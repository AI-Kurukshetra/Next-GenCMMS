import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, formatStr: string = "MMM d, yyyy"): string {
  if (!date) return "-";
  try {
    return format(new Date(date), formatStr);
  } catch {
    return "-";
  }
}

export function formatDateRelative(date: string | Date): string {
  if (!date) return "-";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "-";
  }
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Work order statuses
    open: "bg-slate-100 text-slate-800",
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    // Asset statuses
    active: "bg-green-100 text-green-800",
    inactive: "bg-slate-100 text-slate-800",
    under_maintenance: "bg-yellow-100 text-yellow-800",
    retired: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-slate-100 text-slate-800";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-slate-100 text-slate-800";
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-slate-500",
    assigned: "bg-blue-500",
    in_progress: "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };
  return colors[status] || "bg-slate-500";
}

export function calculateProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
