import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Mountain, Route, Tent, Plane, TrainFront, ShieldCheck, Plus, CalendarX, MapPin } from "lucide-react";
import { getTrek, getTreks } from "@/lib/treks";
import { getUpcomingEvents } from "@/lib/events";
import { MONTHS } from "@/data/treks";
import { DIFFICULTY_STYLES, capitalize, formatAltitude } from "@/lib/format";
import Cover from "@/components/Cover";
import TrekCard from "@/components/TrekCard";
import EventCard from "@/components/EventCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTrek(slug);
  if (!t) return { title: "Trek not found" };
  return { title: `${t.name} Trek, ${t.state}`, description: t.summary, openGraph: { title: t.name, description: t.summary, images: t.cover_image_url ? [t.cover_image_url] : undefined } };
}

export default async function TrekPage({ params }: Props) {
  const { slug } = await params;
  const trek = await getTrek(slug);
  if (!trek) notFound();

  const [events, all] = await Promise.all([getUpcomingEvents({ trekSlug: slug }), getTreks()]);
  const similar = all
    .filter((t) => t.slug !== slug)
    .map((t) => ({ t, score: (t.state === trek.state ? 2 : 0) + t.tags.filter((x) => trek.tags.includes(x)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.t);

  const stats = [
    { icon: Mountain, label: "Max altitude", value: formatAltitude(trek.max_altitude_m) },
    { icon: Clock, label: "Duration", value: trek.duration_days ? `${trek.duration_days} days` : "—" },
    { icon: Route, label: "Distance", value: trek.distance_km ? `${trek.distance_km} km` : "—" },
    { icon: Tent, label: "Base camp", value: trek.base_camp ?? "—" },
  ];

  return (
    <div className="pb-16">
      <div className="container-page pt-4">
        <div className="relative h-72 overflow-hidden rounded-3xl shadow-md ring-1 ring-line sm:h-96">
          <Cover src={trek.cover_image_url} seed={trek.slug} alt={trek.name} snow={trek.tags.includes("snow")} />
          <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${DIFFICULTY_STYLES[trek.difficulty]}`}>{capitalize(trek.difficulty)}</span>
            <h1 className="mt-2 text-3xl font-extrabold drop-shadow sm:text-5xl">{trek.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white/90">
              <MapPin className="h-4 w-4" /> {trek.state}
              {trek.region ? ` · ${trek.region}` : ""}
              {trek.mountain_range ? ` · ${trek.mountain_range}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700"><s.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">{s.label}</p>
                <p className="truncate font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-3 p-4">
          <p className="text-xs font-medium text-muted">Best months</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MONTHS.map((m) => {
              const good = trek.best_months.includes(m);
              return (
                <span key={m} className={`rounded-full px-3 py-1 text-xs font-semibold ${good ? "bg-sage-700 text-white" : "bg-sage-50 text-muted"}`}>
                  {m}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-extrabold">About this trek</h2>
              <p className="mt-2 font-medium text-ink/80">{trek.summary}</p>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{trek.description}</p>
              {trek.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {trek.tags.map((t) => (
                    <Link key={t} href={`/treks?tag=${encodeURIComponent(t)}`} className="chip">#{t}</Link>
                  ))}
                </div>
              )}
            </section>

            {trek.highlights.length > 0 && (
              <section>
                <h2 className="text-xl font-extrabold">Highlights</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {trek.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 rounded-xl bg-sage-50 p-3 text-sm">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage-500" /> {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="font-extrabold">How to reach</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex gap-3"><Plane className="h-5 w-5 shrink-0 text-sky-500" /><span><span className="block text-xs text-muted">Nearest airport</span>{trek.nearest_airport ?? "—"}</span></li>
                <li className="flex gap-3"><TrainFront className="h-5 w-5 shrink-0 text-lavender-500" /><span><span className="block text-xs text-muted">Nearest railway</span>{trek.nearest_railway ?? "—"}</span></li>
              </ul>
            </div>
            <div className="card bg-peach-50 p-5">
              <h2 className="flex items-center gap-2 font-extrabold"><ShieldCheck className="h-5 w-5 text-peach-500" /> Permits</h2>
              <p className="mt-2 text-sm text-muted">{trek.permits ?? "No special permits listed. Carry a government photo ID."}</p>
            </div>
          </aside>
        </div>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-xl font-extrabold sm:text-2xl">Upcoming batches for this trek</h2>
            <Link href={`/dashboard/events/new?trek=${trek.slug}`} className="hidden text-sm font-semibold text-sage-700 hover:underline sm:block">Organize this trek →</Link>
          </div>
          {events.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-10 text-center">
              <CalendarX className="h-8 w-8 text-sage-500" />
              <p className="font-semibold">No batches scheduled yet</p>
              <p className="text-sm text-muted">Are you an organizer? Be the first to open registrations for {trek.name}.</p>
              <Link href={`/dashboard/events/new?trek=${trek.slug}`} className="btn-primary mt-2"><Plus className="h-4 w-4" /> Organize this trek</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </section>

        {similar.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-extrabold sm:text-2xl">Similar treks</h2>
              <Link href={`/treks?state=${encodeURIComponent(trek.state)}`} className="text-sm font-semibold text-sage-700 hover:underline">See all →</Link>
            </div>
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {similar.map((t) => (
                <div key={t.slug} className="w-40 shrink-0 sm:w-44"><TrekCard trek={t} /></div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
