import Link from "next/link";
import { ActionForm, SubmitButton } from "./ActionForm";
import { eventQuickAction } from "@/app/dashboard/actions";
import type { TrekEvent } from "@/lib/types";

function Quick({
  id,
  intent,
  label,
  confirm,
  tone = "default",
}: {
  id: string;
  intent: string;
  label: string;
  confirm?: string;
  tone?: "default" | "danger";
}) {
  return (
    <ActionForm action={eventQuickAction} confirm={confirm} className="inline-block" inlineError={false}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <SubmitButton
        className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
          tone === "danger"
            ? "border-peach-300 text-peach-700 hover:bg-peach-50"
            : "border-line text-ink hover:bg-sage-50"
        }`}
      >
        {label}
      </SubmitButton>
    </ActionForm>
  );
}

const link = "rounded-full border border-line px-3 py-1 text-xs font-medium text-ink transition hover:bg-sage-50";

export function EventActions({ event, isOwner, moderation = false }: { event: TrekEvent; isOwner: boolean; moderation?: boolean }) {
  const live = event.status === "draft" || event.status === "published";
  return (
    <div className="flex flex-wrap gap-1.5">
      {!moderation && (
        <>
          <Link href={`/dashboard/events/${event.id}/edit`} className={link}>
            Edit
          </Link>
          <Link href={`/dashboard/events/${event.id}/registrations`} className={link}>
            Registrations
          </Link>
        </>
      )}
      {event.status === "draft" && <Quick id={event.id} intent="publish" label="Publish" />}
      {event.status === "published" && <Quick id={event.id} intent="unpublish" label="Unpublish" confirm="Move this event back to draft? It will disappear from the public listing." />}
      {live && !moderation &&
        (event.registration_open ? (
          <Quick id={event.id} intent="close" label="Close registrations" />
        ) : (
          <Quick id={event.id} intent="open" label="Open registrations" />
        ))}
      {isOwner && (event.is_featured ? (
        <Quick id={event.id} intent="unfeature" label="Unfeature" />
      ) : (
        <Quick id={event.id} intent="feature" label="Feature" />
      ))}
      {live && <Quick id={event.id} intent="cancel" label="Cancel event" tone="danger" confirm="Cancel this event? Registrants will see it as cancelled." />}
      {!moderation && (
        <Quick id={event.id} intent="delete" label="Delete" tone="danger" confirm="Delete this event and all its registrations permanently?" />
      )}
    </div>
  );
}
