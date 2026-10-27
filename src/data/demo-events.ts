import type { TrekEventWithRelations } from "@/lib/types";

/** Shown only while Supabase is not configured, so the site isn't empty. */
const organizer = {
  id: "demo-organizer",
  full_name: "Gooootrek Community",
  organization_name: "Gooootrek Community",
  is_verified: true,
  avatar_url: null,
};

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const base = {
  organizer_id: organizer.id,
  organizer,
  registration_open: true,
  registration_opens_at: null,
  registration_closes_at: null,
  contact_phone: null,
  contact_email: "hello@gooootrek.example",
  cover_image_url: null,
  status: "published" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  form_fields: [
    { id: "age", label: "Age", type: "number" as const, required: true },
    { id: "experience", label: "Previous trekking experience", type: "select" as const, required: true, options: ["None", "1–2 treks", "3+ treks"] },
    { id: "medical", label: "Any medical conditions we should know about?", type: "textarea" as const, required: false },
  ],
};

export const DEMO_EVENTS: TrekEventWithRelations[] = [
  {
    ...base,
    id: "demo-kedarkantha",
    trek_id: null,
    trek: { slug: "kedarkantha", name: "Kedarkantha", state: "Uttarakhand", max_altitude_m: 3810 },
    title: "Kedarkantha Winter Summit — Christmas Batch",
    description: "Six days of snow trails, campfires and a summit sunrise. Small group of 16 with certified trek leaders.",
    difficulty: "moderate",
    start_date: addDays(40),
    end_date: addDays(45),
    meeting_point: "Dehradun Railway Station",
    city: "Dehradun",
    price_inr: 9500,
    total_seats: 16,
    seats_booked: 11,
    itinerary: [
      { day: 1, title: "Dehradun to Sankri", details: "Drive 200 km through Mussoorie and Purola." },
      { day: 2, title: "Sankri to Juda ka Talab", details: "4 km climb through pine forest." },
    ],
    inclusions: ["Stay in tents", "All veg meals", "Trek leader & guides", "Permits"],
    exclusions: ["Travel to Dehradun", "Personal gear"],
    is_featured: true,
  },
  {
    ...base,
    id: "demo-hampta",
    trek_id: null,
    trek: { slug: "hampta-pass", name: "Hampta Pass", state: "Himachal Pradesh", max_altitude_m: 4270 },
    title: "Hampta Pass with Chandratal",
    description: "Cross from Kullu's green meadows to Lahaul's desert and camp beside Chandratal.",
    difficulty: "moderate",
    start_date: addDays(70),
    end_date: addDays(74),
    meeting_point: "Manali Mall Road",
    city: "Manali",
    price_inr: 11500,
    total_seats: 20,
    seats_booked: 6,
    itinerary: [],
    inclusions: ["Tents", "Meals", "Transport Manali–Jobra"],
    exclusions: ["Mules for personal bags"],
    is_featured: true,
  },
  {
    ...base,
    id: "demo-rajmachi",
    trek_id: null,
    trek: { slug: "rajmachi", name: "Rajmachi Fort", state: "Maharashtra", max_altitude_m: 830 },
    title: "Rajmachi Night Trek — Firefly Special",
    description: "An easy overnight trek from Lonavala to Rajmachi, with dinner at the village and sunrise from Shrivardhan.",
    difficulty: "easy",
    start_date: addDays(12),
    end_date: addDays(13),
    meeting_point: "Lonavala Station",
    city: "Pune",
    price_inr: 1299,
    total_seats: 40,
    seats_booked: 22,
    itinerary: [],
    inclusions: ["Dinner & breakfast", "Trek lead"],
    exclusions: ["Train tickets"],
    is_featured: false,
  },
];
