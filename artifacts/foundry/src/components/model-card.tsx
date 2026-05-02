import { Link } from "wouter";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Model } from "@workspace/api-client-react";
import { truncateWallet, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/utils";
import { OgLink } from "./0g-link";
import { Zap, Users, TrendingUp, ArrowRight, Star } from "lucide-react";

export function ModelCard({ model, featured }: { model: Model; featured?: boolean }) {
  const isPopular = (model.inferenceCount ?? 0) > 500;

  return (
    <div className={`group relative flex flex-col rounded-xl border bg-card/60 overflow-hidden transition-all duration-200 glow-card ${featured ? "border-primary/20" : "border-border/60"}`}>
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isPopular && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  <Star className="h-2.5 w-2.5" />
                  HOT
                </span>
              )}
              {featured && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold font-mono bg-primary/10 text-primary border border-primary/20 rounded">
                  FEATURED
                </span>
              )}
            </div>
            <Link href={`/models/${model.id}`}>
              <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {model.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              by {truncateWallet(model.creatorWallet)}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-mono border ${CATEGORY_COLORS[model.category] || CATEGORY_COLORS.other}`}
          >
            {CATEGORY_LABELS[model.category] || model.category}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {model.description}
        </p>

        <div className="bg-muted/40 rounded-lg px-3 py-2.5 mb-4 border border-border/40">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">
            Sample Prompt
          </div>
          <div className="text-xs text-foreground/80 truncate font-mono">{model.samplePrompt}</div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary" className="font-mono text-[10px] bg-secondary/60">
            {model.baseModel.replace("Instruct", "").trim()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-primary/60" />
            <span className="font-mono font-medium text-foreground/80">{(model.inferenceCount ?? 0).toLocaleString()}</span>
            <span>runs</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3 text-primary/60" />
            <span className="font-mono font-medium text-foreground/80">{model.licenseCount ?? 0}</span>
            <span>licenses</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between bg-card/30">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-primary">${model.licensePriceUsd}</span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-500/60" />
            <span className="text-[10px] text-muted-foreground">
              ~${Math.round(model.licensePriceUsd * model.licenseCount * 0.85)}/mo revenue
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {model.ogExplorerUrl && (
            <OgLink hash={model.ogExplorerUrl.split("/").pop() || ""} type="tx" />
          )}
          <Button asChild size="sm" className="font-semibold text-xs h-8 px-3">
            <Link href={`/models/${model.id}`}>
              View <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
