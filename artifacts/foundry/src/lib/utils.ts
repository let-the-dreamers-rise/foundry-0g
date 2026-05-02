import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateWallet(wallet?: string | null) {
  if (!wallet) return "0x0000...0000"
  if (wallet.length <= 10) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export function truncateHash(hash?: string | null) {
  if (!hash) return ""
  if (hash.length <= 14) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

export const CATEGORY_COLORS: Record<string, string> = {
  "customer-support": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "creative-writing": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "code-assistant": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "finance": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "medical": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "legal": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "other": "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

export const CATEGORY_LABELS: Record<string, string> = {
  "customer-support": "Support",
  "creative-writing": "Creative",
  "code-assistant": "Code",
  "finance": "Finance",
  "medical": "Medical",
  "legal": "Legal",
  "other": "Other",
}

export const STATUS_COLORS: Record<string, string> = {
  "pending": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "uploading": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "training": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "completed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "failed": "bg-red-500/10 text-red-400 border-red-500/20",
}

export const STATUS_LABELS: Record<string, string> = {
  "pending": "Pending",
  "uploading": "Uploading to 0G",
  "training": "Training on 0G GPU",
  "completed": "Completed",
  "failed": "Failed",
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
