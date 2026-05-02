import { useState } from "react";
import { useListModels } from "@workspace/api-client-react";
import { ModelCard } from "@/components/model-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/utils";

export default function Marketplace() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"popular" | "newest" | "cheapest">("popular");
  const [search, setSearch] = useState("");

  const { data: models, isLoading } = useListModels({
    category: category === "all" ? undefined : category,
    sort,
  });

  const filteredModels = models?.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono uppercase text-primary">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Browse, license, and run decentralized AI models.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card/50 border border-border/50 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search models by name or description..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="cheapest">Cheapest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : filteredModels?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground bg-card/30 rounded-xl border border-border/50 flex flex-col items-center">
          <SlidersHorizontal className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p>No models found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
