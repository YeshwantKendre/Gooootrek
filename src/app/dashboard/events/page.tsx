import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange } from "@/lib/format";
import { EventActions } from "@/components/dashboard/EventActions";
import { EventStatusPill } from "@/components/dashboard/Pills";
import type { TrekEvent } from "@/lib/types";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const session = await requireSession(["organizer", "owner"]);
  const { scope } = await searchParams;
  const isOwner = session.profile.role === "owner";
  const all = isOwner && scope === "all";
  const supabase = await createClient();

  let q = supabase.from("events").select("*").order("start_date", { ascending: false });
  if (!all) q = q.eq("organizer_id", session.userId);
  const { data } = await q;
  const events = (data ?? []) as TrekEvent[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{all ? "All events" : "My events"}</h1>
          <p className="mt-1 text-muted">{events.length} {events.length === 1 ? "event" : "events"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <Link href={all ? "/dashboard/events" : "/dashboard/events?scope=all"} className="btn-secondary">
              {all ? "Show only mine" : "Show all events"}
            </Link>
          )}
          <Link href="/dashboard/events/new" className="btn-primary">New event</Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-semibold">No events yet</p>
          <p className="mt-1 text-sm text-muted">Create your first trek batch and start taking registrations.</p>
          <Link href="/dashboard/events/new" className="btn-primary mt-4">Create an event</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {events.map((e) => (
            <li key={e.id} className="card p-4 transition hover:bg-sage-50/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{e.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatDateRange(e.start_date, e.end_date)} · {e.seats_booked}/{e.total_seats} seats
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EventStatusPill status={e.status} />
                  {!e.registration_open && (
                    <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">Registrations closed</span>
                  )}
                  {e.is_featured && (
                    <span className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-semibold text-lavender-700">Featured</span>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <EventActions event={e} isOwner={isOwner} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
