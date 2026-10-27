import Link from "next/link";
import { Compass } from "lucide-react";

export default function TrekNotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <Compass className="h-12 w-12 text-sage-500" />
      <h1 className="mt-4 text-2xl font-extrabold">We couldn&apos;t find that trek</h1>
      <p className="mt-1 text-muted">It may have been renamed or removed from the guide.</p>
      <Link href="/treks" className="btn-primary mt-6">Browse all treks</Link>
    </div>
  );
}
