import { ExternalLink, FlaskConical } from "lucide-react";
import { Button } from "./ui/button";

export function OgLink({
  hash,
  type = "tx",
  className,
  simulated = false,
}: {
  hash: string;
  type?: "tx" | "address";
  className?: string;
  simulated?: boolean;
}) {
  if (!hash) return null;

  if (simulated) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-dashed border-border/60 rounded px-1.5 py-0.5 ${className ?? ""}`}
        title="Demo-mode hash — set OG_PRIVATE_KEY to mint on the real 0G Galileo testnet"
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
      >
        <ExternalLink className="h-3 w-3" />
        <span className="sr-only">View on 0G Explorer</span>
      </a>
    </Button>
  );
}
