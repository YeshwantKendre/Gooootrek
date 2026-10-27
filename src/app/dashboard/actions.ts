"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth";
import { emails, type EmailEvent } from "@/lib/email";
import { isPaymentsConfigured, refundPayment } from "@/lib/razorpay";
import type { ActionResult } from "@/components/dashboard/ActionForm";
import type { Difficulty, EventStatus, FormField, ItineraryDay, RegistrationStatus, Role } from "@/lib/types";

const REG_STATUSES: RegistrationStatus[] = ["pending", "confirmed", "waitlisted", "cancelled", "rejected"];
const ROLES: Role[] = ["owner", "organizer", "customer"];
const DIFFICULTIES: Difficulty[] = ["easy", "moderate", "difficult", "challenging"];
const FIELD_TYPES = ["text", "textarea", "number", "select", "checkbox", "date"];

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const orNull = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

const EMAIL_REG_FIELDS =
  "id, event_id, full_name, email, participants, status, payment_status, amount_due_inr, amount_paid_inr, event:events(id, title, start_date, end_date, meeting_point, contact_email, organizer_id)";
type EmailReg = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  participants: number;
  status: RegistrationStatus;
  payment_status: string;
  amount_due_inr: number;
  amount_paid_inr: number;
  event: EmailEvent;
};

/* ----------------------------- registrations ----------------------------- */

