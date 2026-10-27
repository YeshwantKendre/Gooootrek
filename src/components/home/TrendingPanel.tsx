import Link from "next/link";
import { Megaphone, TrendingUp } from "lucide-react";

interface Item {
  label: string;
  href: string;
}

function Column({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-sm text-muted">Nothing yet</li>}
        {items.map((i) => (
          <li key={i.href + i.label}>
            <Link href={i.href} className="line-clamp-1 text-sm font-medium text-ink transition hover:text-sage-700 hover:underline">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TrendingPanel({ treks, states, batches }: { treks: Item[]; states: Item[]; batches: Item[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="card p-6">
        <h3 className="flex items-center gap-2 text-lg font-extrabold">
          <TrendingUp className="h-5 w-5 text-sage-700" /> Trending searches right now
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Column title="Treks" items={treks} />
          <Column title="States" items={states} />
          <Column title="Upcoming batches" items={batches} />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-lavender-100 p-6 shadow-sm ring-1 ring-line">
        <Megaphone className="h-8 w-8 text-lavender-700" />
        <h3 className="mt-3 text-xl font-extrabold text-ink">List Your Trek</h3>
        <p className="mt-1 text-sm text-ink/80">Organizing a trek? Post it on Gooootrek and open registrations your way.</p>
        <Link href="/organizers" className="btn-primary mt-5">
          Start organizing
        </Link>
      </div>
    </div>
  );
}
