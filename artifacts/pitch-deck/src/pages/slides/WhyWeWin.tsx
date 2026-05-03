export default function WhyWeWin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[6vh]">
      <div className="absolute -top-[10vh] right-[10vw] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[140px]" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">08 · Why Foundry Wins</span>
      </div>

      <h2 className="relative z-10 mt-[3vh] font-display font-bold text-text text-[4.6vw] leading-[0.95] tracking-tight max-w-[82vw]">
        Not another marketplace. <span className="text-primary">The inference layer for 0G.</span>
      </h2>

      <div className="relative z-10 mt-[3.5vh] border border-text/15 bg-surface/40">
        <div className="grid grid-cols-5 border-b border-text/15">
          <div className="px-[1.5vw] py-[1.6vh] font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase col-span-1">Capability</div>
          <div className="px-[1.5vw] py-[1.6vh] font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">HuggingFace</div>
          <div className="px-[1.5vw] py-[1.6vh] font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">OpenAI FT</div>
          <div className="px-[1.5vw] py-[1.6vh] font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">MindVault</div>
          <div className="px-[1.5vw] py-[1.6vh] font-mono text-[0.85vw] text-primary tracking-[0.2em] uppercase">Foundry</div>
        </div>

        <div className="grid grid-cols-5 border-b border-text/10">
          <div className="px-[1.5vw] py-[1.7vh] font-display text-text text-[1.2vw] font-semibold col-span-1">OpenAI-compatible API</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary/70 text-[1.1vw]">✓</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary text-[1.1vw]">✓ /v1/chat</div>
        </div>

        <div className="grid grid-cols-5 border-b border-text/10">
          <div className="px-[1.5vw] py-[1.7vh] font-display text-text text-[1.2vw] font-semibold col-span-1">On-chain license gate</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary text-[1.1vw]">✓ HTTP 402</div>
        </div>

        <div className="grid grid-cols-5 border-b border-text/10">
          <div className="px-[1.5vw] py-[1.7vh] font-display text-text text-[1.2vw] font-semibold col-span-1">DA receipt per call</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary text-[1.1vw]">✓ x-foundry-tx</div>
        </div>

        <div className="grid grid-cols-5 border-b border-text/10">
          <div className="px-[1.5vw] py-[1.7vh] font-display text-text text-[1.2vw] font-semibold col-span-1">Per-call royalties</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary text-[1.1vw]">✓ Auto-split</div>
        </div>

        <div className="grid grid-cols-5 border-b border-text/10">
          <div className="px-[1.5vw] py-[1.7vh] font-display text-text text-[1.2vw] font-semibold col-span-1">ERC-7857 model NFT</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary/70 text-[1.1vw]">✓</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary text-[1.1vw]">✓</div>
        </div>

        <div className="grid grid-cols-5">
          <div className="px-[1.5vw] py-[1.7vh] font-display text-text text-[1.2vw] font-semibold col-span-1">Permissionless listing</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary/70 text-[1.1vw]">✓</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-muted text-[1.1vw]">—</div>
          <div className="px-[1.5vw] py-[1.7vh] font-mono text-primary text-[1.1vw]">✓</div>
        </div>
      </div>
    </div>
  );
}
