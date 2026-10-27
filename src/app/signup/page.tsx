import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/dashboard");
  return (
    <AuthShell title="Join Gooootrek" subtitle="Create a free account to register for treks or host your own." tagline="Trails are better together." seed="signup-ridge">
      <SignupForm defaultRole={sp.role === "organizer" ? "organizer" : "customer"} configured={isSupabaseConfigured} />
    </AuthShell>
  );
}
