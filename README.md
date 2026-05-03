# Foundry — Decentralized AI Model Fine-Tuning & Licensing on 0G

> **Hugging Face + Replicate, fully on-chain.**
> Upload a dataset → fine-tune on 0G's decentralized GPU network → own your model as an **ERC-7857** NFT → license inference to developers and earn recurring on-chain revenue.

**Submission for the 0G APAC Hackathon — May 2026.**

## 🔗 Live On-Chain Proof

| Item | Value |
|---|---|
| Network | **0G-Galileo-Testnet** (chainId `16602` / `0x40da`) |
| Foundry7857 Contract | [`0xA0448Cd63f746a60447cfF1817ec9781C25F7b25`](https://chainscan-galileo.0g.ai/address/0xA0448Cd63f746a60447cfF1817ec9781C25F7b25) |
| Deployment Tx | [`0x20c25681…66ad7`](https://chainscan-galileo.0g.ai/tx/0x20c256812bf56029ca3898d16c54a840eae9e99a53b01f4ec24041ef09d66ad7) |
| Live API status endpoint | `GET /api/og-status` |
| 0G Storage SDK | [`@0glabs/0g-ts-sdk`](https://www.npmjs.com/package/@0glabs/0g-ts-sdk) — real `Indexer.upload()` |
| 0G Compute | OpenAI-compatible TEE broker — real `POST /v1/chat/completions` |

A green "**LIVE ON 0G GALILEO**" banner at the very top of the app links to the live contract — judges can verify in one click.

---

## The Problem

AI is concentrated in 5 companies. Independent creators who fine-tune valuable domain models (legal, medical, customer-support, code) have no native way to:

- **Prove ownership** of weights they trained
- **Prevent unauthorized inference** without expensive API gating
- **Monetize** without surrendering 30%+ to a centralized marketplace

Hugging Face hosts the weights. OpenAI runs the inference. The creator captures none of the upside.

## The Solution

Foundry uses 0G's full stack to make AI models **first-class on-chain assets**:

| 0G Module | How Foundry Uses It | Verifiable Output |
|---|---|---|
| **0G Storage** | Datasets and model weights uploaded via `@0glabs/0g-ts-sdk` `Indexer.upload()` against `https://indexer-storage-testnet-standard.0g.ai`. Each upload signs with the creator's private key on the Galileo EVM RPC. | A 32-byte `rootHash` per file → `https://storagescan-galileo.0g.ai/file/<rootHash>` |
| **0G Chain** | Custom `Foundry7857` registry deployed via solc + ethers v6 to chainId 16602. Real `mint()` calls per fine-tuned model; real on-chain payment verification (`JsonRpcProvider.getTransaction`) for license purchases. | Live address: `0xA0448C…7b25` |
| **0G Compute** | Inference proxied through the TEE broker's OpenAI-compatible `/v1/chat/completions`. Each call signs `{modelRef,ts}` with EIP-191 (`personal_sign`), passes the model's storage root hash in `X-Model-Root-Hash`, and stores the returned TEE attestation reference in Postgres. | TEE attestation ref persisted on every inference row |
| **0G Compute (Fine-Tuning CLI)** | `0g-compute-cli fine-tuning create-task --dataset-path <…> --provider <…>` shelled out as a real subprocess; status polled every 5 s, progress streamed to DB. | When `OG_COMPUTE_PROVIDER` is set, real provider txs |

## What's Real vs. Simulated (transparent disclosure)

We never fake a "live" link. The `LiveOnChainBanner` and `/api/og-status` endpoint expose exactly which subsystems are wired:

| Component | Real | Notes |
|---|---|---|
| Wallet connect (MetaMask + WalletConnect / Reown) | ✅ | Auto-switches to chainId `0x40da` (16602) |
| EIP-712 signed fine-tune submission | ✅ | Mandatory on `POST /fine-tune` (creator-ownership proof, 10-min replay window) |
| EIP-712 signed model listings | ✅ | Mandatory on `POST /models/:id/list` (anti-spoof) |
| EIP-712 signed license purchases | ✅ | Mandatory on `POST /licenses` |
| EIP-712 signed inference calls | ✅ | Mandatory on `POST /models/:id/infer` |
| 0G Storage uploads | ✅ live | `OG_PRIVATE_KEY` set; throws `OgStorageConfigError` rather than fake-hash fallback |
| ERC-7857 mint via ethers v6 | ✅ live | Contract `0xA0448C…7b25` deployed, `OG_PRIVATE_KEY` funded |
| On-chain license payment verification | ✅ | When buyer supplies `paymentTxHash`, server checks `tx.to`, `tx.value`, confirmations |
| 0G Compute inference (real broker) | ⚪ simulated | Set `OG_COMPUTE_BROKER_URL` + `OG_COMPUTE_PROVIDER` to flip live; deterministic stub pool otherwise |
| 0G Compute fine-tuning (real CLI) | ⚪ simulated | Set `OG_COMPUTE_PROVIDER` to flip live; simulated training loop otherwise |

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  artifacts/foundry            React 18 + Vite + Tailwind v4 + shadcn   │
│                                                                        │
│  ┌─ home              Landing + featured models                        │
│  ├─ marketplace       Browse / filter 10+ seeded models                │
│  ├─ studio            3-step wizard: configure → dataset → train       │
│  ├─ model-detail      Live inference + EIP-712 license purchase        │
│  ├─ dashboard         Creator earnings (real weekly revenue)           │
│  └─ activity          Live event feed                                  │
│                                                                        │
│  context/wallet.tsx   MetaMask + WalletConnect (Reown AppKit)          │
│  components/          live-onchain-banner, model-card, og-link, …      │
└────────────────────────────────────────────────────────────────────────┘
                       │  OpenAPI + Orval-generated client
                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│  artifacts/api-server         Express 5 + Drizzle ORM + Zod            │
│                                                                        │
│  routes/                                                               │
│   ├─ fine-tune        POST /fine-tune    → background pipeline         │
│   ├─ models           Marketplace catalogue + filters                  │
│   ├─ licenses         EIP-712 verify + on-chain payment check          │
│   ├─ inference        License gate → 0G Compute TEE call               │
│   ├─ stats            Platform + creator stats with weekly chart       │
│   └─ og-status        Live integration health for the UI banner        │
│                                                                        │
│  lib/                                                                  │
│   ├─ og-storage.ts    Real Indexer.upload via @0glabs/0g-ts-sdk        │
│   ├─ og-chain.ts      ethers v6 → Foundry7857.mint + payment verify    │
│   ├─ og-compute.ts    Signed POST to TEE broker; X-Model-Root-Hash     │
│   └─ og-fine-tune.ts  Real `0g-compute-cli` CLI wrapper + status poll  │
└────────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
                PostgreSQL (Drizzle migrations)
                fine_tune_jobs · models · licenses ·
                inference_calls · activity_events

┌────────────────────────────────────────────────────────────────────────┐
│  contracts/Foundry7857.sol    Solidity 0.8.24, deployed via solc-js   │
│                                                                        │
│  scripts/deploy/deploy-foundry7857.mjs                                 │
│  → solc compile → ethers ContractFactory → live Galileo deploy         │
└────────────────────────────────────────────────────────────────────────┘
```

## ERC-7857 Model NFT (`contracts/Foundry7857.sol`)

A custom registry of fine-tuned models. Each token carries:

- `modelRootHash` — 0G Storage root for the trained weights
- `datasetRootHash` — 0G Storage root for the training dataset (provenance)
- `baseModel`, `category` — discoverability metadata
- `licensePriceWei` — owner-controlled, payable in OG
- `Transfer` / `LicenseIssued` events for indexers

> The contract is a **prototype registry**, not a fully ERC-721-compliant implementation — by design, since per-model licensing semantics differ from collectible-NFT semantics.

## Run Locally

Prereqs: Node 20+, pnpm 10, Postgres 16. The repo is a pnpm monorepo.

```bash
# 1. Install
pnpm install

# 2. Database (local Postgres reachable via DATABASE_URL)
pnpm --filter @workspace/db run push

# 3. Required env vars (paste into Replit Secrets or a .env)
OG_PRIVATE_KEY=0x…          # any funded wallet on Galileo testnet
FOUNDRY_CONTRACT_ADDRESS=0xA0448Cd63f746a60447cfF1817ec9781C25F7b25
DATABASE_URL=postgres://…

# 4. Optional — flip from simulated to fully-live for compute/fine-tune
OG_COMPUTE_BROKER_URL=https://<broker>/v1
OG_COMPUTE_PROVIDER=0x<provider-address-from-broker.inference.listService()>

# 5. Run (each on its own port via $PORT)
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/foundry   run dev
```

### Test the Live Flow

1. Get free testnet OG at <https://faucet.0g.ai> (≈30 s).
2. Open the web UI → connect MetaMask → MetaMask auto-switches to 0G-Galileo-Testnet (16602).
3. **Studio** → submit a small JSONL fine-tune.
4. Watch Studio show a real `storagescan-galileo.0g.ai/file/<rootHash>` link.
5. When training "completes" the model is minted via the live `Foundry7857` contract — check the tx on chainscan.
6. **Marketplace** → list the model → buy a license → MetaMask pops up for a real on-chain payment + EIP-712 signature.
7. **Model detail page** → run an inference → a TEE attestation hash appears as a verifiable "Proof: ↗" link.

### Deploying Your Own Contract

```bash
# After OG_PRIVATE_KEY is set and the wallet is funded:
node scripts/deploy/deploy-foundry7857.mjs
# Compiles Foundry7857.sol, deploys, prints the new address.
```

## Repository Layout

```
contracts/
  Foundry7857.sol            # ERC-7857-style model registry
  Foundry7857.abi.json       # generated by deploy script
artifacts/
  foundry/                   # React + Vite web app
  api-server/                # Express + Drizzle backend
  mockup-sandbox/            # Reusable component sandbox
lib/
  db/                        # Drizzle schema, migrations
  api-spec/                  # OpenAPI source of truth + Orval codegen
scripts/
  deploy/deploy-foundry7857.mjs   # solc + ethers one-shot deployer
SUBMISSION.md                # Hackathon submission deliverables
README.md                    # This file
```

## Hackathon Mapping

| Judging Criterion | Where to look |
|---|---|
| **0G Technical Integration Depth & Innovation** | `lib/og-*.ts`, `contracts/Foundry7857.sol`, `/api/og-status` — uses 4 distinct 0G primitives in production code paths. |
| **Technical Implementation & Completeness** | Live contract + tx links above; mandatory EIP-712 on every state-changing route; Drizzle migrations; OpenAPI-typed end-to-end. |
| **Product Value & Market Potential** | New revenue surface for AI creators currently locked out of monetization; lower take-rate than Hugging Face / Replicate; composable license NFTs. |
| **User Experience & Demo Quality** | One-click MetaMask connect; auto network-switch; live status banner with real contract link; explorer-link buttons on every NFT, dataset, and tx. |
| **Team Capability & Documentation** | This README + `SUBMISSION.md`; full OpenAPI spec; ABI checked into repo; reproducible local-deploy script. |

## Links

- **0G Galileo Explorer**: <https://chainscan-galileo.0g.ai>
- **0G Storage Explorer**: <https://storagescan-galileo.0g.ai>
- **0G Faucet**: <https://faucet.0g.ai>
- **0G Docs**: <https://docs.0g.ai>

---

*Built in May 2026 for the 0G APAC Hackathon. MIT licensed.*
