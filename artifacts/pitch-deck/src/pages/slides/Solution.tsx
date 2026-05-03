export default function Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="absolute -bottom-[20vh] -left-[10vw] w-[50vw] h-[50vw] rounded-full bg-primary/8 blur-[140px]" />

      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">02 · Foundry</span>
      </div>

      <div className="relative z-10 mt-[5vh] grid grid-cols-12 gap-[3vw] items-start">
        <div className="col-span-7">
          <h2 className="font-display font-bold text-text text-[6.5vw] leading-[0.92] tracking-tight">
            Fine-tune. <br />
            Mint. License. <span className="text-primary">Earn.</span>
          </h2>
          <p className="mt-[3vh] font-display text-text/80 text-[1.7vw] leading-snug max-w-[42vw]">
            Foundry turns every fine-tuned AI model into a verifiable on-chain asset — with provable lineage, programmable royalties, and a marketplace built into the protocol.
          </p>
        </div>

        <div className="col-span-5 mt-[2vh] grid grid-cols-1 gap-[1.8vh]">
          <div className="bg-surface/80 border border-text/10 px-[2vw] py-[2.2vh]">
            <div className="font-mono text-[0.9vw] text-primary tracking-[0.2em] uppercase">Step 01</div>
            <div className="mt-[0.6vh] font-display text-text text-[1.55vw] font-semibold leading-tight">Upload a dataset to 0G Storage</div>
          </div>
          <div className="bg-surface/80 border border-text/10 px-[2vw] py-[2.2vh]">
            <div className="font-mono text-[0.9vw] text-primary tracking-[0.2em] uppercase">Step 02</div>
            <div className="mt-[0.6vh] font-display text-text text-[1.55vw] font-semibold leading-tight">Fine-tune via 0G Compute brokers</div>
          </div>
          <div className="bg-surface/80 border border-text/10 px-[2vw] py-[2.2vh]">
            <div className="font-mono text-[0.9vw] text-primary tracking-[0.2em] uppercase">Step 03</div>
            <div className="mt-[0.6vh] font-display text-text text-[1.55vw] font-semibold leading-tight">Mint a Foundry7857 model NFT</div>
          </div>
          <div className="bg-surface/80 border border-text/10 px-[2vw] py-[2.2vh]">
            <div className="font-mono text-[0.9vw] text-primary tracking-[0.2em] uppercase">Step 04</div>
            <div className="mt-[0.6vh] font-display text-text text-[1.55vw] font-semibold leading-tight">List, license, and collect royalties</div>
          </div>
        </div>
      </div>
    </div>
  );
}
