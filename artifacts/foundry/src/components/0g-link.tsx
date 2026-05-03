import { ExternalLink, FlaskConical } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Heuristic: a tx hash that begins with many leading zeros is almost certainly
 * a deterministic seed/fallback, not a real Galileo tx. Showing an explorer
 * link to such a hash leads judges to a chainscan 404, which is worse than
 * showing nothing. We detect ≥10 leading hex zeros after the 0x prefix.
 */
export function isLikelySimulatedHash(hash: string | null | undefined): boolean {
  if (!hash) return true;
  const stripped = hash.toLowerCase().replace(/^0x/, "");
  if (stripped.length < 40) return true;
  const leadingZeros = stripped.match(/^0+/)?.[0].length ?? 0;
  return leadingZeros >= 10;
}

export function OgLink({
  hash,
  type = "tx",
  className,
  simulated,
}: {
  hash: string;
  type?: "tx" | "address";
  className?: string;
  simulated?: boolean;
}) {
  if (!hash) return null;

  const isSimulated = simulated ?? isLikelySimulatedHash(hash);

  if (isSimulated) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-dashed border-border/60 rounded px-1.5 py-0.5 ${className ?? ""}`}
        title="Demo-mode hash from seeded data — set OG_PRIVATE_KEY and submit a real fine-tune to see live chain proofs"
        data-testid="badge-demo-hash"
      >
        <FlaskConical className="h-3 w-3" />
        DEMO
      </span>
    );
  }

  return (
    <Button variant="ghost" size="icon" asChild className={className}>
      <a
        href={`https://chainscan-galileo.0g.ai/${type}/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View on 0G Galileo Explorer"
        data-testid={`link-explorer-${type}`}
      >
        <ExternalLink className="h-3 w-3" />
        <span className="sr-only">View on 0G Explorer</span>
      </a>
    </Button>
  );
}
