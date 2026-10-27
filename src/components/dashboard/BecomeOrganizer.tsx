"use client";

import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton, type ActionResult } from "./ActionForm";

export function BecomeOrganizer({ action }: { action: () => Promise<ActionResult> }) {
  const router = useRouter();
  return (
    <ActionForm
      action={async () => {
        const res = await action();
        if (res.ok) router.refresh();
        return res;
      }}
    >
      <SubmitButton pendingLabel="Upgrading…">Become an organizer</SubmitButton>
    </ActionForm>
  );
}
