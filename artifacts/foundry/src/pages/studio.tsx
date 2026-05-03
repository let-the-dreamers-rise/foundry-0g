import { useState } from "react";
import {
  useListFineTuneJobs, useCreateFineTuneJob, useListModels, useListModel,
  getListFineTuneJobsQueryKey, getListModelsQueryKey,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useActiveWallet } from "@/context/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { truncateHash, STATUS_COLORS, STATUS_LABELS, CATEGORY_COLORS, cn } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import {
  RefreshCcw, Plus, Store, ChevronRight, ChevronLeft,
  Cpu, Database, Settings2, Rocket, Check, AlertCircle, Wifi, WifiOff
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type OgStatus = {
  ogStorageConfigured: boolean;
  ogComputeConfigured: boolean;
  ogEvmRpc: string;
  ogIndexerUrl: string;
  ogComputeBrokerUrl: string | null;
};

function OgStatusBanner() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { data } = useQuery<OgStatus>({
    queryKey: ["og-status"],
    queryFn: () => fetch(`${base}/api/og-status`).then((r) => r.json()),
    staleTime: 30_000,
  });

  if (!data) return null;

  const allLive = data.ogStorageConfigured && data.ogComputeConfigured;
  const anyLive = data.ogStorageConfigured || data.ogComputeConfigured;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-lg border text-xs font-mono",
        allLive
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
          : anyLive
          ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
          : "border-border/40 bg-muted/20 text-muted-foreground"
      )}
    >
      {allLive ? (
        <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      ) : (
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="font-semibold">
        {allLive ? "0G Network: Fully Connected" : anyLive ? "0G Network: Partial" : "0G Network: Demo Mode"}
      </span>
      <span className="text-border">·</span>
      <span className={data.ogStorageConfigured ? "text-emerald-400" : "opacity-60"}>
        Storage {data.ogStorageConfigured ? "✓ Live" : "○ Demo"}
      </span>
      <span className="text-border">·</span>
      <span className={data.ogComputeConfigured ? "text-emerald-400" : "opacity-60"}>
        Compute {data.ogComputeConfigured ? "✓ Live" : "○ Demo"}
      </span>
      <span className="text-border">·</span>
      <span className="opacity-60">Galileo Testnet</span>
    </div>
  );
}

const formSchema = z.object({
  creatorWallet: z.string(),
  baseModel: z.enum(["Qwen2.5-0.5B-Instruct", "Qwen3-32B"] as const),
  modelName: z.string().min(3, "At least 3 characters"),
  description: z.string().min(10, "At least 10 characters"),
  category: z.enum(["customer-support", "creative-writing", "code-assistant", "finance", "medical", "legal", "other"] as const),
  datasetDescription: z.string().min(5, "Required"),
  samplePrompt: z.string().min(5, "Required"),
  sampleOutput: z.string().min(5, "Required"),
  licensePriceUsd: z.coerce.number().min(0),
  datasetContent: z.string().min(10, "Dataset required"),
});
type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, label: "Configure", icon: Settings2 },
  { id: 2, label: "Dataset", icon: Database },
  { id: 3, label: "Review", icon: Rocket },
];

const BASE_MODEL_COSTS: Record<string, number> = {
  "Qwen2.5-0.5B-Instruct": 0.12,
  "Qwen3-32B": 2.40,
};

