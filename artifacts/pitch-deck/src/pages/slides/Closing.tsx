export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-transparent" />
      <div className="absolute -bottom-[30vh] -right-[10vw] w-[60vw] h-[60vw] rounded-full bg-primary/8 blur-[160px]" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[1.1vw] h-[1.1vw] rounded-full bg-primary shadow-[0_0_20px_rgba(16,185,129,0.9)]" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">09 · Try It Now</span>
      </div>

      <div className="relative z-10 mt-auto mb-auto pt-[6vh]">
        <h2 className="font-display font-bold text-text text-[9vw] leading-[0.88] tracking-tighter">
          Own the model.
        </h2>
        <h2 className="font-display font-bold text-primary text-[9vw] leading-[0.88] tracking-tighter">
          Earn the upside.
        </h2>
        <p className="mt-[3.5vh] font-display text-text/80 text-[2vw] leading-snug max-w-[62vw]">
          Foundry is live on 0G Galileo testnet today. Mint your first model NFT in under five minutes.
        </p>
      </div>

      <div className="relative z-10 mt-[2vh] grid grid-cols-3 gap-[2vw] border-t border-text/15 pt-[3vh]">
        <div>
          <div className="font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">Live App</div>
          <div className="mt-[0.6vh] font-mono text-text text-[1.4vw]">YOUR_DEPLOYED_URL</div>
        </div>
        <div>
          <div className="font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">Contract</div>
          <div className="mt-[0.6vh] font-mono text-primary text-[1.4vw] break-all">0xA0448Cd6…25F7b25</div>
        </div>
        <div>
          <div className="font-mono text-[0.85vw] text-muted tracking-[0.2em] uppercase">Hackathon</div>
          <div className="mt-[0.6vh] font-mono text-text text-[1.4vw]">0G APAC · May 2026</div>
        </div>
      </div>
    </div>
  );
}
