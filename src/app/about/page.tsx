import type { Metadata } from "next";
import { Code2, HeartHandshake, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Gooootrek is an open-source platform for discovering and organizing treks in India.",
};

const SAFETY = [
  "Tell someone your route and expected return time.",
  "Acclimatize: ascend slowly and rest on schedule at altitude.",
  "Carry layers, rain protection, a headlamp, water and a first-aid kit.",
  "Start early, turn back on time, and respect your leader's call.",
  "Leave no trace: carry your waste back with you.",
];

export default function AboutPage() {
  const h2 = "text-xl font-extrabold sm:text-2xl";
  return (
    <div className="container-page max-w-4xl py-10">
      <div className="rounded-3xl bg-sage-100 px-6 py-12 sm:px-12">
        <HeartHandshake className="h-8 w-8 text-sage-700" />
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">An open platform for every trail in India</h1>
        <p className="mt-3 max-w-2xl text-ink/80">
          Gooootrek started with a simple frustration: great treks are scattered across WhatsApp groups and PDFs. We&apos;re building an open-source, community-run home where trekkers can discover trails and independent organizers can post their own batches.
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-ink/70"><Code2 className="h-4 w-4" /> The code is open. Contributions, trek data fixes and ideas are welcome.</p>
      </div>

      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
        {["contact", "newsletter", "safety", "terms", "privacy"].map((s) => (
          <a key={s} href={`#${s}`} className="chip capitalize">{s}</a>
        ))}
      </nav>

      <div className="mt-10 space-y-12">
        <section id="contact" className="scroll-mt-24">
          <h2 className={h2}>Contact</h2>
          <p className="mt-2 text-muted">Questions, feedback or a trek to add? Write to us at <a className="font-semibold text-sage-700 hover:underline" href="mailto:hello@gooootrek.example">hello@gooootrek.example</a>.</p>
        </section>

        <section id="newsletter" className="scroll-mt-24">
          <h2 className={h2}>Newsletter</h2>
          <p className="mt-2 text-muted">Seasonal trek picks and new batches, once a month. Opens your email app to subscribe.</p>
          <form action="mailto:hello@gooootrek.example" method="post" encType="text/plain" className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="nl-email">Email address</label>
            <input id="nl-email" name="email" type="email" required placeholder="you@example.com" className="input" />
            <button type="submit" className="btn-primary shrink-0"><Mail className="h-4 w-4" /> Subscribe</button>
          </form>
        </section>

        <section id="safety" className="scroll-mt-24">
          <h2 className={h2}>Trek safety</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SAFETY.map((s) => (
              <li key={s} className="rounded-xl bg-peach-50 p-3 text-sm ring-1 ring-line">{s}</li>
            ))}
          </ul>
        </section>

        <section id="terms" className="scroll-mt-24">
          <h2 className={h2}>Terms of use</h2>
          <p className="mt-2 text-muted">Placeholder terms. Gooootrek connects trekkers with independent organizers. Organizers are solely responsible for their batches, pricing, safety arrangements and refunds. Trekking involves inherent risk; participate at your own discretion.</p>
        </section>

        <section id="privacy" className="scroll-mt-24">
          <h2 className={h2}>Privacy</h2>
          <p className="mt-2 text-muted">Placeholder policy. We store only the details needed to run your account and registrations. Your registration answers are visible to the organizer of that batch and to platform admins. We do not sell your data.</p>
        </section>
      </div>
    </div>
  );
}
