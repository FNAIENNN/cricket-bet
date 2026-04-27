// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 1) return "Just now";
  if (diffMins > 0) {
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${diffDays}d`;
  } else {
    if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)}m ago`;
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)}h ago`;
    return `${Math.abs(diffDays)}d ago`;
  }
}

export function calculatePotential(amount: number, odds: number) {
  return parseFloat((amount * odds).toFixed(2));
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    UPCOMING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    LIVE: "bg-red-500/20 text-red-400 border-red-500/30",
    TOSS_DONE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    FINISHED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    CANCELLED: "bg-gray-700/20 text-gray-500 border-gray-700/30",
    // bet statuses
    PENDING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    WON: "bg-green-500/20 text-green-400 border-green-500/30",
    LOST: "bg-red-500/20 text-red-400 border-red-500/30",
    REFUNDED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    // transaction statuses
    APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
    COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return map[status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";
}
