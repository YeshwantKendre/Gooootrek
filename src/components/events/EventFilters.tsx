import Link from "next/link";
import { Search } from "lucide-react";

export interface EventQuery {
  q?: string;
  city?: string;
  difficulty?: string;
  month?: string;
  maxPrice?: string;
  sort?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function href(query: EventQuery, patch: Partial<EventQuery>) {
  const merged = { ...query, ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/events?${s}` : "/events";
}

export default function EventFilters({ query, cities }: { query: EventQuery; cities: string[] }) {
  const chips = [
    { label: "This Weekend", active: query.month === "weekend", patch: { month: query.month === "weekend" ? undefined : "weekend" } },
    { label: "This Month", active: query.month === "this", patch: { month: query.month === "this" ? undefined : "this" } },
    { label: "Under ₹5,000", active: query.maxPrice === "5000", patch: { maxPrice: query.maxPrice === "5000" ? undefined : "5000" } },
    { label: "Beginner", active: query.difficulty === "easy", patch: { difficulty: query.difficulty === "easy" ? undefined : "easy" } },
    { label: "Himalayan", active: query.q === "himalaya", patch: { q: query.q === "himalaya" ? undefined : "himalaya" } },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Quick filters">
        {chips.map((c) => (
          <Link key={c.label} href={href(query, c.patch)} className={`chip shrink-0 py-1.5 ${c.active ? "chip-active" : ""}`} aria-pressed={c.active}>
            {c.label}
          </Link>
        ))}
      </div>
      <form method="get" action="/events" className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="f_q" className="sr-only">Search</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="f_q" name="q" defaultValue={query.q} placeholder="Search batches or treks" className="input pl-9" />
        </div>
        <Select id="f_city" name="city" label="City" value={query.city} options={cities.map((c) => [c, c])} all="Any city" />
        <Select
          id="f_diff"
          name="difficulty"
          label="Difficulty"
          value={query.difficulty}
          options={[["easy", "Easy"], ["moderate", "Moderate"], ["difficult", "Difficult"], ["challenging", "Challenging"]]}
          all="Any difficulty"
        />
        <Select
          id="f_month"
          name="month"
          label="Month"
          value={query.month}
          options={[["this", "This month"], ["weekend", "This weekend"], ...MONTHS.map((m, i) => [String(i + 1), m] as [string, string])]}
          all="Any month"
        />
        <Select
          id="f_price"
          name="maxPrice"
          label="Max price"
          value={query.maxPrice}
          options={[["3000", "Up to ₹3,000"], ["5000", "Up to ₹5,000"], ["10000", "Up to ₹10,000"], ["20000", "Up to ₹20,000"]]}
          all="Any price"
        />
        <Select id="f_sort" name="sort" label="Sort by" value={query.sort} options={[["date", "Soonest"], ["price", "Price: low to high"]]} all="Default" />
        <button type="submit" className="btn-primary py-2.5">Apply</button>
      </form>
    </div>
  );
}

function Select({
  id, name, label, value, options, all,
}: {
  id: string; name: string; label: string; value?: string; options: [string, string][]; all: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className="input">
        <option value="">{all}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
