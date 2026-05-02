import { useState, useEffect } from "react";
import { useListFineTuneJobs, useCreateFineTuneJob, getListFineTuneJobsQueryKey, useListModel } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { truncateHash, truncateWallet, STATUS_COLORS, CATEGORY_COLORS } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { RefreshCcw, Check, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const DEMO_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const formSchema = z.object({
  creatorWallet: z.string(),
  baseModel: z.enum(["Qwen2.5-0.5B-Instruct", "Qwen3-32B"] as any),
  modelName: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(["customer-support", "creative-writing", "code-assistant", "finance", "medical", "legal", "other"] as any),
  datasetDescription: z.string(),
  samplePrompt: z.string(),
  sampleOutput: z.string(),
  licensePriceUsd: z.coerce.number().min(0),
  datasetContent: z.string().min(10)
});

export default function Studio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: jobs, isLoading, refetch } = useListFineTuneJobs({ creatorWallet: DEMO_WALLET }, {
    query: { refetchInterval: 3000 }
  });

  const createMutation = useCreateFineTuneJob();
  const listModelMutation = useListModel();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creatorWallet: DEMO_WALLET,
      baseModel: "Qwen2.5-0.5B-Instruct" as any,
      modelName: "",
      description: "",
      category: "other" as any,
      datasetDescription: "",
      samplePrompt: "",
      sampleOutput: "",
      licensePriceUsd: 10,
      datasetContent: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Job Submitted", description: "Your fine-tune job has been queued." });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListFineTuneJobsQueryKey({ creatorWallet: DEMO_WALLET }) });
      }
    });
  };

  const handleListModel = (jobId: number) => {
    // We assume the backend uses jobId for listModel? Wait, listModel takes modelId.
    // The backend spec says `/api/models/:id/list`.
    // Wait, the job contains a reference to the created model?
    // Let's assume the job creates the model and we can find the model in the marketplace.
    // The prompt says: "Completed models show 'List on Marketplace' button."
    toast({ title: "To be implemented", description: "Listing flow requires model ID from job." });
  };

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 grid lg:grid-cols-2 gap-8">
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
                    <FormControl><Input {...field} readOnly className="bg-muted" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="modelName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name</FormLabel>
                      <FormControl><Input {...field} placeholder="my-custom-model" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="baseModel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select base model" /></SelectTrigger>
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
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                    <FormControl><Textarea {...field} placeholder="What does this model do?" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="datasetContent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dataset (JSONL)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder='{"messages": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}]}'
                        className="font-mono text-xs h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="samplePrompt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Prompt</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sampleOutput" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Output</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="licensePriceUsd" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly License Price (USD)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={createMutation.isPending} className="w-full font-bold">
                  <Plus className="mr-2 h-4 w-4" /> Submit Job
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-mono uppercase text-primary">Your Jobs</h2>
          <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCcw className="h-4 w-4" /></Button>
        </div>
        
        <div className="space-y-4">
          {jobs?.map(job => (
            <Card key={job.id} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono font-bold text-lg">{job.modelName}</div>
                  <Badge className={STATUS_COLORS[job.status] || STATUS_COLORS.pending}>{job.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-4">Base: {job.baseModel}</div>
                
                {job.status === "training" && job.progressPct != null && (
                  <div className="w-full bg-muted rounded-full h-2 mb-4">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${job.progressPct}%` }}></div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 text-xs font-mono">
                  {job.jobIdOn0g && <div>0G Job: {truncateHash(job.jobIdOn0g)}</div>}
                  {job.datasetOgExplorerUrl && (
                    <div className="flex items-center gap-1">Data Hash: <OgLink hash={job.datasetOgExplorerUrl.split('/').pop() || ''} type="tx" /></div>
                  )}
                </div>

                {job.status === "completed" && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                    <Button size="sm" onClick={() => handleListModel(job.id)}><Check className="mr-2 h-4 w-4" /> List on Marketplace</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {jobs?.length === 0 && <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">No jobs yet</div>}
        </div>
      </div>
    </div>
  );
}
