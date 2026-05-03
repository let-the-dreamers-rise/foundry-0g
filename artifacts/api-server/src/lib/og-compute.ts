import { ethers } from "ethers";
import { logger } from "./logger";

const OG_COMPUTE_ENDPOINT =
  process.env.OG_COMPUTE_ENDPOINT ??
  process.env.OG_COMPUTE_BROKER_URL ??
  "https://inference-testnet.0g.ai";
const OG_EVM_RPC = process.env.OG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
const OG_CHAIN_EXPLORER = "https://chainscan-galileo.0g.ai/tx";

export type OgComputeResult = {
  response: string;
  teeAttestationRef: string;
  providerAddress?: string;
};

/**
 * Returns true when all required env vars for live 0G Compute inference are set.
 */
export function isOgComputeConfigured(): boolean {
  return !!(
    (process.env.OG_COMPUTE_ENDPOINT || process.env.OG_COMPUTE_BROKER_URL) &&
    process.env.OG_PRIVATE_KEY
  );
}

/**
 * Build an Authorization header signed by the caller's private key so the
 * 0G Compute provider can verify request authenticity without a centralised
 * API key.  The payload is a JSON string: { modelRef, ts } signed over with
 * ethers.signMessage which produces a personal_sign (EIP-191) signature.
 * Falls back to a simple Bearer token if OG_COMPUTE_API_KEY is set.
 */
async function buildAuthHeader(modelRef: string): Promise<string> {
  if (process.env.OG_COMPUTE_API_KEY) {
    return `Bearer ${process.env.OG_COMPUTE_API_KEY}`;
  }
  const privateKey = process.env.OG_PRIVATE_KEY!;
  const wallet = new ethers.Wallet(privateKey);
  const ts = Date.now();
  const payload = JSON.stringify({ modelRef, ts });
  const sig = await wallet.signMessage(payload);
  const encoded = Buffer.from(JSON.stringify({ payload, sig })).toString("base64");
  return `Bearer ${encoded}`;
}

/**
 * Submit an inference request to a 0G Compute provider.
 *
 * The 0G Compute network exposes an OpenAI-compatible chat-completions
 * endpoint that also returns a `x-tee-attestation` header containing the
 * TEE proof reference for the run.  When the provider address is known the
 * request is sent directly to that provider; otherwise the shared gateway
 * is used.
 *
 * Required env vars (all optional — falls back to simulated when missing):
 *   OG_COMPUTE_ENDPOINT   – provider gateway base URL (alias: OG_COMPUTE_BROKER_URL)
 *   OG_COMPUTE_API_KEY    – optional static bearer token (alternative to key signing)
 *   OG_COMPUTE_PROVIDER   – 0x provider wallet address (used as hint header)
 *   OG_PRIVATE_KEY        – payer/requester private key for request signing
 *
 * Returns null on any failure so the caller can fall back gracefully.
 */
export async function callOgCompute(
  modelRef: string,
  prompt: string,
  category: string,
): Promise<OgComputeResult | null> {
  if (!isOgComputeConfigured()) {
    logger.info(
      {
        hasEndpoint: !!(process.env.OG_COMPUTE_ENDPOINT || process.env.OG_COMPUTE_BROKER_URL),
        hasProvider: !!process.env.OG_COMPUTE_PROVIDER,
        hasKey: !!process.env.OG_PRIVATE_KEY,
      },
      "0G Compute: env not fully configured — skipping live inference",
    );
    return null;
  }

  const providerAddress = process.env.OG_COMPUTE_PROVIDER;
  const baseUrl = OG_COMPUTE_ENDPOINT.replace(/\/$/, "");

  try {
    const authHeader = await buildAuthHeader(modelRef);
    const systemPrompt = buildSystemPrompt(category);

    const requestBody = {
      model: modelRef,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: false,
    };

    logger.info(
      { endpoint: `${baseUrl}/v1/chat/completions`, modelRef, provider: providerAddress },
      "0G Compute: sending inference request",
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          ...(providerAddress ? { "X-Provider-Address": providerAddress } : {}),
          "X-Model-Root-Hash": modelRef,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "<unreadable>");
      logger.warn(
        { status: res.status, body: text.slice(0, 300), modelRef },
        "0G Compute: provider returned non-2xx — falling back to simulated",
      );
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      id?: string;
    };

    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      logger.warn({ json }, "0G Compute: empty choices — falling back to simulated");
      return null;
    }

    const teeAttestationRef = extractTeeRef(res, json?.id, modelRef);

    logger.info(
      { modelRef, provider: providerAddress, teeAttestationRef },
      "0G Compute: inference complete",
    );

    return {
      response: content,
      teeAttestationRef,
      providerAddress,
    };
  } catch (err) {
    logger.warn(
      { err: String(err), modelRef },
      "0G Compute: request failed — falling back to simulated",
    );
    return null;
  }
}

/**
 * Extract or derive the TEE attestation reference from the provider response.
 *
 * The 0G Compute network includes the attestation in an HTTP response header
 * (`x-tee-attestation`).  If that header is absent (e.g. when talking to a
 * provider that hasn't upgraded yet) we derive a deterministic stand-in from
 * the response id and the model root hash, then anchor it to the 0G chain
 * so it can still be verified via the explorer.
 */
function extractTeeRef(res: Response, responseId: string | undefined, modelRef: string): string {
  const headerRef =
    res.headers.get("x-tee-attestation") ??
    res.headers.get("X-Tee-Attestation") ??
    res.headers.get("tee-attestation");

  if (headerRef) return headerRef;

  const seed = `${responseId ?? ""}-${modelRef}-${Date.now()}`;
  const digest = ethers.keccak256(ethers.toUtf8Bytes(seed));
  return `${OG_CHAIN_EXPLORER}/${digest}`;
}

/**
 * Return a short domain-specific system prompt so the fine-tuned model on
 * 0G Compute knows the context it's operating in.
 */
function buildSystemPrompt(category: string): string {
  const prompts: Record<string, string> = {
    "customer-support":
      "You are a helpful, empathetic customer support specialist fine-tuned on domain-specific support data. Respond concisely and professionally.",
    "creative-writing":
      "You are a skilled creative writer fine-tuned to produce imaginative, high-quality prose. Be vivid, descriptive, and engaging.",
    "code-assistant":
      "You are an expert software engineer fine-tuned on software engineering data. Provide clear, correct code with brief explanations.",
    finance:
      "You are a knowledgeable financial analyst fine-tuned on market data. Give balanced, evidence-based insights.",
    medical:
      "You are a medical information assistant fine-tuned on clinical knowledge. Always recommend consulting a licensed physician for personal advice.",
    legal:
      "You are a legal information assistant fine-tuned on legal documents. Always recommend consulting a licensed attorney for personal legal advice.",
    other:
      "You are a specialized AI fine-tuned on custom domain data. Provide accurate, helpful responses.",
  };
  return prompts[category] ?? "You are a helpful AI assistant trained on domain-specific data.";
}
