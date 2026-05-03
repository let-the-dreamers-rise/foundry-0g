import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { ethers } from "ethers";
import { db, apiKeysTable } from "@workspace/db";
import { generateApiKey } from "../lib/api-key";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const EIP712_DOMAIN = {
  name: "Foundry",
  version: "1",
  chainId: 16602,
} as const;

const EIP712_TYPES: Record<string, Array<{ name: string; type: string }>> = {
  ApiKeyAction: [
    { name: "action", type: "string" },
    { name: "wallet", type: "address" },
    { name: "target", type: "string" },
    { name: "signedAt", type: "uint256" },
  ],
};

interface AuthCheck {
  ok: boolean;
  status?: number;
  error?: string;
  wallet?: string;
}

function verifyAction(
  action: "create" | "list" | "delete",
  wallet: unknown,
  target: string,
  signedAt: unknown,
  signature: unknown,
): AuthCheck {
  if (typeof wallet !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return { ok: false, status: 400, error: "Valid wallet address required" };
  }
  if (typeof signature !== "string" || !signature.startsWith("0x")) {
    return { ok: false, status: 401, error: "EIP-712 signature required" };
  }
  const ts = Number(signedAt);
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 401, error: "signedAt required" };
  }
  if (Math.abs(Date.now() - ts) > 10 * 60 * 1000) {
    return { ok: false, status: 401, error: "Signature expired (>10 min)" };
  }
  try {
    const recovered = ethers.verifyTypedData(
      EIP712_DOMAIN,
      EIP712_TYPES,
      { action, wallet, target, signedAt: BigInt(ts) },
      signature,
    );
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return { ok: false, status: 401, error: "Signature does not match wallet" };
    }
  } catch (err) {
    logger.warn({ err }, "api-keys: EIP-712 verification failed");
    return { ok: false, status: 401, error: "Invalid EIP-712 signature" };
  }
  return { ok: true, wallet: wallet.toLowerCase() };
}

router.get("/api-keys", async (req, res): Promise<void> => {
  const check = verifyAction(
    "list",
    req.query.wallet,
    "*",
    req.query.signedAt,
    req.query.signature,
  );
  if (!check.ok) {
    res.status(check.status!).json({ error: check.error });
    return;
  }

  const rows = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      requestCount: apiKeysTable.requestCount,
      lastUsedAt: apiKeysTable.lastUsedAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.walletAddress, check.wallet!))
    .orderBy(desc(apiKeysTable.createdAt));

  res.json({ keys: rows });
});

router.post("/api-keys", async (req, res): Promise<void> => {
  const name = String(req.body?.name ?? "Default").slice(0, 80);
  const check = verifyAction(
    "create",
    req.body?.wallet,
    name,
    req.body?.signedAt,
    req.body?.signature,
  );
  if (!check.ok) {
    res.status(check.status!).json({ error: check.error });
    return;
  }

  const k = generateApiKey();
  const [row] = await db
    .insert(apiKeysTable)
    .values({
      walletAddress: check.wallet!,
      name,
      keyPrefix: k.prefix,
      keyHash: k.hash,
    })
    .returning();

  res.status(201).json({
    id: row!.id,
    name: row!.name,
    fullKey: k.fullKey,
    keyPrefix: row!.keyPrefix,
    createdAt: row!.createdAt,
    warning: "This is the only time the full key is shown. Store it securely.",
  });
});

router.delete("/api-keys/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const check = verifyAction(
    "delete",
    req.query.wallet,
    String(id),
    req.query.signedAt,
    req.query.signature,
  );
  if (!check.ok) {
    res.status(check.status!).json({ error: check.error });
    return;
  }

  const result = await db
    .delete(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.walletAddress, check.wallet!)))
    .returning({ id: apiKeysTable.id });

  if (result.length === 0) {
    res.status(404).json({ error: "Key not found" });
    return;
  }
  res.json({ deleted: result[0]!.id });
});

export default router;
