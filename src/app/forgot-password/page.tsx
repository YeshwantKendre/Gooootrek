import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to set a new one."
      tagline="Lost the trail? We'll get you back on it."
      seed="forgot-pass"
    >
      <ForgotPasswordForm configured={isSupabaseConfigured} />
    </AuthShell>
  );
}
