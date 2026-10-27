import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Check, Mail, MapPin, Mountain, Phone, X } from "lucide-react";
import Cover from "@/components/Cover";
import RegistrationForm from "@/components/events/RegistrationForm";
import { getEventById, registrationState } from "@/lib/events";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DIFFICULTY_STYLES, capitalize, formatDateRange, formatINR } from "@/lib/format";
import type { RegistrationStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const e = await getEventById(id);
  if (!e) return { title: "Batch not found" };
  return {
    title: e.title,
    description: e.description.slice(0, 160) || `${e.title} — ${formatDateRange(e.start_date, e.end_date)}`,
    openGraph: e.cover_image_url ? { images: [e.cover_image_url] } : undefined,
  };
}

export default async function EventPage({ params }: Params) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const session = await getSession();
  let existing: { status: RegistrationStatus; participants: number } | null = null;
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("registrations")
      .select("status, participants")
      .eq("event_id", event.id)
      .eq("user_id", session.userId)
      .maybeSingle();
    existing = (data as typeof existing) ?? null;
  }

  const reg = registrationState(event);
  const seatsLeft = Math.max(event.total_seats - event.seats_booked, 0);
  const pct = Math.min(100, Math.round((event.seats_booked / event.total_seats) * 100));
  const orgName = event.organizer?.organization_name || event.organizer?.full_name;
  const itinerary = event.itinerary ?? [];

  const bookCard = (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Per person</p>
          <p className="text-2xl font-extrabold text-sage-700">{formatINR(event.price_inr)}</p>
        </div>
        <p className="text-sm text-muted">{seatsLeft > 0 ? `${seatsLeft} seats left` : "Waitlist only"}</p>
      </div>
      <div className="mt-4">
        {reg.open || existing ? (
          <RegistrationForm
            eventId={event.id}
            configured={isSupabaseConfigured}
            signedIn={!!session}
            defaults={{ full_name: session?.profile.full_name ?? "", email: session?.email ?? "" }}
            seatsLeft={seatsLeft}
            formFields={event.form_fields ?? []}
            existing={existing}
          />
        ) : (
          <p className="rounded-xl bg-butter-100 px-3 py-3 text-sm font-medium text-butter-700" role="status">
            {reg.reason ?? "Registrations closed"}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <div className="relative h-56 w-full overflow-hidden bg-sage-50 sm:h-72 lg:h-96">
        <Cover src={event.cover_image_url} seed={event.trek?.slug ?? event.id} alt={event.title} />
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          <header>
            <div className="flex flex-wrap gap-2">
              {event.difficulty && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${DIFFICULTY_STYLES[event.difficulty]}`}>
                  {capitalize(event.difficulty)}
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${reg.open ? "bg-sage-100 text-sage-700" : "bg-line text-muted"}`}>
                {reg.open ? (seatsLeft > 0 ? "Registrations open" : "Waitlist") : reg.reason}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{event.title}</h1>
            {event.trek && (
              <Link href={`/treks/${event.trek.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sage-700 hover:underline">
                <Mountain className="h-4 w-4" aria-hidden="true" /> {event.trek.name}, {event.trek.state}
              </Link>
            )}
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="card flex items-start gap-3 p-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-sage-700" aria-hidden="true" />
                <div><dt className="text-xs text-muted">Dates</dt><dd className="font-semibold">{formatDateRange(event.start_date, event.end_date)}</dd></div>
              </div>
              <div className="card flex items-start gap-3 p-3">
                <MapPin className="mt-0.5 h-5 w-5 text-sage-700" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted">Meeting point</dt>
                  <dd className="font-semibold">{[event.meeting_point, event.city].filter(Boolean).join(", ") || "Shared after booking"}</dd>
                </div>
              </div>
            </dl>
            {orgName && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
                Organized by <span className="font-semibold text-ink">{orgName}</span>
                {event.organizer?.is_verified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
                  </span>
                )}
              </p>
            )}
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{event.seats_booked} of {event.total_seats} seats booked</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sage-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Seats booked">
                <div className="h-full rounded-full bg-sage-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </header>

          {event.description && (
            <section>
              <h2 className="text-xl font-bold">About this batch</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{event.description}</p>
            </section>
          )}

          {itinerary.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">Itinerary</h2>
              <ol className="mt-4 space-y-4 border-l-2 border-sage-200 pl-5">
                {itinerary.map((d) => (
                  <li key={d.day} className="relative">
                    <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-sage-700 text-xs font-bold text-white">{d.day}</span>
                    <h3 className="font-semibold text-ink">{d.title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{d.details}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(event.inclusions?.length > 0 || event.exclusions?.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-sage-50 p-5">
                <h2 className="font-bold text-sage-900">Included</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {event.inclusions.map((i) => (
                    <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-700" aria-hidden="true" />{i}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-peach-50 p-5">
                <h2 className="font-bold text-peach-700">Not included</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {event.exclusions.map((i) => (
                    <li key={i} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-peach-500" aria-hidden="true" />{i}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {(event.contact_phone || event.contact_email) && (
            <section>
              <h2 className="text-xl font-bold">Contact the organizer</h2>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {event.contact_phone && (
                  <a href={`tel:${event.contact_phone}`} className="btn-secondary"><Phone className="h-4 w-4" aria-hidden="true" /> {event.contact_phone}</a>
                )}
                {event.contact_email && (
                  <a href={`mailto:${event.contact_email}`} className="btn-secondary"><Mail className="h-4 w-4" aria-hidden="true" /> {event.contact_email}</a>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sticky on desktop, stacked below content on mobile (bottom bar jumps to it) */}
        <aside>
          <div id="book" className="card scroll-mt-20 p-5 lg:sticky lg:top-24">{bookCard}</div>
        </aside>
      </div>

      {/* Mobile: booking card inline + sticky bottom bar linking to it */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-lg font-extrabold text-sage-700">{formatINR(event.price_inr)}</p>
          <p className="text-xs text-muted">{seatsLeft > 0 ? `${seatsLeft} seats left` : "Waitlist"}</p>
        </div>
        <a href="#book" className="btn-primary px-6 py-2.5">{reg.open ? "Book now" : "View details"}</a>
      </div>
    </div>
  );
}
