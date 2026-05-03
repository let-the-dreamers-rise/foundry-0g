export default function Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="absolute top-0 right-0 w-[55vw] h-[55vw] rounded-full bg-primary/5 blur-[120px] -translate-y-1/3 translate-x-1/4" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">01 · The Problem</span>
      </div>

      <h2 className="relative z-10 mt-[4vh] font-display font-bold text-text text-[6vw] leading-[0.95] tracking-tight max-w-[70vw]">
        AI is being built in the open. <span className="text-muted">It isn't owned that way.</span>
      </h2>

      <div className="relative z-10 mt-auto grid grid-cols-3 gap-[3vw]">
        <div className="border-t border-text/15 pt-[3vh]">
          <div className="font-display font-bold text-primary text-[6vw] leading-none tracking-tighter">87%</div>
          <div className="mt-[1.2vh] font-display text-text text-[1.6vw] font-semibold leading-tight">of foundation models live behind closed APIs</div>
          <div className="mt-[1vh] font-mono text-[0.95vw] text-muted leading-relaxed">Stanford AI Index, 2025</div>
        </div>
        <div className="border-t border-text/15 pt-[3vh]">
          <div className="font-display font-bold text-primary text-[6vw] leading-none tracking-tighter">0%</div>
          <div className="mt-[1.2vh] font-display text-text text-[1.6vw] font-semibold leading-tight">royalty share for the engineers who fine-tune them</div>
          <div className="mt-[1vh] font-mono text-[0.95vw] text-muted leading-relaxed">No standard for model provenance</div>
        </div>
        <div className="border-t border-text/15 pt-[3vh]">
          <div className="font-display font-bold text-primary text-[6vw] leading-none tracking-tighter">$200B</div>
          <div className="mt-[1.2vh] font-display text-text text-[1.6vw] font-semibold leading-tight">in AI revenue captured by three vendors</div>
          <div className="mt-[1vh] font-mono text-[0.95vw] text-muted leading-relaxed">Bloomberg Intelligence, 2025</div>
        </div>
      </div>
    </div>
  );
}
