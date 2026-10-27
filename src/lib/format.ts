import type { Difficulty, RegistrationStatus } from "./types";

export function formatINR(amount: number) {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(date.length === 10 ? `${date}T00:00:00` : date).toLocaleDateString("en-IN", opts);
}

export function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);
  return `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end)}`;
}

export function formatAltitude(m: number | null) {
  return m == null ? "—" : `${m.toLocaleString("en-IN")} m`;
}

/** Tailwind classes for difficulty badges (pastel). */
export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-sage-100 text-sage-700",
  moderate: "bg-sky-100 text-sky-700",
  difficult: "bg-peach-100 text-peach-700",
  challenging: "bg-lavender-100 text-lavender-700",
};

export const STATUS_STYLES: Record<RegistrationStatus, string> = {
  pending: "bg-butter-100 text-butter-700",
  confirmed: "bg-sage-100 text-sage-700",
  waitlisted: "bg-sky-100 text-sky-700",
  cancelled: "bg-line text-muted",
  rejected: "bg-peach-100 text-peach-700",
};

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
