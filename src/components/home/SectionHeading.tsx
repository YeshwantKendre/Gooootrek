import Link from "next/link";

export default function SectionHeading({ title, href, linkLabel = "See all →", dark }: { title: string; href?: string; linkLabel?: string; dark?: boolean }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className={`text-xl font-extrabold sm:text-2xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      {href && (
        <Link href={href} className={`shrink-0 text-sm font-semibold hover:underline ${dark ? "text-sage-300" : "text-sage-700"}`}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
