import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange } from "@/lib/format";
import { EventActions } from "@/components/dashboard/EventActions";
import { EventStatusPill } from "@/components/dashboard/Pills";
import type { TrekEvent } from "@/lib/types";

type Row = TrekEvent & { organizer: { full_name: string | null; organization_name: string | null } | null };

export default async function ModerationPage() {
  await requireSession(["owner"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, organizer:profiles!events_organizer_id_fkey(full_name, organization_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  const events = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Moderation</h1>
      <p className="mt-1 text-muted">Feature standout events, or pull any event off the public listing.</p>
      <ul className="mt-6 space-y-3">
        {events.map((e) => (
          <li key={e.id} className="card p-4 transition hover:bg-sage-50/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{e.title}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {e.organizer?.organization_name || e.organizer?.full_name || "Unknown organizer"} · {formatDateRange(e.start_date, e.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EventStatusPill status={e.status} />
                {e.is_featured && (
                  <span className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-semibold text-lavender-700">Featured</span>
                )}
              </div>
            </div>
            <div className="mt-3"><EventActions event={e} isOwner moderation /></div>
          </li>
        ))}
        {events.length === 0 && <li className="card p-8 text-center text-muted">No events to moderate yet.</li>}
      </ul>
    </div>
  );
}
