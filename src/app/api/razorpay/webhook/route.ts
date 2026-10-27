import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderFailed, markOrderPaid } from "@/lib/payments";

/**
 * Razorpay webhook (events: payment.captured, order.paid, payment.failed).
 * Backs up the checkout callback when the trekker closes the tab mid-payment.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(raw) as {
    event: string;
    payload: { payment?: { entity: { id: string; order_id: string } } };
  };
  const payment = body.payload.payment?.entity;
  if (payment?.order_id) {
    if (body.event === "payment.captured" || body.event === "order.paid") {
      const result = await markOrderPaid(payment.order_id, payment.id);
      // 500 makes Razorpay retry later.
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    } else if (body.event === "payment.failed") {
      await markOrderFailed(payment.order_id);
    }
  }
  return NextResponse.json({ ok: true });
}
