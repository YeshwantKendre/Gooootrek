import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-lavender-100 text-lavender-700"><Compass className="h-10 w-10" /></span>
      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Looks like you&apos;ve wandered off-trail</h1>
      <p className="mt-2 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back to a marked path.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Back home</Link>
        <Link href="/treks" className="btn-secondary">Browse treks</Link>
      </div>
    </div>
  );
}
