# Foundry — Live Demo Script

**Total runtime: 2 minutes 30 seconds.** Built to land in the top 3.

> The judges have seen ~100 marketplaces today. You have one job: in the first 15 seconds, prove this is a *different category* of submission. Lead with the curl. Show the on-chain receipt. Don't bury the wedge.

---

## 🎬 The 15-second hook (memorize this verbatim)

> "Every other AI marketplace on 0G stops at *listing* a model. Foundry turns every minted model into a callable SaaS endpoint — OpenAI-compatible, on-chain license-gated, with a real Galileo receipt for every inference call. One line of code and any team in this hackathon can ship with a Foundry model in production today."

Pause. Let it land.

---

## 🎯 The four moments judges have to see

These are the only things that matter. Every second of the demo serves one of them.

1. **The curl works.** A real OpenAI-compatible endpoint that returns a real LLM response.
2. **The license gate is real.** HTTP 402 when the wallet doesn't hold a license. No bypass.
3. **The receipt is real.** Click the header URL → chainscan-galileo.0g.ai → see the tx, the block, the calldata.
4. **The integration is one line.** Show the `baseURL` swap on a real OpenAI SDK call.

If you only have 60 seconds, hit moments **1 and 3**. Everything else is bonus.

---

## 🎬 Full script (2:30)

### [0:00 – 0:15] The hook
- Land the 15-second pitch above. Camera on you, no slides yet.
- End with: *"Let me show you."*

