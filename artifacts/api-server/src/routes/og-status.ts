import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/og-status", (_req, res): void => {
  res.json({
    ogStorageConfigured: !!process.env.OG_PRIVATE_KEY,
    ogComputeConfigured: !!process.env.OG_COMPUTE_BROKER_URL,
    ogChainConfigured: !!(process.env.FOUNDRY_CONTRACT_ADDRESS && process.env.OG_PRIVATE_KEY),
    ogFineTuneCliConfigured: !!process.env.OG_COMPUTE_PROVIDER,
    ogEvmRpc: process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai",
    ogIndexerUrl:
      process.env.OG_INDEXER_RPC ??
      process.env.OG_INDEXER_URL ??
      "https://indexer-storage-testnet-standard.0g.ai",
    ogComputeBrokerUrl: process.env.OG_COMPUTE_BROKER_URL ?? null,
    foundryContractAddress: process.env.FOUNDRY_CONTRACT_ADDRESS ?? null,
  });
});

export default router;
