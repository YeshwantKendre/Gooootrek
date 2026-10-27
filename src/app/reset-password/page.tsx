import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Set a new password" };

/** Reached from the reset email via /auth/callback, which signs the user in first. */
export default async function ResetPasswordPage() {
  const session = await getSession();
  return (
    <AuthShell title="Set a new password" subtitle="You're almost back on the trail." tagline="Fresh start, same summit." seed="reset-pass">
      {session ? (
        <ResetPasswordForm email={session.email} />
      ) : (
        <div className="rounded-2xl bg-butter-100 p-6 text-center" role="status">
          <p className="font-semibold text-butter-700">This reset link has expired or was already used.</p>
          <p className="mt-1 text-sm text-butter-700">Reset links work once and expire after an hour.</p>
          <Link href="/forgot-password" className="btn-primary mt-4">Send a new link</Link>
        </div>
      )}
    </AuthShell>
  );
}
