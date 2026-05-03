export default function BuiltOn0G() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] bg-primary/5 blur-[120px]" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">05 · Built On 0G</span>
      </div>

      <h2 className="relative z-10 mt-[3vh] font-display font-bold text-text text-[5.2vw] leading-[0.95] tracking-tight max-w-[75vw]">
        We use the full 0G stack — <span className="text-primary">not just one chain call.</span>
      </h2>

      <div className="relative z-10 mt-[5vh] grid grid-cols-2 grid-rows-2 gap-[1.6vw]">
        <div className="bg-surface/70 border border-text/10 p-[3vh] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[0.95vw] text-primary tracking-[0.25em] uppercase">0G Storage</div>
            <div className="font-mono text-[0.85vw] text-primary px-[0.8vw] py-[0.4vh] border border-primary/40">LIVE</div>
          </div>
          <div className="mt-[1.5vh] font-display font-bold text-text text-[2.4vw] leading-tight">Datasets & Weights</div>
          <p className="mt-[1.2vh] font-display text-muted text-[1.2vw] leading-snug">
            Every training dataset and resulting model file is uploaded, chunked, and content-addressed. The root hash anchors model provenance.
          </p>
        </div>

        <div className="bg-surface/70 border border-text/10 p-[3vh] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[0.95vw] text-primary tracking-[0.25em] uppercase">0G Chain</div>
            <div className="font-mono text-[0.85vw] text-primary px-[0.8vw] py-[0.4vh] border border-primary/40">LIVE</div>
          </div>
          <div className="mt-[1.5vh] font-display font-bold text-text text-[2.4vw] leading-tight">Foundry7857 Contract</div>
          <p className="mt-[1.2vh] font-display text-muted text-[1.2vw] leading-snug">
            ERC-7857 model NFTs, license escrow, and royalty splits — all settled on Galileo testnet at chain ID 16602.
          </p>
        </div>

        <div className="bg-surface/70 border border-text/10 p-[3vh] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[0.95vw] text-accent tracking-[0.25em] uppercase">0G Compute</div>
            <div className="font-mono text-[0.85vw] text-accent px-[0.8vw] py-[0.4vh] border border-accent/40">INTEGRATED</div>
          </div>
          <div className="mt-[1.5vh] font-display font-bold text-text text-[2.4vw] leading-tight">Fine-Tune Brokers</div>
          <p className="mt-[1.2vh] font-display text-muted text-[1.2vw] leading-snug">
            Training jobs are dispatched to 0G Compute broker endpoints with signed attestations binding inputs to outputs.
          </p>
        </div>

        <div className="bg-surface/70 border border-text/10 p-[3vh] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[0.95vw] text-accent tracking-[0.25em] uppercase">0G DA</div>
            <div className="font-mono text-[0.85vw] text-accent px-[0.8vw] py-[0.4vh] border border-accent/40">INTEGRATED</div>
          </div>
          <div className="mt-[1.5vh] font-display font-bold text-text text-[2.4vw] leading-tight">Inference Receipts</div>
          <p className="mt-[1.2vh] font-display text-muted text-[1.2vw] leading-snug">
            Every metered inference call posts a usage receipt to 0G DA, so royalty accounting is auditable end-to-end.
          </p>
        </div>
      </div>
    </div>
  );
}
