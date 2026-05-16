import { useGetPlatformStats } from "@workspace/api-client-react";
import { ModelCard } from "@/components/model-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Database, Zap, ArrowRight, ShieldCheck, Box, Cpu,
  GitBranch, Lock, Coins, FlaskConical, Globe, ChevronRight, Flame
} from "lucide-react";
import { formatCompact } from "@/lib/utils";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Database,
    title: "Upload Your Dataset",
    description: "Submit a JSONL training dataset. It's encrypted and stored permanently on 0G's decentralized storage network — you own the data.",
    color: "text-blue-400",
    bg: "bg-blue-500/8 border-blue-500/15",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Train on 0G Compute",
    description: "Your fine-tune job runs on 0G's distributed GPU network. Training is verifiable and transparent — no black-box cloud providers.",
    color: "text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/15",
  },
  {
    step: "03",
    icon: Lock,
    title: "Mint as NFT",
    description: "Model weights are stored on 0G Storage and your model is minted as an ERC-7857 NFT. True ownership, on-chain provenance.",
    color: "text-purple-400",
    bg: "bg-purple-500/8 border-purple-500/15",
  },
  {
    step: "04",
    icon: Coins,
    title: "Earn Forever",
    description: "List on the marketplace and set your price. Developers purchase monthly licenses. Revenue flows to your wallet automatically.",
    color: "text-primary",
    bg: "bg-primary/8 border-primary/15",
  },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Permissionless by Default",
    description: "No sign-up, no KYC. Connect your wallet and start building. Anyone can create, list, or license models.",
  },
  {
    icon: ShieldCheck,
    title: "TEE-Verified Inference",
    description: "Every inference call is executed in a Trusted Execution Environment on 0G Compute — outputs are cryptographically attestable.",
  },
  {
    icon: Lock,
    title: "True Model Ownership",
    description: "ERC-7857 NFTs represent legal and cryptographic ownership of your fine-tuned models. Transfer, sell, or stake them.",
  },
  {
    icon: GitBranch,
    title: "Composable Licensing",
    description: "Set time-based licenses with custom pricing tiers. Revoke, renew, or transfer licenses programmatically via the API.",
  },
  {
    icon: Database,
    title: "Permanent Data Storage",
    description: "Datasets and model weights live on 0G Storage — a decentralized, immutable layer built for AI workloads.",
  },
  {
    icon: FlaskConical,
    title: "Any Domain, Any Data",
    description: "Finance, legal, medical, code, creative — Foundry handles any specialization. Bring your proprietary dataset.",
  },
];

export default function Home() {
  const { data: stats, isLoading } = useGetPlatformStats();

  return (
    <div className="flex flex-col">
      <section className="relative hero-grid w-full max-w-full overflow-hidden px-4 py-20 sm:py-28">
        <div className="container w-full max-w-screen-xl mx-auto text-center space-y-8 relative z-10 overflow-hidden">
          <div className="mx-auto flex w-full max-w-[18rem] sm:inline-flex sm:w-auto sm:max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-2xl sm:rounded-full bg-primary/10 text-primary text-xs font-mono font-semibold border border-primary/20 animate-pulse-glow leading-relaxed">
            <Flame className="h-3.5 w-3.5" />
            <span>Built on 0G</span>
            <span className="opacity-60">·</span>
            <span>Galileo Testnet</span>
            <span className="opacity-60">·</span>
            <span>ERC-7857</span>
          </div>

          <h1 className="mx-auto max-w-[22rem] sm:max-w-none text-4xl sm:text-7xl font-extrabold tracking-tight sm:tracking-tighter leading-none">
            <span className="text-foreground">Fine-tune AI.</span>
            <br />
            <span className="gradient-text block sm:inline">Own it.</span>
            <span className="gradient-text block sm:inline sm:ml-3">Monetize it.</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-[18rem] sm:max-w-2xl mx-auto leading-relaxed">
            The permissionless marketplace where AI creators train models on 0G's decentralized
            GPU network, own them as NFTs, and earn recurring revenue through on-chain licensing.
          </p>

          <p className="text-sm text-muted-foreground/60 font-mono leading-relaxed max-w-[18rem] sm:max-w-none mx-auto">
            Think <span className="text-foreground/80">Hugging Face + Replicate</span> — fully on-chain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full max-w-60 sm:w-auto text-sm font-bold px-8 h-12 shadow-lg shadow-primary/20">
              <Link href="/studio">
                Launch Studio <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full max-w-60 sm:w-auto text-sm font-semibold px-8 h-12 border-border/60 hover:border-primary/30">
              <Link href="/marketplace">
                Explore Models <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mx-auto flex max-w-[22rem] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-4 sm:max-w-none sm:gap-x-6">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary/60" /> Verifiable training</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary/60" /> NFT ownership</span>
            <span className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5 text-primary/60" /> On-chain revenue</span>
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-card/20 py-8 px-4">
        <div className="container max-w-screen-xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Models Listed", value: stats?.totalModels, suffix: "", icon: Box },
              { label: "Fine-Tune Jobs", value: stats?.totalFineTuneJobs, suffix: "", icon: Zap },
              { label: "Inference Calls", value: stats?.totalInferenceCalls, suffix: "", icon: Database },
              { label: "Storage (GB)", value: stats?.totalDatasetStorageGb, suffix: " GB", icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-bold font-mono gradient-text">
                  {isLoading ? (
                    <Skeleton className="h-10 w-20 mx-auto" />
                  ) : (
                    `${formatCompact(Number(stat.value ?? 0))}${stat.suffix}`
                  )}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container max-w-screen-xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-xs font-mono text-primary uppercase tracking-widest">How It Works</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From dataset to revenue<br />
              <span className="gradient-text">in four steps</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative">
                <div className={`rounded-xl border p-6 h-full ${step.bg} transition-all duration-200 hover:-translate-y-1`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-background/60 border border-white/5`}>
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <span className={`text-3xl font-black font-mono opacity-20 ${step.color}`}>{step.step}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/20 border-y border-border/40">
        <div className="container max-w-screen-xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-xs font-mono text-primary uppercase tracking-widest">Why Foundry</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              The infrastructure<br />
              <span className="gradient-text">AI creators deserve</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="group p-6 rounded-xl border border-border/60 bg-card/40 hover:border-primary/20 hover:bg-card/70 transition-all duration-200 glow-card">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container max-w-screen-xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Marketplace</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Featured Models</h2>
            </div>
            <Button variant="ghost" asChild className="text-sm font-semibold">
              <Link href="/marketplace">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
              ))}
            </div>
          ) : stats?.featuredModels?.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.featuredModels.map((model) => (
                <ModelCard key={model.id} model={model} featured />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
              No featured models yet.
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container max-w-screen-xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-transparent to-blue-500/5 p-10 text-center space-y-6">
            <div className="absolute inset-0 hero-grid opacity-40" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to monetize<br />
                <span className="gradient-text">your AI expertise?</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                Upload your dataset today. Models on Foundry earn an average of{" "}
                <span className="text-foreground font-semibold">$340/month</span> in licensing revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="font-bold px-10 h-12 shadow-lg shadow-primary/20">
                  <Link href="/studio">
                    Start Fine-Tuning <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold px-10 h-12 border-primary/20 hover:bg-primary/5">
                  <Link href="/marketplace">Browse Models</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                No gas fees on Galileo testnet · Free to experiment
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
