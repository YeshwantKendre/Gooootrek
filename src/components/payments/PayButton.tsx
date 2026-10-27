"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { confirmPayment, createPaymentOrder } from "@/app/payments/actions";
import { formatINR } from "@/lib/format";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Opens Razorpay Checkout for the amount still owed on a registration. */
export default function PayButton({
  registrationId,
  amountInr,
  className = "btn-primary w-full py-2.5",
}: {
  registrationId: string;
  amountInr: number;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function pay() {
    setBusy(true);
    setError(null);
    const { order, error } = await createPaymentOrder(registrationId);
    if (!order) {
      setError(error ?? "Could not start the payment.");
      setBusy(false);
      return;
    }
    if (!(await loadCheckout()) || !window.Razorpay) {
      setError("Couldn't load the payment window. Check your connection and try again.");
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: "INR",
      order_id: order.orderId,
      name: "Gooootrek",
      description: order.description,
      prefill: order.prefill,
      theme: { color: "#3e6b55" },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (res: RazorpayResponse) => {
        const result = await confirmPayment({
          orderId: res.razorpay_order_id,
          paymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
        });
        setBusy(false);
        if (result.ok) {
          setDone(true);
          router.refresh();
        } else {
          setError(result.error ?? "Payment could not be verified.");
        }
      },
    });
    rzp.on("payment.failed", () => setError("The payment didn't go through. You can try again."));
    rzp.open();
  }

  if (done) {
    return (
      <p role="status" className="rounded-xl bg-sage-50 px-3 py-2 text-sm font-medium text-sage-700">
        Payment received — your spot is confirmed. A receipt is on its way to your email.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={pay} disabled={busy} className={className}>
        <CreditCard className="h-4 w-4" aria-hidden="true" />
        {busy ? "Opening payment…" : `Pay ${formatINR(amountInr)}`}
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-peach-50 px-3 py-2 text-sm text-peach-700">
          {error}
        </p>
      )}
    </div>
  );
}
