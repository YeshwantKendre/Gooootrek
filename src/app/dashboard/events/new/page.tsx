import { requireSession } from "@/lib/auth";
import { getTreks } from "@/lib/treks";
import { EventForm } from "@/components/dashboard/EventForm";

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ trek?: string }> }) {
  const session = await requireSession(["organizer", "owner"]);
  const { trek } = await searchParams;
  const treks = (await getTreks()).map((t) => ({ slug: t.slug, name: t.name }));
  const prefill = trek && treks.some((t) => t.slug === trek) ? trek : null;

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Create an event</h1>
      <EventForm treks={treks} userId={session.userId} defaultTrekSlug={prefill} />
    </div>
  );
}
