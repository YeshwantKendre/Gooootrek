"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveEvent, type EventInput } from "@/app/dashboard/actions";
import type { Difficulty, EventStatus, FormField, FormFieldType, TrekEvent } from "@/lib/types";

export interface TrekOption {
  slug: string;
  name: string;
}

interface Q {
  key: string;
  id?: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  optionsText: string;
}
interface Day {
  key: string;
  title: string;
  details: string;
}

let counter = 0;
const uid = () => `k${++counter}`;

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "question";

/** ISO timestamp -> value for <input type="datetime-local"> in the viewer's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

const FIELD_TYPES: FormFieldType[] = ["text", "textarea", "number", "select", "checkbox", "date"];
const DIFFICULTIES: Difficulty[] = ["easy", "moderate", "difficult", "challenging"];

export function EventForm({
  treks,
  userId,
  event,
  defaultTrekSlug,
}: {
  treks: TrekOption[];
  userId: string;
  event?: TrekEvent;
  defaultTrekSlug?: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [trekSlug, setTrekSlug] = useState(defaultTrekSlug ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(event?.difficulty ?? "");
  const [startDate, setStartDate] = useState(event?.start_date ?? "");
  const [endDate, setEndDate] = useState(event?.end_date ?? "");
  const [meetingPoint, setMeetingPoint] = useState(event?.meeting_point ?? "");
  const [city, setCity] = useState(event?.city ?? "");
  const [price, setPrice] = useState(String(event?.price_inr ?? 0));
  const [advance, setAdvance] = useState(String(event?.advance_percent ?? 100));
  const [seats, setSeats] = useState(String(event?.total_seats ?? 20));
  const [regOpen, setRegOpen] = useState(event?.registration_open ?? true);
  const [opensAt, setOpensAt] = useState(toLocalInput(event?.registration_opens_at ?? null));
  const [closesAt, setClosesAt] = useState(toLocalInput(event?.registration_closes_at ?? null));
  const [phone, setPhone] = useState(event?.contact_phone ?? "");
  const [email, setEmail] = useState(event?.contact_email ?? "");
  const [cover, setCover] = useState(event?.cover_image_url ?? "");
  const [inclusions, setInclusions] = useState((event?.inclusions ?? []).join("\n"));
  const [exclusions, setExclusions] = useState((event?.exclusions ?? []).join("\n"));
  const [days, setDays] = useState<Day[]>(
    (event?.itinerary ?? []).map((d) => ({ key: uid(), title: d.title, details: d.details })),
  );
  const [questions, setQuestions] = useState<Q[]>(
    (event?.form_fields ?? []).map((f) => ({
      key: uid(),
      id: f.id,
      label: f.label,
      type: f.type,
      required: f.required,
      optionsText: (f.options ?? []).join(", "),
    })),
  );

  function pickTrek(slug: string) {
    setTrekSlug(slug);
    const t = treks.find((x) => x.slug === slug);
    if (t && !title.trim()) setTitle(`${t.name} Trek`);
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      setCover(supabase.storage.from("covers").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? `Upload failed: ${e.message}` : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function buildFields(): FormField[] {
    const used = new Set(questions.map((q) => q.id).filter(Boolean) as string[]);
    return questions.map((q) => {
      let id = q.id;
      if (!id) {
        const base = slugify(q.label);
        id = base;
        let n = 2;
        while (used.has(id)) id = `${base}_${n++}`;
        used.add(id);
      }
      const f: FormField = { id, label: q.label.trim(), type: q.type, required: q.required };
      if (q.type === "select") f.options = q.optionsText.split(",").map((o) => o.trim()).filter(Boolean);
      return f;
    });
  }

  async function submit(status: EventStatus | "keep", label: string) {
    setError(null);
    setBusy(label);
    const input: EventInput = {
      title,
      description,
      difficulty,
      start_date: startDate,
      end_date: endDate,
      meeting_point: meetingPoint,
      city,
      price_inr: Number(price),
      advance_percent: Number(advance),
      total_seats: Number(seats),
      registration_open: regOpen,
      registration_opens_at: fromLocalInput(opensAt),
      registration_closes_at: fromLocalInput(closesAt),
      contact_phone: phone,
      contact_email: email,
      cover_image_url: cover,
      inclusions: lines(inclusions),
      exclusions: lines(exclusions),
      itinerary: days.map((d, i) => ({ day: i + 1, title: d.title, details: d.details })),
      form_fields: buildFields(),
      trek_slug: trekSlug || null,
      status,
    };
    try {
      const res = await saveEvent(input, event?.id);
      if (res.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/dashboard/events");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  const updateQ = (key: string, patch: Partial<Q>) => setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  const updateDay = (key: string, patch: Partial<Day>) => setDays((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const iconBtn = "rounded-full p-1.5 text-muted transition hover:bg-sage-50 hover:text-ink disabled:opacity-30";
  const status = event?.status;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      {error && (
        <p role="alert" className="rounded-xl bg-peach-50 px-4 py-3 text-sm text-peach-700">
          {error}
        </p>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Basics</h2>
        <div>
          <label htmlFor="trek" className="label">Linked trek (optional)</label>
          <select id="trek" className="input" value={trekSlug} onChange={(e) => pickTrek(e.target.value)}>
            <option value="">— None / custom trek —</option>
            {treks.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="title" className="label">Title *</label>
          <input id="title" required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" rows={5} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="difficulty" className="label">Difficulty</label>
            <select id="difficulty" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}>
              <option value="">Not specified</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="start" className="label">Start date *</label>
            <input id="start" type="date" required className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="end" className="label">End date *</label>
            <input id="end" type="date" required min={startDate || undefined} className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="meeting" className="label">Meeting point</label>
            <input id="meeting" className="input" value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} />
          </div>
          <div>
            <label htmlFor="city" className="label">City</label>
            <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label htmlFor="price" className="label">Price per person (₹)</label>
            <input id="price" type="number" min={0} className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label htmlFor="advance" className="label">Collect online at booking</label>
            <select id="advance" className="input" value={advance} onChange={(e) => setAdvance(e.target.value)}>
              <option value="100">Full amount (100%)</option>
              {[50, 30, 25, 20, 10].map((p) => (
                <option key={p} value={p}>{p}% advance</option>
              ))}
            </select>
            {Number(price) > 0 && Number(advance) < 100 && (
              <p className="mt-1 text-xs text-muted">
                Trekkers pay ₹{Math.ceil((Number(price) * Number(advance)) / 100).toLocaleString("en-IN")} per person online; you collect the rest.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="seats" className="label">Total seats</label>
            <input id="seats" type="number" min={1} className="input" value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone" className="label">Contact phone</label>
            <input id="phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="label">Contact email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Registration window</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={regOpen} onChange={(e) => setRegOpen(e.target.checked)} className="h-4 w-4 accent-sage-700" />
          Registrations are open
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="opens" className="label">Opens at</label>
            <input id="opens" type="datetime-local" className="input" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="closes" className="label">Closes at</label>
            <input id="closes" type="datetime-local" className="input" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Cover image</h2>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="Cover preview" className="h-40 w-full max-w-sm rounded-xl object-cover" />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Upload cover image"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="btn-secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden /> {uploading ? "Uploading…" : "Upload image"}
          </button>
          {cover && <button type="button" className="btn-ghost" onClick={() => setCover("")}>Remove</button>}
        </div>
        <div>
          <label htmlFor="cover" className="label">…or paste an image URL</label>
          <input id="cover" type="url" placeholder="https://" className="input" value={cover} onChange={(e) => setCover(e.target.value)} />
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="inc" className="label">Inclusions (one per line)</label>
          <textarea id="inc" rows={5} className="input" value={inclusions} onChange={(e) => setInclusions(e.target.value)} />
        </div>
        <div>
          <label htmlFor="exc" className="label">Exclusions (one per line)</label>
          <textarea id="exc" rows={5} className="input" value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Itinerary</h2>
          <button type="button" className="chip" onClick={() => setDays((d) => [...d, { key: uid(), title: "", details: "" }])}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add day
          </button>
        </div>
        {days.length === 0 && <p className="text-sm text-muted">No days added yet.</p>}
        {days.map((d, i) => (
          <div key={d.key} className="rounded-xl border border-line bg-cream/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-sage-700">Day {i + 1}</span>
              <div className="flex">
                <button type="button" className={iconBtn} aria-label={`Move day ${i + 1} up`} disabled={i === 0} onClick={() => setDays((x) => move(x, i, -1))}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className={iconBtn} aria-label={`Move day ${i + 1} down`} disabled={i === days.length - 1} onClick={() => setDays((x) => move(x, i, 1))}><ArrowDown className="h-4 w-4" /></button>
                <button type="button" className={iconBtn} aria-label={`Remove day ${i + 1}`} onClick={() => setDays((x) => x.filter((y) => y.key !== d.key))}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <input aria-label={`Day ${i + 1} title`} placeholder="Title" className="input mb-2" value={d.title} onChange={(e) => updateDay(d.key, { title: e.target.value })} />
            <textarea aria-label={`Day ${i + 1} details`} placeholder="Details" rows={2} className="input" value={d.details} onChange={(e) => updateDay(d.key, { details: e.target.value })} />
          </div>
        ))}
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Registration form</h2>
            <p className="text-sm text-muted">Name, email, phone and number of people are always asked. Add your own questions.</p>
          </div>
          <button
            type="button"
            className="chip"
            onClick={() => setQuestions((q) => [...q, { key: uid(), label: "", type: "text", required: false, optionsText: "" }])}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add question
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            {questions.length === 0 && <p className="text-sm text-muted">No custom questions yet.</p>}
            {questions.map((q, i) => (
              <div key={q.key} className="rounded-xl border border-line bg-cream/60 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                  <input aria-label={`Question ${i + 1} label`} placeholder="Question label" className="input" value={q.label} onChange={(e) => updateQ(q.key, { label: e.target.value })} />
                  <select aria-label={`Question ${i + 1} type`} className="input" value={q.type} onChange={(e) => updateQ(q.key, { type: e.target.value as FormFieldType })}>
                    {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {q.type === "select" && (
                  <input aria-label={`Question ${i + 1} options`} placeholder="Options, comma-separated" className="input mt-2" value={q.optionsText} onChange={(e) => updateQ(q.key, { optionsText: e.target.value })} />
                )}
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-sage-700" checked={q.required} onChange={(e) => updateQ(q.key, { required: e.target.checked })} /> Required
                  </label>
                  <div className="flex">
                    <button type="button" className={iconBtn} aria-label={`Move question ${i + 1} up`} disabled={i === 0} onClick={() => setQuestions((x) => move(x, i, -1))}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" className={iconBtn} aria-label={`Move question ${i + 1} down`} disabled={i === questions.length - 1} onClick={() => setQuestions((x) => move(x, i, 1))}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" className={iconBtn} aria-label={`Remove question ${i + 1}`} onClick={() => setQuestions((x) => x.filter((y) => y.key !== q.key))}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside aria-label="Form preview" className="rounded-xl border border-dashed border-sage-300 bg-sage-50/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-700">Live preview</p>
            <ul className="space-y-2 text-sm">
              {["Full name", "Email", "Phone", "Participants"].map((l) => (
                <li key={l} className="text-muted">{l} <span className="text-peach-700">*</span></li>
              ))}
              {questions.map((q) => (
                <li key={q.key}>
                  <span className="font-medium">{q.label || <em className="text-muted">Untitled question</em>}</span>
                  {q.required && <span className="text-peach-700"> *</span>}
                  <span className="ml-1 text-xs text-muted">({q.type}{q.type === "select" && q.optionsText ? `: ${q.optionsText}` : ""})</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {(!status || status === "draft") && (
          <>
            <button type="button" className="btn-secondary" disabled={!!busy} onClick={() => submit("draft", "draft")}>
              {busy === "draft" ? "Saving…" : "Save as draft"}
            </button>
            <button type="button" className="btn-primary" disabled={!!busy} onClick={() => submit("published", "publish")}>
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
          </>
        )}
        {status && status !== "draft" && (
          <>
            <button type="button" className="btn-primary" disabled={!!busy} onClick={() => submit("keep", "keep")}>
              {busy === "keep" ? "Saving…" : "Save changes"}
            </button>
            {status === "published" && (
              <button type="button" className="btn-secondary" disabled={!!busy} onClick={() => submit("draft", "draft")}>
                Revert to draft
              </button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
