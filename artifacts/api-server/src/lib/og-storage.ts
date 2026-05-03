import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import pino from "pino";

const log = pino({ level: "info" });

// Support both OG_INDEXER_RPC (canonical 0G env name) and OG_INDEXER_URL (legacy).
const OG_INDEXER_URL =
  process.env.OG_INDEXER_RPC ??
  process.env.OG_INDEXER_URL ??
  "https://indexer-storage-testnet-standard.0g.ai";
const OG_EVM_RPC = process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
const OG_CHAIN_EXPLORER = "https://chainscan-galileo.0g.ai/tx";
const OG_STORAGE_EXPLORER = "https://storagescan-galileo.0g.ai/file";

export type OgUploadResult = {
  txHash: string;
  rootHash: string;
  /** chainscan-galileo.0g.ai/tx/<txHash> — the on-chain submit transaction. */
  explorerUrl: string;
  /** storagescan-galileo.0g.ai/file/<rootHash> — the stored file artifact. */
  storageExplorerUrl: string;
  bytes: number;
};

export class OgStorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OgStorageConfigError";
  }
}

export class OgStorageUploadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "OgStorageUploadError";
  }
}

// Bridge type: extract what Indexer.upload actually expects as its signer parameter.
// This resolves the ESM (lib.esm) vs CJS (lib.commonjs) dual-package type conflict
// that occurs because ethers ships separate entry points for each module system.
type IndexerUploadSigner = Parameters<InstanceType<typeof Indexer>["upload"]>[2];

/**
 * Upload arbitrary content to 0G Storage on the Galileo testnet via the
 * official @0glabs/0g-ts-sdk Indexer. Returns the real on-chain root hash
 * and submit transaction hash.
 *
 * Throws OgStorageConfigError when OG_PRIVATE_KEY is not configured — the
 * caller is responsible for surfacing this clearly (no silent fake-hash
 * fallback that would mislead the UI / judges into thinking a fake hash
 * is real). Throws OgStorageUploadError on indexer / network failure.
 */
export async function uploadToOgStorage(content: string, label: string): Promise<OgUploadResult> {
  const privateKey = process.env.OG_PRIVATE_KEY;
  if (!privateKey) {
    throw new OgStorageConfigError(
      "OG_PRIVATE_KEY is not configured. Set it to a funded 0G Galileo testnet wallet " +
      "private key to enable real dataset uploads to 0G Storage."
    );
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const memData = new MemData(bytes);
  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);

  // ethers.Wallet is structurally identical to the Signer the SDK expects at runtime;
  // the type mismatch is a TypeScript-only artifact of the ESM/CJS dual-package issue.
  const wallet = new ethers.Wallet(privateKey, provider) as unknown as IndexerUploadSigner;

  const indexer = new Indexer(OG_INDEXER_URL);
  log.info(
    { label, bytes: bytes.length, indexer: OG_INDEXER_URL, evmRpc: OG_EVM_RPC },
    "0G Storage: uploading via Indexer"
  );

  let result: { txHash: string; rootHash: string };
  let err: Error | null;
  try {
    [result, err] = await indexer.upload(memData, OG_EVM_RPC, wallet, {
      tags: "0x",
      finalityRequired: false,
      taskSize: 1,
      expectedReplica: 1,
      skipTx: false,
      fee: 0n,
    });
  } catch (caught) {
    log.error({ label, err: String(caught) }, "0G Storage: indexer.upload threw");
    throw new OgStorageUploadError(
      `0G Storage upload failed for "${label}": ${caught instanceof Error ? caught.message : String(caught)}`,
      caught
    );
  }

  if (err != null) {
    log.error({ label, err: err.message }, "0G Storage: indexer returned error");
    throw new OgStorageUploadError(
      `0G Storage upload failed for "${label}": ${err.message}`,
      err
    );
  }

  log.info(
    { label, txHash: result.txHash, rootHash: result.rootHash, bytes: bytes.length },
    "0G Storage: upload complete"
  );
  return {
    txHash: result.txHash,
    rootHash: result.rootHash,
    explorerUrl: `${OG_CHAIN_EXPLORER}/${result.txHash}`,
    storageExplorerUrl: `${OG_STORAGE_EXPLORER}/${result.rootHash}`,
    bytes: bytes.length,
  };
}

/** Whether the server is configured to perform real uploads. */
export function isOgStorageConfigured(): boolean {
  return !!process.env.OG_PRIVATE_KEY;
}
