import { useGetPlatformStats, getGetPlatformStatsQueryKey } from "@workspace/api-client-react";
import { ModelCard } from "@/components/model-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Database, Zap, ArrowRight, ShieldCheck, Box } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading } = useGetPlatformStats();

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-12">
      {/* Hero Section */}
      <section className="py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <ShieldCheck className="h-4 w-4" />
          <span>Decentralized AI Infrastructure on 0G</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-foreground font-mono">
          FINE-TUNE. <span className="text-primary">OWN.</span> MONETIZE.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The permissionless marketplace for AI models. Train on decentralized GPUs, store datasets on 0G, and earn recurring revenue through on-chain licensing.
        </p>
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button asChild size="lg" className="text-base font-bold px-8">
            <Link href="/studio">Start Fine-Tuning <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base font-bold px-8">
            <Link href="/marketplace">Browse Models</Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Models Listed", value: stats?.totalModels, icon: Box },
          { label: "Fine-Tune Jobs", value: stats?.totalFineTuneJobs, icon: Zap },
          { label: "Inference Calls", value: stats?.totalInferenceCalls, icon: Database },
          { label: "Storage (GB)", value: stats?.totalDatasetStorageGb, icon: ShieldCheck },
        ].map((stat, i) => (
          <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-6 text-center hover:bg-card/80 transition-colors">
            <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary/80" />
            <div className="text-3xl font-bold font-mono">
              {isLoading ? <Skeleton className="h-9 w-20 mx-auto" /> : stat.value}
            </div>
            <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Featured Models */}
      <section className="space-y-6 pt-12 border-t border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-mono uppercase">Featured Models</h2>
          <Button variant="ghost" asChild>
            <Link href="/marketplace">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
            ))}
          </div>
        ) : stats?.featuredModels?.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.featuredModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
            No featured models available.
          </div>
        )}
      </section>
    </div>
  );
}
