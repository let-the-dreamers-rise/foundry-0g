import { useGetCreatorStats } from "@workspace/api-client-react";
import { useActiveWallet } from "@/context/wallet";
import { ModelCard } from "@/components/model-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { truncateHash, truncateWallet, STATUS_COLORS, STATUS_LABELS, cn } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet, Activity, Database, DollarSign, Box, TrendingUp,
  ArrowRight, Copy, Check, Flame
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useState } from "react";
import { Link } from "wouter";

const EARNINGS_DATA = [
  { day: "Mon", value: 18 },
  { day: "Tue", value: 32 },
  { day: "Wed", value: 27 },
  { day: "Thu", value: 45 },
  { day: "Fri", value: 38 },
  { day: "Sat", value: 52 },
  { day: "Sun", value: 41 },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/60 rounded-lg px-3 py-2 shadow-xl text-xs">
        <div className="text-muted-foreground mb-1">{label}</div>
        <div className="font-bold font-mono text-primary">${payload[0].value}</div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const wallet = useActiveWallet();
  const { data: stats, isLoading } = useGetCreatorStats({ creatorWallet: wallet });

  const STAT_CARDS = [
    {
      label: "Est. Revenue",
      value: `$${stats?.estimatedEarningsUsd ?? 0}`,
      sub: "+12% this month",
      icon: DollarSign,
      highlight: true,
    },
    {
      label: "Listed Models",
      value: stats?.listedModels ?? 0,
      sub: "Active on marketplace",
      icon: Box,
      highlight: false,
    },
    {
      label: "Total Licenses",
      value: stats?.totalLicenses ?? 0,
      sub: "Across all models",
      icon: Wallet,
      highlight: false,
    },
    {
      label: "Inference Runs",
      value: stats?.totalInferenceCalls ?? 0,
      sub: "Total API calls",
      icon: Activity,
      highlight: false,
    },
    {
      label: "Jobs Done",
      value: stats?.completedJobs ?? 0,
      sub: "Fine-tune completed",
      icon: Database,
      highlight: false,
    },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Creator Portal</div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground font-mono">{wallet}</span>
            <CopyButton text={wallet} />
          </div>
        </div>
        <Button asChild className="font-semibold text-sm">
          <Link href="/studio">
            <Flame className="mr-2 h-4 w-4" /> New Fine-Tune
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map((stat, i) => (
          <Card
            key={i}
            className={cn(
              "border transition-all",
              stat.highlight
                ? "border-primary/20 bg-primary/5"
                : "border-border/60 bg-card/40"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={cn("h-4 w-4", stat.highlight ? "text-primary" : "text-muted-foreground")} />
                {stat.highlight && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
              <div className={cn("text-2xl font-bold font-mono mb-1", stat.highlight && "gradient-text")}>
                {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono leading-tight">
                {stat.label}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Weekly Revenue
            </CardTitle>
            <p className="text-xs text-muted-foreground">USD earnings from licenses</p>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="text-2xl font-bold font-mono gradient-text">
                ${EARNINGS_DATA.reduce((a, b) => a + b.value, 0)}
              </span>
              <span className="text-xs text-muted-foreground ml-2">this week</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={EARNINGS_DATA} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "hsl(215 18% 45%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(217 25% 11%)" }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {EARNINGS_DATA.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index === EARNINGS_DATA.length - 2 ? "hsl(154 70% 50%)" : "hsl(154 70% 50% / 0.35)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Fine-Tune Jobs
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
                <Link href="/studio">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
              ) : stats?.jobs?.length ? (
                stats.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-card/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{job.modelName}</span>
                        <Badge className={cn("text-[10px] font-mono", STATUS_COLORS[job.status] || STATUS_COLORS.pending)}>
                          {STATUS_LABELS[job.status] || job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span>{new Date(job.startedAt).toLocaleDateString()}</span>
                        {job.jobIdOn0g && (
                          <span className="flex items-center gap-1 pl-3 border-l border-border/40">
                            0G: {truncateHash(job.jobIdOn0g)}
                          </span>
                        )}
                      </div>
                    </div>
                    {job.nftOgExplorerUrl && (
                      <OgLink hash={job.nftOgExplorerUrl.split("/").pop() || ""} type="tx" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/40 rounded-lg">
                  No jobs yet.{" "}
                  <Link href="/studio" className="text-primary hover:underline">Start fine-tuning →</Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" />
            Your Listed Models
          </h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
            <Link href="/marketplace">
              Marketplace <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : stats?.models?.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
            <Box className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No models listed yet.</p>
            <Link href="/studio" className="text-primary text-sm hover:underline mt-1 inline-block">
              Create your first model →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
