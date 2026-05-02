import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Model } from "@workspace/api-client-react";
import { truncateWallet, CATEGORY_COLORS } from "@/lib/utils";
import { OgLink } from "./0g-link";

export function ModelCard({ model }: { model: Model }) {
  return (
    <Card className="flex flex-col bg-card/50 hover:bg-card/80 transition-colors border-border/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold font-mono tracking-tight text-primary">
              <Link href={`/models/${model.id}`}>{model.name}</Link>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              by {truncateWallet(model.creatorWallet)}
            </CardDescription>
          </div>
          <Badge variant="outline" className={CATEGORY_COLORS[model.category] || CATEGORY_COLORS.other}>
            {model.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-foreground/80 line-clamp-2 mb-4">{model.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="font-mono text-xs">{model.baseModel}</Badge>
          <Badge variant="secondary" className="text-xs">{model.inferenceCount} runs</Badge>
          <Badge variant="secondary" className="text-xs">{model.licenseCount} licenses</Badge>
        </div>
        <div className="bg-muted/50 p-3 rounded-md text-xs font-mono border border-border/50">
          <div className="text-muted-foreground mb-1">Sample Prompt:</div>
          <div className="text-foreground truncate">{model.samplePrompt}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-border/50 pt-4">
        <div className="text-lg font-bold text-primary">${model.licensePriceUsd}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
        <div className="flex items-center gap-2">
          {model.ogExplorerUrl && <OgLink hash={model.ogExplorerUrl.split('/').pop() || ''} type="tx" />}
          <Button asChild size="sm">
            <Link href={`/models/${model.id}`}>View Details</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
