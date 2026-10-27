// Shared domain types. Mirrors supabase/migrations/*_init.sql.

export type Role = "owner" | "organizer" | "customer";
export type Difficulty = "easy" | "moderate" | "difficult" | "challenging";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type RegistrationStatus = "pending" | "confirmed" | "waitlisted" | "cancelled" | "rejected";
export type PaymentStatus = "not_required" | "unpaid" | "paid" | "refunded";
export type Season = "spring" | "summer" | "monsoon" | "autumn" | "winter";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  organization_name: string | null;
  bio: string | null;
  website: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/** Encyclopedia entry. Static copies live in src/data/treks.json (no id there). */
export interface Trek {
  id?: string;
  slug: string;
  name: string;
  state: string;
  region: string | null;
  mountain_range: string | null;
  difficulty: Difficulty;
  duration_days: number | null;
  max_altitude_m: number | null;
  distance_km: number | null;
  best_months: string[]; // e.g. ["May", "Jun", "Sep"]
  seasons: Season[];
  base_camp: string | null;
  nearest_airport: string | null;
  nearest_railway: string | null;
  summary: string;
  description: string;
  highlights: string[];
  tags: string[]; // e.g. ["himalayan", "snow", "beginner", "lakes", "forest", "monsoon", "fort", "summit"]
  permits: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
}

/** A question the organizer adds to the registration form. */
export type FormFieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "date";
export interface FormField {
  id: string; // stable key used in registrations.answers
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[]; // for "select"
  placeholder?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  details: string;
}

export interface TrekEvent {
  id: string;
  organizer_id: string;
  trek_id: string | null;
  title: string;
  description: string;
  difficulty: Difficulty | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  meeting_point: string | null;
  city: string | null;
  price_inr: number;
  /** Share of the price collected online at booking (10–100). */
  advance_percent: number;
  total_seats: number;
  seats_booked: number;
  registration_open: boolean;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  form_fields: FormField[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  contact_phone: string | null;
  contact_email: string | null;
  cover_image_url: string | null;
  status: EventStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/** Event joined with its organizer and (optional) trek, as returned by src/lib/events.ts */
export interface TrekEventWithRelations extends TrekEvent {
  organizer: Pick<Profile, "id" | "full_name" | "organization_name" | "is_verified" | "avatar_url"> | null;
  trek: Pick<Trek, "slug" | "name" | "state" | "max_altitude_m"> | null;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  participants: number;
  answers: Record<string, string | number | boolean>;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  /** Computed by the database: price × participants × advance_percent. */
  amount_due_inr: number;
  amount_paid_inr: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
