/**
 * 0G Storage integration for dataset and model upload.
 * Uses @0glabs/0g-ts-sdk to upload data to 0G's decentralized storage network.
 * Falls back to deterministic hashes when no private key is configured.
 */
import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import { logger } from "./logger";

// 0G Galileo Testnet
const OG_INDEXER_URL = process.env.OG_INDEXER_URL ?? "https://indexer-storage-testnet-standard.0g.ai";
const OG_EVM_RPC = process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
const OG_CHAIN_EXPLORER = "https://chainscan-galileo.0g.ai/tx";

export type OgUploadResult = {
  txHash: string;
  rootHash: string;
  explorerUrl: string;
  real: boolean; // whether this was a real on-chain upload or a simulated one
};

/**
 * Upload data to 0G Storage.
 * If OG_PRIVATE_KEY env var is set, uses the real SDK.
 * Otherwise, generates deterministic hashes for demo purposes.
 */
export async function uploadToOgStorage(
  content: string,
  label: string
): Promise<OgUploadResult> {
  const privateKey = process.env.OG_PRIVATE_KEY;

  if (privateKey) {
    try {
      return await realOgUpload(content, label, privateKey);
    } catch (err) {
      logger.warn({ err, label }, "Real 0G upload failed, falling back to deterministic hash");
    }
  } else {
    logger.info({ label }, "OG_PRIVATE_KEY not set — using deterministic hash for demo");
  }

  return deterministicHash(content, label);
}

async function realOgUpload(
  content: string,
  label: string,
  privateKey: string
): Promise<OgUploadResult> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const memData = new MemData(bytes);

  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  const indexer = new Indexer(OG_INDEXER_URL);

  logger.info({ label, bytes: bytes.length }, "Uploading to 0G Storage via Indexer");

  const [result, err] = await indexer.upload(memData, OG_EVM_RPC, wallet, {
    tags: "0x",
    finalityRequired: false,
  });

  if (err != null) {
    throw new Error(`0G upload error: ${err.message}`);
  }

  const txHash = result.txHash;
  const rootHash = result.rootHash;
  const explorerUrl = `${OG_CHAIN_EXPLORER}/${txHash}`;

  logger.info({ label, txHash, rootHash }, "0G Storage upload complete");

  return { txHash, rootHash, explorerUrl, real: true };
}

/**
 * Generate a deterministic-looking hash from content for demo purposes.
 * Uses a simple hash of the content bytes to produce consistent results.
 */
function deterministicHash(content: string, label: string): OgUploadResult {
  // Simple 64-char deterministic hex from content
  let hash = 0n;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 31n + BigInt(content.charCodeAt(i))) % (2n ** 256n);
  }
  const rootHash = "0x" + hash.toString(16).padStart(64, "0");

  // txHash adds timestamp component so explorer URLs look different each submission
  const ts = Date.now();
  let txHash2 = 0n;
  const combined = content + ts.toString() + label;
  for (let i = 0; i < combined.length; i++) {
    txHash2 = (txHash2 * 37n + BigInt(combined.charCodeAt(i))) % (2n ** 256n);
  }
  const txHash = "0x" + txHash2.toString(16).padStart(64, "0");

  return {
    txHash,
    rootHash,
    explorerUrl: `${OG_CHAIN_EXPLORER}/${txHash}`,
    real: false,
  };
}
