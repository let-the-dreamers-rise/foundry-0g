import { spawn } from "node:child_process";
import { logger } from "./logger";

/**
 * Wrapper around `0g-compute-cli fine-tuning` for real on-chain training jobs.
 * Falls back to a simulated pipeline when the CLI is unavailable or env is
 * incomplete, so the demo always runs.
 *
 * Required env to enable real path:
 *   - OG_COMPUTE_CLI_BIN  (path to `0g-compute-cli`, default: "0g-compute-cli")
 *   - OG_COMPUTE_PROVIDER (e.g. "0xProviderAddr")
 *   - OG_PRIVATE_KEY      (creator/payer key)
 */

export type CliCreateResult = {
  taskId: string;
  txHash?: string;
};

export type CliStatus = {
  status: "pending" | "running" | "completed" | "failed";
  progressPct: number;
  modelRootHash?: string;
  raw?: string;
};

function cliBin(): string {
  return process.env.OG_COMPUTE_CLI_BIN ?? "0g-compute-cli";
}

export function isCliEnabled(): boolean {
  return !!(process.env.OG_COMPUTE_PROVIDER && process.env.OG_PRIVATE_KEY);
}

function run(args: string[], timeoutMs = 30_000): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cliBin(), args, {
      env: {
        ...process.env,
        ZG_PRIVATE_KEY: process.env.OG_PRIVATE_KEY ?? "",
      },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`CLI timeout after ${timeoutMs}ms: ${args.join(" ")}`));
    }, timeoutMs);
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? -1 });
    });
  });
}

export async function createFineTuneTask(args: {
  datasetRootHash: string;
  baseModel: string;
  jobLabel: string;
}): Promise<CliCreateResult | null> {
  if (!isCliEnabled()) {
    logger.info({ jobLabel: args.jobLabel }, "0g-compute-cli not enabled — simulated pipeline");
    return null;
  }
  try {
    const provider = process.env.OG_COMPUTE_PROVIDER!;
    const cliArgs = [
      "fine-tuning",
      "create-task",
      "--provider", provider,
      "--dataset-path", args.datasetRootHash,
      "--base-model", args.baseModel,
      "--label", args.jobLabel,
      "--json",
    ];
    logger.info({ cliArgs }, "0g-compute-cli: create-task");
    const { stdout, stderr, code } = await run(cliArgs, 60_000);
    if (code !== 0) {
      logger.warn({ code, stderr: stderr.slice(0, 500) }, "create-task failed — falling back");
      return null;
    }
    const parsed = JSON.parse(stdout) as { taskId?: string; id?: string; txHash?: string };
    const taskId = parsed.taskId ?? parsed.id;
    if (!taskId) throw new Error("CLI returned no taskId");
    return { taskId, txHash: parsed.txHash };
  } catch (err) {
    logger.warn({ err: String(err) }, "create-task error — falling back to simulated");
    return null;
  }
}

export async function pollTaskStatus(taskId: string): Promise<CliStatus | null> {
  if (!isCliEnabled()) return null;
  try {
    const { stdout, code } = await run(
      ["fine-tuning", "task-status", "--task-id", taskId, "--json"],
      20_000,
    );
    if (code !== 0) return null;
    const parsed = JSON.parse(stdout) as {
      status?: string;
      progress?: number;
      modelRootHash?: string;
      modelHash?: string;
    };
    const rawStatus = (parsed.status ?? "running").toLowerCase();
    const status: CliStatus["status"] =
      rawStatus === "completed" || rawStatus === "success" ? "completed"
      : rawStatus === "failed" || rawStatus === "error" ? "failed"
      : rawStatus === "pending" || rawStatus === "queued" ? "pending"
      : "running";
    return {
      status,
      progressPct: typeof parsed.progress === "number" ? Math.round(parsed.progress) : 50,
      modelRootHash: parsed.modelRootHash ?? parsed.modelHash,
      raw: stdout,
    };
  } catch (err) {
    logger.warn({ err: String(err), taskId }, "task-status error");
    return null;
  }
}
