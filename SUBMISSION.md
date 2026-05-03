# Foundry — 0G APAC Hackathon Submission

> Copy-paste-ready answers for the HackQuest submission form. May 2026.

---

## 1. Basic Project Information

**Project Name:** Foundry

**One-sentence description (≤30 words):**
> Foundry is a decentralized marketplace where AI creators fine-tune models on 0G, mint them as ERC-7857 NFTs, and earn recurring on-chain revenue from per-call licensing.

**Short summary:**

Foundry is a permissionless marketplace for fine-tuned AI models. Creators upload a dataset, fine-tune a base model on 0G Compute, mint the result as an ERC-7857 NFT on 0G Chain, and license inference to developers — all without intermediaries. Every dataset, every model weight, and every license payment is anchored on 0G's stack: **0G Storage** holds the datasets and weights with verifiable root hashes; **0G Compute** runs training and TEE-attested inference; **0G Chain** records ownership, license signatures (EIP-712), and royalty flows on the Galileo testnet.

It solves a real creator-economy problem: today's AI economy concentrates ~$340B of value in five companies, and independent fine-tuners — the people who build the most useful domain-specific models (legal, medical, code, support) — capture none of it. Foundry gives them on-chain ownership, programmable licensing, and a revenue stream that doesn't require trusting a centralized marketplace.

**0G components used:** 0G Storage, 0G Chain (EVM), 0G Compute (TEE inference + fine-tuning CLI).

---

## 2. Code Repository

- **GitHub:** _<paste your public repo URL after pushing>_
- The repo is a pnpm monorepo. All hackathon work is in this single repository.
- Commit history shows the full build journey from scaffold → real-on-chain integration.

---

## 3. 0G Integration Proof ✅ MANDATORY

| | |
|---|---|
| **0G Network** | 0G-Galileo-Testnet (chainId `16602`, hex `0x40da`) |
| **Foundry7857 Contract** | `0xA0448Cd63f746a60447cfF1817ec9781C25F7b25` |
| **Explorer (contract)** | <https://chainscan-galileo.0g.ai/address/0xA0448Cd63f746a60447cfF1817ec9781C25F7b25> |
| **Explorer (deploy tx)** | <https://chainscan-galileo.0g.ai/tx/0x20c256812bf56029ca3898d16c54a840eae9e99a53b01f4ec24041ef09d66ad7> |
| **Deployer / operator wallet** | `0xA1918A4E578babad074ACf7DCefB152f8FDC8D2E` |

**Where the integration lives in code:**

- `artifacts/api-server/src/lib/og-storage.ts` — real `Indexer.upload()` via `@0glabs/0g-ts-sdk` against `https://indexer-storage-testnet-standard.0g.ai`. Throws explicit errors instead of falling back to fake hashes.
- `artifacts/api-server/src/lib/og-chain.ts` — real `Foundry7857.mint()` and license-payment verification via ethers v6 + `JsonRpcProvider("https://evmrpc-testnet.0g.ai")`.
- `artifacts/api-server/src/lib/og-compute.ts` — signed `POST /v1/chat/completions` to the 0G Compute TEE broker, capturing the `x-tee-attestation` header on every inference call.
- `artifacts/api-server/src/lib/og-fine-tune.ts` — real `0g-compute-cli fine-tuning create-task --dataset-path <…> --provider <…>` subprocess wrapper with 5-second status polling.
- `contracts/Foundry7857.sol` — Solidity 0.8.24 source, deployed via `scripts/deploy/deploy-foundry7857.mjs`.
- `artifacts/api-server/src/routes/og-status.ts` — `GET /api/og-status` exposes live integration health (visible as the green banner at the top of the app).

---

## 4. Demo Video

**Length:** ≤ 3 minutes. Upload to YouTube or Loom (unlisted is fine; must be publicly accessible).

### Suggested Script (≈2:45)

