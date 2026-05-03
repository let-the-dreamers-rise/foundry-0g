const base = import.meta.env.BASE_URL;

export default function Market() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}cube-asset.png`}
        crossOrigin="anonymous"
        alt="Asset cube"
        className="absolute right-0 top-0 h-full w-[55vw] object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent" />

      <div className="relative z-10 flex flex-col h-full px-[7vw] py-[7vh] max-w-[60vw]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
          <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">06 · Market</span>
        </div>

        <h2 className="mt-[3vh] font-display font-bold text-text text-[5.2vw] leading-[0.95] tracking-tight">
          The AI creator economy is <span className="text-primary">starved of ownership.</span>
        </h2>

        <div className="mt-auto">
          <div className="font-display font-bold text-primary text-[12vw] leading-none tracking-tighter">$1.3T</div>
          <div className="mt-[1vh] font-display text-text text-[1.8vw] font-semibold leading-tight max-w-[45vw]">
            projected AI software market by 2032
          </div>
          <div className="mt-[0.8vh] font-mono text-[1vw] text-muted">Bloomberg Intelligence · 2024</div>

          <div className="mt-[4vh] grid grid-cols-2 gap-[2vw] max-w-[45vw]">
            <div className="border-l-2 border-primary pl-[1.5vw]">
              <div className="font-display font-bold text-text text-[3.2vw] leading-none">2.4M</div>
              <div className="mt-[0.8vh] font-mono text-[0.95vw] text-muted leading-snug">fine-tuned models on Hugging Face — none of which earn their authors a cent</div>
            </div>
            <div className="border-l-2 border-primary pl-[1.5vw]">
              <div className="font-display font-bold text-text text-[3.2vw] leading-none">$13B</div>
              <div className="mt-[0.8vh] font-mono text-[0.95vw] text-muted leading-snug">spent on enterprise model fine-tuning in 2025 — captured by hyperscalers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
