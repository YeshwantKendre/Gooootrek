"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/events";
import type { RegistrationStatus } from "@/lib/types";

export interface RegisterState {
  ok?: boolean;
  message?: string;
  error?: string;
  status?: RegistrationStatus;
}

export async function registerForEvent(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const session = await requireSession();
  const eventId = String(formData.get("event_id") ?? "");
  const event = await getEventById(eventId);
  if (!event) return { error: "This trek batch could not be found." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const participants = Number.parseInt(String(formData.get("participants") ?? "1"), 10);

  if (full_name.length < 2) return { error: "Please enter your full name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 8) return { error: "Please enter a valid phone number." };
  if (!Number.isInteger(participants) || participants < 1 || participants > 10)
    return { error: "Participants must be between 1 and 10." };

  const answers: Record<string, string | number | boolean> = {};
  for (const f of event.form_fields ?? []) {
    const raw = formData.get(`field_${f.id}`);
    if (f.type === "checkbox") {
      const checked = raw === "on";
      if (f.required && !checked) return { error: `Please confirm: ${f.label}` };
      answers[f.id] = checked;
      continue;
    }
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (f.required) return { error: `"${f.label}" is required.` };
      continue;
    }
    if (f.type === "number") {
      const n = Number(value);
      if (Number.isNaN(n)) return { error: `"${f.label}" must be a number.` };
      answers[f.id] = n;
    } else if (f.type === "select") {
      if (f.options && !f.options.includes(value)) return { error: `Choose a valid option for "${f.label}".` };
      answers[f.id] = value;
    } else {
      answers[f.id] = value.slice(0, 2000);
    }
  }

  const supabase = await createClient();
  // A previously cancelled registration would block the unique (event, user) insert.
  await supabase
    .from("registrations")
    .delete()
    .eq("event_id", event.id)
    .eq("user_id", session.userId)
    .eq("status", "cancelled");
  const { data, error } = await supabase
    .from("registrations")
    .insert({ event_id: event.id, user_id: session.userId, full_name, email, phone, participants, answers })
    .select("status")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You're already registered for this batch." };
    return { error: error.message || "Something went wrong. Please try again." };
  }

  revalidatePath(`/events/${event.id}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  const status = (data?.status ?? "pending") as RegistrationStatus;
  return {
    ok: true,
    status,
    message:
      status === "waitlisted"
        ? "This batch is full, so you're on the waitlist. The organizer will reach out if a seat opens up."
        : "You're registered! The organizer will confirm your spot soon.",
  };
}

export async function cancelRegistration(formData: FormData) {
  const session = await requireSession();
  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) return;
  const supabase = await createClient();
  await supabase
    .from("registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", session.userId);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
}
