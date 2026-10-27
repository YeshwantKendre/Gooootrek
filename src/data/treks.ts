import type { Difficulty, Trek } from "@/lib/types";
import raw from "./treks.json";

/**
 * Static encyclopedia of Indian treks. It is the source for the seed SQL
 * (npm run seed:sql) and the fallback when Supabase is not configured.
 */
export const TREKS: Trek[] = raw as Trek[];

export function getTrekBySlug(slug: string): Trek | undefined {
  return TREKS.find((t) => t.slug === slug);
}

export const STATES = Array.from(new Set(TREKS.map((t) => t.state))).sort();

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "difficult", label: "Difficult" },
  { value: "challenging", label: "Challenging" },
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
