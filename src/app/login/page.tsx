import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/dashboard";
  if (await getSession()) redirect(next);
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your treks and registrations." tagline="Your next summit is one batch away." seed="login-trail">
      <LoginForm next={next} configured={isSupabaseConfigured} urlError={sp.error === "auth"} />
    </AuthShell>
  );
}
