import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, SearchX, SlidersHorizontal } from "lucide-react";
import { getTreks } from "@/lib/treks";
import { DIFFICULTIES, MONTHS } from "@/data/treks";
import { capitalize } from "@/lib/format";
import TrekCard from "@/components/TrekCard";
import FAQ from "@/components/treks/FAQ";
import Pagination from "@/components/treks/Pagination";
import AutoSubmit from "@/components/treks/AutoSubmit";
import type { Trek } from "@/lib/types";

export const metadata: Metadata = {
  title: "All Treks in India",
  description: "Browse the Gooootrek encyclopedia of Indian treks: filter by state, difficulty, season and month.",
};

const PAGE_SIZE = 20;
const SEASONS = ["spring", "summer", "monsoon", "autumn", "winter"];
const CHIPS = [
  { label: "All", tag: "" },
  { label: "Trending", tag: "trending" },
  { label: "Beginner", tag: "beginner" },
  { label: "Himalayan", tag: "himalayan" },
  { label: "Sahyadri", tag: "sahyadri" },
  { label: "Snow", tag: "snow" },
  { label: "Monsoon", tag: "monsoon" },
];

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function TreksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const state = one(sp.state);
  const difficulty = one(sp.difficulty);
  const season = one(sp.season);
  const tag = one(sp.tag);
  const month = one(sp.month);
  const sort = one(sp.sort) || "name";
  const pageReq = Math.max(1, parseInt(one(sp.page)) || 1);

  const all = await getTreks();
  const states = Array.from(new Set(all.map((t) => t.state))).sort();

  const ql = q.toLowerCase();
  let list: Trek[] = all.filter((t) => {
    if (ql && ![t.name, t.state, t.region, t.mountain_range, t.base_camp, t.summary, ...t.tags].some((x) => x?.toLowerCase().includes(ql))) return false;
    if (state && t.state !== state) return false;
    if (difficulty && t.difficulty !== difficulty) return false;
    if (season && !t.seasons.includes(season as Trek["seasons"][number])) return false;
    if (month && !t.best_months.includes(month)) return false;
    if (tag === "trending") return t.is_featured;
    if (tag && !t.tags.includes(tag)) return false;
    return true;
  });
  list = [...list].sort((a, b) =>
    sort === "altitude" ? (b.max_altitude_m ?? 0) - (a.max_altitude_m ?? 0) : sort === "duration" ? (a.duration_days ?? 0) - (b.duration_days ?? 0) : a.name.localeCompare(b.name),
  );

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(pageReq, pages);
  const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const params = { q, state, difficulty, season, tag, month, sort: sort === "name" ? "" : sort };
  const href = (over: Partial<Record<string, string>> & { page?: string }) => {
    const merged: Record<string, string> = { ...params, ...over };
    const u = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && u.set(k, v));
    const s = u.toString();
    return `/treks${s ? `?${s}` : ""}`;
  };

  const selectCls = "rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100";
  const first = slice.slice(0, 10);
  const rest = slice.slice(10);
  const grid = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Explore treks</h1>
        <p className="mt-1 text-sm text-muted">{all.length} trails across India: from gentle forest walks to high Himalayan passes.</p>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0 xl:min-w-0">
          {CHIPS.map((c) => (
            <Link key={c.label} href={href({ tag: c.tag, page: "" })} className={`chip shrink-0 !px-4 !py-1.5 !text-sm ${tag === c.tag ? "chip-active" : ""}`}>
              {c.label}
            </Link>
          ))}
        </div>

        <form id="filters" action="/treks" method="get" className="flex flex-wrap items-center gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <span className="hidden items-center gap-1 text-sm font-semibold text-muted sm:inline-flex">
            <SlidersHorizontal className="h-4 w-4" /> Browse by
          </span>
          <select name="state" defaultValue={state} aria-label="Browse by state" className={selectCls}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select name="difficulty" defaultValue={difficulty} aria-label="Difficulty" className={selectCls}>
            <option value="">Difficulty</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <select name="season" defaultValue={season} aria-label="Season" className={selectCls}>
            <option value="">Season</option>
            {SEASONS.map((s) => (
              <option key={s} value={s}>{capitalize(s)}</option>
            ))}
          </select>
          <select name="month" defaultValue={month} aria-label="Best month" className={selectCls}>
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} aria-label="Sort by" className={selectCls}>
            <option value="name">Sort: Name</option>
            <option value="altitude">Sort: Altitude</option>
            <option value="duration">Sort: Duration</option>
          </select>
          <button type="submit" className="btn-primary !py-1.5">Apply</button>
          <AutoSubmit formId="filters" />
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>
          <strong className="text-ink">{list.length}</strong> {list.length === 1 ? "trek" : "treks"}
          {q && <> for “{q}”</>}
        </span>
        {(q || state || difficulty || season || month || tag) && (
          <Link href="/treks" className="font-semibold text-sage-700 hover:underline">Clear filters</Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-2 p-12 text-center">
          <SearchX className="h-10 w-10 text-sage-500" />
          <p className="text-lg font-bold">No treks match your filters</p>
          <p className="text-sm text-muted">Try removing a filter or searching for something broader.</p>
          <Link href="/treks" className="btn-primary mt-3">Show all treks</Link>
        </div>
      ) : (
        <div className="mt-6">
          <div className={grid}>
            {first.map((t) => <TrekCard key={t.slug} trek={t} />)}
          </div>

          <div className="relative my-10 overflow-hidden rounded-3xl bg-night p-6 text-white sm:p-10">
            <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-lavender-300/20 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage-300">
                  <CalendarClock className="h-4 w-4" /> Coming soon
                </p>
                <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">Upcoming batches from open organizers</h2>
                <p className="mt-1 text-sm text-white/70">Found a trek you like? See who is heading out next and grab a seat.</p>
              </div>
              <Link href="/events" className="inline-flex shrink-0 items-center justify-center rounded-full bg-sage-300 px-5 py-2 text-sm font-bold text-sage-900 transition hover:bg-sage-200">
                View batches
              </Link>
            </div>
          </div>

          {rest.length > 0 && <div className={grid}>{rest.map((t) => <TrekCard key={t.slug} trek={t} />)}</div>}
        </div>
      )}

      <Pagination page={page} pages={pages} hrefFor={(p) => href({ page: p > 1 ? String(p) : "" })} />

      <div className="mt-16">
        <FAQ />
      </div>
    </div>
  );
}
