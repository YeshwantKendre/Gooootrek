"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthState {
  ok?: boolean;
  error?: string;
  message?: string;
}

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? "http"}://${host}`;
}

const NOT_CONFIGURED: AuthState = { error: "Accounts are disabled until Supabase is connected." };

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(safeNext(formData.get("next")));
}

export async function magicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email first." };
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: false },
  });
  if (error) return { error: error.message };
  return { ok: true, message: "Check your email for a sign-in link." };
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "organizer" ? "organizer" : "customer";
  const organization_name = String(formData.get("organization_name") ?? "").trim();
  if (!full_name) return { error: "Please enter your name." };
  if (!email) return { error: "Please enter your email." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (role === "organizer" && !organization_name) return { error: "Please enter your organization name." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role, organization_name: role === "organizer" ? organization_name : null },
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/dashboard");
  return { ok: true, message: `We sent a confirmation link to ${email}. Click it to activate your account.` };
}

export async function signout() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
