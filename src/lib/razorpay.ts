import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isAdminConfigured } from "@/lib/supabase/admin";

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

/** Online payments need Razorpay keys and the Supabase service role key. */
export const isPaymentsConfigured = Boolean(KEY_ID && KEY_SECRET && isAdminConfigured);
export const RAZORPAY_KEY_ID = KEY_ID;

async function razorpay<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.description ?? `Razorpay request failed (${res.status})`);
  return json as T;
}

export function createOrder(amountInr: number, receipt: string, notes: Record<string, string>) {
  return razorpay<{ id: string; amount: number; currency: string }>("/orders", {
    amount: amountInr * 100,
    currency: "INR",
    receipt: receipt.slice(0, 40),
    notes,
  });
}

export function refundPayment(paymentId: string) {
  return razorpay<{ id: string; status: string }>(`/payments/${paymentId}/refund`, { speed: "normal" });
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Signature returned to Checkout's handler: HMAC(order_id|payment_id, key secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
