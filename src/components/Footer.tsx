import Link from "next/link";
import { Headset, Mail, Ticket } from "lucide-react";
import Logo from "./Logo";

const ACTIONS = [
  { href: "/about#contact", label: "Trekker Support", icon: Headset },
  { href: "/dashboard", label: "My Registrations", icon: Ticket },
  { href: "/about#newsletter", label: "Subscribe to Updates", icon: Mail },
];

const COLUMNS = [
  {
    title: "Help",
    links: [
      { href: "/about", label: "About Gooootrek" },
      { href: "/about#contact", label: "Contact Us" },
      { href: "/treks#faqs", label: "FAQs" },
      { href: "/about#safety", label: "Trek Safety" },
      { href: "/about#terms", label: "Terms & Conditions" },
      { href: "/about#privacy", label: "Privacy Policy" },
    ],
  },
  {
    title: "Regions",
    links: [
      { href: "/treks?state=Uttarakhand", label: "Uttarakhand" },
      { href: "/treks?state=Himachal+Pradesh", label: "Himachal Pradesh" },
      { href: "/treks?state=Jammu+and+Kashmir", label: "Jammu & Kashmir" },
      { href: "/treks?state=Sikkim", label: "Sikkim" },
      { href: "/treks?state=Maharashtra", label: "Maharashtra" },
      { href: "/treks?state=Karnataka", label: "Karnataka" },
    ],
  },
  {
    title: "Gooootrek",
    links: [
      { href: "/events", label: "Upcoming Batches" },
      { href: "/organizers", label: "List Your Trek" },
      { href: "/signup?role=organizer", label: "Become an Organizer" },
      { href: "/about", label: "Open Source" },
    ],
  },
  {
    title: "Popular Treks",
    links: [
      { href: "/treks/kedarkantha", label: "Kedarkantha" },
      { href: "/treks/hampta-pass", label: "Hampta Pass" },
      { href: "/treks/valley-of-flowers", label: "Valley of Flowers" },
      { href: "/treks/kashmir-great-lakes", label: "Kashmir Great Lakes" },
      { href: "/treks/goechala", label: "Goechala" },
      { href: "/treks/rajmachi", label: "Rajmachi Fort" },
    ],
  },
];

const SOCIAL = [
  { label: "Instagram", path: "M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5.5-1.5a1 1 0 100 2 1 1 0 000-2z" },
  { label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15V9l5.2 3L10 15z" },
  { label: "X", path: "M4 4l7.2 9.6L4.3 20H6l6-5.6 4.2 5.6H20l-7.6-10.1L18.8 4H17l-5.4 5-3.8-5H4z" },
  { label: "GitHub", path: "M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 011-2.7 3.6 3.6 0 01.1-2.7s.8-.3 2.8 1a9.6 9.6 0 015 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 011 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0012 2z" },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-night text-white/80">
      <div className="container-page py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-3 rounded-2xl bg-night-soft px-6 py-7 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Icon className="h-9 w-9 stroke-[1.25] text-sage-300" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">{col.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/70 transition hover:text-sage-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/20" />
          <Logo light />
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <div className="mt-6 flex justify-center gap-3">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href="#"
              aria-label={s.label}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-sage-700 transition hover:bg-sage-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d={s.path} />
              </svg>
            </a>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-white/50">
          © {new Date().getFullYear()} Gooootrek — an open, community-run platform for treks across India. Trek information is
          compiled from public sources for reference; always confirm conditions, permits and safety with your organizer
          before you go. Organizers are responsible for the batches they list.
        </p>
      </div>
    </footer>
  );
}
