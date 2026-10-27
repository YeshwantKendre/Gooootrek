-- Gooootrek: initial schema
-- Roles: owner (platform admin), organizer (posts trek batches), customer (registers)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('owner', 'organizer', 'customer');
create type public.trek_difficulty as enum ('easy', 'moderate', 'difficult', 'challenging');
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.registration_status as enum ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users). Contains only public-safe fields; email
-- lives in auth.users and contact details live on events/registrations.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  avatar_url        text,
  role              public.user_role not null default 'customer',
  organization_name text,
  bio               text,
  website           text,
  is_verified       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Treks: the open encyclopedia of Indian treks
-- ---------------------------------------------------------------------------
create table public.treks (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  state            text not null,
  region           text,
  mountain_range   text,
  difficulty       public.trek_difficulty not null default 'moderate',
  duration_days    integer check (duration_days > 0),
  max_altitude_m   integer check (max_altitude_m >= 0),
  distance_km      numeric(6, 1),
  best_months      text[] not null default '{}',
  seasons          text[] not null default '{}',
  base_camp        text,
  nearest_airport  text,
  nearest_railway  text,
  summary          text not null default '',
  description      text not null default '',
  highlights       text[] not null default '{}',
  tags             text[] not null default '{}',
  permits          text,
  cover_image_url  text,
  is_featured      boolean not null default false,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index treks_state_idx on public.treks (state);
create index treks_difficulty_idx on public.treks (difficulty);
create index treks_tags_idx on public.treks using gin (tags);

-- ---------------------------------------------------------------------------
-- Events: an organized batch of a trek with its own registration window
-- ---------------------------------------------------------------------------
create table public.events (
  id                      uuid primary key default gen_random_uuid(),
  organizer_id            uuid not null references public.profiles (id) on delete cascade,
  trek_id                 uuid references public.treks (id) on delete set null,
  title                   text not null,
  description             text not null default '',
  difficulty              public.trek_difficulty,
  start_date              date not null,
  end_date                date not null,
  meeting_point           text,
  city                    text,
  price_inr               integer not null default 0 check (price_inr >= 0),
  total_seats             integer not null default 20 check (total_seats > 0),
  seats_booked            integer not null default 0,
  registration_open       boolean not null default true,
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,
  -- Organizer-defined registration questions, see FormField in src/lib/types.ts
  form_fields             jsonb not null default '[]'::jsonb,
  -- [{ "day": 1, "title": "...", "details": "..." }]
  itinerary               jsonb not null default '[]'::jsonb,
  inclusions              text[] not null default '{}',
  exclusions              text[] not null default '{}',
  contact_phone           text,
  contact_email           text,
  cover_image_url         text,
  status                  public.event_status not null default 'draft',
  is_featured             boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint events_dates_check check (end_date >= start_date),
  constraint events_form_fields_array check (jsonb_typeof(form_fields) = 'array'),
  constraint events_itinerary_array check (jsonb_typeof(itinerary) = 'array')
);

create index events_organizer_idx on public.events (organizer_id);
create index events_trek_idx on public.events (trek_id);
create index events_status_start_idx on public.events (status, start_date);

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------
create table public.registrations (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  full_name     text not null,
  email         text not null,
  phone         text not null,
  participants  integer not null default 1 check (participants between 1 and 20),
  -- answers to events.form_fields keyed by field id
  answers       jsonb not null default '{}'::jsonb,
  status        public.registration_status not null default 'pending',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (event_id, user_id)
);

create index registrations_event_idx on public.registrations (event_id);
create index registrations_user_idx on public.registrations (user_id);

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies don't recurse into profiles RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.can_organize()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role in ('owner', 'organizer') from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger treks_updated_at before update on public.treks
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger registrations_updated_at before update on public.registrations
  for each row execute function public.set_updated_at();

-- New auth user -> profile. Signup may request 'organizer'; 'owner' is never
-- self-assigned (promote the first owner manually, see README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, avatar_url, role, organization_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    case when requested = 'organizer' then 'organizer'::public.user_role else 'customer'::public.user_role end,
    new.raw_user_meta_data ->> 'organization_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only owners may change role / verification, except a customer upgrading
-- themselves to organizer. auth.uid() is null for the SQL editor and the
-- service role, which are trusted.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_owner() then
    return new;
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'Only the owner can change verification status';
  end if;

  if new.role is distinct from old.role then
    if not (new.id = auth.uid() and old.role = 'customer' and new.role = 'organizer') then
      raise exception 'Only the owner can change roles';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileges before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Organizers cannot feature their own events; only owners can.
create or replace function public.guard_event_feature()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- pg_trigger_depth() > 1: the seat-sync trigger updating seats_booked
  if auth.uid() is not null and not public.is_owner() and pg_trigger_depth() = 1 then
    if tg_op = 'INSERT' then
      new.is_featured := false;
    elsif new.is_featured is distinct from old.is_featured then
      raise exception 'Only the owner can feature events';
    end if;
    if tg_op = 'UPDATE' then
      new.organizer_id := old.organizer_id;
      new.seats_booked := old.seats_booked;
    end if;
  end if;
  return new;
end;
$$;

create trigger events_guard_feature before insert or update on public.events
  for each row execute function public.guard_event_feature();

-- Validate a registration on insert: event must be published, open, within
-- its window. When seats are short the registration is waitlisted.
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

  return new;
end;
$$;

create trigger registrations_validate before insert on public.registrations
  for each row execute function public.validate_registration();

-- Customers may only cancel their own registration; organizers/owners may
-- change status and notes.
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

  select organizer_id into organizer from public.events where id = old.event_id;

  if organizer = auth.uid() then
    -- organizer may only touch status/notes
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

create trigger registrations_guard_update before update on public.registrations
  for each row execute function public.guard_registration_update();

-- Keep events.seats_booked in sync with active registrations.
create or replace function public.sync_seats_booked()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  target uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events e
     set seats_booked = coalesce((
       select sum(r.participants)
         from public.registrations r
        where r.event_id = target and r.status in ('pending', 'confirmed')
     ), 0)
   where e.id = target;
  return null;
end;
$$;

create trigger registrations_sync_seats
  after insert or update or delete on public.registrations
  for each row execute function public.sync_seats_booked();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.treks enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- profiles
create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
create policy "Users update their own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "Owner updates any profile" on public.profiles
  for update using (public.is_owner()) with check (public.is_owner());

-- treks
create policy "Treks are publicly readable" on public.treks
  for select using (true);
create policy "Organizers add treks" on public.treks
  for insert with check (public.can_organize() and created_by = auth.uid());
create policy "Creators and owner update treks" on public.treks
  for update using (created_by = auth.uid() or public.is_owner());
create policy "Owner deletes treks" on public.treks
  for delete using (public.is_owner());

-- events
create policy "Public sees published events, organizers see their own" on public.events
  for select using (
    status in ('published', 'completed', 'cancelled')
    or organizer_id = auth.uid()
    or public.is_owner()
  );
create policy "Organizers create events" on public.events
  for insert with check (public.can_organize() and organizer_id = auth.uid());
create policy "Organizers update own events, owner updates all" on public.events
  for update using (organizer_id = auth.uid() or public.is_owner());
create policy "Organizers delete own events, owner deletes all" on public.events
  for delete using (organizer_id = auth.uid() or public.is_owner());

-- registrations
create policy "Registrants, event organizer and owner read registrations" on public.registrations
  for select using (
    user_id = auth.uid()
    or public.is_owner()
    or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
  );
create policy "Users register themselves" on public.registrations
  for insert with check (user_id = auth.uid());
create policy "Registrant, organizer and owner update registrations" on public.registrations
  for update using (
    user_id = auth.uid()
    or public.is_owner()
    or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
  );
create policy "Owner deletes registrations" on public.registrations
  for delete using (public.is_owner());
-- Lets a user clear their cancelled registration so they can register again.
create policy "Users delete their cancelled registrations" on public.registrations
  for delete using (user_id = auth.uid() and status = 'cancelled');

-- ---------------------------------------------------------------------------
-- Storage: public bucket for event / trek cover images.
-- Files are uploaded under "<user id>/<file name>".
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "Cover images are public" on storage.objects
  for select using (bucket_id = 'covers');
create policy "Users upload covers to their folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users manage their own covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
