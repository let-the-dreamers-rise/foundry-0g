import { useState } from "react";
import { useGetActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { truncateWallet, cn } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import {
  Activity as ActivityIcon, Play, Key, PlusCircle, CheckCircle, Cpu, Filter
} from "lucide-react";

const EVENT_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  model_trained: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Trained" },
  model_listed: { icon: PlusCircle, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Listed" },
  license_purchased: { icon: Key, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Licensed" },
  inference_run: { icon: Play, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Inference" },
  job_started: { icon: Cpu, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", label: "Job" },
};

const EVENT_TYPES = [
  { value: "all", label: "All" },
  { value: "model_trained", label: "Training" },
  { value: "model_listed", label: "Listings" },
  { value: "license_purchased", label: "Licenses" },
  { value: "inference_run", label: "Inference" },
];

function getEventText(event: { eventType: string; modelName?: string }) {
  const name = event.modelName ?? "unknown";
  switch (event.eventType) {
    case "model_trained": return <>Model <span className="font-semibold text-foreground">{name}</span> completed training on 0G Compute</>;
    case "model_listed": return <>Model <span className="font-semibold text-foreground">{name}</span> listed on marketplace</>;
    case "license_purchased": return <>Developer purchased 30-day license for <span className="font-semibold text-foreground">{name}</span></>;
    case "inference_run": return <>Inference run on <span className="font-semibold text-foreground">{name}</span> via 0G TEE</>;
    case "job_started": return <>Fine-tune job started for <span className="font-semibold text-foreground">{name}</span></>;
    default: return <>Platform event</>;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Activity() {
  const { data: events, isLoading } = useGetActivity({ limit: 50 });
  const [filter, setFilter] = useState("all");

  const filteredEvents = filter === "all"
    ? events
    : events?.filter((e) => e.eventType === filter);

  return (
    <div className="container max-w-screen-lg mx-auto p-4 sm:p-8 space-y-8">
      <div>
        <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Live Feed</div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Activity</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Real-time decentralized actions across the Foundry network.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {EVENT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter(type.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
              filter === type.value
                ? "pill-active"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-card/40"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : filteredEvents?.length ? (
          filteredEvents.map((event) => {
            const config = EVENT_CONFIG[event.eventType] ?? EVENT_CONFIG.job_started;
            const Icon = config.icon;
            return (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 transition-all duration-150 group"
              >
                <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 mt-0.5", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug">{getEventText({ ...event, modelName: event.modelName ?? undefined })}</p>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {truncateWallet(event.actorWallet)}
                    </span>
                    {event.ogExplorerUrl && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>0G proof:</span>
                        <OgLink hash={event.ogExplorerUrl.split("/").pop() || ""} type="tx" />
                      </div>
                    )}
                    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border", config.bg, config.color)}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border/40 rounded-xl">
            <ActivityIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
