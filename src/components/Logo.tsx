import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-1 text-xl font-extrabold tracking-tight" aria-label="Gooootrek home">
      <span className={light ? "text-white" : "text-ink"}>gooo</span>
      <span className="rounded-md bg-sage-300 px-1.5 py-0.5 text-sage-900 -rotate-3">otrek</span>
    </Link>
  );
}
