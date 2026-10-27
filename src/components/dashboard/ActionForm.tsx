"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export interface ActionResult {
  error?: string;
  ok?: boolean;
  message?: string;
}

/** Form wrapper for server actions: shows pending/error/success inline and optionally confirms first. */
export function ActionForm({
  action,
  children,
  className = "",
  confirm,
  inlineError = true,
}: {
  action: (formData: FormData) => Promise<ActionResult | void>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  inlineError?: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(async (_prev, fd) => {
    const res = await action(fd);
    return res ?? { ok: true };
  }, {});

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {inlineError && state.error && (
        <p role="alert" className="mt-2 rounded-lg bg-peach-50 px-3 py-2 text-xs text-peach-700">
          {state.error}
        </p>
      )}
      {inlineError && !state.error && state.message && (
        <p role="status" className="mt-2 rounded-lg bg-sage-50 px-3 py-2 text-xs text-sage-700">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
