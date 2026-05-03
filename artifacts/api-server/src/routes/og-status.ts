import { Router, type IRouter } from "express";
import { isOgStorageConfigured } from "../lib/og-storage";
import { isCliEnabled } from "../lib/og-fine-tune";
import { isOgComputeConfigured } from "../lib/og-compute";

const router: IRouter = Router();

router.get("/og-status", (_req, res): void => {
  const storageConfigured = isOgStorageConfigured();
  const computeConfigured = isOgComputeConfigured();
  const fineTuneConfigured = isCliEnabled();
  const indexerUrl =
    process.env.OG_INDEXER_RPC ??
    process.env.OG_INDEXER_URL ??
    "https://indexer-storage-testnet-standard.0g.ai";
  const evmRpc = process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
  const computeEndpoint =
    process.env.OG_COMPUTE_ENDPOINT ??
    process.env.OG_COMPUTE_BROKER_URL ??
    null;
  const contractAddress = process.env.FOUNDRY_CONTRACT_ADDRESS ?? null;
  const hasPrivateKey = !!process.env.OG_PRIVATE_KEY;
  const chainConfigured = !!contractAddress && hasPrivateKey;

  res.json({
    // Nested shape (canonical)
    storage: { configured: storageConfigured, indexerRpc: indexerUrl, evmRpc },
    compute: {
      configured: computeConfigured,
      endpoint: computeEndpoint,
      provider: process.env.OG_COMPUTE_PROVIDER ?? null,
    },
    fineTune: { configured: fineTuneConfigured },
    chain: {
      configured: chainConfigured,
      contractAddress,
      hasPrivateKey,
      chainId: 16602,
      explorerBase: "https://chainscan-galileo.0g.ai",
    },
    // Flat shape (for legacy banner consumers in the web app)
    ogStorageConfigured: storageConfigured,
    ogComputeConfigured: computeConfigured,
    ogChainConfigured: chainConfigured,
    ogEvmRpc: evmRpc,
    ogIndexerUrl: indexerUrl,
    ogComputeBrokerUrl: computeEndpoint,
    ogContractAddress: contractAddress,
  });
});

export default router;
