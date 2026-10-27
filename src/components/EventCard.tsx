import Link from "next/link";
import { BadgeCheck, CalendarDays, Users } from "lucide-react";
import Cover from "./Cover";
import { formatDateRange, formatINR } from "@/lib/format";
import { registrationState } from "@/lib/events";
import type { TrekEventWithRelations } from "@/lib/types";

/** Card for an organized trek batch. */
export default function EventCard({ event }: { event: TrekEventWithRelations }) {
  const seatsLeft = Math.max(event.total_seats - event.seats_booked, 0);
  const reg = registrationState(event);
  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sage-50 shadow-sm ring-1 ring-line transition group-hover:-translate-y-1 group-hover:shadow-md">
        <Cover src={event.cover_image_url} seed={event.trek?.slug ?? event.id} alt={event.title} />
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            reg.open ? "bg-sage-100 text-sage-700" : "bg-white/90 text-muted"
          }`}
        >
          {reg.open ? (seatsLeft > 0 ? "Registrations open" : "Waitlist") : reg.reason}
        </span>
        {event.is_featured && (
          <span className="absolute right-2 top-2 rounded-full bg-peach-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-peach-700">
            Featured
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 font-semibold text-ink">{event.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(event.start_date, event.end_date)}
          {event.city ? ` · from ${event.city}` : ""}
        </p>
        <div className="mt-1.5 flex items-center justify-between text-sm">
          <span className="font-bold text-sage-700">{formatINR(event.price_inr)}</span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Users className="h-3.5 w-3.5" /> {seatsLeft} seats left
          </span>
        </div>
        {event.organizer && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            by {event.organizer.organization_name || event.organizer.full_name}
            {event.organizer.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Verified" />}
          </p>
        )}
      </div>
    </Link>
  );
}
