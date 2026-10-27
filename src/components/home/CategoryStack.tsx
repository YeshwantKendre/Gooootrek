"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StackPanel {
  id: string;
  title: string;
  href: string;
  tint: string; // tailwind bg classes
  tabs: { label: string; cards: ReactNode[] }[];
}

export default function CategoryStack({ panels }: { panels: StackPanel[] }) {
  const [active, setActive] = useState(panels[0]?.id);
  const [tabIdx, setTabIdx] = useState<Record<string, number>>({});
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  const current = panels.find((p) => p.id === active) ?? panels[0];
  if (!current) return null;
  const t = tabIdx[current.id] ?? 0;
  const tab = current.tabs[t] ?? current.tabs[0];

  const body = (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold text-ink sm:text-2xl">{current.title}</h3>
        <Link href={current.href} className="text-sm font-semibold text-sage-700 hover:underline">
          See All →
        </Link>
      </div>
      {current.tabs.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {current.tabs.map((x, i) => (
            <button
              key={x.label}
              type="button"
              onClick={() => setTabIdx((s) => ({ ...s, [current.id]: i }))}
              className={`chip ${i === t ? "chip-active" : ""}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative mt-4">
        <div ref={scroller} className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none]">
          {tab.cards.length === 0 ? (
            <p className="rounded-xl bg-white/70 p-6 text-sm text-muted">No treks here yet — check back soon.</p>
          ) : (
            tab.cards.map((c, i) => (
              <div key={i} className="w-36 shrink-0 sm:w-40 lg:w-44">
                {c}
              </div>
            ))
          )}
        </div>
        <div className="mt-2 hidden justify-end gap-2 md:flex">
          <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-line hover:bg-sage-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-line hover:bg-sage-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* mobile: category chips + single scrolling panel */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:hidden">
        {panels.map((p) => (
          <button key={p.id} type="button" onClick={() => setActive(p.id)} className={`chip shrink-0 ${p.id === current.id ? "chip-active" : ""}`}>
            {p.title.replace("Recommended Treks for You", "For You")}
          </button>
        ))}
      </div>
      <div className={`rounded-3xl p-4 md:hidden ${current.tint}`}>{body}</div>

      {/* desktop: overlapping stack */}
      <div className="hidden items-stretch md:flex">
        {panels.map((p, i) =>
          p.id === current.id ? (
            <div key={p.id} className={`relative z-10 flex min-w-0 flex-1 rounded-3xl p-6 shadow-md ring-1 ring-line ${p.tint} ${i > 0 ? "-ml-6" : ""}`}>
              {body}
            </div>
          ) : (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              aria-label={`Show ${p.title}`}
              className={`relative flex w-20 shrink-0 items-center justify-center rounded-3xl shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-md ${p.tint} ${i > 0 ? "-ml-6 pl-6" : ""}`}
              style={{ zIndex: 5 - Math.abs(i - panels.findIndex((x) => x.id === current.id)) }}
            >
              <span className="whitespace-nowrap text-sm font-bold text-ink [writing-mode:vertical-rl] rotate-180">{p.title}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
