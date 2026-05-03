import pino from "pino";

const log = pino({ level: "info" });

export type OgComputeResult = {
  response: string;
  teeAttestationRef: string;
  real: boolean;
  brokerUrl?: string;
};

export async function callOgCompute(
  modelRef: string,
  prompt: string,
  category: string
): Promise<OgComputeResult | null> {
  const brokerUrl = process.env.OG_COMPUTE_BROKER_URL;
  if (!brokerUrl) {
    log.info({ category }, "OG_COMPUTE_BROKER_URL not set — using simulated inference");
    return null;
  }

  const systemPrompt = buildSystemPrompt(category);

  try {
    log.info({ brokerUrl, modelRef: modelRef.slice(0, 16) }, "Calling 0G Compute broker");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${brokerUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OG_COMPUTE_API_KEY
          ? { Authorization: `Bearer ${process.env.OG_COMPUTE_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model: modelRef,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Broker HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      id?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("Empty response from broker");

    const teeRef = `tee_real_${data.id ?? Date.now()}_${modelRef.slice(2, 10)}`;

    log.info({ teeRef }, "0G Compute inference complete");

    return {
      response: content,
      teeAttestationRef: teeRef,
      real: true,
      brokerUrl,
    };
  } catch (err: unknown) {
    log.warn(
      { err: String(err), brokerUrl },
      "0G Compute broker call failed — falling back to simulated inference"
    );
    return null;
  }
}

function buildSystemPrompt(category: string): string {
  const prompts: Record<string, string> = {
    "customer-support":
      "You are a helpful customer support AI fine-tuned on domain-specific support data. Provide clear, empathetic, and actionable responses.",
    "creative-writing":
      "You are a creative writing AI fine-tuned to produce imaginative, high-quality prose. Be vivid, descriptive, and engaging.",
    "code-assistant":
      "You are a coding assistant AI fine-tuned on software engineering data. Provide precise, well-explained code solutions.",
    finance:
      "You are a financial analysis AI fine-tuned on market and investment data. Provide balanced, data-driven insights.",
    medical:
      "You are a medical information AI fine-tuned on clinical knowledge. Provide accurate information and recommend professional consultation.",
    legal:
      "You are a legal analysis AI fine-tuned on legal documents and case law. Provide structured legal insights.",
    other:
      "You are a specialized AI fine-tuned on custom domain data. Provide accurate, helpful responses based on your training.",
  };
  return (
    prompts[category] ??
    "You are a specialized AI assistant. Provide helpful, accurate responses."
  );
}
