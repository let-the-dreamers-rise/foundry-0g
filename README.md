# Foundry — Decentralized AI Model Fine-Tuning & Licensing on 0G

> **Hugging Face + Replicate, fully on-chain.** Upload a dataset → fine-tune on 0G's decentralized GPU network → own your model as an **ERC-7857** NFT → license inference to developers and earn recurring on-chain revenue.

**Submission for the 0G APAC Hackathon — May 2026.**

---

## The Problem

AI is concentrated in 5 companies. Creators who fine-tune valuable domain models (legal, medical, support, code) have no native way to **prove ownership**, **prevent unauthorized inference**, or **monetize without intermediaries**. Hugging Face hosts the weights; OpenAI runs inference; the creator captures none of the upside.

## The Solution

Foundry uses 0G's full stack to make AI models **first-class on-chain assets**:

| Layer | What we use | What we get |
|---|---|---|
| **0G Storage** | `@0glabs/0g-ts-sdk` Indexer.upload | Tamper-proof root hashes for datasets + model weights, verifiable on Galileo testnet |
| **0G Compute** | OpenAI-compatible TEE broker | Verifiable inference — every API call returns a TEE attestation reference |
| **0G Chain** | EVM (Galileo testnet, chainId 16600) | ERC-7857 model NFTs, EIP-712 license signatures recorded with each purchase |
| **ERC-7857 (custom registry prototype)** | `contracts/Foundry7857.sol` | Each fine-tuned model = 1 entry in our on-chain registry. Owner controls licensing and transfers. (Not yet a fully ERC-721-compliant implementation — prototype.) |

## The User Journey

```
  Studio              0G Storage          0G Compute         0G Chain
    │                     │                    │                 │
    ├─Upload dataset────→ │                    │                 │
    │ ←─root hash─────────┤                    │                 │
    ├─Run fine-tune───────┼──────────────────→ │                 │
    │ ←─progress events ──┼──── ────────────── ┤                 │
    ├─Mint NFT────────────┼────────────────────┼───────────────→ │
    │ ←─tokenId, txHash───┼────────────────────┼─────────────────┤
    │
    ▼
 Marketplace        EIP-712 sig         License DB         Inference
    │                    │                  │                  │
 Buyer───Sign Purchase─→ │                  │                  │
        intent w/ wallet │                  │                  │
    ←──verified address──┤──────insert─────→│                  │
                                            │ ←─ check active ─┤
                                            │                  ├─→0G Compute TEE
                                            │                  │ ←─attestation ref
```

## What's Real, What's Simulated

We're transparent about the testnet boundary. The **0G Network status banner** in Studio shows live/demo state.

| Component | Status |
|---|---|
| Wallet connect (MetaMask, EIP-1193) | **Real** — auto-switches to 0G Galileo (chainId 0x40D8) |
| EIP-712 signed fine-tune jobs | **Real** — required on `POST /fine-tune` (creator-ownership proof) |
| EIP-712 signed model listings | **Real** — required on `POST /models/:id/list` (anti-spoof) |
| EIP-712 signed license purchases | **Real** — required on `POST /licenses` |
| EIP-712 signed inference calls | **Real** — required on `POST /models/:id/infer` (10-min replay window) |
| 0G Storage uploads | **Real** when `OG_PRIVATE_KEY` is set; deterministic-hash fallback otherwise |
| ERC-7857 NFT mint (`Foundry7857.mint`) | **Real ethers v6 call** when `FOUNDRY_CONTRACT_ADDRESS` + `OG_PRIVATE_KEY` are set; deterministic placeholder fallback (clearly logged) |
| On-chain license payment verification | **Real** when buyer supplies `paymentTxHash` — server checks tx mined, sender, value via `JsonRpcProvider`. License row stores `paymentVerified` flag. |
| 0G Compute inference | **Real** when `OG_COMPUTE_BROKER_URL` is set; simulated response pool fallback |
| ERC-7857 contract | **Prototype source** at `contracts/Foundry7857.sol` — custom registry, not full ERC-721 |
| Demo-mode TX hashes | **Clearly labeled** — no fake "live" links |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  artifacts/foundry              React + Vite + Tailwind v4 + shadcn │
│  ├── pages/home          Landing — value prop + featured models     │
│  ├── pages/marketplace   Browse, filter, search 10+ seeded models   │
│  ├── pages/studio        3-step wizard: configure → dataset → train │
│  ├── pages/model-detail  Demo inference + EIP-712 license purchase  │
│  ├── pages/dashboard     Creator earnings (real weekly revenue)     │
│  └── pages/activity      Live event feed                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │ OpenAPI/Orval generated client
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  artifacts/api-server           Express 5 + Drizzle + Zod           │
│  ├── routes/fine-tune    POST /fine-tune → background pipeline       │
│  ├── routes/models       Marketplace catalogue + filters             │
│  ├── routes/licenses     EIP-712 verification + license issuance     │
│  ├── routes/inference    License gate → 0G Compute TEE call          │
│  ├── routes/stats        Platform + creator stats with weekly chart  │
│  ├── lib/og-storage.ts   Real Indexer.upload via @0glabs/0g-ts-sdk   │
│  └── lib/og-compute.ts   Real broker /v1/chat/completions call       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                       PostgreSQL (Drizzle ORM)
```

## ERC-7857 Model NFT

`contracts/Foundry7857.sol` is the on-chain registry for fine-tuned models. Each NFT carries:

- `modelRootHash` — the 0G Storage root for the model weights
- `datasetRootHash` — the 0G Storage root for the training dataset (provenance)
- `baseModel`, `category` — metadata
- `licensePriceUsd` — owner-controlled
- Standard ERC-721 transfer/ownership

## Run Locally

```bash
pnpm install
pnpm --filter @workspace/db run push      # apply schema to local Postgres
pnpm --filter @workspace/api-server run dev   # API on port from $PORT
pnpm --filter @workspace/foundry run dev      # Web on port from $PORT
```

Open the preview, click **New Fine-Tune**, drop a JSONL file, and watch the pipeline run end-to-end.

## Hackathon Track

**Application Track — Consumer/Developer Tooling on 0G.** Foundry consumes all four 0G primitives (Storage, Compute, Chain, EVM) and unlocks a use case (model ownership + per-call licensing) that isn't possible on traditional clouds.

## Team & Links

- **Live demo:** see Replit deployment
- **0G Galileo Explorer:** https://chainscan-galileo.0g.ai
- **0G Docs:** https://docs.0g.ai

---

*Built in May 2026 for the 0G APAC Hackathon.*
