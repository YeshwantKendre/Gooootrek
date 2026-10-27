"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder, isPaymentsConfigured, RAZORPAY_KEY_ID, verifyCheckoutSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/payments";

export interface CheckoutOrder {
  orderId: string;
  amountPaise: number;
  keyId: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

/** Creates a Razorpay order for what the signed-in user still owes on a registration. */
export async function createPaymentOrder(registrationId: string): Promise<{ order?: CheckoutOrder; error?: string }> {
  if (!isPaymentsConfigured) return { error: "Online payments aren't enabled yet. The organizer will share payment details." };
  const session = await requireSession();
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("registrations")
    .select("id, user_id, full_name, email, phone, status, payment_status, amount_due_inr, amount_paid_inr, event:events(title)")
    .eq("id", registrationId)
    .maybeSingle<{
      id: string;
      user_id: string;
      full_name: string;
      email: string;
      phone: string;
      status: string;
      payment_status: string;
      amount_due_inr: number;
      amount_paid_inr: number;
      event: { title: string } | null;
    }>();

  if (!reg || reg.user_id !== session.userId) return { error: "Registration not found." };
  if (reg.status !== "pending" && reg.status !== "confirmed")
    return { error: "Payment is only needed once your spot is reserved." };
  const owes = reg.amount_due_inr - reg.amount_paid_inr;
  if (reg.payment_status !== "unpaid" || owes <= 0) return { error: "Nothing left to pay for this booking." };

  try {
    const order = await createOrder(owes, reg.id, { registration_id: reg.id });
    const { error } = await createAdminClient().from("payments").insert({
      registration_id: reg.id,
      user_id: session.userId,
      razorpay_order_id: order.id,
      amount_inr: owes,
    });
    if (error) return { error: "Could not start the payment. Please try again." };
    return {
      order: {
        orderId: order.id,
        amountPaise: order.amount,
        keyId: RAZORPAY_KEY_ID,
        description: reg.event?.title ?? "Trek booking",
        prefill: { name: reg.full_name, email: reg.email, contact: reg.phone },
      },
    };
  } catch (err) {
    console.error("createPaymentOrder", err);
    return { error: "Could not reach the payment gateway. Please try again." };
  }
}

/** Called from Razorpay Checkout's success handler. */
export async function confirmPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const session = await requireSession();
  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature))
    return { error: "We couldn't verify this payment. If money was debited, it will be reconciled automatically." };

  const { data: payment } = await createAdminClient()
    .from("payments")
    .select("user_id")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();
  if (!payment || payment.user_id !== session.userId) return { error: "Payment not found." };

  const result = await markOrderPaid(input.orderId, input.paymentId);
  return result.ok ? { ok: true } : { error: "Payment received but we couldn't update your booking yet. It will update shortly." };
}
