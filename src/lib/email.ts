import "server-only";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { formatDateRange, formatINR } from "@/lib/format";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
// Until you verify a domain in Resend, onboarding@resend.dev only delivers to your own Resend email.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Gooootrek <onboarding@resend.dev>";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const isEmailConfigured = Boolean(RESEND_API_KEY);

/** Best-effort send: logs and returns on failure, never throws into the caller. */
export async function sendEmail(to: string | null | undefined, subject: string, html: string) {
  if (!isEmailConfigured || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
      cache: "no-store",
    });
    if (!res.ok) console.error("sendEmail failed", res.status, await res.text());
  } catch (err) {
    console.error("sendEmail error", err);
  }
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Pastel, table-free email layout that renders in Gmail/Outlook. */
function layout(heading: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#fbf8f3;font-family:Arial,Helvetica,sans-serif;color:#26332e">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <p style="font-size:20px;font-weight:800;margin:0 0 16px">gooo<span style="background:#a8d5ba;color:#23402f;padding:2px 6px;border-radius:6px">otrek</span></p>
  <div style="background:#ffffff;border:1px solid #e7e2d9;border-radius:16px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">${escape(heading)}</h1>
    ${body}
    ${cta ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="display:inline-block;background:#3e6b55;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:999px">${escape(cta.label)}</a></p>` : ""}
  </div>
  <p style="font-size:12px;color:#66756f;margin:16px 0 0">You're receiving this because of a trek booking on Gooootrek. Always confirm conditions and safety with your organizer.</p>
</div></body></html>`;
}

const p = (text: string) => `<p style="font-size:14px;line-height:1.6;margin:0 0 10px">${text}</p>`;

export interface EmailEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  meeting_point: string | null;
  contact_email: string | null;
  organizer_id: string;
}

export interface EmailRegistration {
  full_name: string;
  email: string;
  phone?: string;
  participants: number;
  status: string;
  amount_due_inr: number;
  amount_paid_inr: number;
}

function tripLine(e: EmailEvent) {
  return p(
    `<strong>${escape(e.title)}</strong><br>${formatDateRange(e.start_date, e.end_date)}${
      e.meeting_point ? ` · ${escape(e.meeting_point)}` : ""
    }`,
  );
}

/** Organizer's address: the event's contact email, else their account email. */
export async function organizerEmail(e: EmailEvent): Promise<string | null> {
  if (e.contact_email) return e.contact_email;
  if (!isAdminConfigured) return null;
  const { data } = await createAdminClient().auth.admin.getUserById(e.organizer_id);
  return data.user?.email ?? null;
}

