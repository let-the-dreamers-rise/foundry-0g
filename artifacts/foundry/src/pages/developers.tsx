import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/wallet";
import { Code, Copy, Check, Trash2, KeyRound, Zap, ShieldCheck, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, apiUrl } from "@/lib/api-base";

interface ApiKeyRow {
  id: number;
  name: string;
  keyPrefix: string;
  requestCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewKeyResponse {
  id: number;
  name: string;
  fullKey: string;
  keyPrefix: string;
  createdAt: string;
  warning: string;
}

const EIP712_DOMAIN = { name: "Foundry", version: "1", chainId: 16602 };
const EIP712_TYPES = {
  ApiKeyAction: [
    { name: "action", type: "string" },
    { name: "wallet", type: "address" },
    { name: "target", type: "string" },
    { name: "signedAt", type: "uint256" },
  ],
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/60 rounded hover:border-primary/40 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function makeCurlExample(apiBaseUrl: string) {
  return `curl ${apiBaseUrl}/api/v1/chat/completions \\
  -H "Authorization: Bearer fnd_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "foundry/1",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
}

function makeNodeExample(apiBaseUrl: string) {
  return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${apiBaseUrl}/api/v1",
  apiKey: "fnd_live_...",
});

const res = await client.chat.completions.create({
  model: "foundry/1",
  messages: [{ role: "user", content: "Hello" }],
});`;
}

export default function Developers() {
  const { address, isConnected, openConnectModal, signTypedData } = useWallet();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<NewKeyResponse | null>(null);

  const wallet = address ?? null;
  const apiBaseUrl = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "https://YOUR_DEPLOYED_URL");
  const curlExample = makeCurlExample(apiBaseUrl);
  const nodeExample = makeNodeExample(apiBaseUrl);

  async function signAction(action: "create" | "list" | "delete", target: string) {
    if (!wallet) throw new Error("Wallet not connected");
    const signedAt = Date.now();
    const sig = await signTypedData(
      EIP712_DOMAIN,
      EIP712_TYPES,
      { action, wallet, target, signedAt },
      "ApiKeyAction",
    );
    if (!sig) throw new Error("Signature rejected");
    return { signature: sig, signedAt };
  }

  const keysQuery = useQuery<{ keys: ApiKeyRow[] }>({
    queryKey: ["api-keys", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const { signature, signedAt } = await signAction("list", "*");
      const params = new URLSearchParams({
        wallet: wallet!,
        signature,
        signedAt: String(signedAt),
      });
      const r = await fetch(apiUrl(`/api/api-keys?${params}`));
      if (!r.ok) throw new Error("Failed to load keys");
      return r.json();
    },
  });

  const createKey = useMutation({
    mutationFn: async (name: string): Promise<NewKeyResponse> => {
      const finalName = name || "Default";
      const { signature, signedAt } = await signAction("create", finalName);
      const r = await fetch(apiUrl("/api/api-keys"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, name: finalName, signature, signedAt }),
      });
      if (!r.ok) throw new Error("Failed to create key");
      return r.json();
    },
    onSuccess: (data) => {
      setRevealedKey(data);
      setNewKeyName("");
      qc.invalidateQueries({ queryKey: ["api-keys", wallet] });
      toast({ title: "API key created", description: "Copy it now — it won't be shown again." });
    },
    onError: (err: Error) => {
      toast({ title: "Could not create key", description: err.message, variant: "destructive" });
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (id: number) => {
      const { signature, signedAt } = await signAction("delete", String(id));
      const params = new URLSearchParams({
        wallet: wallet!,
        signature,
        signedAt: String(signedAt),
      });
      const r = await fetch(apiUrl(`/api/api-keys/${id}?${params}`), { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete key");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", wallet] });
      toast({ title: "Key revoked" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not revoke key", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="container max-w-screen-2xl px-4 py-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-mono text-primary">
          <Zap className="h-3 w-3" /> Foundry Inference Gateway
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          One API. Every model on 0G.
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Drop-in OpenAI-compatible endpoint. Your fine-tuned model becomes a callable SaaS the moment
          you mint it — with on-chain license checks, royalty splits, and a 0G receipt for every call.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">License-Gated</span>
            </div>
            <CardTitle className="text-base">Every call checks the chain</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Requests are denied with HTTP 402 unless the caller's wallet holds an active license NFT for
            the requested model.
          </CardContent>
        </Card>
        <Card className="glow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">Verifiable Receipts</span>
            </div>
            <CardTitle className="text-base">DA anchor on every response</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every response carries an <code className="font-mono text-primary">x-foundry-receipt-tx</code>{" "}
            header pointing at chainscan-galileo.0g.ai for end-to-end auditability.
          </CardContent>
        </Card>
        <Card className="glow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <Code className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">OpenAI-Compatible</span>
            </div>
            <CardTitle className="text-base">Change one line of code</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Swap your <code className="font-mono text-primary">baseURL</code> to point at Foundry. The
            rest of the OpenAI SDK works as-is.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            Tied to your wallet via on-chain signature. Calls inherit the licenses your wallet owns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected && (
            <div className="flex items-center justify-between p-4 rounded-md border border-border/60 bg-card/40">
              <div className="text-sm text-muted-foreground">
                Connect your wallet to manage API keys.
              </div>
              <Button size="sm" onClick={openConnectModal}>
                Connect Wallet
              </Button>
            </div>
          )}

          {isConnected && (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Key name (e.g. local-dev, prod-bot)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={() => createKey.mutate(newKeyName)} disabled={createKey.isPending}>
                  {createKey.isPending ? "Sign & Create…" : "Generate Key"}
                </Button>
              </div>

              {revealedKey && (
                <div className="p-4 rounded-md border border-primary/40 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono uppercase tracking-wider text-primary">
                      Key created — copy now
                    </div>
                    <button
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => setRevealedKey(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="font-mono text-sm break-all bg-background p-3 rounded border border-border/60">
                    {revealedKey.fullKey}
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={revealedKey.fullKey} label="Copy key" />
                    <span className="text-[11px] text-muted-foreground">{revealedKey.warning}</span>
                  </div>
                </div>
              )}

              <div className="border border-border/60 rounded-md overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground bg-card/40 border-b border-border/60">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-4">Key</div>
                  <div className="col-span-2 text-right">Requests</div>
                  <div className="col-span-2">Last Used</div>
                  <div className="col-span-1" />
                </div>
                {keysQuery.isLoading && (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    Sign in your wallet to view keys…
                  </div>
                )}
                {keysQuery.data?.keys.length === 0 && (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    No keys yet. Generate one above.
                  </div>
                )}
                {keysQuery.data?.keys.map((k) => (
                  <div
                    key={k.id}
                    className="grid grid-cols-12 px-4 py-3 text-sm border-b border-border/40 last:border-b-0 items-center"
                  >
                    <div className="col-span-3 font-medium">{k.name}</div>
                    <div className="col-span-4 font-mono text-muted-foreground text-xs">
                      {k.keyPrefix}…
                    </div>
                    <div className="col-span-2 font-mono text-right">{k.requestCount}</div>
                    <div className="col-span-2 font-mono text-xs text-muted-foreground">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "—"}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => deleteKey.mutate(k.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Revoke key"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" /> curl
              </span>
              <CopyButton text={curlExample} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-background border border-border/60 rounded p-3 overflow-x-auto leading-relaxed">
              {curlExample}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" /> Node / OpenAI SDK
              </span>
              <CopyButton text={nodeExample} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-background border border-border/60 rounded p-3 overflow-x-auto leading-relaxed">
              {nodeExample}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response Headers</CardTitle>
          <CardDescription>Every successful gateway response includes:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs">
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4 text-primary">x-foundry-model</div>
              <div className="col-span-8 text-muted-foreground">foundry/&lt;model_id&gt;</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4 text-primary">x-foundry-creator</div>
              <div className="col-span-8 text-muted-foreground">0x… wallet earning royalties</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4 text-primary">x-foundry-receipt-tx</div>
              <div className="col-span-8 text-muted-foreground">0x… on 0G Galileo</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4 text-primary">x-foundry-receipt-url</div>
              <div className="col-span-8 text-muted-foreground">https://chainscan-galileo.0g.ai/tx/…</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4 text-primary">x-foundry-da-anchor</div>
              <div className="col-span-8 text-muted-foreground">DA reference for the response</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