| Time | Visual | Voiceover |
|---|---|---|
| 0:00 – 0:15 | Foundry homepage, green "LIVE ON 0G GALILEO" banner clearly visible at the top, contract link clicked → chainscan opens in a new tab | "This is Foundry — a decentralized marketplace for fine-tuned AI models. Everything you see is live on 0G Galileo testnet — here's our contract on chainscan." |
| 0:15 – 0:35 | Click contract link, show address + deploy tx on chainscan; close tab | "Our `Foundry7857` registry contract is deployed at `0xA0448C…7b25`. Every model on this platform is a real on-chain NFT." |
| 0:35 – 1:00 | Click "Connect Wallet" → MetaMask pops up → auto-switches to 0G-Galileo-Testnet (16602) | "Permissionless onboarding. Connect any EVM wallet — MetaMask auto-switches to 0G Galileo. No sign-up, no KYC." |
| 1:00 – 1:30 | Studio → upload a small JSONL dataset → submit → MetaMask EIP-712 signature popup | "I'm fine-tuning a customer-support model. The dataset uploads to 0G Storage — that returns a verifiable root hash — and the job is signed with EIP-712 so creator ownership is provable." |
| 1:30 – 1:50 | Studio job card: storagescan link appears → click it → real 0G Storage explorer page | "There's the dataset on 0G Storage Explorer. Tamper-proof, decentralized, owned by the creator." |
| 1:50 – 2:10 | Job completes → ERC-7857 mint tx appears → click → chainscan tx detail | "Training completes, and the model is minted as an ERC-7857 NFT. Real on-chain mint, real tx hash, viewable on chainscan." |
| 2:10 – 2:30 | Marketplace → list model → another wallet clicks Buy License → MetaMask payment + EIP-712 sig | "Now a developer buys a 30-day license. Real OG payment on-chain, plus EIP-712 signature for the license terms." |
| 2:30 – 2:45 | Model detail page → run inference → TEE attestation "Proof ↗" link appears | "Every inference call returns a TEE attestation reference — verifiable, gated by the on-chain license. That's Foundry. Thanks 0G!" |

---

## 5. README / Documentation

See **[README.md](./README.md)** in the repo root. It includes:

- Project overview + problem/solution
- Live on-chain proof (contract address, explorer links)
- ASCII architecture diagram
- 0G modules table with file references
- Real-vs-simulated transparency table
- Local deployment & test-flow instructions
- Faucet + reviewer-test instructions
- Repository layout

---

## 6. Public X Post (mandatory)

### Suggested Post Copy

```
Excited to launch Foundry on @0G_labs Galileo testnet! 🔥

Fine-tune AI models on 0G Compute → mint as ERC-7857 NFTs → license per-call inference, all on-chain. The Hugging Face + Replicate moment for Web3.

Live contract:
chainscan-galileo.0g.ai/address/0xA0448Cd63f746a60447cfF1817ec9781C25F7b25

#0GHackathon #BuildOn0G

@0G_labs @0g_CN @0g_Eco @HackQuest_
```

**Attach:** a 10-second screen recording of the homepage with the green LIVE banner + a click-through to chainscan, OR a single screenshot of the Studio mid-flow.

---

## 7. Optional Bonus Materials

| Asset | Status |
|---|---|
| Pitch deck / slides | _Recommended add — ask the assistant to generate one with the slides skill if you want it on Canvas_ |
| Frontend demo link | Replit deployment URL after publishing |
| Backend API docs | Auto-generated OpenAPI at `lib/api-spec/openapi.yaml` |
| Tutorial / write-up | This SUBMISSION.md + the architecture section of README.md |

---

## Reviewer / Judge Quick-Start

1. Visit the deployed app URL (top of the homepage shows a green "LIVE ON 0G GALILEO" banner with a one-click contract link).
2. Get testnet OG at <https://faucet.0g.ai> using any wallet.
3. Connect that wallet → it auto-switches to 0G-Galileo-Testnet (16602).
4. Click "New Fine-Tune" — submit any small JSONL dataset (we provide samples in the Studio UI).
5. Watch the live storagescan + chainscan links populate as the job runs.
6. Buy a license on any seeded model in the Marketplace to see the EIP-712 + on-chain payment flow.

For local reproduction, see the **Run Locally** section of `README.md`.
