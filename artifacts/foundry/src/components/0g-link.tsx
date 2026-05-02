import React from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

export function OgLink({ hash, type = "tx", className }: { hash: string; type?: "tx" | "address"; className?: string }) {
  if (!hash) return null;
  return (
    <Button variant="ghost" size="icon" asChild className={className}>
      <a 
        href={`https://chainscan-galileo.0g.ai/${type}/${hash}`} 
        target="_blank" 
        rel="norenoopener noreferrer"
        title="View on 0G Explorer"
      >
        <ExternalLink className="h-3 w-3" />
        <span className="sr-only">View on 0G Explorer</span>
      </a>
    </Button>
  );
}
