import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import pino from "pino";

const log = pino({ level: "info" });

const OG_INDEXER_URL = process.env.OG_INDEXER_URL ?? "https://indexer-storage-testnet-standard.0g.ai";
const OG_EVM_RPC = process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
const OG_CHAIN_EXPLORER = "https://chainscan-galileo.0g.ai/tx";

export type OgUploadResult = {
  txHash: string;
  rootHash: string;
  explorerUrl: string;
  real: boolean;
};

// Bridge type: extract what Indexer.upload actually expects as its signer parameter.
// This resolves the ESM (lib.esm) vs CJS (lib.commonjs) dual-package type conflict
// that occurs because ethers ships separate entry points for each module system.
type IndexerUploadSigner = Parameters<InstanceType<typeof Indexer>["upload"]>[2];

export async function uploadToOgStorage(content: string, label: string): Promise<OgUploadResult> {
  const privateKey = process.env.OG_PRIVATE_KEY;
  if (privateKey) {
    try {
      return await realOgUpload(content, label, privateKey);
    } catch (uploadErr) {
      log.warn({ err: String(uploadErr), label }, "0G upload failed, using deterministic hash");
    }
  } else {
    log.info({ label }, "OG_PRIVATE_KEY not configured — using deterministic hash for demo");
  }
  return deterministicHash(content, label);
}

async function realOgUpload(content: string, label: string, privateKey: string): Promise<OgUploadResult> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const memData = new MemData(bytes);
  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);

  // ethers.Wallet is structurally identical to the Signer the SDK expects at runtime;
  // the type mismatch is a TypeScript-only artifact of the ESM/CJS dual-package issue.
  const wallet = new ethers.Wallet(privateKey, provider) as unknown as IndexerUploadSigner;

  const indexer = new Indexer(OG_INDEXER_URL);
  log.info({ label, bytes: bytes.length }, "Uploading to 0G Storage via Indexer");

  const [result, err] = await indexer.upload(memData, OG_EVM_RPC, wallet, {
    tags: "0x",
    finalityRequired: false,
    taskSize: 1,
    expectedReplica: 1,
    skipTx: false,
    fee: 0n,
  });

  if (err != null) {
    throw new Error(err.message);
  }

  log.info({ label, txHash: result.txHash, rootHash: result.rootHash }, "0G upload complete");
  return {
    txHash: result.txHash,
    rootHash: result.rootHash,
    explorerUrl: `${OG_CHAIN_EXPLORER}/${result.txHash}`,
    real: true,
  };
}

function deterministicHash(content: string, label: string): OgUploadResult {
  let hash = 0n;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 31n + BigInt(content.charCodeAt(i))) % (2n ** 256n);
  }
  const rootHash = "0x" + hash.toString(16).padStart(64, "0");

  const ts = Date.now();
  const combined = content + ts.toString() + label;
  let txHash2 = 0n;
  for (let i = 0; i < combined.length; i++) {
    txHash2 = (txHash2 * 37n + BigInt(combined.charCodeAt(i))) % (2n ** 256n);
  }
  const txHash = "0x" + txHash2.toString(16).padStart(64, "0");
  return { txHash, rootHash, explorerUrl: `${OG_CHAIN_EXPLORER}/${txHash}`, real: false };
}
