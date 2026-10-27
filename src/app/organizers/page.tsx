import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, UserPlus, Users, Globe2, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "For Organizers",
  description: "Post your trek batches on Gooootrek, ask your own registration questions and manage participants.",
};

const STEPS = [
  { icon: UserPlus, title: "Sign up as an organizer", body: "Create a free account and choose the organizer role. Add your organization name and contact details." },
  { icon: ClipboardList, title: "Post your batch", body: "Pick a trek from the guide, set dates, price and seats, and write your own registration questions." },
  { icon: Users, title: "Open registrations & manage", body: "Open or close registrations whenever you like, then confirm, waitlist or reject participants from your dashboard." },
];

const BENEFITS = [
  { icon: Globe2, title: "Reach trekkers across India", body: "Your batch appears beside the trek it belongs to, on listings and in search." },
  { icon: Sparkles, title: "Your rules, your form", body: "Ask what you need to know: fitness, medical details, gear, pickup city." },
  { icon: ShieldCheck, title: "Open and transparent", body: "Gooootrek is an open-source platform. No lock-in, no hidden commissions." },
];

export default function OrganizersPage() {
  return (
    <div className="pb-16">
      <section className="container-page pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-lavender-100 px-6 py-14 sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-sage-200/60 blur-2xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-lavender-700">For organizers</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">Organizing a trek? Post it on Gooootrek.</h1>
            <p className="mt-4 text-ink/80">Open registrations your way, collect the details you need and fill your batch, all from one dashboard.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup?role=organizer" className="btn-primary">Sign up as organizer</Link>
              <Link href="/dashboard/events/new" className="btn-secondary">Post a batch</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-14">
        <h2 className="text-xl font-extrabold sm:text-2xl">How it works</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-4 text-5xl font-extrabold text-sage-100">{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-100 text-sage-700"><s.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page mt-14">
        <h2 className="text-xl font-extrabold sm:text-2xl">Why organizers choose Gooootrek</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className={`rounded-2xl p-6 ring-1 ring-line ${["bg-sky-50", "bg-peach-50", "bg-butter-100/50"][i]}`}>
              <b.icon className="h-6 w-6 text-sage-700" />
              <h3 className="mt-3 font-bold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-14">
        <div className="rounded-3xl bg-night px-6 py-10 text-center text-white sm:py-14">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to fill your next batch?</h2>
          <p className="mt-2 text-white/70">It takes about five minutes to post your first trek.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup?role=organizer" className="inline-flex items-center rounded-full bg-sage-300 px-6 py-2.5 text-sm font-bold text-sage-900 hover:bg-sage-200">Get started</Link>
            <Link href="/dashboard/events/new" className="inline-flex items-center rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold hover:bg-white/10">Post a batch</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
