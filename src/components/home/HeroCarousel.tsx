"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Cover from "@/components/Cover";

export interface HeroSlide {
  id: string;
  href: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  coverSrc: string | null;
  seed: string;
  snow?: boolean;
  tone: "sage" | "lavender" | "peach" | "sky";
}

const TONES: Record<HeroSlide["tone"], string> = {
  sage: "from-sage-900/80 via-sage-700/40",
  lavender: "from-lavender-700/80 via-lavender-500/35",
  peach: "from-peach-700/75 via-peach-500/35",
  sky: "from-sky-700/80 via-sky-500/35",
};

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), 5500);
    return () => clearInterval(t);
  }, [paused, n]);

  if (n === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured treks and batches"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden py-4">
        <div
          className="flex [--w:88] transition-transform duration-700 ease-out md:[--w:68]"
          style={{ transform: `translateX(calc((100% - var(--w) * 1%) / 2 - var(--w) * 1% * ${index}))` }}
        >
          {slides.map((s, i) => {
            const active = i === index;
            return (
              <div
                key={s.id}
                className="shrink-0 px-1.5 md:px-3"
                style={{ width: "calc(var(--w) * 1%)" }}
                aria-hidden={!active}
              >
                <Link
                  href={s.href}
                  tabIndex={active ? 0 : -1}
                  onClick={(e) => {
                    if (!active) {
                      e.preventDefault();
                      go(i);
                    }
                  }}
                  className={`relative block aspect-[16/10] overflow-hidden rounded-3xl shadow-md ring-1 ring-line transition-all duration-700 sm:aspect-[21/9] ${
                    active ? "scale-100 opacity-100" : "scale-[0.9] opacity-50"
                  }`}
                >
                  <Cover src={s.coverSrc} seed={s.seed} alt={s.title} snow={s.snow} />
                  <div className={`absolute inset-0 bg-gradient-to-r to-transparent ${TONES[s.tone]}`} />
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 p-4 text-white sm:p-8 md:max-w-[75%]">
                    <span className="w-fit rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sage-900">
                      {s.badge}
                    </span>
                    <h2 className="line-clamp-2 text-xl font-extrabold leading-tight drop-shadow sm:text-3xl lg:text-4xl">{s.title}</h2>
                    <p className="line-clamp-1 text-xs font-medium text-white/90 sm:text-sm">{s.subtitle}</p>
                    <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-sage-900 shadow sm:text-sm">
                      {s.cta} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-md ring-1 ring-line transition hover:bg-sage-50 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-md ring-1 ring-line transition hover:bg-sage-50 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-1 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-sage-700" : "w-2 bg-sage-300 hover:bg-sage-500"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
