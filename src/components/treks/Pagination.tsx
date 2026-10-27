import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const base = "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition";
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <span className="mr-1 text-sm text-muted">Page</span>
      {page > 1 && (
        <Link href={hrefFor(page - 1)} aria-label="Previous page" className={`${base} bg-white ring-1 ring-line hover:bg-sage-50`}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">…</span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-sage-700 text-white" : "bg-white text-ink ring-1 ring-line hover:bg-sage-50"}`}
          >
            {n}
          </Link>
        ),
      )}
      {page < pages && (
        <Link href={hrefFor(page + 1)} aria-label="Next page" className={`${base} bg-white ring-1 ring-line hover:bg-sage-50`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
