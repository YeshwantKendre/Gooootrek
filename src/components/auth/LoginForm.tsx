"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, magicLink, type AuthState } from "@/app/auth/actions";
import SupabaseNotice from "@/components/SupabaseNotice";

const initial: AuthState = {};

export default function LoginForm({ next, configured, urlError }: { next: string; configured: boolean; urlError?: boolean }) {
  const [state, action, pending] = useActionState(login, initial);
  const [mlState, mlAction, mlPending] = useActionState(magicLink, initial);
  const signupHref = next && next !== "/dashboard" ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <div className="space-y-4">
      {!configured && <SupabaseNotice />}
      {urlError && (
        <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">
          That sign-in link didn&apos;t work. Please try again.
        </p>
      )}
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <fieldset disabled={!configured} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-sage-700 underline-offset-2 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          {state.error && (
            <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </fieldset>
      </form>

      <form action={mlAction}>
        <input type="hidden" name="next" value={next} />
        <MagicEmailBridge />
        <button type="submit" disabled={!configured || mlPending} className="btn-secondary w-full">
          {mlPending ? "Sending…" : "Email me a magic link instead"}
        </button>
        {mlState.error && <p role="alert" className="mt-2 text-sm text-peach-700">{mlState.error}</p>}
        {mlState.ok && <p role="status" className="mt-2 rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-700">{mlState.message}</p>}
      </form>

      <p className="text-center text-sm text-muted">
        New to Gooootrek?{" "}
        <Link href={signupHref} className="font-semibold text-sage-700 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

/** Copies the email typed in the main form into the magic-link form on submit. */
function MagicEmailBridge() {
  return (
    <input
      type="hidden"
      name="email"
      ref={(el) => {
        if (!el) return;
        const form = el.form;
        if (!form) return;
        const sync = () => {
          const main = document.getElementById("email") as HTMLInputElement | null;
          el.value = main?.value ?? "";
        };
        form.addEventListener("submit", sync, { capture: true });
        return () => form.removeEventListener("submit", sync, { capture: true });
      }}
    />
  );
}
