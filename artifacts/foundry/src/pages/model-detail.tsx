import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useGetModel, getGetModelQueryKey, usePurchaseLicense, useInferModel } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { truncateHash, truncateWallet, CATEGORY_COLORS } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import { Terminal, Database, Box, Play, LockKeyhole, LockOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const DEMO_WALLET = "0x7A3c3E9547d2E5A8e01C7b8F5234567890aB19F2";

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

  const handlePurchase = () => {
    purchaseMutation.mutate({
      data: {
        modelId,
        buyerWallet: DEMO_WALLET,
        durationDays: 30
      }
    }, {
      onSuccess: () => {
        toast({ title: "License Purchased!", description: "You now have access to run inference on this model." });
        queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
      }
    });
  };

  const handleInference = () => {
    if (!prompt) return;
    inferMutation.mutate({
      data: {
        prompt,
        callerWallet: DEMO_WALLET,
      }
    }, {
      onSuccess: (res) => {
        setOutput(res.response);
        toast({ title: "Inference Complete", description: `Processing time: ${res.processingMs}ms` });
      }
    });
  };

  if (isLoading) {
    return <div className="container max-w-screen-xl mx-auto p-8"><Skeleton className="h-64 w-full mb-8" /></div>;
  }

  if (!model) return <div className="p-8 text-center">Model not found</div>;

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
            <div className="font-mono text-sm">{model.inferenceCount}</div>
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
                {model.ogExplorerUrl && <OgLink hash={model.modelRootHash} type="tx" />}
              </div>
            </div>
          )}
          {model.nftTokenId && (
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NFT Token ID</div>
              <div className="font-mono text-sm">{truncateHash(model.nftTokenId)}</div>
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
              <p className="text-sm">{model.datasetDescription}</p>
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
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  placeholder={model.samplePrompt} 
                  className="font-mono text-sm bg-muted/30"
                  rows={4}
                />
              </div>
              <Button onClick={handleInference} disabled={inferMutation.isPending || !prompt} className="w-full font-bold">
                <Play className="mr-2 h-4 w-4" /> Run Inference
              </Button>

              {output && (
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Output</label>
                  <div className="p-4 bg-muted/50 rounded-md font-mono text-sm border border-border/50 whitespace-pre-wrap">
                    {output}
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
                  <Box className="h-4 w-4" /> Access via API
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database className="h-4 w-4" /> Decentralized execution
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LockOpen className="h-4 w-4" /> On-chain proof of access
                </div>
              </div>
              <Button 
                onClick={handlePurchase} 
                disabled={purchaseMutation.isPending} 
                size="lg" 
                className="w-full font-bold text-md"
              >
                Purchase License
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
