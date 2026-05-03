import { Router, type IRouter } from "express";
import { isOgStorageConfigured } from "../lib/og-storage";
import { isCliEnabled } from "../lib/og-fine-tune";
import { isOgComputeConfigured } from "../lib/og-compute";

const router: IRouter = Router();

router.get("/og-status", (_req, res): void => {
  res.json({
    storage: {
      configured: isOgStorageConfigured(),
      indexerRpc:
        process.env.OG_INDEXER_RPC ??
        process.env.OG_INDEXER_URL ??
        "https://indexer-storage-testnet-standard.0g.ai",
      evmRpc: process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai",
    },
    compute: {
      configured: isOgComputeConfigured(),
      endpoint:
        process.env.OG_COMPUTE_ENDPOINT ??
        process.env.OG_COMPUTE_BROKER_URL ??
        null,
      provider: process.env.OG_COMPUTE_PROVIDER ?? null,
    },
    fineTune: {
      configured: isCliEnabled(),
    },
    chain: {
      contractAddress: process.env.FOUNDRY_CONTRACT_ADDRESS ?? null,
      hasPrivateKey: !!process.env.OG_PRIVATE_KEY,
    },
  });
});

export default router;
