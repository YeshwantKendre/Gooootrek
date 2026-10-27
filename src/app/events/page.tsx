import type { Metadata } from "next";
import Link from "next/link";
import { Mountain } from "lucide-react";
import EventCard from "@/components/EventCard";
import EventFilters, { type EventQuery } from "@/components/events/EventFilters";
import { getUpcomingEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Upcoming trek batches",
  description: "Browse upcoming organized trek batches across India and register in minutes.",
};

function weekendRange() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun
  const sat = new Date(now);
  sat.setDate(now.getDate() + (day === 0 ? -1 : 6 - day));
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return [iso(sat), iso(sun)] as const;
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<EventQuery> }) {
  const query = await searchParams;
  const all = await getUpcomingEvents();
  const cities = [...new Set(all.map((e) => e.city).filter((c): c is string => !!c))].sort();

  const q = query.q?.trim().toLowerCase();
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : null;
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const [satISO, sunISO] = weekendRange();

  let list = all.filter((e) => {
    if (q) {
      const hay = [e.title, e.trek?.name, e.trek?.state, e.city, e.organizer?.organization_name, e.organizer?.full_name]
        .filter(Boolean).join(" ").toLowerCase();
      const aliases = q === "himalaya" ? ["himalaya", "uttarakhand", "himachal", "sikkim", "ladakh", "kashmir", "arunachal"] : [q];
      if (!aliases.some((a) => hay.includes(a))) return false;
    }
    if (query.city && e.city !== query.city) return false;
    if (query.difficulty && e.difficulty !== query.difficulty) return false;
    if (maxPrice != null && !Number.isNaN(maxPrice) && e.price_inr > maxPrice) return false;
    if (query.month === "this") {
      if (!(e.start_date.slice(0, 7) <= thisMonth && e.end_date.slice(0, 7) >= thisMonth)) return false;
    } else if (query.month === "weekend") {
      if (!(e.start_date <= sunISO && e.end_date >= satISO)) return false;
    } else if (query.month && /^\d+$/.test(query.month)) {
      const m = Number(query.month);
      if (new Date(`${e.start_date}T00:00:00`).getMonth() + 1 !== m) return false;
    }
    return true;
  });

  if (query.sort === "price") list = [...list].sort((a, b) => a.price_inr - b.price_inr);
  else list = [...list].sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div className="container-page py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Upcoming trek batches</h1>
        <p className="mt-1 text-muted">Pick a date, meet your group, and hit the trail.</p>
      </header>
      <EventFilters query={query} cities={cities} />
      <p className="mb-4 mt-6 text-sm text-muted" aria-live="polite">
        {list.length} batch{list.length === 1 ? "" : "es"} found
      </p>
      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3 bg-sage-50 px-6 py-14 text-center">
          <Mountain className="h-10 w-10 text-sage-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-ink">No batches match yet</h2>
          <p className="max-w-md text-sm text-muted">Try clearing a filter — or run treks yourself? List your batch and let trekkers find you.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/events" className="btn-secondary">Clear filters</Link>
            <Link href="/signup?role=organizer" className="btn-primary">List a trek</Link>
          </div>
        </div>
      )}
    </div>
  );
}