export default function Studio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wallet = useActiveWallet();
  const [step, setStep] = useState(1);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listingJobId, setListingJobId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("29");

  const { data: jobs, isLoading, refetch } = useListFineTuneJobs(
    { creatorWallet: wallet },
    { query: { refetchInterval: 3000, queryKey: getListFineTuneJobsQueryKey({ creatorWallet: wallet }) } }
  );

  const { data: creatorModels, refetch: refetchModels } = useListModels(
    { creatorWallet: wallet },
    { query: { queryKey: getListModelsQueryKey({ creatorWallet: wallet }) } }
  );

  const createMutation = useCreateFineTuneJob();
  const listModelMutation = useListModel();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creatorWallet: wallet,
      baseModel: "Qwen2.5-0.5B-Instruct",
      modelName: "",
      description: "",
      category: "other",
      datasetDescription: "",
      samplePrompt: "",
      sampleOutput: "",
      licensePriceUsd: 29,
      datasetContent: "",
    },
  });

  const watchedBase = form.watch("baseModel");
  const watchedDataset = form.watch("datasetContent");
  const watchedPrice = form.watch("licensePriceUsd");
  const estimatedCost = BASE_MODEL_COSTS[watchedBase] ?? 0;
  const datasetLines = watchedDataset ? watchedDataset.trim().split("\n").filter(Boolean).length : 0;

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: (job) => {
          toast({ title: "Job Submitted!", description: `Fine-tune job #${job.id} queued. Uploading to 0G Storage...` });
          form.reset({ ...form.formState.defaultValues as FormValues, creatorWallet: wallet });
          queryClient.invalidateQueries({ queryKey: getListFineTuneJobsQueryKey({ creatorWallet: wallet }) });
          setStep(1);
        },
        onError: () => {
          toast({ title: "Submit Failed", description: "Could not create job.", variant: "destructive" });
        },
      }
    );
  };

  const openListDialog = (jobId: number) => {
    setListingJobId(jobId);
    const model = creatorModels?.find((m) => m.jobId === jobId);
    if (model) setListPrice(String(model.licensePriceUsd));
    setListDialogOpen(true);
  };

  const confirmListing = () => {
    if (listingJobId == null) return;
    const model = creatorModels?.find((m) => m.jobId === listingJobId);
    if (!model) {
      toast({ title: "Model not ready", variant: "destructive" });
      return;
    }
    listModelMutation.mutate(
      { id: model.id, data: { licensePriceUsd: Number(listPrice), creatorWallet: wallet } },
      {
        onSuccess: () => {
          toast({ title: "Listed!", description: `${model.name} is now on the marketplace.` });
          setListDialogOpen(false);
          setListingJobId(null);
          queryClient.invalidateQueries({ queryKey: getListModelsQueryKey({ creatorWallet: wallet }) });
          refetchModels();
        },
        onError: () => {
          toast({ title: "Listing Failed", variant: "destructive" });
        },
      }
    );
  };

  const goNext = async () => {
    const stepFields: Record<number, (keyof FormValues)[]> = {
      1: ["modelName", "baseModel", "category", "description"],
      2: ["datasetDescription", "datasetContent", "samplePrompt", "sampleOutput"],
    };
    const valid = await form.trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  };

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      <div>
        <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Creator Studio</div>
        <h1 className="text-3xl font-bold tracking-tight">Fine-Tune Studio</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Train a custom AI model on 0G's decentralized GPU network.
        </p>
      </div>

      <OgStatusBanner />

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-0 mb-4">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <button
                      onClick={() => step > s.id && setStep(s.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        step === s.id
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : step > s.id
                          ? "text-primary/60 hover:text-primary cursor-pointer"
                          : "text-muted-foreground cursor-default"
                      )}
                    >
                      {step > s.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <s.icon className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.id}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-1" />
                    )}
                  </div>
                ))}
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                {step === 1 && "Model Configuration"}
                {step === 2 && "Training Dataset"}
                {step === 3 && "Review & Launch"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {step === 1 && "Name your model and choose a base LLM to fine-tune."}
                {step === 2 && "Upload your JSONL dataset. It will be stored on 0G Storage."}
                {step === 3 && "Review all settings before submitting your fine-tune job."}
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="modelName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Model Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-model-name" placeholder="my-custom-model" className="h-9" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="baseModel" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Base Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-base-model" className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Qwen2.5-0.5B-Instruct">
                                  <div>
                                    <div className="font-medium text-xs">Qwen2.5-0.5B</div>
                                    <div className="text-[10px] text-muted-foreground">~$0.12/job · Fast</div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Qwen3-32B">
                                  <div>
                                    <div className="font-medium text-xs">Qwen3-32B</div>
                                    <div className="text-[10px] text-muted-foreground">~$2.40/job · Powerful</div>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category" className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CATEGORY_COLORS).map(([cat]) => (
                                <SelectItem key={cat} value={cat}>{cat.replace("-", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              data-testid="input-description"
                              placeholder="What does this model do? Who is it for?"
                              className="resize-none h-20 text-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="licensePriceUsd" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Monthly License Price (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                {...field}
                                data-testid="input-license-price"
                                className="pl-7 h-9"
                                min="0"
                              />
                            </div>
                          </FormControl>
                          <p className="text-[10px] text-muted-foreground">
                            You earn ~${Math.round(Number(watchedPrice) * 0.85)}/license/month after 15% platform fee
                          </p>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <FormField control={form.control} name="datasetDescription" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Dataset Description</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-dataset-description"
                              placeholder="e.g. 5,000 DeFi protocol Q&A pairs"
                              className="h-9"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="datasetContent" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs flex items-center justify-between">
                            <span>Dataset (JSONL)</span>
                            {datasetLines > 0 && (
                              <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                {datasetLines} lines
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              data-testid="input-dataset-content"
                              placeholder={'{"messages": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi!"}]}'}
                              className="font-mono text-xs h-36 bg-muted/20"
                            />
                          </FormControl>
                          <p className="text-[10px] text-muted-foreground">
                            One JSON object per line. Will be encrypted and stored on 0G Storage.
                          </p>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="samplePrompt" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Sample Prompt</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-sample-prompt" placeholder="Example user input" className="h-9" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="sampleOutput" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Sample Output</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-sample-output" placeholder="Expected response" className="h-9" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3 text-sm">
                        {[
                          { label: "Model Name", value: form.getValues("modelName") || "—" },
                          { label: "Base Model", value: form.getValues("baseModel") },
                          { label: "Category", value: form.getValues("category") },
                          { label: "License Price", value: `$${form.getValues("licensePriceUsd")}/month` },
                          { label: "Dataset Lines", value: datasetLines || "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Estimated Training Cost
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold font-mono text-amber-400">
                            ${(estimatedCost * Math.max(1, datasetLines / 100)).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">in 0G tokens</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Based on {form.getValues("baseModel")} × {datasetLines} training examples on 0G Compute GPU network.
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {[
                          "Dataset encrypted and uploaded to 0G Storage",
                          "Training job dispatched to 0G Compute GPU cluster",
                          "Model weights stored on 0G — minted as ERC-7857 NFT",
                          "Model listed on marketplace at your set price",
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep((s) => s - 1)}
                        className="flex-1 h-10"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                      </Button>
                    )}
                    {step < 3 ? (
                      <Button type="button" onClick={goNext} className="flex-1 h-10 font-semibold">
                        Continue <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        data-testid="button-submit-job"
                        disabled={createMutation.isPending}
                        className="flex-1 h-10 font-bold shadow-lg shadow-primary/20"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {createMutation.isPending ? "Launching..." : "Launch Fine-Tune"}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Your Jobs
            </h2>
            <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh-jobs" className="h-8 w-8">
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-28 bg-card/40 rounded-xl animate-pulse border border-border/50" />)}
            </div>
          )}

          <div className="space-y-3">
            {jobs?.map((job) => {
              const relatedModel = creatorModels?.find((m) => m.jobId === job.id);
              const isAlreadyListed = relatedModel?.isListed ?? false;

              return (
                <Card key={job.id} data-testid={`card-job-${job.id}`} className="border-border/60 bg-card/40">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate mb-0.5">{job.modelName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {job.baseModel} · {new Date(job.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={cn("ml-2 shrink-0 text-[10px]", STATUS_COLORS[job.status] || STATUS_COLORS.pending)}>
                        {STATUS_LABELS[job.status] || job.status}
                      </Badge>
                    </div>

                    {(job.status === "uploading" || job.status === "training") && job.progressPct != null && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{job.status === "uploading" ? "Uploading to 0G Storage..." : "Training on 0G GPU..."}</span>
                          <span className="font-mono font-bold">{job.progressPct}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-500",
                              job.status === "uploading" ? "bg-blue-500" : "bg-amber-500"
                            )}
                            style={{ width: `${job.progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
                      {job.jobIdOn0g && (
                        <span className="bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                          0G: {truncateHash(job.jobIdOn0g)}
                        </span>
                      )}
                      {job.datasetOgExplorerUrl && (
                        <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                          Dataset: <OgLink hash={job.datasetOgExplorerUrl.split("/").pop() || ""} type="tx" />
                        </span>
                      )}
                      {job.nftOgExplorerUrl && (
                        <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                          NFT: <OgLink hash={job.nftOgExplorerUrl.split("/").pop() || ""} type="tx" />
                        </span>
                      )}
                    </div>

                    {job.status === "completed" && (
                      <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {job.nftTokenId ? `NFT #${job.nftTokenId}` : "Model ready"}
                        </span>
                        {isAlreadyListed ? (
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="h-2.5 w-2.5 mr-1" /> Listed on Marketplace
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            data-testid={`button-list-model-${job.id}`}
                            onClick={() => openListDialog(job.id)}
                            disabled={listModelMutation.isPending}
                            className="h-7 text-xs font-semibold"
                          >
                            <Store className="mr-1.5 h-3 w-3" /> List on Marketplace
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!isLoading && jobs?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl text-sm">
                No jobs yet. Submit your first fine-tune above.
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              List on Marketplace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Set a monthly license price. Developers pay to access your model via the API.
              You earn <span className="text-foreground font-semibold">85%</span> of each license fee.
            </p>
            <div className="space-y-2">
              <Label htmlFor="list-price" className="text-xs">Monthly License Price (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="list-price"
                  data-testid="input-list-price"
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  min="0"
                  step="1"
                  className="pl-7"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Your earnings: ~${Math.round(Number(listPrice) * 0.85)}/license/month after 15% platform fee
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)} className="text-sm">Cancel</Button>
            <Button
              data-testid="button-confirm-list"
              onClick={confirmListing}
              disabled={listModelMutation.isPending}
              className="font-semibold text-sm"
            >
              {listModelMutation.isPending ? "Listing..." : "Confirm & List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
