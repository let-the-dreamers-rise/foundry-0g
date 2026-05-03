import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetModel, getGetModelQueryKey, usePurchaseLicense, useInferModel
} from "@workspace/api-client-react";
import { useWallet } from "@/context/wallet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { truncateHash, truncateWallet, CATEGORY_COLORS, CATEGORY_LABELS, cn } from "@/lib/utils";
import { OgLink } from "@/components/0g-link";
import {
  Terminal, Database, Box, Play, Lock, Unlock, Check,
  Copy, Zap, Users, ArrowLeft, ShieldCheck, Code2, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type LicenseTier = "monthly" | "quarterly" | "annual";

function TeeProofLink({ teeRef }: { teeRef: string }) {
  const isUrl = teeRef.startsWith("http");
  const proofUrl = isUrl
    ? teeRef
    : `https://chainscan-galileo.0g.ai/tx/${teeRef}`;
  const label = teeRef.startsWith("http")
    ? teeRef.split("/").pop()?.slice(0, 14) ?? teeRef.slice(0, 14)
    : teeRef.slice(0, 14);

  return (
    <a
      href={proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="link-tee-proof"
      className="flex items-center gap-1 text-primary/80 hover:text-primary transition-colors"
      title="View TEE attestation proof on 0G Chain Explorer"
    >
      <ShieldCheck className="h-3 w-3" />
      Proof: {label}…
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

function CodeBlock({ code }: { code: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group code-block overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="text-xs font-mono text-foreground/80 p-4 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function ModelDetail() {
  const { id } = useParams();
  const modelId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address, isConnected, openConnectModal, signTypedData } = useWallet();
  const walletAddress = address ?? "";

  const { data: model, isLoading } = useGetModel(modelId, {
    query: { enabled: !!modelId, queryKey: getGetModelQueryKey(modelId) },
  });

  const purchaseMutation = usePurchaseLicense();
  const inferMutation = useInferModel();

  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [inferTime, setInferTime] = useState<number | null>(null);
  const [teeRef, setTeeRef] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<LicenseTier>("monthly");

  const handlePurchase = async () => {
    if (!isConnected) { openConnectModal(); return; }
    const durationMap: Record<LicenseTier, number> = { monthly: 30, quarterly: 90, annual: 365 };
    const durationDays = durationMap[selectedTier];
    const signedAt = Date.now();

    toast({
      title: "Sign in your wallet",
      description: "Approve the purchase intent in your wallet. No gas required.",
    });

    const signature = await signTypedData(
      { name: "Foundry", version: "1", chainId: 16601 },
      {
        PurchaseLicense: [
          { name: "modelId", type: "uint256" },
          { name: "buyer", type: "address" },
          { name: "durationDays", type: "uint256" },
          { name: "signedAt", type: "uint256" },
        ],
      },
      { modelId, buyer: walletAddress, durationDays, signedAt },
      "PurchaseLicense",
    );

    if (!signature) {
      toast({
        title: "Signature required",
        description: "Purchase cancelled — wallet signature was rejected.",
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate(
      { data: { modelId, buyerWallet: walletAddress, durationDays, signature, signedAt } as any },
      {
        onSuccess: () => {
          toast({
            title: "License Purchased!",
            description: `${selectedTier} license active — wallet signature verified on-chain.`,
          });
          queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
        },
        onError: () => {
          toast({
            title: "Purchase Failed",
            description: "Could not process license purchase.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleInference = async () => {
    if (!prompt.trim()) return;
    if (!isConnected) { openConnectModal(); return; }

    const signedAt = Date.now();
    const signature = await signTypedData(
      { name: "Foundry", version: "1", chainId: 16601 },
      {
        Inference: [
          { name: "modelId", type: "uint256" },
          { name: "caller", type: "address" },
          { name: "signedAt", type: "uint256" },
        ],
      },
      { modelId, caller: walletAddress, signedAt },
      "Inference",
    );

    if (!signature) {
      toast({
        title: "Signature required",
        description: "Inference cancelled — wallet signature was rejected.",
        variant: "destructive",
      });
      return;
    }

    setOutput(""); setInferTime(null); setTeeRef(null);
    inferMutation.mutate(
      { id: modelId, data: { prompt: prompt.trim(), callerWallet: walletAddress, signature, signedAt } as any },
      {
        onSuccess: (res) => {
          setOutput(res.response);
          setInferTime(res.processingMs);
          if (res.teeAttestationRef) setTeeRef(res.teeAttestationRef);
          toast({ title: "Inference Complete", description: `Processed in ${res.processingMs}ms via 0G Compute TEE` });
          queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error && err.message.includes("403")
              ? "No active license. Purchase a license first."
              : "Inference failed.";
          toast({ title: "Inference Failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto p-8 space-y-6">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="container max-w-screen-xl mx-auto p-8 text-center">
        <p className="text-muted-foreground">Model not found.</p>
        <Link href="/marketplace" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to marketplace</Link>
      </div>
    );
  }

  const basePrice = model.licensePriceUsd;
  const quarterlyPrice = Math.round(basePrice * 2.5);
  const annualPrice = Math.round(basePrice * 8.5);

  const TIERS: Array<{
    id: LicenseTier; label: string; price: number; duration: string;
    calls: string; badge?: string; savings?: string
  }> = [
    { id: "monthly", label: "Developer", price: basePrice, duration: "/ 30 days", calls: "Up to 1,000 API calls" },
    { id: "quarterly", label: "Growth", price: quarterlyPrice, duration: "/ 90 days", calls: "Up to 5,000 API calls", badge: "Popular", savings: `Save ${Math.round((1 - quarterlyPrice / (basePrice * 3)) * 100)}%` },
    { id: "annual", label: "Studio", price: annualPrice, duration: "/ 365 days", calls: "Unlimited API calls", savings: `Save ${Math.round((1 - annualPrice / (basePrice * 12)) * 100)}%` },
  ];

  const curlExample = `curl -X POST https://api.foundry.0g.ai/v1/models/${modelId}/infer \\
  -H "Authorization: Bearer fl_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "${model.samplePrompt}"}'`;

  const sdkExample = `import { FoundryClient } from "@foundry/sdk";

const client = new FoundryClient({
  licenseKey: "fl_xxxxxxxxxxxxxxxx",
});

const response = await client.models.infer(${modelId}, {
  prompt: "${model.samplePrompt}",
});

console.log(response.output);
// ${model.sampleOutput?.slice(0, 60) ?? "Model output here..."}`;

  return (
    <div className="container max-w-screen-xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/marketplace" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{model.name}</span>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/50 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <Badge
                variant="outline"
                className={cn("text-xs font-mono", CATEGORY_COLORS[model.category] || CATEGORY_COLORS.other)}
              >
                {CATEGORY_LABELS[model.category] || model.category}
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">{model.baseModel}</Badge>
              {model.nftTokenId && (
                <Badge variant="outline" className="text-xs font-mono border-primary/20 text-primary bg-primary/5">
                  NFT #{model.nftTokenId}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{model.name}</h1>
            <p className="text-sm text-muted-foreground">
              by{" "}
              <span className="font-mono text-foreground/80">{truncateWallet(model.creatorWallet)}</span>
              {" · "}Listed {new Date(model.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="text-base text-foreground/80 leading-relaxed mb-8 max-w-3xl">{model.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Runs", value: model.inferenceCount.toLocaleString(), icon: Zap },
            { label: "Active Licenses", value: model.licenseCount, icon: Users },
            { label: "Base Model", value: model.baseModel.split("-").slice(0, 2).join("-"), icon: Box },
            { label: "Monthly Revenue", value: `$${Math.round(model.licensePriceUsd * model.licenseCount * 0.85)}`, icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-4 border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{label}</span>
              </div>
              <div className="text-lg font-bold font-mono">{value}</div>
            </div>
          ))}
        </div>

        {model.modelRootHash && (
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-border/40 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-primary/50" />
              <span>0G Root: {truncateHash(model.modelRootHash)}</span>
              {model.ogExplorerUrl && (
                <OgLink hash={model.ogExplorerUrl.split("/").pop() || ""} type="tx" />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="demo">
            <TabsList className="bg-card/50 border border-border/60 h-10 p-1 mb-6">
              <TabsTrigger value="demo" className="text-xs gap-1.5 data-[state=active]:text-foreground">
                <Terminal className="h-3.5 w-3.5" /> Demo
              </TabsTrigger>
              <TabsTrigger value="api" className="text-xs gap-1.5 data-[state=active]:text-foreground">
                <Code2 className="h-3.5 w-3.5" /> API Reference
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1.5 data-[state=active]:text-foreground">
                <Database className="h-3.5 w-3.5" /> Training Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="demo" className="space-y-4 mt-0">
              <div className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Prompt
                  </label>
                  <Textarea
                    data-testid="input-inference-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={model.samplePrompt || "Enter your prompt here..."}
                    className="font-mono text-sm bg-muted/20 border-border/60 resize-none"
                    rows={4}
                  />
                </div>
                <Button
                  data-testid="button-run-inference"
                  onClick={handleInference}
                  disabled={inferMutation.isPending || !prompt.trim()}
                  className="w-full font-semibold"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {inferMutation.isPending ? "Running on 0G Compute..." : "Run Inference"}
                </Button>

                {!output && model.sampleOutput && (
                  <div className="space-y-2 opacity-50">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Example Output
                    </label>
                    <div className="p-4 bg-muted/20 rounded-lg font-mono text-xs border border-border/30 whitespace-pre-wrap">
                      {model.sampleOutput}
                    </div>
                  </div>
                )}

                {output && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Output
                      </label>
                      <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                        {inferTime && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Zap className="h-3 w-3" /> {inferTime}ms
                          </span>
                        )}
                          {teeRef && (
                          <TeeProofLink teeRef={teeRef} />
                        )}
                      </div>
                    </div>
                    <div
                      data-testid="text-inference-output"
                      className="p-4 bg-muted/30 rounded-lg font-mono text-sm border border-border/50 whitespace-pre-wrap"
                    >
                      {output}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-6 mt-0">
              <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="text-xs text-muted-foreground font-mono ml-2">cURL</span>
                </div>
                <CodeBlock code={curlExample} />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="text-xs text-muted-foreground font-mono ml-2">JavaScript / TypeScript</span>
                </div>
                <CodeBlock code={sdkExample} />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-3">
                <h3 className="text-sm font-semibold">Response Format</h3>
                <CodeBlock code={`{
  "response": "string",        // Model output text
  "processingMs": 234,         // Latency in milliseconds
  "teeAttestationRef": "0x...", // TEE proof hash (0G Compute)
  "modelId": ${modelId}
}`} />
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 mt-0">
              <div className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Dataset Description
                  </label>
                  <p className="text-sm text-foreground/80 leading-relaxed">{model.datasetDescription}</p>
                </div>
                {model.datasetRootHash && (
                  <div className="pt-4 border-t border-border/40">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      0G Storage Root Hash
                    </label>
                    <div className="flex items-center gap-2 font-mono text-xs text-foreground/70">
                      <Database className="h-3.5 w-3.5 text-primary/60" />
                      <span data-testid="text-dataset-root-hash">{truncateHash(model.datasetRootHash)}</span>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(model.datasetRootHash!);
                          toast({ title: "Root hash copied" });
                        }}
                        className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy root hash"
                        data-testid="button-copy-dataset-hash"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={`https://storagescan-galileo.0g.ai/file/${model.datasetRootHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/80 hover:text-primary border border-primary/30 hover:border-primary/60 rounded px-1.5 py-0.5 transition-colors"
                        title="View dataset on 0G Storage Explorer"
                        data-testid="link-dataset-storage-explorer"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        0G Storage
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dataset is permanently stored on 0G's decentralized storage network.
                      The root hash is immutable proof of the training data used.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-2">
                  {[
                    { label: "Format", value: "JSONL" },
                    { label: "Storage", value: "0G Network" },
                    { label: "Access", value: "Permissioned" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-md px-3 py-2 text-xs border border-border/40">
                      <div className="text-muted-foreground uppercase tracking-wider text-[9px] font-mono mb-0.5">{label}</div>
                      <div className="font-semibold text-foreground/80">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-card/50 overflow-hidden sticky top-20">
            <div className="p-5 border-b border-border/40">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">License Access</h3>
              </div>

              <div className="space-y-2">
                {TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all duration-150",
                      selectedTier === tier.id
                        ? "border-primary/40 bg-primary/8 glow-border"
                        : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{tier.label}</span>
                        {tier.badge && (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                            {tier.badge}
                          </span>
                        )}
                        {tier.savings && (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {tier.savings}
                          </span>
                        )}
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        selectedTier === tier.id ? "border-primary bg-primary" : "border-border/60"
                      )}>
                        {selectedTier === tier.id && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-mono">${tier.price}</span>
                      <span className="text-xs text-muted-foreground">{tier.duration}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{tier.calls}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                {[
                  { icon: Unlock, label: "REST API access" },
                  { icon: ShieldCheck, label: "TEE-verified inference" },
                  { icon: Database, label: "Weights on 0G Storage" },
                  { icon: Box, label: "On-chain license proof" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    {label}
                  </div>
                ))}
              </div>

              <Button
                data-testid="button-purchase-license"
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending}
                size="lg"
                className="w-full font-bold"
              >
                {purchaseMutation.isPending
                  ? "Processing..."
                  : `Purchase ${TIERS.find((t) => t.id === selectedTier)?.label} License`}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground font-mono">
                {isConnected ? `Wallet: ${truncateWallet(walletAddress)} · Galileo Testnet` : "Connect wallet to purchase"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
