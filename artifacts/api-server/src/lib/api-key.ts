import { createHash, randomBytes } from "node:crypto";

export interface NewApiKey {
  fullKey: string;
  prefix: string;
  hash: string;
}

export function generateApiKey(): NewApiKey {
  const random = randomBytes(24).toString("hex");
  const fullKey = `fnd_live_${random}`;
  return {
    fullKey,
    prefix: fullKey.slice(0, 14),
    hash: hashApiKey(fullKey),
  };
}

export function hashApiKey(fullKey: string): string {
  return createHash("sha256").update(fullKey).digest("hex");
}
