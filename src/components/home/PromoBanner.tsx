import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-night px-6 py-10 text-white sm:px-12 sm:py-14">
      <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-lavender-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-sage-300/20 blur-2xl" />
      <svg aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-full w-2/3 text-night-soft" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0 120 L70 50 L120 85 L200 15 L270 80 L330 40 L400 100 L400 120 Z" fill="currentColor" />
      </svg>
      <div className="relative max-w-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-sage-300">Open platform</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          Every trail in India. <span className="text-peach-300">One open platform.</span>
        </h2>
        <p className="mt-3 text-sm text-white/75 sm:text-base">Discover treks, compare batches from independent organizers, and register in minutes.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/treks" className="inline-flex items-center gap-2 rounded-full bg-sage-300 px-5 py-2 text-sm font-bold text-sage-900 transition hover:bg-sage-200">
            Browse treks <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/organizers" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            Organize a batch
          </Link>
        </div>
      </div>
    </div>
  );
}
