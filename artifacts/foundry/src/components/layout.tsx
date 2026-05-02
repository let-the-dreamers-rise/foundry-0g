import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Cpu, LayoutDashboard, Store, Activity, Plus } from "lucide-react";
import { Button } from "./ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Cpu },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/studio", label: "Studio", icon: Plus },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 dark">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight font-mono">FOUNDRY</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 flex items-center gap-2",
                  location === item.href || (location.startsWith(item.href) && item.href !== "/")
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" className="font-mono text-xs hidden sm:flex">
              0x7A3c...19F2
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
