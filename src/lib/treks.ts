import { TREKS } from "@/data/treks";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Trek } from "@/lib/types";

/** All treks: from Supabase when configured and seeded, else the static JSON. */
export async function getTreks(): Promise<Trek[]> {
  if (!isSupabaseConfigured) return TREKS;
  const supabase = await createClient();
  const { data, error } = await supabase.from("treks").select("*").order("name");
  if (error || !data || data.length === 0) return TREKS;
  return data as Trek[];
}

export async function getTrek(slug: string): Promise<Trek | null> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.from("treks").select("*").eq("slug", slug).maybeSingle();
    if (data) return data as Trek;
  }
  return TREKS.find((t) => t.slug === slug) ?? null;
}
