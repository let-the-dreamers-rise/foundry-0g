import { useGetCreatorStats, getGetCreatorStatsQueryKey } from "@workspace/api-client-react";
import { ModelCard } from "@/components/model-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { truncateHash, STATUS_COLORS } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { Badge } from "@/components/ui/badge";
import { Wallet, Activity, Database, DollarSign, Box } from "lucide-react";

const DEMO_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetCreatorStats({ creatorWallet: DEMO_WALLET });

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-mono uppercase text-primary">Creator Dashboard</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">{DEMO_WALLET}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Earnings", value: `$${stats?.estimatedEarningsUsd || 0}`, icon: DollarSign },
          { label: "Listed Models", value: stats?.listedModels || 0, icon: Box },
          { label: "Total Licenses", value: stats?.totalLicenses || 0, icon: Wallet },
          { label: "Inference Runs", value: stats?.totalInferenceCalls || 0, icon: Activity },
          { label: "Jobs Completed", value: stats?.completedJobs || 0, icon: Database },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-6 text-center">
              <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary/80" />
              <div className="text-2xl font-bold font-mono">{isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Listed Models */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-mono uppercase">Your Listed Models</h2>
          <div className="grid gap-4">
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : stats?.models?.length ? (
              stats.models.map(model => (
                <ModelCard key={model.id} model={model} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">No models listed</div>
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-mono uppercase">Recent Jobs</h2>
          <div className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : stats?.jobs?.length ? (
              stats.jobs.map(job => (
                <Card key={job.id} className="bg-card/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold">{job.modelName}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        {new Date(job.startedAt).toLocaleDateString()}
                        {job.jobIdOn0g && <span className="flex items-center gap-1 ml-2 border-l pl-2 border-border">0G: {truncateHash(job.jobIdOn0g)}</span>}
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[job.status] || STATUS_COLORS.pending}>{job.status}</Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">No jobs found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
