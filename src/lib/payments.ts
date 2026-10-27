import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { emails, type EmailEvent, type EmailRegistration } from "@/lib/email";

const EVENT_FIELDS = "id, title, start_date, end_date, meeting_point, contact_email, organizer_id";

type RegistrationWithEvent = EmailRegistration & {
  id: string;
  payment_status: string;
  event: EmailEvent;
};

/**
 * Records a successful Razorpay payment. Idempotent: called by both the
 * checkout callback and the webhook, and only the first call has effect.
 */
export async function markOrderPaid(orderId: string, paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: payment, error: claimError } = await admin
    .from("payments")
    .update({ status: "paid", razorpay_payment_id: paymentId })
    .eq("razorpay_order_id", orderId)
    // "failed" too: Checkout allows a retry on the same order after a failed attempt.
    .in("status", ["created", "failed"])
    .select("registration_id, amount_inr")
    .maybeSingle();
  if (claimError) return { ok: false, error: claimError.message };
  // Already processed (or unknown order): nothing more to do.
  if (!payment) return { ok: true };
  if (!payment.registration_id) return { ok: true };

  const { data: reg } = await admin
    .from("registrations")
    .select(`id, full_name, email, participants, status, payment_status, amount_due_inr, amount_paid_inr, event:events(${EVENT_FIELDS})`)
    .eq("id", payment.registration_id)
    .single<RegistrationWithEvent>();
  if (!reg) return { ok: false, error: "Registration not found" };

  const paid = reg.amount_paid_inr + payment.amount_inr;
  const updated = {
    amount_paid_inr: paid,
    payment_status: paid >= reg.amount_due_inr ? "paid" : "unpaid",
    status: reg.status === "pending" ? "confirmed" : reg.status,
  };
  const { error } = await admin.from("registrations").update(updated).eq("id", reg.id);
  if (error) return { ok: false, error: error.message };

  const after = { ...reg, ...updated };
  await Promise.all([
    emails.paymentReceived(reg.event, after, paymentId),
    emails.paymentReceivedForOrganizer(reg.event, after),
  ]);

  revalidatePath(`/events/${reg.event.id}`);
  revalidatePath("/dashboard/registrations");
  revalidatePath(`/dashboard/events/${reg.event.id}/registrations`);
  return { ok: true };
}

export async function markOrderFailed(orderId: string) {
  await createAdminClient().from("payments").update({ status: "failed" }).eq("razorpay_order_id", orderId).eq("status", "created");
}
