import { DEMO_EVENTS } from "@/data/demo-events";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { TrekEventWithRelations } from "@/lib/types";

export const EVENT_SELECT =
  "*, organizer:profiles!events_organizer_id_fkey(id, full_name, organization_name, is_verified, avatar_url), trek:treks(slug, name, state, max_altitude_m)";

/** Published, upcoming events for public listings (demo data when Supabase isn't set up). */
export async function getUpcomingEvents(opts: { limit?: number; trekSlug?: string; featuredOnly?: boolean } = {}) {
  if (!isSupabaseConfigured) {
    let list = DEMO_EVENTS;
    if (opts.trekSlug) list = list.filter((e) => e.trek?.slug === opts.trekSlug);
    if (opts.featuredOnly) list = list.filter((e) => e.is_featured);
    return list.slice(0, opts.limit ?? list.length);
  }
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(opts.trekSlug ? EVENT_SELECT.replace("trek:treks(", "trek:treks!inner(") : EVENT_SELECT)
    .eq("status", "published")
    .gte("end_date", new Date().toISOString().slice(0, 10))
    .order("start_date", { ascending: true });
  if (opts.trekSlug) query = query.eq("trek.slug", opts.trekSlug);
  if (opts.featuredOnly) query = query.eq("is_featured", true);
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) {
    console.error("getUpcomingEvents", error.message);
    return [];
  }
  return (data ?? []) as unknown as TrekEventWithRelations[];
}

export async function getEventById(id: string): Promise<TrekEventWithRelations | null> {
  if (!isSupabaseConfigured) return DEMO_EVENTS.find((e) => e.id === id) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(EVENT_SELECT).eq("id", id).maybeSingle();
  if (error) {
    console.error("getEventById", error.message);
    return null;
  }
  return data as unknown as TrekEventWithRelations | null;
}

/** Whether a customer can register right now, with a reason when not. */
export function registrationState(e: TrekEventWithRelations): { open: boolean; reason?: string } {
  const now = Date.now();
  if (e.status !== "published") return { open: false, reason: "Not accepting registrations" };
  if (!e.registration_open) return { open: false, reason: "Registrations closed" };
  if (e.registration_opens_at && now < Date.parse(e.registration_opens_at))
    return { open: false, reason: "Registrations open soon" };
  if (e.registration_closes_at && now > Date.parse(e.registration_closes_at))
    return { open: false, reason: "Registrations closed" };
  if (Date.parse(`${e.end_date}T23:59:59`) < now) return { open: false, reason: "Trek completed" };
  return { open: true };
}
