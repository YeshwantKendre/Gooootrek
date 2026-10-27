-- Online payments (Razorpay). Money is collected into the platform owner's
-- Razorpay account. Payment rows are written only by the server using the
-- service role key, so customers can never mark themselves as paid.

-- Organizer chooses what share of the price is collected online at booking.
alter table public.events
  add column advance_percent integer not null default 100
  check (advance_percent between 10 and 100);

alter table public.registrations
  add column payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'unpaid', 'paid', 'refunded')),
  add column amount_due_inr integer not null default 0 check (amount_due_inr >= 0),
  add column amount_paid_inr integer not null default 0 check (amount_paid_inr >= 0);

create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  -- set null keeps the payment record if a refunded registration is cleared
  registration_id      uuid references public.registrations (id) on delete set null,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  razorpay_order_id    text not null unique,
  razorpay_payment_id  text unique,
  razorpay_refund_id   text,
  amount_inr           integer not null check (amount_inr > 0),
  status               text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index payments_registration_idx on public.payments (registration_id);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- Read-only for the people involved; no insert/update/delete policies, so
-- only the service role (which bypasses RLS) can write.
create policy "Payer, event organizer and owner read payments" on public.payments
  for select using (
    user_id = auth.uid()
    or public.is_owner()
    or exists (
      select 1 from public.registrations r
      join public.events e on e.id = r.event_id
      where r.id = registration_id and e.organizer_id = auth.uid()
    )
  );

-- Registration insert: also compute what is owed, server-side.
create or replace function public.validate_registration()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  ev public.events%rowtype;
begin
  select * into ev from public.events where id = new.event_id for update;

  if not found then
    raise exception 'Event not found';
  end if;

  if auth.uid() is not null and not public.is_owner() then
    if ev.status <> 'published' then
      raise exception 'This event is not accepting registrations';
    end if;
    if not ev.registration_open then
      raise exception 'Registrations are closed for this event';
    end if;
    if ev.registration_opens_at is not null and now() < ev.registration_opens_at then
      raise exception 'Registrations have not opened yet';
    end if;
    if ev.registration_closes_at is not null and now() > ev.registration_closes_at then
      raise exception 'Registrations have closed';
    end if;
    new.status := 'pending';
  end if;

  if new.status in ('pending', 'confirmed')
     and ev.seats_booked + new.participants > ev.total_seats then
    new.status := 'waitlisted';
  end if;

  new.amount_due_inr := ceil(ev.price_inr * new.participants * ev.advance_percent / 100.0)::integer;
  new.amount_paid_inr := 0;
  new.payment_status := case when new.amount_due_inr > 0 then 'unpaid' else 'not_required' end;

  return new;
end;
$$;

-- Registration update: payment fields and participant count are server-only.
create or replace function public.guard_registration_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  organizer uuid;
begin
  if auth.uid() is null or public.is_owner() then
    return new;
  end if;

  new.payment_status := old.payment_status;
  new.amount_due_inr := old.amount_due_inr;
  new.amount_paid_inr := old.amount_paid_inr;
  new.participants := old.participants;

  select organizer_id into organizer from public.events where id = old.event_id;

  if organizer = auth.uid() then
    new.event_id := old.event_id;
    new.user_id := old.user_id;
    new.answers := old.answers;
    return new;
  end if;

  if old.user_id = auth.uid() then
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'You can only cancel your registration';
    end if;
    new.event_id := old.event_id;
    new.user_id := old.user_id;
    new.notes := old.notes;
    return new;
  end if;

  raise exception 'Not allowed';
end;
$$;

-- A paid registration must not be deleted to re-register; only unpaid
-- cancelled ones can be cleared.
alter policy "Users delete their cancelled registrations" on public.registrations
  using (
    user_id = auth.uid() and status = 'cancelled' and payment_status in ('not_required', 'unpaid', 'refunded')
  );

revoke execute on function public.validate_registration() from public, anon, authenticated;
revoke execute on function public.guard_registration_update() from public, anon, authenticated;
