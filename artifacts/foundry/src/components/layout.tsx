import React from "react";
import { Link, useLocation } from "wouter";
import { LiveOnChainBanner } from "./live-onchain-banner";
import { cn } from "@/lib/utils";
import { Flame, LayoutDashboard, Store, Activity, Cpu, Wallet, AlertTriangle, LogOut, ChevronDown, Loader2, Code } from "lucide-react";
import { Button } from "./ui/button";
import { useWallet } from "@/context/wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/studio", label: "Studio", icon: Cpu },
  { href: "/developers", label: "Developers", icon: Code },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
];

function WalletButton() {
  const { address, isConnected, isConnecting, isWrongChain, hasWallet, openConnectModal, disconnect, switchToOgChain, error } =
    useWallet();

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/50 text-xs font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting…
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer",
              isWrongChain
                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:border-yellow-500/70"
                : "border-primary/30 bg-primary/5 text-foreground hover:border-primary/50"
            )}
          >
            {isWrongChain ? (
              <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
            ) : (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
            {address.slice(0, 6)}…{address.slice(-4)}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 font-mono text-xs dark">
          <div className="px-3 py-2 text-muted-foreground text-[10px]">
            <div className="text-foreground font-semibold mb-0.5">Connected Wallet</div>
            <div className="break-all">{address}</div>
          </div>
          {isWrongChain && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-yellow-400 focus:text-yellow-300 cursor-pointer"
                onClick={() => switchToOgChain()}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                Switch to 0G Galileo
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={disconnect}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={openConnectModal}
        title={hasWallet ? "Connect Wallet" : "Install MetaMask"}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-border bg-card/50 text-xs font-mono text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors cursor-pointer"
      >
        <Wallet className="h-3 w-3" />
        <span className="hidden sm:inline">{hasWallet ? "Connect Wallet" : "Install MetaMask"}</span>
      </button>
      {error && (
        <span className="text-[10px] text-destructive font-mono">{error}</span>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 dark">
      <LiveOnChainBanner />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 max-w-screen-2xl items-center px-4 gap-3 md:gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <Flame className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight font-mono">
              FOUNDRY
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded">
              0G
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium flex-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200",
                  isActive(item.href)
                    ? "text-foreground bg-primary/8 nav-link-active"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", isActive(item.href) && "text-primary")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <WalletButton />
            <Button asChild size="sm" className="hidden md:flex font-semibold text-xs px-4">
              <Link href="/studio">New Fine-Tune</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="border-t border-border/40 py-6 mt-8">
        <div className="container max-w-screen-2xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-primary/60" />
            <span className="font-mono font-medium">FOUNDRY</span>
            <span className="text-border">·</span>
            <span>Built on 0G Network · Galileo Testnet</span>
          </div>
          <div className="flex items-center gap-4">
            <span>ERC-7857 Model NFTs</span>
            <span className="text-border">·</span>
            <span>0G Storage + Compute</span>
            <span className="text-border">·</span>
            <a
              href="https://chainscan-galileo.0g.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              0G Explorer ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
