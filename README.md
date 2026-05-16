# Foundry

> **The OpenAI-compatible inference layer for 0G.** Mint a fine-tuned model as an NFT, gate it with on-chain licenses, and let anyone call it through a drop-in `/v1/chat/completions` endpoint — every call settled with a real on-chain receipt.

Built for the **0G APAC Hackathon** · Live on **0G Galileo Testnet (chainId 16602)**

- **Live contract:** [`0xA0448Cd63f746a60447cfF1817ec9781C25F7b25`](https://chainscan-galileo.0g.ai/address/0xA0448Cd63f746a60447cfF1817ec9781C25F7b25)
- **Standard:** ERC-7857 (Foundry7857 model NFT)
- **Stack:** 0G Chain (live verified) · 0G Storage SDK · 0G Compute broker support

---

## The Wedge

Every other AI marketplace on 0G stops at "list a model." Foundry turns every minted model into a **callable SaaS the moment it ships**:

```bash
curl https://YOUR_DEPLOYED_URL/api/v1/chat/completions \
  -H "Authorization: Bearer fnd_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "foundry/1",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

That's the whole integration. Other 0G hackathon teams can wire Foundry models into their app today by changing one line — the OpenAI SDK `baseURL`.

---

## What's actually on-chain

Every successful gateway response includes verifiable headers:

| Header | What it is |
|---|---|
| `x-foundry-model` | `foundry/<id>` of the model that served the call |
| `x-foundry-creator` | Wallet earning royalties for this call |
| `x-foundry-receipt-tx` | **Real** tx hash mined on 0G Galileo for this inference |
| `x-foundry-receipt-url` | `https://chainscan-galileo.0g.ai/tx/<hash>` — clickable |
| `x-foundry-da-anchor` | DA reference for the response payload |
| `x-foundry-onchain-receipt` | `true` when the receipt is anchored on-chain |

Returns **HTTP 402** if the caller's wallet doesn't hold an active license NFT for the requested model.

---

## What's real (no smoke-and-mirrors)

| Component | Real on testnet |
|---|---|
| Model NFT minting (ERC-7857) | ✅ via `Foundry7857` contract |
| Dataset / model file upload | ✅ via `@0glabs/0g-ts-sdk` Indexer when `OG_PRIVATE_KEY` is configured |
| License purchase payment | ✅ on-chain payment verified via JSON-RPC (sender + amount) |
| EIP-712 signatures | ✅ enforced for license, inference, and API key operations |
| Gateway LLM response | ✅ OpenRouter or 0G Compute broker when configured; explicit fallback when credentials are absent |
| Per-call inference receipt | ✅ real tx mined on Galileo carrying the response digest in calldata |

---

## Quick start (curl, 60 seconds)

```bash
# 1. List available models on Foundry
curl https://YOUR_DEPLOYED_URL/api/v1/models

# 2. Make an inference call (you need an API key + an active license)
curl https://YOUR_DEPLOYED_URL/api/v1/chat/completions \
  -H "Authorization: Bearer fnd_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "foundry/1",
    "messages": [{"role": "user", "content": "Explain 0G in one sentence."}]
  }'

# 3. Click the x-foundry-receipt-url header in the response
#    → opens chainscan-galileo.0g.ai showing the real anchor tx
```

### Drop-in OpenAI SDK

```ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://YOUR_DEPLOYED_URL/api/v1",
  apiKey: "fnd_live_...",
});

const res = await client.chat.completions.create({
  model: "foundry/1",
  messages: [{ role: "user", content: "Hello!" }],
});
```

---

## Run it locally

### Prerequisites

- Node 22+
- pnpm 10+
- A PostgreSQL database (Replit auto-provisions one)
- An EVM wallet with a small amount of AOGI on Galileo for gas — get some at the [0G faucet](https://faucet.0g.ai)

### Setup

```bash
# 1. Install
pnpm install

# 2. Configure secrets (already set if you're on Replit)
export DATABASE_URL=postgres://...
export OG_PRIVATE_KEY=0x...                          # funded Galileo wallet
export FOUNDRY_CONTRACT_ADDRESS=0xA0448Cd63f746a60447cfF1817ec9781C25F7b25
export AI_INTEGRATIONS_OPENROUTER_BASE_URL=...       # real LLM responses
export AI_INTEGRATIONS_OPENROUTER_API_KEY=...

# Optional — route through 0G Compute TEE instead of OpenRouter
# export OG_COMPUTE_PROVIDER=0x...
# export OG_COMPUTE_BROKER_URL=https://...

# 3. Push the schema
pnpm --filter @workspace/db run push

# 4. Boot API + frontend locally
pnpm dev
```

Local defaults: API on `http://127.0.0.1:8080`, frontend on `http://127.0.0.1:5173`, and the Vite dev server proxies `/api` to the API server.

| Workflow | What it serves |
|---|---|
| `artifacts/foundry: web` | Marketplace + Studio + Developers UI |
| `artifacts/api-server: API Server` | REST API + `/api/v1/chat/completions` gateway |
| `artifacts/pitch-deck: web` | Investor-grade pitch deck (10 slides) |
| `artifacts/mockup-sandbox` | Component sandbox for design iteration |

---

## Repo layout

```
artifacts/
  foundry/            # React + Vite frontend (marketplace, studio, developers)
  api-server/         # Express API + OpenAI-compatible gateway
  pitch-deck/         # 10-slide investor pitch (validate-slides clean)
  mockup-sandbox/     # Component preview server
lib/
  db/                 # Drizzle schema + Postgres client (shared)
  api-zod/            # Shared zod request/response schemas
  api-spec/           # OpenAPI spec → @workspace/api-client-react codegen
.local/skills/        # Replit Agent skills
```

Key files for reviewers:

- `artifacts/api-server/src/routes/gateway.ts` — the OpenAI-compat gateway
- `artifacts/api-server/src/lib/og-chain.ts` — real on-chain anchor + mint + payment verify
- `artifacts/api-server/src/lib/og-storage.ts` — real 0G Storage uploads via Indexer SDK
- `artifacts/api-server/src/routes/licenses.ts` — EIP-712 + on-chain payment verification
- `artifacts/foundry/src/pages/developers.tsx` — wallet-signed API key management

---

## License

MIT — built in public for the 0G APAC Hackathon, May 2026.
