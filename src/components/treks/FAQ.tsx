import { ChevronDown } from "lucide-react";

export const FAQS = [
  { q: "How do I pick the right difficulty?", a: "Start with Easy or Moderate treks if you are new: short days, gentle gradients and altitudes below ~4,000 m. Move to Difficult and Challenging only after a few multi-day treks and good fitness: you should comfortably jog 5 km in under 35 minutes before attempting high passes." },
  { q: "What should I pack for a trek?", a: "A well-fitting 40–60 L backpack with a rain cover, broken-in trekking shoes, 3 layers (base, fleece, waterproof shell), a warm cap and gloves, sunglasses and sunscreen, a headlamp, a 2 L water bottle, personal medication, and a basic first-aid kit. Pack light: carry no more than 10% of your body weight." },
  { q: "Do I need permits?", a: "Many treks inside forest, wildlife or border areas need permits (forest entry, inner-line permit, camping fees). The trek page lists what applies; your organizer normally handles these, but always carry government photo ID." },
  { q: "How do I stay safe from altitude sickness (AMS)?", a: "Ascend gradually, hydrate well, avoid alcohol, and keep to the itinerary's acclimatization days. Headache, nausea and dizziness are warning signs: tell your trek leader immediately and descend if symptoms worsen. Never ignore AMS." },
  { q: "How do I register for a batch?", a: "Open an upcoming batch, check dates, price and inclusions, then press Register. Create a free account, fill in the organizer's registration form and submit. The organizer confirms your spot and shares payment and joining details." },
  { q: "How can I list my own trek?", a: "Sign up as an organizer, then post a batch from your dashboard: pick a trek, set dates, price and seats, add your own registration questions, and open registrations when you are ready. Visit the organizers page to get started." },
];

export default function FAQ() {
  return (
    <section id="faqs" className="scroll-mt-24">
      <h2 className="text-xl font-extrabold sm:text-2xl">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {FAQS.map((f) => (
          <details key={f.q} className="group p-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="h-5 w-5 shrink-0 text-sage-700 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
