"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/auth/actions";

const initial: AuthState = {};

export default function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updatePassword, initial);
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">
        Choose a new password for <span className="font-semibold text-ink">{email}</span>.
      </p>
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required className="input" />
        <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={6} required className="input" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
