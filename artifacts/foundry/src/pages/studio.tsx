import { useState } from "react";
import {
  useListFineTuneJobs,
  useCreateFineTuneJob,
  useListModels,
  useListModel,
  getListFineTuneJobsQueryKey,
  getListModelsQueryKey,
} from "@workspace/api-client-react";
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
import { truncateHash, STATUS_COLORS, CATEGORY_COLORS } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { RefreshCcw, Plus, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const DEMO_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const formSchema = z.object({
  creatorWallet: z.string(),
  baseModel: z.enum(["Qwen2.5-0.5B-Instruct", "Qwen3-32B"] as const),
  modelName: z.string().min(3, "Model name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["customer-support", "creative-writing", "code-assistant", "finance", "medical", "legal", "other"] as const),
  datasetDescription: z.string().min(5, "Required"),
  samplePrompt: z.string().min(5, "Required"),
  sampleOutput: z.string().min(5, "Required"),
  licensePriceUsd: z.coerce.number().min(0),
  datasetContent: z.string().min(10, "Dataset content required")
});

type FormValues = z.infer<typeof formSchema>;

export default function Studio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog state for listing a model
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listingJobId, setListingJobId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("29");

  const { data: jobs, isLoading, refetch } = useListFineTuneJobs(
    { creatorWallet: DEMO_WALLET },
    { query: { refetchInterval: 3000, queryKey: getListFineTuneJobsQueryKey({ creatorWallet: DEMO_WALLET }) } }
  );

  // Fetch creator's models so we can find model by jobId for the listing flow
  const { data: creatorModels, refetch: refetchModels } = useListModels(
    { creatorWallet: DEMO_WALLET },
    { query: { queryKey: getListModelsQueryKey({ creatorWallet: DEMO_WALLET }) } }
  );

  const createMutation = useCreateFineTuneJob();
  const listModelMutation = useListModel();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creatorWallet: DEMO_WALLET,
      baseModel: "Qwen2.5-0.5B-Instruct",
      modelName: "",
      description: "",
      category: "other",
      datasetDescription: "",
      samplePrompt: "",
      sampleOutput: "",
      licensePriceUsd: 29,
      datasetContent: ""
    }
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({ data: values }, {
      onSuccess: (job) => {
        toast({
          title: "Job Submitted",
          description: `Fine-tune job #${job.id} queued. Dataset uploading to 0G Storage...`
        });
        form.reset({ ...form.formState.defaultValues as FormValues, creatorWallet: DEMO_WALLET });
        queryClient.invalidateQueries({ queryKey: getListFineTuneJobsQueryKey({ creatorWallet: DEMO_WALLET }) });
      },
      onError: () => {
        toast({ title: "Submit Failed", description: "Could not create fine-tune job.", variant: "destructive" });
      }
    });
  };

  const openListDialog = (jobId: number) => {
    setListingJobId(jobId);
    // Pre-fill price from the job's form data if available
    const relatedModel = creatorModels?.find(m => m.jobId === jobId);
    if (relatedModel) setListPrice(String(relatedModel.licensePriceUsd));
    setListDialogOpen(true);
  };

  const confirmListing = () => {
    if (listingJobId == null) return;
    const relatedModel = creatorModels?.find(m => m.jobId === listingJobId);
    if (!relatedModel) {
      toast({ title: "Model not ready", description: "Could not find the model for this job.", variant: "destructive" });
      return;
    }

    listModelMutation.mutate(
      { id: relatedModel.id, data: { licensePriceUsd: Number(listPrice), creatorWallet: DEMO_WALLET } },
      {
        onSuccess: () => {
          toast({ title: "Listed!", description: `${relatedModel.name} is now on the marketplace.` });
          setListDialogOpen(false);
          setListingJobId(null);
          queryClient.invalidateQueries({ queryKey: getListModelsQueryKey({ creatorWallet: DEMO_WALLET }) });
          refetchModels();
        },
        onError: () => {
          toast({ title: "Listing Failed", description: "Could not list model on marketplace.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 grid lg:grid-cols-2 gap-8">
      {/* New Fine-Tune Job Form */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-mono uppercase text-primary">New Fine-Tune Job</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="creatorWallet" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator Wallet</FormLabel>
                    <FormControl><Input {...field} readOnly data-testid="input-creator-wallet" className="bg-muted font-mono text-xs" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="modelName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name</FormLabel>
                      <FormControl><Input {...field} data-testid="input-model-name" placeholder="my-custom-model" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="baseModel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-base-model"><SelectValue placeholder="Select base model" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Qwen2.5-0.5B-Instruct">Qwen2.5-0.5B-Instruct</SelectItem>
                          <SelectItem value="Qwen3-32B">Qwen3-32B</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(CATEGORY_COLORS).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} data-testid="input-description" placeholder="What does this model do?" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="datasetDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dataset Description</FormLabel>
                    <FormControl><Input {...field} data-testid="input-dataset-description" placeholder="e.g. 5,000 customer support Q&A pairs" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="datasetContent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dataset (JSONL)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-dataset-content"
                        placeholder={'{"messages": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}]}'}
                        className="font-mono text-xs h-28"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="samplePrompt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Prompt</FormLabel>
                      <FormControl><Input {...field} data-testid="input-sample-prompt" placeholder="Example user input" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sampleOutput" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Output</FormLabel>
                      <FormControl><Input {...field} data-testid="input-sample-output" placeholder="Expected model response" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="licensePriceUsd" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly License Price (USD)</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-license-price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  data-testid="button-submit-job"
                  disabled={createMutation.isPending}
                  className="w-full font-bold"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? "Submitting..." : "Submit Job"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-mono uppercase text-primary">Your Jobs</h2>
          <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh-jobs">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-xl animate-pulse border border-border/50" />)}
          </div>
        )}

        <div className="space-y-4">
          {jobs?.map(job => {
            const relatedModel = creatorModels?.find(m => m.jobId === job.id);
            const isAlreadyListed = relatedModel?.isListed ?? false;

            return (
              <Card key={job.id} data-testid={`card-job-${job.id}`} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono font-bold text-lg">{job.modelName}</div>
                    <Badge className={STATUS_COLORS[job.status] || STATUS_COLORS.pending}>{job.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">Base: {job.baseModel} · {new Date(job.startedAt).toLocaleDateString()}</div>

                  {(job.status === "uploading" || job.status === "training") && job.progressPct != null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{job.status === "uploading" ? "Uploading to 0G Storage..." : "Training on 0G Compute..."}</span>
                        <span>{job.progressPct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${job.status === "uploading" ? "bg-blue-500" : "bg-amber-500"}`}
                          style={{ width: `${job.progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs font-mono text-muted-foreground">
                    {job.jobIdOn0g && <div>0G Job: {truncateHash(job.jobIdOn0g)}</div>}
                    {job.datasetOgExplorerUrl && (
                      <div className="flex items-center gap-1">
                        Dataset Tx: <OgLink hash={job.datasetOgExplorerUrl.split('/').pop() || ''} type="tx" />
                      </div>
                    )}
                    {job.nftOgExplorerUrl && (
                      <div className="flex items-center gap-1">
                        NFT Mint: <OgLink hash={job.nftOgExplorerUrl.split('/').pop() || ''} type="tx" />
                      </div>
                    )}
                  </div>

                  {job.status === "completed" && (
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        {job.nftTokenId ? `NFT #${job.nftTokenId}` : "Model ready"}
                      </span>
                      {isAlreadyListed ? (
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Listed on Marketplace</Badge>
                      ) : (
                        <Button
                          size="sm"
                          data-testid={`button-list-model-${job.id}`}
                          onClick={() => openListDialog(job.id)}
                          disabled={listModelMutation.isPending}
                        >
                          <Store className="mr-2 h-3 w-3" /> List on Marketplace
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && jobs?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
              No jobs yet. Submit your first fine-tune job.
            </div>
          )}
        </div>
      </div>

      {/* List on Marketplace Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List Model on Marketplace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Set a monthly license price. Developers who purchase a license can run inference on your model via the API.
            </p>
            <div className="space-y-2">
              <Label htmlFor="list-price">Monthly License Price (USD)</Label>
              <Input
                id="list-price"
                data-testid="input-list-price"
                type="number"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
                min="0"
                step="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)}>Cancel</Button>
            <Button
              data-testid="button-confirm-list"
              onClick={confirmListing}
              disabled={listModelMutation.isPending}
            >
              {listModelMutation.isPending ? "Listing..." : "Confirm & List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
