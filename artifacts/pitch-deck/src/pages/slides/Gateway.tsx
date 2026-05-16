export default function Gateway() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[6vh]">
      <div className="absolute -top-[20vh] -left-[10vw] w-[60vw] h-[60vw] rounded-full bg-primary/8 blur-[140px]" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">04 · The Wedge</span>
      </div>

      <h2 className="relative z-10 mt-[3vh] font-display font-bold text-text text-[5.4vw] leading-[0.95] tracking-tight max-w-[80vw]">
        The OpenAI-compatible inference layer for 0G.
      </h2>
      <p className="relative z-10 mt-[2vh] font-display text-text/80 text-[1.6vw] leading-snug max-w-[64vw]">
        Mint a model on Foundry → instantly get a working endpoint. Other 0G builders integrate with one line of code.
      </p>

      <div className="relative z-10 mt-[4vh] grid grid-cols-12 gap-[2vw] flex-1">
        <div className="col-span-7 bg-surface border border-text/10 p-[3vh] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[0.9vw] text-primary tracking-[0.25em] uppercase">POST /v1/chat/completions</div>
            <div className="font-mono text-[0.85vw] text-primary px-[0.8vw] py-[0.4vh] border border-primary/40">LIVE</div>
          </div>

          <div className="mt-[2vh] font-mono text-[1.05vw] leading-[1.55] text-text/90">
            <div><span className="text-muted">$</span> curl https://YOUR_DEPLOYED_URL<span className="text-primary">/api/v1/chat/completions</span> \</div>
            <div className="pl-[1.5vw]">-H <span className="text-accent">"Authorization: Bearer fnd_live_…"</span> \</div>
            <div className="pl-[1.5vw]">-H <span className="text-accent">"Content-Type: application/json"</span> \</div>
            <div className="pl-[1.5vw]">-d <span className="text-accent">'{`{`}"model":"foundry/42",</span></div>
            <div className="pl-[3vw]"><span className="text-accent">"messages":[{`{`}"role":"user","content":"Hi"{`}`}]{`}`}'</span></div>
          </div>

          <div className="mt-auto pt-[2.5vh] border-t border-text/10">
            <div className="font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">Drop-in replacement</div>
            <div className="mt-[0.5vh] font-display text-text text-[1.5vw] font-semibold leading-tight">
              Change one line. <span className="text-primary">baseURL → YOUR_DEPLOYED_URL/api/v1</span>
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-[1.4vh]">
          <div className="bg-surface border border-primary/30 p-[2vh]">
            <div className="font-mono text-[0.8vw] text-primary tracking-[0.2em] uppercase">x-foundry-receipt-tx</div>
            <div className="mt-[0.4vh] font-mono text-text text-[1.05vw] break-all">0x7c9f…a3d1</div>
            <div className="mt-[0.4vh] font-mono text-[0.78vw] text-muted">→ chainscan-galileo.0g.ai</div>
          </div>
          <div className="bg-surface border border-primary/30 p-[2vh]">
            <div className="font-mono text-[0.8vw] text-primary tracking-[0.2em] uppercase">x-foundry-creator</div>
            <div className="mt-[0.4vh] font-mono text-text text-[1.05vw] break-all">0xA1918A4E…8D2E</div>
            <div className="mt-[0.4vh] font-mono text-[0.78vw] text-muted">royalties accrue per call</div>
          </div>
          <div className="bg-surface border border-primary/30 p-[2vh]">
            <div className="font-mono text-[0.8vw] text-primary tracking-[0.2em] uppercase">x-foundry-da-anchor</div>
            <div className="mt-[0.4vh] font-mono text-text text-[1.05vw] break-all">da_ref_…</div>
            <div className="mt-[0.4vh] font-mono text-[0.78vw] text-muted">verifiable response provenance</div>
          </div>
          <div className="bg-primary/12 border border-primary/50 p-[2vh] mt-auto">
            <div className="font-display text-text text-[1.3vw] font-semibold leading-snug">
              HTTP 402 if the caller's wallet doesn't hold a license.
            </div>
            <div className="mt-[0.4vh] font-mono text-[0.85vw] text-primary">License check happens on-chain.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
