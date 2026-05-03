export default function WhyWeWin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="absolute -top-[10vh] right-[10vw] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[140px]" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">07 · Why Foundry Wins</span>
      </div>

      <h2 className="relative z-10 mt-[3vh] font-display font-bold text-text text-[5.2vw] leading-[0.95] tracking-tight max-w-[80vw]">
        The first marketplace where <span className="text-primary">the model itself is the asset.</span>
      </h2>

      <div className="relative z-10 mt-[5vh] border border-text/15 bg-surface/40">
        <div className="grid grid-cols-4 border-b border-text/15">
          <div className="px-[2vw] py-[2vh] font-mono text-[0.9vw] text-muted tracking-[0.2em] uppercase">Capability</div>
          <div className="px-[2vw] py-[2vh] font-mono text-[0.9vw] text-muted tracking-[0.2em] uppercase">Hugging Face</div>
          <div className="px-[2vw] py-[2vh] font-mono text-[0.9vw] text-muted tracking-[0.2em] uppercase">OpenAI Fine-Tune</div>
          <div className="px-[2vw] py-[2vh] font-mono text-[0.9vw] text-primary tracking-[0.2em] uppercase">Foundry</div>
        </div>

        <div className="grid grid-cols-4 border-b border-text/10">
          <div className="px-[2vw] py-[2.4vh] font-display text-text text-[1.4vw] font-semibold">On-chain provenance</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-primary text-[1.3vw]">✓ ERC-7857</div>
        </div>

        <div className="grid grid-cols-4 border-b border-text/10">
          <div className="px-[2vw] py-[2.4vh] font-display text-text text-[1.4vw] font-semibold">Programmable royalties</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-primary text-[1.3vw]">✓ Per-call</div>
        </div>

        <div className="grid grid-cols-4 border-b border-text/10">
          <div className="px-[2vw] py-[2.4vh] font-display text-text text-[1.4vw] font-semibold">Permissionless listing</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-primary/70 text-[1.3vw]">✓</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-primary text-[1.3vw]">✓</div>
        </div>

        <div className="grid grid-cols-4 border-b border-text/10">
          <div className="px-[2vw] py-[2.4vh] font-display text-text text-[1.4vw] font-semibold">Verifiable inference</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-primary text-[1.3vw]">✓ DA receipts</div>
        </div>

        <div className="grid grid-cols-4">
          <div className="px-[2vw] py-[2.4vh] font-display text-text text-[1.4vw] font-semibold">Censorship-resistant</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-muted text-[1.3vw]">—</div>
          <div className="px-[2vw] py-[2.4vh] font-mono text-primary text-[1.3vw]">✓ 0G Storage</div>
        </div>
      </div>
    </div>
  );
}
