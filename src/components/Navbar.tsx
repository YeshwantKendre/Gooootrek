import Link from "next/link";
import { CalendarDays, MapPin, Plus, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";

const TABS = [
  { href: "/treks", label: "All Treks" },
  { href: "/events", label: "Upcoming Batches" },
  { href: "/treks?tag=himalayan", label: "Himalayan" },
  { href: "/treks?tag=sahyadri", label: "Sahyadri" },
  { href: "/treks?season=winter", label: "Winter" },
  { href: "/treks?season=monsoon", label: "Monsoon" },
];

const SIDE_LINKS = [
  { href: "/organizers", label: "For Organizers" },
  { href: "/treks#faqs", label: "FAQs" },
  { href: "/about", label: "Open Source" },
];

export default async function Navbar() {
  const session = await getSession();
  const canPost = session && (session.profile.role === "organizer" || session.profile.role === "owner");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Logo />
        <form action="/treks" className="ml-4 hidden flex-1 md:block md:max-w-md">
          <label className="relative block">
            <span className="sr-only">Search treks</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              placeholder="Search treks, states, peaks, organizers"
              className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
            />
          </label>
        </form>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/treks" className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-2 text-xs text-muted shadow-sm">
            <MapPin className="h-3.5 w-3.5" /> All India
          </Link>
          <Link href="/events" className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-2 text-xs text-muted shadow-sm">
            <CalendarDays className="h-3.5 w-3.5" /> Any date
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={canPost ? "/dashboard/events/new" : "/organizers"} className="btn-secondary hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> List a Trek
          </Link>
          {session ? (
            <Link href="/dashboard" className="btn-primary">
              {session.profile.full_name?.split(" ")[0] ?? "Dashboard"}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          )}
          <MobileMenu tabs={TABS} links={SIDE_LINKS} />
        </div>
      </div>
      <nav className="container-page flex h-11 items-center gap-1 overflow-x-auto text-sm">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-muted transition hover:bg-sage-50 hover:text-sage-700">
            {t.label}
          </Link>
        ))}
        <div className="ml-auto hidden items-center gap-1 rounded-full bg-white px-1 py-1 shadow-sm ring-1 ring-line lg:flex">
          {SIDE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-1 text-xs text-muted hover:bg-sage-50 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
