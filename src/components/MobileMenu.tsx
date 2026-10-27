"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

export default function MobileMenu({ tabs, links }: { tabs: L[]; links: L[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-muted hover:bg-sage-50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/30" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-72 bg-cream p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setOpen(false)} className="mb-4 ml-auto block rounded-full p-2 hover:bg-sage-50" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <form action="/treks" className="mb-4">
              <input name="q" placeholder="Search treks" className="input" />
            </form>
            <ul className="space-y-1">
              {[...tabs, ...links, { href: "/dashboard", label: "Dashboard" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-sage-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
