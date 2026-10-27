import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/dashboard/ActionForm";
import { EventStatusPill, RegStatusPill } from "@/components/dashboard/Pills";
import { cancelRegistration } from "../actions";
import type { EventStatus, Registration } from "@/lib/types";

type Row = Registration & {
  event: { id: string; title: string; start_date: string; end_date: string; status: EventStatus; city: string | null } | null;
};

export default async function MyTreksPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("*, event:events(id, title, start_date, end_date, status, city)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="text-2xl font-bold">My Treks</h1>
      <p className="mt-1 text-muted">Everything you have registered for.</p>
      {rows.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-semibold">No registrations yet</p>
          <p className="mt-1 text-sm text-muted">Find a batch you like and register in a minute.</p>
          <Link href="/events" className="btn-primary mt-4">Browse upcoming treks</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {r.event ? (
                  <Link href={`/events/${r.event.id}`} className="font-semibold hover:text-sage-700">{r.event.title}</Link>
                ) : (
                  <span className="font-semibold">Event unavailable</span>
                )}
                {r.event && (
                  <p className="mt-0.5 text-sm text-muted">
                    {formatDateRange(r.event.start_date, r.event.end_date)}
                    {r.event.city ? ` · ${r.event.city}` : ""} · {r.participants} {r.participants === 1 ? "person" : "people"}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <RegStatusPill status={r.status} />
                  {r.event && r.event.status !== "published" && <EventStatusPill status={r.event.status} />}
                </div>
              </div>
              {["pending", "confirmed", "waitlisted"].includes(r.status) && (
                <ActionForm action={cancelRegistration} confirm="Cancel this registration?" className="shrink-0">
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton className="btn-secondary" pendingLabel="Cancelling…">Cancel registration</SubmitButton>
                </ActionForm>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
