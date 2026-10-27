import Link from "next/link";
import { CalendarX } from "lucide-react";
import { getTreks } from "@/lib/treks";
import { getUpcomingEvents } from "@/lib/events";
import { formatDateRange, formatINR, formatAltitude } from "@/lib/format";
import TrekCard from "@/components/TrekCard";
import EventCard from "@/components/EventCard";
import HeroCarousel, { type HeroSlide } from "@/components/home/HeroCarousel";
import CategoryStack, { type StackPanel } from "@/components/home/CategoryStack";
import TrendingPanel from "@/components/home/TrendingPanel";
import PromoBanner from "@/components/home/PromoBanner";
import SectionHeading from "@/components/home/SectionHeading";
import type { Trek } from "@/lib/types";

export default async function Home() {
  const [treks, events] = await Promise.all([getTreks(), getUpcomingEvents({ limit: 12 })]);

  const featuredTreks = treks.filter((t) => t.is_featured);
  const featuredEvents = events.filter((e) => e.is_featured);

  // Hero slides: featured events mixed with featured treks
  const eventSlides: HeroSlide[] = (featuredEvents.length ? featuredEvents : events).slice(0, 3).map((e) => ({
    id: `e-${e.id}`,
    href: `/events/${e.id}`,
    badge: "Upcoming batch",
    title: e.title,
    subtitle: `${formatDateRange(e.start_date, e.end_date)} · ${formatINR(e.price_inr)}${e.city ? ` · from ${e.city}` : ""}`,
    cta: "Register now",
    coverSrc: e.cover_image_url,
    seed: e.trek?.slug ?? e.id,
    tone: "sage",
  }));
  const tones: HeroSlide["tone"][] = ["lavender", "sky", "peach"];
  const trekSlides: HeroSlide[] = (featuredTreks.length ? featuredTreks : treks).slice(0, 3).map((t, i) => ({
    id: `t-${t.slug}`,
    href: `/treks/${t.slug}`,
    badge: "Featured trek",
    title: t.name,
    subtitle: `${t.state} · ${formatAltitude(t.max_altitude_m)}${t.duration_days ? ` · ${t.duration_days} days` : ""}`,
    cta: "Explore trek",
    coverSrc: t.cover_image_url,
    seed: t.slug,
    snow: t.tags.includes("snow"),
    tone: tones[i % tones.length],
  }));
  const slides: HeroSlide[] = [];
  for (let i = 0; i < Math.max(eventSlides.length, trekSlides.length); i++) {
    if (eventSlides[i]) slides.push(eventSlides[i]);
    if (trekSlides[i]) slides.push(trekSlides[i]);
  }
  if (slides.length === 0)
    slides.push({
      id: "welcome",
      href: "/treks",
      badge: "Welcome",
      title: "Find your next trail",
      subtitle: "India's open platform for treks and trek batches",
      cta: "Browse treks",
      coverSrc: null,
      seed: "welcome",
      tone: "sage",
    });

  // Category stack
  const card = (t: Trek) => <TrekCard key={t.slug} trek={t} />;
  const take = (list: Trek[]) => list.slice(0, 10).map(card);
  const byTag = (tag: string) => treks.filter((t) => t.tags.includes(tag));
  const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const recommended: StackPanel = {
    id: "recommended",
    title: "Recommended Treks for You",
    href: "/treks",
    tint: "bg-sage-100",
    tabs: [
      { label: "Top Rated", cards: take([...treks].sort((a, b) => Number(b.is_featured) - Number(a.is_featured))) },
      { label: "Most Loved", cards: take([...treks].sort((a, b) => (b.max_altitude_m ?? 0) - (a.max_altitude_m ?? 0))) },
      { label: "Latest", cards: take([...treks].reverse()) },
      { label: "Trending Now", cards: take([...treks].sort((a, b) => hash(a.slug) - hash(b.slug))) },
    ],
  };
  const cat = (id: string, title: string, href: string, tint: string, list: Trek[]): StackPanel => ({
    id,
    title,
    href,
    tint,
    tabs: [{ label: title, cards: take(list) }],
  });
  const panels: StackPanel[] = [
    recommended,
    cat("himalayan", "Himalayan Classics", "/treks?tag=himalayan", "bg-lavender-100", byTag("himalayan")),
    cat("sahyadri", "Sahyadri Forts", "/treks?tag=sahyadri", "bg-peach-100", byTag("sahyadri")),
    cat("snow", "Winter Snow Treks", "/treks?season=winter", "bg-sky-100", treks.filter((t) => t.seasons.includes("winter") || t.tags.includes("snow"))),
    cat("monsoon", "Monsoon Greens", "/treks?tag=monsoon", "bg-sage-200", byTag("monsoon")),
    cat("beginner", "Beginner Friendly", "/treks?tag=beginner", "bg-butter-100", byTag("beginner")),
  ];

  // Trending panel
  const trendTreks = (featuredTreks.length ? featuredTreks : treks).slice(0, 6).map((t) => ({ label: t.name, href: `/treks/${t.slug}` }));
  const stateCount = new Map<string, number>();
  treks.forEach((t) => stateCount.set(t.state, (stateCount.get(t.state) ?? 0) + 1));
  const trendStates = [...stateCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s]) => ({ label: s, href: `/treks?state=${encodeURIComponent(s)}` }));
  const trendBatches = events.slice(0, 6).map((e) => ({ label: e.title, href: `/events/${e.id}` }));

  const icons = (featuredTreks.length >= 4 ? featuredTreks : [...treks].sort((a, b) => (b.max_altitude_m ?? 0) - (a.max_altitude_m ?? 0))).slice(0, 10);

  return (
    <div className="pb-16">
      <div className="container-page pt-4">
        <HeroCarousel slides={slides} />
      </div>

      <section className="container-page mt-10">
        <CategoryStack panels={panels} />
      </section>

      <section className="container-page mt-14">
        <TrendingPanel treks={trendTreks} states={trendStates} batches={trendBatches} />
      </section>

      <section className="container-page mt-14">
        <PromoBanner />
      </section>

      <section className="container-page mt-14">
        <SectionHeading title="Upcoming Batches" href="/events" linkLabel="Explore all batches →" />
        {events.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-10 text-center">
            <CalendarX className="h-8 w-8 text-sage-500" />
            <p className="font-semibold">No upcoming batches yet</p>
            <p className="text-sm text-muted">Organizers are lining up new dates. Browse the trek guide in the meantime.</p>
            <Link href="/treks" className="btn-secondary mt-2">
              Browse treks
            </Link>
          </div>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            {events.map((e) => (
              <div key={e.id} className="w-64 shrink-0 sm:w-72">
                <EventCard event={e} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14 bg-night py-12">
        <div className="container-page">
          <SectionHeading title="Himalayan Icons" href="/treks?tag=himalayan" dark />
          <p className="-mt-2 mb-6 text-sm text-white/70">The treks every trekker dreams of.</p>
          {icons.length === 0 ? (
            <p className="text-sm text-white/70">Treks are on their way.</p>
          ) : (
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {icons.map((t) => (
                <div key={t.slug} className="w-40 shrink-0 sm:w-44 [&_h3]:text-white [&_p]:text-white/60">
                  <TrekCard trek={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
