"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Mountain, Ticket, MailCheck } from "lucide-react";
import { signup, type AuthState } from "@/app/auth/actions";
import SupabaseNotice from "@/components/SupabaseNotice";

const initial: AuthState = {};

export default function SignupForm({ defaultRole, configured }: { defaultRole: "customer" | "organizer"; configured: boolean }) {
  const [state, action, pending] = useActionState(signup, initial);
  const [role, setRole] = useState(defaultRole);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-sage-50 p-6 text-center" role="status">
        <MailCheck className="mx-auto h-10 w-10 text-sage-700" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold text-ink">Check your email</h2>
        <p className="mt-1 text-sm text-muted">{state.message}</p>
        <Link href="/login" className="btn-secondary mt-4">Back to sign in</Link>
      </div>
    );
  }

  const options = [
    { value: "customer", title: "Join treks", hint: "Browse and register for batches", Icon: Ticket },
    { value: "organizer", title: "Organize treks", hint: "List batches and manage registrations", Icon: Mountain },
  ] as const;

  return (
    <div className="space-y-4">
      {!configured && <SupabaseNotice />}
      <form action={action}>
        <fieldset disabled={!configured} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="label">Full name</label>
            <input id="full_name" name="full_name" autoComplete="name" required className="input" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required className="input" />
            <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
          </div>
          <div role="radiogroup" aria-label="I want to">
            <span className="label">I want to</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map(({ value, title, hint, Icon }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition ${
                    role === value ? "border-sage-700 bg-sage-50" : "border-line hover:bg-sage-50/50"
                  }`}
                >
                  <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="mt-1 accent-sage-700" />
                  <span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                      <Icon className="h-4 w-4 text-sage-700" aria-hidden="true" /> {title}
                    </span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          {role === "organizer" && (
            <div>
              <label htmlFor="organization_name" className="label">Organization name</label>
              <input id="organization_name" name="organization_name" required className="input" placeholder="e.g. Himalayan Trails Co." />
            </div>
          )}
          {state.error && (
            <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
            {pending ? "Creating account…" : "Create account"}
          </button>
        </fieldset>
      </form>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-sage-700 underline-offset-2 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
