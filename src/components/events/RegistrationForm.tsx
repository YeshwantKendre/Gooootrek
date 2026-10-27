"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { registerForEvent, cancelRegistration, type RegisterState } from "@/app/events/[id]/actions";
import SupabaseNotice from "@/components/SupabaseNotice";
import { STATUS_STYLES, capitalize } from "@/lib/format";
import type { FormField, RegistrationStatus } from "@/lib/types";

const initial: RegisterState = {};

interface Props {
  eventId: string;
  configured: boolean;
  signedIn: boolean;
  defaults: { full_name: string; email: string };
  seatsLeft: number;
  formFields: FormField[];
  existing: { status: RegistrationStatus; participants: number } | null;
}

export default function RegistrationForm({ eventId, configured, signedIn, defaults, seatsLeft, formFields, existing }: Props) {
  const [state, action, pending] = useActionState(registerForEvent, initial);

  if (!configured) return <SupabaseNotice />;

  if (!signedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Create a free account or sign in to reserve your spot.</p>
        <Link href={`/login?next=${encodeURIComponent(`/events/${eventId}`)}`} className="btn-primary w-full py-2.5">
          Sign in to register
        </Link>
      </div>
    );
  }

  if (existing && existing.status !== "cancelled") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Your registration</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[existing.status]}`}>
            {capitalize(existing.status)}
          </span>
        </div>
        <p className="text-sm text-muted">
          {existing.participants} participant{existing.participants > 1 ? "s" : ""}.{" "}
          {existing.status === "waitlisted"
              ? "You're on the waitlist."
              : existing.status === "rejected"
                ? "The organizer couldn't accommodate this request."
                : "We'll keep you posted."}
        </p>
        {(existing.status === "pending" || existing.status === "confirmed" || existing.status === "waitlisted") && (
          <form action={cancelRegistration}>
            <input type="hidden" name="event_id" value={eventId} />
            <button type="submit" className="btn-secondary w-full">Cancel registration</button>
          </form>
        )}
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-xl bg-sage-50 p-4 text-sm text-sage-700" role="status">
        <CheckCircle2 className="mb-1 h-6 w-6" aria-hidden="true" />
        <p className="font-semibold">{state.status === "waitlisted" ? "Added to waitlist" : "Registration received"}</p>
        <p className="mt-1">{state.message}</p>
      </div>
    );
  }

  const maxParticipants = Math.max(1, Math.min(10, seatsLeft || 10));

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="event_id" value={eventId} />
      {seatsLeft <= 0 && (
        <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
          This batch is full. You can still register — you&apos;ll be added to the waitlist.
        </p>
      )}
      <div>
        <label htmlFor="reg_full_name" className="label">Full name</label>
        <input id="reg_full_name" name="full_name" defaultValue={defaults.full_name} required autoComplete="name" className="input" />
      </div>
      <div>
        <label htmlFor="reg_email" className="label">Email</label>
        <input id="reg_email" name="email" type="email" defaultValue={defaults.email} required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="reg_phone" className="label">Phone</label>
        <input id="reg_phone" name="phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" className="input" />
      </div>
      <div>
        <label htmlFor="reg_participants" className="label">Participants</label>
        <select id="reg_participants" name="participants" defaultValue="1" className="input">
          {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {formFields.map((f) => (
        <DynamicField key={f.id} field={f} />
      ))}

      {state.error && (
        <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
        {pending ? "Submitting…" : seatsLeft <= 0 ? "Join waitlist" : "Register now"}
      </button>
    </form>
  );
}

function DynamicField({ field: f }: { field: FormField }) {
  const id = `field_${f.id}`;
  const label = (
    <>
      {f.label}
      {!f.required && f.type !== "checkbox" && <span className="font-normal text-muted"> (optional)</span>}
    </>
  );
  if (f.type === "checkbox") {
    return (
      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" name={id} required={f.required} className="mt-0.5 h-4 w-4 accent-sage-700" />
        <span>{f.label}{f.required && <span aria-hidden="true"> *</span>}</span>
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {f.type === "textarea" ? (
        <textarea id={id} name={id} required={f.required} rows={3} placeholder={f.placeholder} className="input" />
      ) : f.type === "select" ? (
        <select id={id} name={id} required={f.required} defaultValue="" className="input">
          <option value="" disabled>Select…</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={id}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
          required={f.required}
          placeholder={f.placeholder}
          className="input"
        />
      )}
    </div>
  );
}
