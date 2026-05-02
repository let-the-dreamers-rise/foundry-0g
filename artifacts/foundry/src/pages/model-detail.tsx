import { useState } from "react";
import { useParams } from "wouter";
import { useGetModel, getGetModelQueryKey, usePurchaseLicense, useInferModel } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { truncateHash, truncateWallet, CATEGORY_COLORS } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { Terminal, Database, Box, Play, LockKeyhole, LockOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const DEMO_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export default function ModelDetail() {
  const { id } = useParams();
  const modelId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: model, isLoading } = useGetModel(modelId, {
    query: { enabled: !!modelId, queryKey: getGetModelQueryKey(modelId) }
  });

  const purchaseMutation = usePurchaseLicense();
  const inferMutation = useInferModel();

  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [inferTime, setInferTime] = useState<number | null>(null);
  const [teeRef, setTeeRef] = useState<string | null>(null);

  const handlePurchase = () => {
    purchaseMutation.mutate({
      data: {
        modelId,
        buyerWallet: DEMO_WALLET,
        durationDays: 30
      }
    }, {
      onSuccess: () => {
        toast({ title: "License Purchased!", description: "You now have 30 days of inference access to this model." });
        queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
      },
      onError: () => {
        toast({ title: "Purchase Failed", description: "Could not process license purchase.", variant: "destructive" });
      }
    });
  };

  const handleInference = () => {
    if (!prompt.trim()) return;
    setOutput("");
    setInferTime(null);
    setTeeRef(null);
    inferMutation.mutate({
      id: modelId,
      data: {
        prompt: prompt.trim(),
        callerWallet: DEMO_WALLET,
      }
    }, {
      onSuccess: (res) => {
        setOutput(res.response);
        setInferTime(res.processingMs);
        if (res.teeAttestationRef) setTeeRef(res.teeAttestationRef);
        toast({ title: "Inference Complete", description: `Processed in ${res.processingMs}ms via 0G Compute TEE` });
        queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
      },
      onError: (err: any) => {
        const msg = err?.message?.includes("403") ? "No active license for this model. Purchase a license first." : "Inference failed.";
        toast({ title: "Inference Failed", description: msg, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto p-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!model) return <div className="p-8 text-center text-muted-foreground">Model not found</div>;

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold font-mono tracking-tight text-primary mb-2">{model.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Creator: <span className="font-mono text-foreground">{truncateWallet(model.creatorWallet)}</span></span>
              <span>Listed: {new Date(model.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge className={CATEGORY_COLORS[model.category] || CATEGORY_COLORS.other}>{model.category}</Badge>
        </div>
        <p className="text-lg text-foreground/90 max-w-4xl">{model.description}</p>

        <div className="flex flex-wrap gap-6 mt-8 p-4 bg-muted/30 rounded-lg border border-border/50">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Base Model</div>
            <div className="font-mono text-sm">{model.baseModel}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Runs</div>
            <div className="font-mono text-sm">{model.inferenceCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Licenses</div>
            <div className="font-mono text-sm">{model.licenseCount}</div>
          </div>
          {model.modelRootHash && (
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Model Root Hash (0G)</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{truncateHash(model.modelRootHash)}</span>
                {model.ogExplorerUrl && <OgLink hash={model.ogExplorerUrl.split('/').pop() || ''} type="tx" />}
              </div>
            </div>
          )}
          {model.nftTokenId && (
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NFT Token ID</div>
              <div className="font-mono text-sm">#{model.nftTokenId}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Dataset Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{model.datasetDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" /> Demo Inference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prompt</label>
                <Textarea
                  data-testid="input-inference-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={model.samplePrompt || "Enter your prompt here..."}
                  className="font-mono text-sm bg-muted/30"
                  rows={4}
                />
              </div>
              <Button
                data-testid="button-run-inference"
                onClick={handleInference}
                disabled={inferMutation.isPending || !prompt.trim()}
                className="w-full font-bold"
              >
                <Play className="mr-2 h-4 w-4" />
                {inferMutation.isPending ? "Running on 0G Compute..." : "Run Inference"}
              </Button>

              {output && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Output</label>
                    <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                      {inferTime && <span>{inferTime}ms</span>}
                      {teeRef && <span>TEE: {teeRef.slice(0, 20)}...</span>}
                    </div>
                  </div>
                  <div
                    data-testid="text-inference-output"
                    className="p-4 bg-muted/50 rounded-md font-mono text-sm border border-border/50 whitespace-pre-wrap"
                  >
                    {output}
                  </div>
                </div>
              )}

              {/* Sample output preview */}
              {!output && model.sampleOutput && (
                <div className="mt-2 space-y-2 opacity-60">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Example Output</label>
                  <div className="p-4 bg-muted/20 rounded-md font-mono text-xs border border-border/30 whitespace-pre-wrap">
                    {model.sampleOutput}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-primary" /> License Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-background rounded-lg border border-border/50">
                <div className="text-4xl font-extrabold text-primary font-mono">${model.licensePriceUsd}</div>
                <div className="text-sm text-muted-foreground mt-1">per 30 days</div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Box className="h-4 w-4 text-primary/70" /> Access via REST API
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database className="h-4 w-4 text-primary/70" /> Weights stored on 0G Storage
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LockOpen className="h-4 w-4 text-primary/70" /> On-chain license proof
                </div>
              </div>
              <Button
                data-testid="button-purchase-license"
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending}
                size="lg"
                className="w-full font-bold"
              >
                {purchaseMutation.isPending ? "Processing..." : "Purchase License"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Caller wallet: <span className="font-mono">{truncateWallet(DEMO_WALLET)}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
