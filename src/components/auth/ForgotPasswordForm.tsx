"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordReset, type AuthState } from "@/app/auth/actions";
import SupabaseNotice from "@/components/SupabaseNotice";

const initial: AuthState = {};

export default function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-sage-50 p-6 text-center" role="status">
        <MailCheck className="mx-auto h-10 w-10 text-sage-700" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold text-ink">Check your email</h2>
        <p className="mt-1 text-sm text-muted">{state.message}</p>
        <p className="mt-1 text-xs text-muted">The link works once and expires after an hour. Check spam if it doesn&apos;t arrive.</p>
        <Link href="/login" className="btn-secondary mt-4">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!configured && <SupabaseNotice />}
      <form action={action}>
        <fieldset disabled={!configured} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" />
          </div>
          {state.error && (
            <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </fieldset>
      </form>
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-sage-700 underline-offset-2 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
