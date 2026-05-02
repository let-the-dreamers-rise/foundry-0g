import { useGetActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { truncateWallet } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { Activity as ActivityIcon, Play, Key, PlusCircle, CheckCircle } from "lucide-react";

export default function Activity() {
  const { data: events, isLoading } = useGetActivity({ limit: 50 });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "model_trained": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "model_listed": return <PlusCircle className="h-4 w-4 text-blue-500" />;
      case "license_purchased": return <Key className="h-4 w-4 text-amber-500" />;
      case "inference_run": return <Play className="h-4 w-4 text-purple-500" />;
      case "job_started": return <ActivityIcon className="h-4 w-4 text-slate-500" />;
      default: return <ActivityIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventText = (event: any) => {
    switch (event.eventType) {
      case "model_trained": return <span>Model <span className="font-bold text-foreground">{event.modelName}</span> completed training.</span>;
      case "model_listed": return <span>Model <span className="font-bold text-foreground">{event.modelName}</span> listed on marketplace.</span>;
      case "license_purchased": return <span>Purchased license for <span className="font-bold text-foreground">{event.modelName}</span>.</span>;
      case "inference_run": return <span>Ran inference on <span className="font-bold text-foreground">{event.modelName}</span>.</span>;
      case "job_started": return <span>Started fine-tune job for <span className="font-bold text-foreground">{event.modelName}</span>.</span>;
      default: return <span>Unknown event.</span>;
    }
  };

  return (
    <div className="container max-w-screen-md mx-auto p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono uppercase text-primary">Platform Activity</h1>
        <p className="text-muted-foreground mt-1">Live feed of decentralized actions.</p>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : events?.length ? (
          events.map(event => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                {getEventIcon(event.eventType)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-xs font-bold text-muted-foreground">{truncateWallet(event.actorWallet)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm">
                  {getEventText(event)}
                </div>
                {event.ogExplorerUrl && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    0G Proof: <OgLink hash={event.ogExplorerUrl.split('/').pop() || ''} type="tx" />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">No activity found.</div>
        )}
      </div>
    </div>
  );
}
