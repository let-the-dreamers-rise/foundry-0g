export default function HowItWorks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="relative z-10 flex items-center gap-[1vw]">
        <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
        <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">04 · How It Works</span>
      </div>

      <h2 className="relative z-10 mt-[3vh] font-display font-bold text-text text-[5vw] leading-[0.95] tracking-tight max-w-[70vw]">
        Four steps. <span className="text-muted">Every one verifiable on-chain.</span>
      </h2>

      <div className="relative z-10 mt-auto grid grid-cols-4 gap-[1.5vw]">
        <div className="relative pt-[3vh] border-t-2 border-primary">
          <div className="absolute -top-[1.1vh] left-0 w-[2.2vh] h-[2.2vh] rounded-full bg-primary" />
          <div className="font-mono text-[0.9vw] text-primary tracking-[0.25em] uppercase">Step 01</div>
          <div className="mt-[1.2vh] font-display font-bold text-text text-[2.2vw] leading-tight">Upload Dataset</div>
          <p className="mt-[1.5vh] font-display text-muted text-[1.15vw] leading-snug">
            Training data is chunked and pinned to 0G Storage. A content-addressed root hash is returned and stored on-chain with the model.
          </p>
        </div>

        <div className="relative pt-[3vh] border-t-2 border-primary/60">
          <div className="absolute -top-[1.1vh] left-0 w-[2.2vh] h-[2.2vh] rounded-full bg-primary/80" />
          <div className="font-mono text-[0.9vw] text-primary tracking-[0.25em] uppercase">Step 02</div>
          <div className="mt-[1.2vh] font-display font-bold text-text text-[2.2vw] leading-tight">Run Fine-Tune</div>
          <p className="mt-[1.5vh] font-display text-muted text-[1.15vw] leading-snug">
            A 0G Compute broker accepts the job, runs the training, and returns a signed attestation with the resulting model weights hash.
          </p>
        </div>

        <div className="relative pt-[3vh] border-t-2 border-primary/40">
          <div className="absolute -top-[1.1vh] left-0 w-[2.2vh] h-[2.2vh] rounded-full bg-primary/60" />
          <div className="font-mono text-[0.9vw] text-primary tracking-[0.25em] uppercase">Step 03</div>
          <div className="mt-[1.2vh] font-display font-bold text-text text-[2.2vw] leading-tight">Mint Model NFT</div>
          <p className="mt-[1.5vh] font-display text-muted text-[1.15vw] leading-snug">
            Foundry7857 mints an ERC-7857 AI-NFT carrying dataset hash, weights hash, training attestation, and the creator's royalty schedule.
          </p>
        </div>

        <div className="relative pt-[3vh] border-t-2 border-primary/25">
          <div className="absolute -top-[1.1vh] left-0 w-[2.2vh] h-[2.2vh] rounded-full bg-primary/40" />
          <div className="font-mono text-[0.9vw] text-primary tracking-[0.25em] uppercase">Step 04</div>
          <div className="mt-[1.2vh] font-display font-bold text-text text-[2.2vw] leading-tight">License & Earn</div>
          <p className="mt-[1.5vh] font-display text-muted text-[1.15vw] leading-snug">
            Buyers acquire per-call or perpetual licenses. Inference is gated on-chain. Royalties stream back to creators automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
