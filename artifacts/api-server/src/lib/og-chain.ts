import { ethers } from "ethers";
import { logger } from "./logger";

const OG_EVM_RPC = process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
const OG_CHAIN_EXPLORER = "https://chainscan-galileo.0g.ai/tx";

const FOUNDRY_ABI = [
  "function mint(address to, bytes32 modelRootHash, bytes32 datasetRootHash, string baseModel, string category, uint256 licensePriceWei) external returns (uint256)",
  "event ModelMinted(uint256 indexed tokenId, address indexed owner, bytes32 modelRootHash, bytes32 datasetRootHash, string category)",
] as const;

export type MintResult = {
  tokenId: string;
  txHash: string;
  explorerUrl: string;
  real: boolean;
};

export type PaymentVerification = {
  verified: boolean;
  reason?: string;
  amountWei?: string;
  from?: string;
  to?: string;
};

function explorer(hash: string): string {
  return `${OG_CHAIN_EXPLORER}/${hash}`;
}

/**
 * Mint a Foundry7857 model NFT on 0G Chain when credentials are configured.
 * Returns null when env is missing or the call fails (caller falls back to
 * a deterministic placeholder for demo mode).
 *
 * Required env: FOUNDRY_CONTRACT_ADDRESS, OG_PRIVATE_KEY
 */
export async function mintModelNft(args: {
  to: string;
  modelRootHash: string;
  datasetRootHash: string;
  baseModel: string;
  category: string;
  licensePriceUsd: number;
}): Promise<MintResult | null> {
  const contractAddress = process.env.FOUNDRY_CONTRACT_ADDRESS;
  const privateKey = process.env.OG_PRIVATE_KEY;
  if (!contractAddress || !privateKey) {
    logger.info(
      { hasContract: !!contractAddress, hasKey: !!privateKey },
      "0G mint: env not configured — falling back to deterministic"
    );
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, FOUNDRY_ABI, wallet);

    // Convert USD price → wei (rough: 1 USD ≈ 0.0005 ETH for demo).
    const licensePriceWei = ethers.parseEther((args.licensePriceUsd * 0.0005).toFixed(8));

    const modelRoot = args.modelRootHash.startsWith("0x") ? args.modelRootHash : `0x${args.modelRootHash}`;
    const datasetRoot = args.datasetRootHash.startsWith("0x") ? args.datasetRootHash : `0x${args.datasetRootHash}`;

    logger.info({ to: args.to, contractAddress }, "0G mint: submitting tx");
    const tx = await contract.mint(
      args.to,
      modelRoot,
      datasetRoot,
      args.baseModel,
      args.category,
      licensePriceWei,
    );
    const receipt = await tx.wait();
    const log = receipt?.logs.find((l: { topics: string[] }) =>
      l.topics[0] === ethers.id("ModelMinted(uint256,address,bytes32,bytes32,string)")
    );
    const tokenId = log ? BigInt(log.topics[1]).toString() : "0";

    logger.info({ tokenId, txHash: tx.hash }, "0G mint: success");
    return {
      tokenId,
      txHash: tx.hash,
      explorerUrl: explorer(tx.hash),
      real: true,
    };
  } catch (err) {
    logger.warn({ err: String(err) }, "0G mint: failed — falling back to deterministic");
    return null;
  }
}

/**
 * Verify a license payment by inspecting the on-chain tx receipt.
 * Confirms (a) the tx is mined on 0G Galileo, (b) the sender matches buyer,
 * and (c) the value transferred is at least minPriceUsd (rough USD→wei conversion).
 *
 * When OG_EVM_RPC is unreachable or the tx is unknown, returns verified:false
 * with a reason. The caller can choose to accept anyway (with `paymentVerified=false`)
 * or reject the purchase outright.
 */
export async function verifyLicensePayment(args: {
  txHash: string;
  expectedBuyer: string;
  minPriceUsd: number;
}): Promise<PaymentVerification> {
  try {
    const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);
    const tx = await provider.getTransaction(args.txHash);
    if (!tx) return { verified: false, reason: "Transaction not found on chain" };

    const receipt = await provider.getTransactionReceipt(args.txHash);
    if (!receipt || receipt.status !== 1) {
      return { verified: false, reason: "Transaction not mined or reverted" };
    }

    if (tx.from.toLowerCase() !== args.expectedBuyer.toLowerCase()) {
      return {
        verified: false,
        reason: `Sender ${tx.from} does not match expected buyer ${args.expectedBuyer}`,
        from: tx.from,
      };
    }

    const minWei = ethers.parseEther((args.minPriceUsd * 0.0005).toFixed(8));
    if (tx.value < minWei) {
      return {
        verified: false,
        reason: `Insufficient payment: ${ethers.formatEther(tx.value)} ETH < ${ethers.formatEther(minWei)} ETH`,
        amountWei: tx.value.toString(),
        from: tx.from,
        to: tx.to ?? undefined,
      };
    }

    return {
      verified: true,
      amountWei: tx.value.toString(),
      from: tx.from,
      to: tx.to ?? undefined,
    };
  } catch (err) {
    return { verified: false, reason: `Verification error: ${String(err)}` };
  }
}

export function makeOgExplorerUrl(txHash: string): string {
  return explorer(txHash);
}

export type InferenceAnchorResult = {
  txHash: string;
  explorerUrl: string;
  blockNumber: number | null;
  real: boolean;
};

let cachedAnchorWallet: ethers.Wallet | null = null;
function getAnchorWallet(): ethers.Wallet | null {
  const pk = process.env.OG_PRIVATE_KEY;
  if (!pk) return null;
  if (cachedAnchorWallet) return cachedAnchorWallet;
  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);
  cachedAnchorWallet = new ethers.Wallet(pk, provider);
  return cachedAnchorWallet;
}

/**
 * Post a real on-chain transaction anchoring an inference call to 0G Galileo.
 *
 * Sends a 0-value self-transfer carrying the keccak256(modelId || caller || responseHash)
 * digest in calldata. The transaction hash this returns is genuinely mined on
 * 0G Galileo and resolves cleanly on chainscan-galileo.0g.ai/tx/<hash>.
 *
 * Returns null when OG_PRIVATE_KEY is missing or the network call fails — the
 * caller is responsible for falling back to a clearly-marked simulated hash.
 */
export async function anchorInferenceOnChain(args: {
  modelId: number;
  caller: string;
  responseDigest: string;
}): Promise<InferenceAnchorResult | null> {
  const wallet = getAnchorWallet();
  if (!wallet) {
    logger.info("anchorInferenceOnChain: OG_PRIVATE_KEY missing, skipping");
    return null;
  }

  try {
    const payload = ethers.solidityPacked(
      ["string", "uint256", "address", "bytes32"],
      ["FoundryInfer", BigInt(args.modelId), args.caller, args.responseDigest],
    );

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0n,
      data: payload,
    });
    const receipt = await tx.wait();

    return {
      txHash: tx.hash,
      explorerUrl: explorer(tx.hash),
      blockNumber: receipt?.blockNumber ?? null,
      real: true,
    };
  } catch (err) {
    logger.warn({ err: String(err) }, "anchorInferenceOnChain: failed");
    return null;
  }
}
