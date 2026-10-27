import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateRange } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/dashboard/ActionForm";
import { updateRegistration } from "../../../actions";
import type { Registration, RegistrationStatus, TrekEvent } from "@/lib/types";

const STATUSES: RegistrationStatus[] = ["pending", "confirmed", "waitlisted", "rejected", "cancelled"];

export default async function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(["organizer", "owner"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  const event = ev as TrekEvent | null;
  if (!event) notFound();
  if (session.profile.role !== "owner" && event.organizer_id !== session.userId) notFound();

  const { data } = await supabase.from("registrations").select("*").eq("event_id", id).order("created_at");
  const regs = (data ?? []) as Registration[];
  const count = (s: RegistrationStatus) => regs.filter((r) => r.status === s).length;
  const fields = event.form_fields ?? [];

  const answer = (r: Registration, fid: string) => {
    const v = r.answers?.[fid];
    if (v === undefined || v === null || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return String(v);
  };

  return (
    <div>
      <Link href="/dashboard/events" className="text-sm text-muted hover:text-ink">← My events</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="mt-1 text-muted">{formatDateRange(event.start_date, event.end_date)} · {event.seats_booked}/{event.total_seats} seats booked</p>
        </div>
        <a href={`/dashboard/events/${id}/registrations/export`} className="btn-secondary">Export CSV</a>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-paper px-3 py-1 font-medium shadow-sm">Total {regs.length}</span>
        {STATUSES.map((s) => (
          <span key={s} className="rounded-full bg-paper px-3 py-1 shadow-sm">{count(s)} {s}</span>
        ))}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">People</th>
              {fields.map((f) => <th key={f.id} className="px-3 py-3">{f.label}</th>)}
              <th className="px-3 py-3">Registered</th>
              <th className="px-3 py-3">Status &amp; notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {regs.map((r) => (
              <tr key={r.id} className="align-top transition hover:bg-sage-50/60">
                <td className="px-3 py-3 font-medium">{r.full_name}</td>
                <td className="px-3 py-3 text-muted">
                  <div>{r.email}</div>
                  <div>{r.phone}</div>
                </td>
                <td className="px-3 py-3">{r.participants}</td>
                {fields.map((f) => <td key={f.id} className="px-3 py-3 text-muted">{answer(r, f.id)}</td>)}
                <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(r.created_at)}</td>
                <td className="px-3 py-3">
                  <ActionForm action={updateRegistration} className="flex min-w-[220px] flex-col gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} aria-label={`Status for ${r.full_name}`} className="input py-1">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input name="notes" defaultValue={r.notes ?? ""} placeholder="Organizer notes" aria-label={`Notes for ${r.full_name}`} className="input py-1" />
                    <SubmitButton className="chip w-fit" pendingLabel="Saving…">Save</SubmitButton>
                  </ActionForm>
                </td>
              </tr>
            ))}
            {regs.length === 0 && (
              <tr><td colSpan={5 + fields.length} className="px-4 py-8 text-center text-muted">No registrations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