export async function cancelRegistration(fd: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const id = str(fd, "id");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", session.userId)
    .in("status", ["pending", "confirmed", "waitlisted"])
    .select(EMAIL_REG_FIELDS)
    .maybeSingle<EmailReg>();
  if (error) return { error: error.message };
  if (data) after(() => emails.cancelledForOrganizer(data.event, data));
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function updateRegistration(fd: FormData): Promise<ActionResult> {
  await requireSession(["organizer", "owner"]);
  const id = str(fd, "id");
  const status = str(fd, "status") as RegistrationStatus;
  if (!REG_STATUSES.includes(status)) return { error: "Invalid status" };
  const supabase = await createClient();
  const { data: before } = await supabase.from("registrations").select("status").eq("id", id).maybeSingle();
  const { data, error } = await supabase
    .from("registrations")
    .update({ status, notes: orNull(str(fd, "notes")) })
    .eq("id", id)
    .select(EMAIL_REG_FIELDS)
    .returns<EmailReg[]>();
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Registration not found or not allowed" };
  const reg = data[0];
  if (before && before.status !== reg.status) after(() => emails.statusChanged(reg.event, reg));
  revalidatePath(`/dashboard/events/${reg.event_id}/registrations`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Saved" };
}

/** Full refund of everything paid online; also cancels the registration. */
export async function refundRegistration(fd: FormData): Promise<ActionResult> {
  const session = await requireSession(["organizer", "owner"]);
  if (!isPaymentsConfigured) return { error: "Online payments are not configured." };
  const id = str(fd, "id");
  // RLS limits this read to the event's organizer and the owner.
  const supabase = await createClient();
  const { data: reg } = await supabase.from("registrations").select(EMAIL_REG_FIELDS).eq("id", id).maybeSingle<EmailReg>();
  if (!reg) return { error: "Registration not found" };
  if (session.profile.role !== "owner" && reg.event.organizer_id !== session.userId) return { error: "Not allowed" };
  if (reg.payment_status !== "paid" && reg.amount_paid_inr <= 0) return { error: "Nothing has been paid online." };

  const admin = createAdminClient();
  const { data: payments } = await admin
    .from("payments")
    .select("id, razorpay_payment_id")
    .eq("registration_id", id)
    .eq("status", "paid");
  for (const pay of payments ?? []) {
    if (!pay.razorpay_payment_id) continue;
    try {
      const refund = await refundPayment(pay.razorpay_payment_id);
      await admin.from("payments").update({ status: "refunded", razorpay_refund_id: refund.id }).eq("id", pay.id);
    } catch (err) {
      return { error: err instanceof Error ? `Refund failed: ${err.message}` : "Refund failed" };
    }
  }
  await admin.from("registrations").update({ payment_status: "refunded", status: "cancelled" }).eq("id", id);
  after(() => emails.refundIssued(reg.event, reg));
  revalidatePath(`/dashboard/events/${reg.event_id}/registrations`);
  revalidatePath(`/events/${reg.event_id}`);
  return { ok: true, message: "Refund initiated" };
}

/* -------------------------------- profile -------------------------------- */

export async function updateProfile(fd: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const supabase = await createClient();
  const website = str(fd, "website");
  if (website && !/^https?:\/\//i.test(website)) return { error: "Website must start with http:// or https://" };
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: orNull(str(fd, "full_name")),
      organization_name: orNull(str(fd, "organization_name")),
      bio: orNull(str(fd, "bio")),
      website: orNull(website),
      avatar_url: orNull(str(fd, "avatar_url")),
    })
    .eq("id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved" };
}

export async function becomeOrganizer(): Promise<ActionResult> {
  const session = await requireSession();
  if (session.profile.role !== "customer") return { error: "Your account is already upgraded" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role: "organizer" }).eq("id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/* --------------------------------- events -------------------------------- */

export interface EventInput {
  title: string;
  description: string;
  difficulty: Difficulty | "";
  start_date: string;
  end_date: string;
  meeting_point: string;
  city: string;
  price_inr: number;
  advance_percent: number;
  total_seats: number;
  registration_open: boolean;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  contact_phone: string;
  contact_email: string;
  cover_image_url: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  form_fields: FormField[];
  trek_slug: string | null;
  status: EventStatus | "keep";
}

export async function saveEvent(input: EventInput, id?: string): Promise<{ error?: string; id?: string }> {
  const session = await requireSession(["organizer", "owner"]);
  const supabase = await createClient();

  const title = input.title?.trim();
  if (!title) return { error: "Title is required" };
  if (!input.start_date || !input.end_date) return { error: "Start and end dates are required" };
  if (input.end_date < input.start_date) return { error: "End date must be on or after the start date" };
  if (!Number.isFinite(input.total_seats) || input.total_seats <= 0) return { error: "Total seats must be greater than 0" };
  if (!Number.isFinite(input.price_inr) || input.price_inr < 0) return { error: "Price cannot be negative" };
  if (!Number.isInteger(input.advance_percent) || input.advance_percent < 10 || input.advance_percent > 100)
    return { error: "Advance must be between 10% and 100%" };
  if (input.difficulty && !DIFFICULTIES.includes(input.difficulty)) return { error: "Invalid difficulty" };
  if (input.registration_opens_at && input.registration_closes_at && input.registration_closes_at < input.registration_opens_at) {
    return { error: "Registration close time must be after the open time" };
  }
  for (const f of input.form_fields) {
    if (!f.label.trim()) return { error: "Every registration question needs a label" };
    if (!FIELD_TYPES.includes(f.type)) return { error: `Invalid question type for "${f.label}"` };
    if (f.type === "select" && (!f.options || f.options.length === 0)) return { error: `Add options for "${f.label}"` };
  }

  let trek_id: string | null = null;
  if (input.trek_slug) {
    const { data } = await supabase.from("treks").select("id").eq("slug", input.trek_slug).maybeSingle();
    trek_id = data?.id ?? null;
  }

  const row: Record<string, unknown> = {
    trek_id,
    title,
    description: input.description ?? "",
    difficulty: input.difficulty || null,
    start_date: input.start_date,
    end_date: input.end_date,
    meeting_point: orNull(input.meeting_point),
    city: orNull(input.city),
    price_inr: Math.round(input.price_inr),
    advance_percent: input.advance_percent,
    total_seats: Math.round(input.total_seats),
    registration_open: input.registration_open,
    registration_opens_at: input.registration_opens_at,
    registration_closes_at: input.registration_closes_at,
    contact_phone: orNull(input.contact_phone),
    contact_email: orNull(input.contact_email),
    cover_image_url: orNull(input.cover_image_url),
    inclusions: input.inclusions,
    exclusions: input.exclusions,
    itinerary: input.itinerary.map((d, i) => ({ day: i + 1, title: d.title.trim(), details: d.details.trim() })),
    form_fields: input.form_fields,
  };
  if (input.status !== "keep") row.status = input.status;

  if (id) {
    const q = supabase.from("events").update(row).eq("id", id);
    if (session.profile.role !== "owner") q.eq("organizer_id", session.userId);
    const { data, error } = await q.select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Event not found or you do not have access" };
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert({ ...row, organizer_id: session.userId })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/events");
  revalidatePath("/");
  return { id };
}

type EventIntent = "publish" | "unpublish" | "open" | "close" | "cancel" | "delete" | "feature" | "unfeature";

export async function eventQuickAction(fd: FormData): Promise<ActionResult> {
  const session = await requireSession(["organizer", "owner"]);
  const id = str(fd, "id");
  const intent = str(fd, "intent") as EventIntent;
  const supabase = await createClient();
  const isOwner = session.profile.role === "owner";

  if (intent === "feature" || intent === "unfeature") {
    if (!isOwner) return { error: "Only the owner can feature events" };
  }

  let q;
  switch (intent) {
    case "publish":
      q = supabase.from("events").update({ status: "published" }).eq("id", id);
      break;
    case "unpublish":
      q = supabase.from("events").update({ status: "draft" }).eq("id", id);
      break;
    case "open":
      q = supabase.from("events").update({ registration_open: true }).eq("id", id);
      break;
    case "close":
      q = supabase.from("events").update({ registration_open: false }).eq("id", id);
      break;
    case "cancel":
      q = supabase.from("events").update({ status: "cancelled" }).eq("id", id);
      break;
    case "feature":
      q = supabase.from("events").update({ is_featured: true }).eq("id", id);
      break;
    case "unfeature":
      q = supabase.from("events").update({ is_featured: false }).eq("id", id);
      break;
    case "delete":
      q = supabase.from("events").delete().eq("id", id);
      break;
    default:
      return { error: "Unknown action" };
  }
  if (!isOwner) q = q.eq("organizer_id", session.userId);
  const { data, error } = await q.select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Event not found or you do not have access" };

  revalidatePath("/dashboard", "layout");
  revalidatePath("/events");
  revalidatePath("/");
  return { ok: true };
}

/* --------------------------------- users --------------------------------- */

export async function setUserRole(fd: FormData): Promise<ActionResult> {
  const session = await requireSession(["owner"]);
  const id = str(fd, "id");
  const role = str(fd, "role") as Role;
  if (!ROLES.includes(role)) return { error: "Invalid role" };
  if (id === session.userId && role !== "owner") return { error: "You cannot remove your own owner role" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/users");
  return { ok: true, message: "Role updated" };
}

export async function setUserVerified(fd: FormData): Promise<ActionResult> {
  await requireSession(["owner"]);
  const id = str(fd, "id");
  const verified = str(fd, "verified") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_verified: verified }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/users");
  return { ok: true };
}
