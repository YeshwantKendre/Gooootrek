import Link from "next/link";
import { Clock, Mountain } from "lucide-react";
import Cover from "./Cover";
import { DIFFICULTY_STYLES, capitalize, formatAltitude } from "@/lib/format";
import type { Trek } from "@/lib/types";

/** Poster-style card for an encyclopedia trek (BookMyShow movie-card layout). */
export default function TrekCard({ trek }: { trek: Trek }) {
  return (
    <Link href={`/treks/${trek.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sage-50 shadow-sm ring-1 ring-line transition group-hover:-translate-y-1 group-hover:shadow-md">
        <Cover src={trek.cover_image_url} seed={trek.slug} alt={trek.name} snow={trek.tags.includes("snow")} />
        {trek.is_featured && (
          <span className="absolute right-2 top-2 rounded-full bg-lavender-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lavender-700">
            Featured
          </span>
        )}
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink backdrop-blur">
            <Mountain className="h-3 w-3" /> {formatAltitude(trek.max_altitude_m)}
          </span>
          {trek.duration_days != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink backdrop-blur">
              <Clock className="h-3 w-3" /> {trek.duration_days}d
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${DIFFICULTY_STYLES[trek.difficulty]}`}>
          {capitalize(trek.difficulty)}
        </span>
        <h3 className="mt-1 line-clamp-1 font-semibold text-ink">{trek.name}</h3>
        <p className="line-clamp-1 text-xs text-muted">
          {trek.state}
          {trek.region ? ` · ${trek.region}` : ""}
        </p>
      </div>
    </Link>
  );
}