export const emails = {
  registrationReceived(e: EmailEvent, r: EmailRegistration) {
    const owes = r.amount_due_inr - r.amount_paid_inr;
    const body =
      tripLine(e) +
      p(
        r.status === "waitlisted"
          ? "This batch is currently full, so you're on the <strong>waitlist</strong>. We'll email you if a seat opens up — no payment is needed until then."
          : owes > 0
            ? `Your spot is reserved. Complete the payment of <strong>${formatINR(owes)}</strong> to confirm it.`
            : "Your registration has been received. The organizer will confirm your spot soon.",
      ) +
      p(`Participants: ${r.participants}`);
    return sendEmail(
      r.email,
      r.status === "waitlisted" ? `You're on the waitlist — ${e.title}` : `Registration received — ${e.title}`,
      layout(`Hi ${r.full_name.split(" ")[0]}, thanks for registering!`, body, {
        href: `${SITE_URL}/events/${e.id}`,
        label: owes > 0 && r.status !== "waitlisted" ? "Pay & confirm" : "View your booking",
      }),
    );
  },

  async newRegistrationForOrganizer(e: EmailEvent, r: EmailRegistration) {
    const body =
      tripLine(e) +
      p(
        `<strong>${escape(r.full_name)}</strong> (${escape(r.email)}${r.phone ? `, ${escape(r.phone)}` : ""}) registered ${r.participants} participant${
          r.participants > 1 ? "s" : ""
        }. Status: <strong>${r.status}</strong>.`,
      );
    return sendEmail(
      await organizerEmail(e),
      `New registration — ${e.title}`,
      layout("You have a new registration", body, {
        href: `${SITE_URL}/dashboard/events/${e.id}/registrations`,
        label: "Manage registrations",
      }),
    );
  },

  paymentReceived(e: EmailEvent, r: EmailRegistration, paymentId: string) {
    const body =
      tripLine(e) +
      p(`We received your payment of <strong>${formatINR(r.amount_paid_inr)}</strong>. Your spot is <strong>confirmed</strong>.`) +
      p(`<span style="color:#66756f">Payment reference: ${escape(paymentId)}</span>`);
    return sendEmail(
      r.email,
      `Payment received — ${e.title}`,
      layout("You're confirmed! 🎒", body, { href: `${SITE_URL}/dashboard/registrations`, label: "View my treks" }),
    );
  },

  async paymentReceivedForOrganizer(e: EmailEvent, r: EmailRegistration) {
    const body = tripLine(e) + p(`${escape(r.full_name)} paid <strong>${formatINR(r.amount_paid_inr)}</strong> and is now confirmed.`);
    return sendEmail(
      await organizerEmail(e),
      `Payment received from ${r.full_name} — ${e.title}`,
      layout("Payment received", body, {
        href: `${SITE_URL}/dashboard/events/${e.id}/registrations`,
        label: "Manage registrations",
      }),
    );
  },

  statusChanged(e: EmailEvent, r: EmailRegistration) {
    const messages: Record<string, string> = {
      confirmed: "Great news — your spot is <strong>confirmed</strong>. See you on the trail!",
      waitlisted: "You've been moved to the <strong>waitlist</strong>. We'll let you know if a seat opens up.",
      rejected: "Unfortunately the organizer couldn't accommodate your registration this time.",
      cancelled: "Your registration has been <strong>cancelled</strong>.",
      pending: "Your registration is back to <strong>pending</strong> while the organizer reviews it.",
    };
    const owes = r.amount_due_inr - r.amount_paid_inr;
    const body =
      tripLine(e) +
      p(messages[r.status] ?? `Your registration status is now <strong>${r.status}</strong>.`) +
      (r.status === "confirmed" && owes > 0 ? p(`Amount still to pay online: <strong>${formatINR(owes)}</strong>.`) : "");
    return sendEmail(
      r.email,
      `Update on your booking — ${e.title}`,
      layout(`Your registration is ${r.status}`, body, { href: `${SITE_URL}/events/${e.id}`, label: "View booking" }),
    );
  },

  async cancelledForOrganizer(e: EmailEvent, r: EmailRegistration) {
    const body =
      tripLine(e) +
      p(`${escape(r.full_name)} (${escape(r.email)}) cancelled their registration for ${r.participants} participant${r.participants > 1 ? "s" : ""}.`) +
      (r.amount_paid_inr > 0
        ? p(`They had paid <strong>${formatINR(r.amount_paid_inr)}</strong>. Issue a refund from the dashboard if your policy allows it.`)
        : "");
    return sendEmail(
      await organizerEmail(e),
      `Registration cancelled — ${e.title}`,
      layout("A registration was cancelled", body, {
        href: `${SITE_URL}/dashboard/events/${e.id}/registrations`,
        label: "Manage registrations",
      }),
    );
  },

  refundIssued(e: EmailEvent, r: EmailRegistration) {
    const body =
      tripLine(e) +
      p(`A refund of <strong>${formatINR(r.amount_paid_inr)}</strong> has been initiated to your original payment method. Banks usually take 5–7 working days to credit it.`);
    return sendEmail(r.email, `Refund initiated — ${e.title}`, layout("Your refund is on its way", body));
  },
};
