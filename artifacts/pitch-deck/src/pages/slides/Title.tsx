const base = import.meta.env.BASE_URL;

export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}hero-network.png`}
        crossOrigin="anonymous"
        alt="Network background"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/30" />

      <div className="relative z-10 flex flex-col justify-between w-full h-full px-[7vw] py-[6vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[1.1vw] h-[1.1vw] rounded-full bg-primary shadow-[0_0_20px_rgba(16,185,129,0.9)]" />
          <span className="font-mono text-[1.2vw] tracking-[0.3em] text-primary uppercase">
            Foundry · 0G Galileo Testnet
          </span>
        </div>

        <div className="max-w-[80vw]">
          <h1 className="font-display font-bold text-text text-[10vw] leading-[0.88] tracking-tighter">
            AI Models,
          </h1>
          <h1 className="font-display font-bold text-primary text-[10vw] leading-[0.88] tracking-tighter">
            On-Chain.
          </h1>
          <p className="mt-[3.5vh] font-display text-text/80 text-[2.1vw] leading-tight max-w-[55vw]">
            A decentralized marketplace to fine-tune, mint, and license AI models — settled entirely on 0G.
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div className="font-mono text-[1vw] text-muted leading-relaxed">
            <div className="text-text/90">0G APAC Hackathon · May 2026</div>
            <div className="mt-[0.3vh]">Live contract · Chain ID 16602</div>
          </div>
          <div className="font-mono text-[0.9vw] text-muted text-right">
            <div className="text-primary">$45K Track</div>
            <div className="mt-[0.3vh]">YOUR_DEPLOYED_URL</div>
          </div>
        </div>
      </div>
    </div>
  );
}