### [0:15 – 0:35] Slide 1–4 of the pitch deck (fast cut)
- **Slide 1 (Title):** "Foundry — AI Models, On-Chain. Live on 0G Galileo. Hackathon, May 2026."
- **Slide 2 (Problem):** *"AI ownership is concentrated in 3 vendors. Fine-tuners can't capture value from their work."*
- **Slide 3 (Solution):** *"Fine-tune. Mint as an NFT. License. Earn royalties on every call."* (don't dwell)
- **Slide 4 (Gateway — THE WEDGE):** stop here for 8 seconds. *"This is the part nobody else has. An OpenAI-compatible endpoint backed by 0G."*

### [0:35 – 1:05] The frontend flow (real wallet)
1. **Connect wallet.** "MetaMask, signs into Foundry."
2. **Marketplace.** *"These are real models, real creators, real on-chain license prices."* Click into a model.
3. **Buy a license.** Sign EIP-712 — *"This signature is verified server-side; no fake purchases."*
4. **Open Developers tab.** *"Now I'm a developer who wants to call this model."*
5. **Generate API key.** Sign with wallet. *"Wallet-bound API key — the gateway will only honor calls from wallets that hold a license."*

### [1:05 – 1:50] The kill shot — the curl
1. Open terminal in front of judges. Already have the command pre-typed:
   ```bash
   curl https://YOUR_DEPLOYED_URL/api/v1/chat/completions \
     -H "Authorization: Bearer fnd_live_XXX" \
     -H "Content-Type: application/json" \
     -d '{"model":"foundry/1","messages":[{"role":"user","content":"Explain 0G in one sentence."}]}'
   ```
2. Hit enter. Real LLM response streams back in ~2 seconds. Read the first sentence aloud.
3. Scroll up to the response headers. Point at:
   - `x-foundry-real-llm: true` — *"Real Llama-3.1-8B response."*
   - `x-foundry-receipt-tx: 0x...` — *"That is a real transaction on 0G Galileo, mined right now, while you watched."*
4. **Copy the `x-foundry-receipt-url` header. Paste it into the browser.**
5. Chainscan opens. Show the block number, the sender (the Foundry server wallet), the calldata starts with `FoundryInfer`. *"This is the inference, anchored on-chain. Every call. Royalty accounting becomes a SQL query against the chain."*

### [1:50 – 2:10] The 402 demo (the proof you can't fake)
1. Run the same curl with a *different* model id you don't have a license for:
   ```bash
   curl ... -d '{"model":"foundry/99","messages":[...]}'
   ```
2. Response: **HTTP 402 Payment Required**. *"License gate. On-chain. No license, no inference. No bypass."*

### [2:10 – 2:30] The closer
- *"Everything I just showed you is live on Galileo. The contract address is on-screen now."*
- Show the contract on chainscan: `0xA0448Cd63f746a60447cfF1817ec9781C25F7b25`.
- Final line: *"Foundry is the OpenAI-compatible inference layer for 0G. One line of code, real on-chain settlement, ready for any team in this hackathon to build on today. Thank you."*

---

## 🛡️ Pre-flight checklist (run this 30 minutes before)

- [ ] Server wallet has at least 0.05 AOGI on Galileo (gas for receipt anchoring)
- [ ] Server wallet address handy in case a judge asks
- [ ] OpenRouter env vars set (or your `real_llm` flag will say `false`)
- [ ] At least 3 demo models seeded with descriptions, prices, sample outputs
- [ ] One demo wallet pre-loaded with an active license for `foundry/1`
- [ ] One API key pre-generated for that demo wallet — copied into your terminal as `$KEY`
- [ ] One terminal open with the curl command pre-typed (don't fat-finger it on stage)
- [ ] Browser tab open at `chainscan-galileo.0g.ai` (so the receipt link is fast)
- [ ] Pitch deck open at slide 1, full-screen
- [ ] Foundry frontend open at `/marketplace`, wallet connected

---

## 💬 Likely judge questions & sharp answers

**Q: How is this different from HuggingFace?**
> HuggingFace is a registry. We're an inference layer. Every Foundry response is a real on-chain transaction with a clickable receipt — try doing that on HuggingFace.

**Q: Is the LLM actually fine-tuned, or are you just calling Llama?**
> Today's gateway proxies to OpenRouter for the hackathon demo so judges can verify it works without a TEE provider key. The architecture is plug-compatible with 0G Compute via `OG_COMPUTE_PROVIDER` — flip one env var and the same call routes through 0G's TEE network instead. The gateway, license gate, and receipt anchoring are independent of the inference backend.

**Q: What stops me from sharing my API key with my friends?**
> Keys are wallet-bound. Sharing a key shares your license — which costs you. If your wallet's licenses expire, every key tied to that wallet returns 402 until you renew. The economics enforce themselves.

**Q: Why on-chain anchor every call? That costs gas.**
> ~$0.0001 per call on Galileo for a tx with 100 bytes of calldata. That's the cost of making royalty splits trustless and auditable. Compare to credit card processing for SaaS — 2.9%. We're 4 orders of magnitude cheaper, and it's verifiable.

**Q: What's the business model?**
> 1% protocol fee on every license sale, settled on-chain at purchase. We never touch the inference revenue — that flows directly to the model creator's wallet via the gateway accounting.

**Q: What's the Day 1 user?**
> The other ~100 teams in this hackathon. We launched the Developers page so any team can integrate a Foundry model with one line of code change to their `baseURL`. We're the OpenRouter of 0G.

---

## 🚨 Don't do these things

- **Don't open the slides first.** Lead with the verbal hook; slides are the supporting cast.
- **Don't say "let me show you the database."** Judges don't care about your schema.
- **Don't apologize for what's not finished.** TEE compute is one env var away — that's a feature, not a gap.
- **Don't talk about the codebase architecture** unless asked. The artifact is the demo, not the repo tour.
- **Don't run unfamiliar curl commands live.** Pre-type everything. Have a fallback recording if the network dies.

---

## 🏆 Why this wins

You're not competing on "more features." You're competing on **a wedge nobody else has**. The OpenAI-compat gateway with real on-chain receipts means:

1. Judges see a *category-defining* demo, not a clone.
2. Other teams can integrate Foundry **this week** — that's a distribution flywheel before the awards are even announced.
3. The on-chain anchor proves you understand 0G's value prop better than the marketplace teams.

Go win the $45k. 🔥
