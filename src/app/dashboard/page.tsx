import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { capitalize } from "@/lib/format";

function Tile({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`rounded-2xl p-5 ${tone}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

export default async function DashboardOverview() {
  const session = await requireSession();
  const { role } = session.profile;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const tiles: { label: string; value: string | number; tone: string }[] = [];

  if (role === "customer") {
    const { data } = await supabase
      .from("registrations")
      .select("status, event:events(end_date, status)")
      .eq("user_id", session.userId);
    const rows = (data ?? []) as unknown as { status: string; event: { end_date: string; status: string } | null }[];
    const upcoming = rows.filter(
      (r) => ["pending", "confirmed", "waitlisted"].includes(r.status) && r.event && r.event.end_date >= today && r.event.status !== "cancelled",
    ).length;
    tiles.push(
      { label: "Upcoming treks", value: upcoming, tone: "bg-sage-100 text-sage-900" },
      { label: "Total registrations", value: rows.length, tone: "bg-sky-100 text-sky-700" },
    );
  } else if (role === "organizer") {
    const { data: events } = await supabase
      .from("events")
      .select("id, seats_booked, total_seats")
      .eq("organizer_id", session.userId);
    const evs = events ?? [];
    let regs = 0;
    if (evs.length) {
      const { count } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .in("event_id", evs.map((e) => e.id));
      regs = count ?? 0;
    }
    const booked = evs.reduce((s, e) => s + e.seats_booked, 0);
    const total = evs.reduce((s, e) => s + e.total_seats, 0);
    tiles.push(
      { label: "My events", value: evs.length, tone: "bg-sky-100 text-sky-700" },
      { label: "Total registrations", value: regs, tone: "bg-sage-100 text-sage-900" },
      { label: "Seats filled", value: total ? `${booked} / ${total}` : "0", tone: "bg-lavender-100 text-lavender-700" },
    );
  } else {
    const [{ data: profiles }, { data: events }, { count: regCount }] = await Promise.all([
      supabase.from("profiles").select("role"),
      supabase.from("events").select("status"),
      supabase.from("registrations").select("id", { count: "exact", head: true }),
    ]);
    const tones: Record<string, string> = {
      owner: "bg-lavender-100 text-lavender-700",
      organizer: "bg-sky-100 text-sky-700",
      customer: "bg-sage-100 text-sage-900",
    };
    for (const r of ["customer", "organizer", "owner"]) {
      tiles.push({ label: `${capitalize(r)}s`, value: (profiles ?? []).filter((p) => p.role === r).length, tone: tones[r] });
    }
    for (const s of ["draft", "published", "cancelled", "completed"]) {
      tiles.push({ label: `${capitalize(s)} events`, value: (events ?? []).filter((e) => e.status === s).length, tone: "bg-peach-50 text-peach-700" });
    }
    tiles.push({ label: "Registrations", value: regCount ?? 0, tone: "bg-butter-100 text-butter-700" });
  }

  const first = (session.profile.full_name || session.email).split(/[\s@]/)[0];

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Hello, {first} 👋</h1>
      <p className="mt-1 text-muted">Here is what is happening on your {role} dashboard.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/registrations" className="btn-secondary">My treks</Link>
        {role !== "customer" && <Link href="/dashboard/events/new" className="btn-primary">Create an event</Link>}
        {role === "customer" && <Link href="/dashboard/profile" className="btn-primary">Become an organizer</Link>}
        <Link href="/treks" className="btn-ghost">Browse treks</Link>
      </div>
    </div>
  );
}
