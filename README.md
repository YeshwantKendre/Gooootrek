# Gooootrek

An open platform for treks across India — think *BookMyShow, but for trekking*.

- **Discover** an encyclopedia of 100+ Indian treks (Himalaya, Sahyadri, Western Ghats, North-East…) with altitude, duration, best months, base camp, how to reach and permits.
- **Organize**: anyone who runs treks signs up as an organizer, posts a batch (dates, price, seats, itinerary, inclusions) with **their own registration questions**, and opens/closes registrations whenever they want.
- **Join**: trekkers register for batches, track their registrations and cancel if plans change. Full batches automatically waitlist.

Built with Next.js 15 (App Router), React 19, Tailwind CSS v4 (pastel theme) and Supabase (Postgres, Auth, Storage, Row Level Security).

## Roles

| Role | Can do |
| --- | --- |
| **owner** | Platform admin. Change anyone's role, verify organizers, feature / unpublish / cancel any event, see every registration. |
| **organizer** | Create and manage their own events, build custom registration forms, open/close registrations, confirm / waitlist / reject registrants, export CSV. Add treks to the encyclopedia. |
| **customer** | Browse, register for events, cancel their own registration, upgrade themselves to organizer. |

Roles are enforced in the database (RLS policies + triggers in `supabase/migrations`), not just in the UI.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Without Supabase env vars the site still runs: trek pages use `src/data/treks.json` and a few demo batches are shown; sign-in and dashboards show a "connect Supabase" notice.

## Connect your Supabase project

1. Create a project at [supabase.com](https://supabase.com) (or use your existing one).
2. **Schema** — in the SQL editor run each file in `supabase/migrations/` in order, or with the CLI:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
3. **Trek data** — run `supabase/seed.sql` in the SQL editor (regenerate it from `src/data/treks.json` any time with `npm run seed:sql`).
4. **Env** — Project Settings → API: copy the URL and anon/publishable key into `.env.local` (and into your host, e.g. Vercel). Set `NEXT_PUBLIC_SITE_URL` to your deployed URL.
5. **Auth** — Authentication → URL Configuration: set Site URL to your domain and add `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback`) to Redirect URLs.
6. **Make yourself owner** — sign up on the site, then run in the SQL editor:
   ```sql
   update public.profiles set role = 'owner'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   After that, manage everyone else's roles from **Dashboard → Users**.

## Payments & emails

- **Payments (Razorpay):** organizers set a price and how much is collected online at booking (full or an advance of 10–50%). Trekkers pay through Razorpay Checkout right after registering, or later from *My Treks*. A successful payment confirms the seat and emails a receipt. Organizers and the owner can refund from the registrations dashboard. Money goes to the platform owner's Razorpay account; settle with organizers separately.
- **Emails (Resend):** registration received, waitlisted, payment receipt, status changes and refunds go to trekkers; new registrations, payments and cancellations go to the organizer (the event's contact email, else their account email).
- Both are optional: without the keys, registrations still work, emails are skipped and the site shows "the organizer will share payment details".

Setup:
1. Add the variables from `.env.example` to `.env.local` and to Vercel (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_*`, `RESEND_API_KEY`, `EMAIL_FROM`).
2. Razorpay → Webhooks → add `https://<your-domain>/api/razorpay/webhook` with events `payment.captured`, `order.paid`, `payment.failed`, and the same secret as `RAZORPAY_WEBHOOK_SECRET`. The webhook confirms bookings even if a trekker closes the tab mid-payment.
3. Resend → verify your domain, then set `EMAIL_FROM` to an address on it.
4. Test with `rzp_test_` keys and Razorpay's test cards/UPI before switching to live keys (live keys need KYC on Razorpay).

## Database

`supabase/migrations/20261027000000_init.sql`

- `profiles` — one per auth user: `role` (owner | organizer | customer), name, organization, bio, `is_verified`. Created automatically on signup; signup may request `organizer`, never `owner`.
- `treks` — the encyclopedia (slug, state, region, range, difficulty, altitude, duration, distance, best months, seasons, base camp, access, permits, highlights, tags).
- `events` — an organizer's trek batch: optional link to a trek, dates, price, seats, `registration_open` + optional open/close timestamps, `form_fields` (custom questions JSON), `itinerary`, inclusions/exclusions, contact, `status` (draft | published | cancelled | completed), `is_featured`.
- `registrations` — a customer's booking: contact, participants, `answers` to the custom questions, `status` (pending | confirmed | waitlisted | cancelled | rejected), and `payment_status` (not_required | unpaid | paid | refunded) with the amount due (computed by the database from price × participants × advance %) and amount paid.
- `payments` — one row per Razorpay order. Written only by the server with the service role key; readable by the payer, the event's organizer and the owner.
- Storage bucket `covers` for event cover images (uploads go to `<user id>/…`).

Triggers keep `events.seats_booked` in sync, validate that registrations only happen while an event is published and open, waitlist when seats run out, and stop non-owners from changing roles, verification or featured flags.

## Project layout

```
src/app/            routes: / · /treks · /treks/[slug] · /events · /events/[id] · /login · /signup · /dashboard/**
src/components/     Navbar, Footer, cards, home + trek + event + dashboard components
src/data/           treks.json (encyclopedia source), demo events
src/lib/            supabase clients, auth/session helpers, data access, types, formatting
supabase/           migrations + seed.sql
scripts/            generate-seed.mjs (treks.json → seed.sql)
```

## Contributing

It's open source — add or correct treks by editing `src/data/treks.json` and opening a pull request. Trek information is compiled from public sources for reference; always confirm current conditions, permits and safety advisories before you go.
