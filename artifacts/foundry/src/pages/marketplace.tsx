import { useState } from "react";
import { useListModels } from "@workspace/api-client-react";
import { ModelCard } from "@/components/model-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_LABELS, cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "customer-support", label: "Support" },
  { value: "creative-writing", label: "Creative" },
  { value: "code-assistant", label: "Code" },
  { value: "finance", label: "Finance" },
  { value: "medical", label: "Medical" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
];

export default function Marketplace() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"popular" | "newest" | "cheapest">("popular");
  const [search, setSearch] = useState("");

  const { data: models, isLoading } = useListModels({
    category: category === "all" ? undefined : category,
    sort,
  });

  const filteredModels = models?.filter(
    (m) =>
      m.isListed &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase()))
  );

  const featuredModels = filteredModels?.filter((m) => (m.inferenceCount ?? 0) > 500) ?? [];
  const regularModels = filteredModels?.filter((m) => (m.inferenceCount ?? 0) <= 500) ?? [];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
        <div>
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Marketplace</div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Model Marketplace
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse, license, and run fine-tuned AI models owned on 0G.
          </p>
        </div>
        {!isLoading && filteredModels && (
          <div className="text-sm text-muted-foreground font-mono">
            <span className="text-foreground font-semibold">{filteredModels.length}</span> models available
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
              category === cat.value
                ? "pill-active"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-card/40"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            className="pl-9 bg-card/40 border-border/60 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as "popular" | "newest" | "cheapest")}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card/40 border-border/60 h-10">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="cheapest">Lowest Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : filteredModels?.length ? (
        <div className="space-y-10">
          {featuredModels.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                  Trending
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/20 text-amber-400 bg-amber-500/8">
                  HOT
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredModels.map((model) => (
                  <ModelCard key={model.id} model={model} featured />
                ))}
              </div>
            </div>
          )}

          {regularModels.length > 0 && (
            <div className="space-y-4">
              {featuredModels.length > 0 && (
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  All Models
                </h2>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularModels.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground bg-card/20 rounded-xl border border-border/40 flex flex-col items-center gap-3">
          <SlidersHorizontal className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm">No models match your criteria.</p>
          <button
            onClick={() => { setCategory("all"); setSearch(""); }}
            className="text-xs text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
