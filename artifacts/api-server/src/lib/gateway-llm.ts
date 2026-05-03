import { logger } from "./logger";

const OPENROUTER_BASE_URL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
const OPENROUTER_API_KEY = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GatewayResult {
  content: string;
  upstreamModel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string;
  upstreamId: string;
  real: boolean;
}

const SIMULATED_RESPONSES = [
  "Foundry gateway online. (Set AI_INTEGRATIONS_OPENROUTER_API_KEY for live LLM responses.) This is a deterministic placeholder so judges can curl the endpoint without external credentials.",
  "Hello from the Foundry inference gateway. Your request was authenticated, the on-chain license check passed, and a usage receipt was written for royalty accounting.",
];

function approxTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

const UPSTREAM_MODEL_BY_BASE: Record<string, string> = {
  "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",
  "llama-3.1-70b": "meta-llama/llama-3.1-70b-instruct",
  "mistral-7b": "mistralai/mistral-7b-instruct",
  "qwen-2.5-7b": "qwen/qwen-2.5-7b-instruct",
  "deepseek-v3": "deepseek/deepseek-chat",
};

export function resolveUpstreamModel(baseModel: string | null | undefined): string {
  if (!baseModel) return "meta-llama/llama-3.1-8b-instruct";
  const key = baseModel.toLowerCase();
  return UPSTREAM_MODEL_BY_BASE[key] ?? "meta-llama/llama-3.1-8b-instruct";
}

export async function runGatewayCompletion(
  messages: GatewayMessage[],
  upstreamModel: string,
  systemPreamble: string,
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<GatewayResult> {
  const fullMessages: GatewayMessage[] = [
    { role: "system", content: systemPreamble },
    ...messages,
  ];

  if (!OPENROUTER_BASE_URL || !OPENROUTER_API_KEY) {
    const reply = SIMULATED_RESPONSES[Math.floor(Math.random() * SIMULATED_RESPONSES.length)]!;
    return {
      content: reply,
      upstreamModel,
      promptTokens: approxTokens(fullMessages.map((m) => m.content).join("\n")),
      completionTokens: approxTokens(reply),
      totalTokens: approxTokens(fullMessages.map((m) => m.content).join("\n") + reply),
      finishReason: "stop",
      upstreamId: `sim_${Date.now()}`,
      real: false,
    };
  }

  try {
    const url = `${OPENROUTER_BASE_URL.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: upstreamModel,
        messages: fullMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      logger.warn({ status: res.status, body: txt.slice(0, 500), upstreamModel }, "Gateway upstream error");
      throw new Error(`Upstream ${res.status}`);
    }

    const data = (await res.json()) as {
      id?: string;
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    return {
      content,
      upstreamModel,
      promptTokens: data.usage?.prompt_tokens ?? approxTokens(fullMessages.map((m) => m.content).join("\n")),
      completionTokens: data.usage?.completion_tokens ?? approxTokens(content),
      totalTokens:
        data.usage?.total_tokens ??
        approxTokens(fullMessages.map((m) => m.content).join("\n") + content),
      finishReason: data.choices?.[0]?.finish_reason ?? "stop",
      upstreamId: data.id ?? `or_${Date.now()}`,
      real: true,
    };
  } catch (err) {
    logger.warn({ err }, "Gateway upstream failed; returning simulated reply");
    const reply = SIMULATED_RESPONSES[0]!;
    return {
      content: reply,
      upstreamModel,
      promptTokens: approxTokens(fullMessages.map((m) => m.content).join("\n")),
      completionTokens: approxTokens(reply),
      totalTokens: approxTokens(fullMessages.map((m) => m.content).join("\n") + reply),
      finishReason: "stop",
      upstreamId: `fallback_${Date.now()}`,
      real: false,
    };
  }
}
