import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getPreviousMonth(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(monthStr: string) {
  // Append T00:00:00 to force local time interpretation (date-only strings are UTC)
  return new Date(`${monthStr}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatCurrency(amount: number, showCents: boolean = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}
