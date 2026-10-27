import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, Role } from "@/lib/types";

export interface Session {
  userId: string;
  email: string;
  profile: Profile;
}

/** Current user + profile, or null when signed out / Supabase not configured. */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;
  return { userId: user.id, email: user.email ?? "", profile: profile as Profile };
});

/** Use in server components/actions that need a signed-in user, optionally with a role. */
export async function requireSession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.profile.role)) redirect("/dashboard");
  return session;
}
