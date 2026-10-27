import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Registration, TrekEvent } from "@/lib/types";

const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.profile.role === "customer") return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  const event = ev as TrekEvent | null;
  if (!event) return new Response("Not found", { status: 404 });
  if (session.profile.role !== "owner" && event.organizer_id !== session.userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data } = await supabase.from("registrations").select("*").eq("event_id", id).order("created_at");
  const regs = (data ?? []) as Registration[];
  const fields = event.form_fields ?? [];

  const header = ["Name", "Email", "Phone", "Participants", "Status", "Payment", "Amount due (INR)", "Paid online (INR)", "Registered at", "Notes", ...fields.map((f) => f.label)];
  const lines = [header.map(cell).join(",")];
  for (const r of regs) {
    lines.push(
      [r.full_name, r.email, r.phone, r.participants, r.status, r.payment_status, r.amount_due_inr, r.amount_paid_inr, r.created_at, r.notes, ...fields.map((f) => r.answers?.[f.id])]
        .map(cell)
        .join(","),
    );
  }

  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-registrations.csv"`,
    },
  });
}
