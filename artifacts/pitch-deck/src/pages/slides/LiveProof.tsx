export default function LiveProof() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg flex flex-col px-[7vw] py-[7vh]">
      <div className="absolute inset-x-0 top-0 h-[0.3vh] bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2.5vw] h-[0.2vh] bg-primary" />
          <span className="font-mono text-[1vw] tracking-[0.3em] text-primary uppercase">03 · Live On-Chain Proof</span>
        </div>
        <div className="flex items-center gap-[0.8vw] px-[1.4vw] py-[1vh] border border-primary/40 bg-primary/10">
          <div className="w-[0.7vw] h-[0.7vw] rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[0.95vw] text-primary tracking-[0.2em] uppercase">Live · Galileo Testnet</span>
        </div>
      </div>

      <h2 className="relative z-10 mt-[4vh] font-display font-bold text-text text-[5.6vw] leading-[0.95] tracking-tight max-w-[80vw]">
        Not a mockup. <span className="text-primary">Already deployed.</span>
      </h2>

      <div className="relative z-10 mt-[4vh] grid grid-cols-12 gap-[2vw]">
        <div className="col-span-7 bg-surface border border-text/10 p-[3vh]">
          <div className="font-mono text-[0.9vw] text-muted tracking-[0.2em] uppercase">Foundry7857 Contract</div>
          <div className="mt-[1.5vh] font-mono text-primary text-[1.6vw] break-all leading-snug">
            0xA0448Cd63f746a60447cfF1817ec9781C25F7b25
          </div>
          <div className="mt-[2.5vh] grid grid-cols-2 gap-[1.5vw]">
            <div>
              <div className="font-mono text-[0.85vw] text-muted tracking-[0.15em] uppercase">Chain ID</div>
              <div className="mt-[0.5vh] font-mono text-text text-[1.4vw]">16602</div>
            </div>
            <div>
              <div className="font-mono text-[0.85vw] text-muted tracking-[0.15em] uppercase">RPC</div>
              <div className="mt-[0.5vh] font-mono text-text text-[1.4vw]">evmrpc-testnet.0g.ai</div>
            </div>
          </div>
        </div>

        <div className="col-span-5 grid grid-cols-1 gap-[1.5vh]">
          <div className="bg-surface border border-text/10 p-[2.4vh]">
            <div className="font-mono text-[0.85vw] text-muted tracking-[0.15em] uppercase">Deploy Tx</div>
            <div className="mt-[0.6vh] font-mono text-text text-[1.15vw] break-all">0x20c25681…66ad7</div>
          </div>
          <div className="bg-surface border border-text/10 p-[2.4vh]">
            <div className="font-mono text-[0.85vw] text-muted tracking-[0.15em] uppercase">Token Standard</div>
            <div className="mt-[0.6vh] font-display text-text text-[1.6vw] font-semibold">ERC-7857 (AI-NFT)</div>
          </div>
          <div className="bg-primary/10 border border-primary/40 p-[2.4vh]">
            <div className="font-mono text-[0.85vw] text-primary tracking-[0.15em] uppercase">Verify</div>
            <div className="mt-[0.6vh] font-mono text-primary text-[1.15vw] break-all">chainscan-galileo.0g.ai</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-[3vh] flex items-center justify-between font-mono text-[0.95vw] text-muted">
        <span>Storage · Chain · Compute · DA all live in production</span>
        <span className="text-primary">/api/og-status → ok</span>
      </div>
    </div>
  );
}
