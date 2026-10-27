import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTreks } from "@/lib/treks";
import { EventForm } from "@/components/dashboard/EventForm";
import type { TrekEvent } from "@/lib/types";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(["organizer", "owner"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*, trek:treks(slug)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { trek, ...rest } = data as TrekEvent & { trek: { slug: string } | null };
  if (session.profile.role !== "owner" && rest.organizer_id !== session.userId) notFound();
  const treks = (await getTreks()).map((t) => ({ slug: t.slug, name: t.name }));

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Edit event</h1>
      <EventForm treks={treks} userId={session.userId} event={rest as TrekEvent} defaultTrekSlug={trek?.slug ?? null} />
    </div>
  );
}
