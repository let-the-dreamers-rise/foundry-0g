import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Radio } from "lucide-react";
import { apiUrl } from "@/lib/api-base";

type OgStatus = {
  ogStorageConfigured?: boolean;
  ogChainConfigured?: boolean;
  ogContractAddress?: string | null;
};

export function LiveOnChainBanner() {
  const { data } = useQuery<OgStatus>({
    queryKey: ["og-status"],
    queryFn: () => fetch(apiUrl("/api/og-status")).then((r) => r.json()),
    staleTime: 60_000,
  });

  if (!data?.ogContractAddress) return null;

  const addr = data.ogContractAddress;
  const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div
      className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-2 text-[11px] font-mono border-b border-emerald-500/20 bg-emerald-500/5 text-emerald-300 sm:gap-x-4 sm:px-4"
      data-testid="banner-live-onchain"
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <Radio className="h-3 w-3 animate-pulse" />
        LIVE ON 0G GALILEO
      </span>
      <span className="opacity-50">/</span>
      <span className="hidden opacity-80 sm:inline">Contract</span>
      <a
        href={`https://chainscan-galileo.0g.ai/address/${addr}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-emerald-200 hover:text-white underline-offset-2 hover:underline"
        data-testid="link-contract-address"
      >
        {short}
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
      <span className="hidden opacity-50 sm:inline">/</span>
      <span className={data.ogStorageConfigured ? "hidden text-emerald-300 sm:inline" : "hidden text-muted-foreground sm:inline"}>
        Storage {data.ogStorageConfigured ? "Live" : "Demo"}
      </span>
      <span className="hidden opacity-50 sm:inline">/</span>
      <span className="hidden text-emerald-300 sm:inline">Chain OK</span>
      <span className="hidden opacity-50 sm:inline">/</span>
      <span className="hidden opacity-60 sm:inline">chainId 16602</span>
    </div>
  );
}
