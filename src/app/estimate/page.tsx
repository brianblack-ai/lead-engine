type Body = {
  eventName: string;
  orgName: string;
  contactEmail: string;
  eventDate?: string;
  guestCount: number;
  hoursOnsite: number;
  ledWall: boolean;
  screensCount: number;
  projectorsCount: number;
  tightWindow: boolean;
  overnightOrHoliday: boolean;
  flownElements: boolean;
  venueRiggingKnown: boolean;
};

function num(n: any, d=0){ const v = Number(n); return Number.isFinite(v) ? v : d; }

export async function POST(req: Request) {
  const b = (await req.json()) as Partial<Body>;

  // Basic validation
  const guestCount = num(b.guestCount);
  const hoursOnsite = num(b.hoursOnsite);
  if (!b.eventName || !b.orgName || !b.contactEmail || guestCount <= 0 || hoursOnsite <= 0) {
    return new Response(JSON.stringify({ error: "Invalid or missing fields" }), { status: 400 });
  }

  // --- Gear estimate (simple but credible placeholders) ---
  const ledWallCost = b.ledWall ? 3500 : 0;             // LED wall package
  const screensCost = num(b.screensCount) * 200;         // TVs w/ stands
  const projectorsCost = num(b.projectorsCount) * 450;   // mid-lumen units
  const gearSubtotal = ledWallCost + screensCost + projectorsCost;

  // --- Labor estimate rules ---
  // $90/hr per tech, 5-hr minimum per tech per call
  // 1.5x if >10h; 2x if overnight/holiday (use the higher multiplier)
  let techCount =
    2 + (b.ledWall ? 2 : 0) +
    Math.ceil(num(b.screensCount + b.projectorsCount) / 3);

  if (b.tightWindow) techCount += 1;
  if (b.flownElements) techCount += 1;

  const baseHours = hoursOnsite + 2; // simple setup/strike allowance
  const billedHoursPerTech = Math.max(5, baseHours);

  let overtimeMultiplier = 1;
  if (b.overnightOrHoliday) overtimeMultiplier = 2;
  else if (billedHoursPerTech > 10) overtimeMultiplier = Math.max(overtimeMultiplier, 1.5);

  const laborRate = 90;
  const laborSubtotal = techCount * billedHoursPerTech * laborRate * overtimeMultiplier;

  const midpoint = gearSubtotal + laborSubtotal;
  const totalRange: [number, number] = [Math.round(midpoint * 0.9), Math.round(midpoint * 1.15)];

  const riskFlags: string[] = [];
  if (b.tightWindow) riskFlags.push("Tight load-in/out window");
  if (b.flownElements) riskFlags.push("Flown elements (rigging)");
  if (!b.venueRiggingKnown) riskFlags.push("Venue power/rigging unknown");
  if (b.overnightOrHoliday) riskFlags.push("Overnight/holiday rates");

  return Response.json({
    gearSubtotal: M
@'
"use client";
import { useMemo, useState } from "react";

type Num = number | "";
type FormState = {
  eventName: string;
  orgName: string;
  contactEmail: string;
  eventDate: string;
  guestCount: Num;
  hoursOnsite: Num;
  ledWall: boolean;
  screensCount: Num;
  projectorsCount: Num;
  tightWindow: boolean;
  overnightOrHoliday: boolean;
  flownElements: boolean;
  venueRiggingKnown: boolean;
};

type QuoteResponse = {
  gearSubtotal: number;
  laborSubtotal: number;
  totalMidpoint: number;
  totalRange: [number, number];
  riskFlags: string[];
  details: { techCount: number; billedHoursPerTech: number; overtimeMultiplier: number; laborRate: number; };
};

const toNum = (v: string): Num => (v === "" ? "" : Math.max(0, Number(v)));
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Page() {
  const [form, setForm] = useState<FormState>({
    eventName: "",
    orgName: "",
    contactEmail: "",
    eventDate: "",
    guestCount: "",
    hoursOnsite: "",
    ledWall: false,
    screensCount: "",
    projectorsCount: "",
    tightWindow: false,
    overnightOrHoliday: false,
    flownElements: false,
    venueRiggingKnown: false,
  });
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(form.contactEmail), [form.contactEmail]);

  const isValid = useMemo(() => {
    const guest = Number(form.guestCount);
    const hours = Number(form.hoursOnsite);
    return (
      form.eventName.trim().length > 0 &&
      form.orgName.trim().length > 0 &&
      emailOk &&
      !Number.isNaN(guest) && guest > 0 &&
      !Number.isNaN(hours) && hours > 0
    );
  }, [form, emailOk]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true); setError(null); setQuote(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          hoursOnsite: Number(form.hoursOnsite),
          screensCount: Number(form.screensCount || 0),
          projectorsCount: Number(form.projectorsCount || 0),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as QuoteResponse;
      setQuote(data);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">AV Budget Reality Check</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Contact & Context */}
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 col-span-2">
            <span className="text-sm font-medium">Event name *</span>
            <input className="border rounded-md p-2"
              value={form.eventName} onChange={(e)=>update("eventName", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Organization *</span>
            <input className="border rounded-md p-2"
              value={form.orgName} onChange={(e)=>update("orgName", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Contact email *</span>
            <input type="email" className="border rounded-md p-2"
              value={form.contactEmail} onChang
@'
"use client";
import { useMemo, useState } from "react";

type Num = number | "";
type FormState = {
  eventName: string;
  orgName: string;
  contactEmail: string;
  eventDate: string;
  guestCount: Num;
  hoursOnsite: Num;
  ledWall: boolean;
  screensCount: Num;
  projectorsCount: Num;
  tightWindow: boolean;
  overnightOrHoliday: boolean;
  flownElements: boolean;
  venueRiggingKnown: boolean;
};

type QuoteResponse = {
  gearSubtotal: number;
  laborSubtotal: number;
  totalMidpoint: number;
  totalRange: [number, number];
  riskFlags: string[];
  details: { techCount: number; billedHoursPerTech: number; overtimeMultiplier: number; laborRate: number; };
};

const toNum = (v: string): Num => (v === "" ? "" : Math.max(0, Number(v)));
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Page() {
  const [form, setForm] = useState<FormState>({
    eventName: "",
    orgName: "",
    contactEmail: "",
    eventDate: "",
    guestCount: "",
    hoursOnsite: "",
    ledWall: false,
    screensCount: "",
    projectorsCount: "",
    tightWindow: false,
    overnightOrHoliday: false,
    flownElements: false,
    venueRiggingKnown: false,
  });
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(form.contactEmail), [form.contactEmail]);

  const isValid = useMemo(() => {
    const guest = Number(form.guestCount);
    const hours = Number(form.hoursOnsite);
    return (
      form.eventName.trim().length > 0 &&
      form.orgName.trim().length > 0 &&
      emailOk &&
      !Number.isNaN(guest) && guest > 0 &&
      !Number.isNaN(hours) && hours > 0
    );
  }, [form, emailOk]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true); setError(null); setQuote(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          hoursOnsite: Number(form.hoursOnsite),
          screensCount: Number(form.screensCount || 0),
          projectorsCount: Number(form.projectorsCount || 0),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as QuoteResponse;
      setQuote(data);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">AV Budget Reality Check</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Contact & Context */}
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 col-span-2">
            <span className="text-sm font-medium">Event name *</span>
            <input className="border rounded-md p-2"
              value={form.eventName} onChange={(e)=>update("eventName", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Organization *</span>
            <input className="border rounded-md p-2"
              value={form.orgName} onChange={(e)=>update("orgName", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Contact email *</span>
            <input type="email" className="border rounded-md p-2"
              value={form.contactEmail} onChange={(e)=>update("contactEmail", e.target.value)} required />
            {!emailOk && form.contactEmail.length > 0 && (
              <span className="text-xs text-red-600">Enter a valid email.</span>
            )}
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Event date (optional)</span>
            <input type="date" className="border rounded-md p-2"
              value={form.eventDate} onChange={(e)=>update("eventDate", e.target.value)} />
          </label>
        </section>

        {/* Attendance & Hours */}
        <section className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Guest count *</span>
            <input type="number" min="1" className="border rounded-md p-2"
              value={form.guestCount as any} onChange={(e)=>update("guestCount", toNum(e.target.value))} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Hours on-site *</span>
            <input type="number" min="1" className="border rounded-md p-2"
              value={form.hoursOnsite as any} onChange={(e)=>update("hoursOnsite", toNum(e.target.value))} required />
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.ledWall} onChange={(e)=>update("ledWall", e.target.checked)} />
            <span>LED wall</span>
          </label>
        </section>

        {/* Gear counts */}
        <section className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Screens (qty)</span>
            <input type="number" min="0" className="border rounded-md p-2"
              value={form.screensCount as any} onChange={(e)=>update("screensCount", toNum(e.target.value))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Projectors (qty)</span>
            <input type="number" min="0" className="border rounded-md p-2"
              value={form.projectorsCount as any} onChange={(e)=>update("projectorsCount", toNum(e.target.value))} />
          </label>
        </section>

        {/* Risk flags */}
        <section className="grid gap-3 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.tightWindow} onChange={(e)=>update("tightWindow", e.target.checked)} />
            <span>Tight load-in/load-out window</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.overnightOrHoliday} onChange={(e)=>update("overnightOrHoliday", e.target.checked)} />
            <span>Overnight / holiday hours</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.flownElements} onChange={(e)=>update("flownElements", e.target.checked)} />
            <span>Flown elements (rigging)</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.venueRiggingKnown} onChange={(e)=>update("venueRiggingKnown", e.target.checked)} />
            <span>Venue rigging/power known</span>
          </label>
        </section>

        <button
          type="submit"
          disabled={!isValid || loading}
          className={"rounded-lg px-5 py-3 text-white " + (isValid && !loading ? "bg-black" : "bg-gray-400 cursor-not-allowed")}
        >
          {loading ? "Calculating…" : "Get Estimate"}
        </button>
      </form>

      {/* Results */}
      {error && <div className="border border-red-300 bg-red-50 p-3 rounded-md text-sm">{String(error)}</div>}

      {quote && (
        <section className="border rounded-md p-4 space-y-2">
          <h2 className="font-semibold">Estimated Range</h2>
          <p>{fmt(quote.totalRange[0])} – {fmt(quote.totalRange[1])} (midpoint {fmt(quote.totalMidpoint)})</p>
          <p className="text-sm">Gear: {fmt(quote.gearSubtotal)} &middot; Labor: {fmt(quote.laborSubtotal)}</p>
          <p className="text-sm">
            Techs: {quote.details.techCount} &middot; Billed hours/tech: {quote.details.billedHoursPerTech} &middot; Multiplier: {quote.details.overtimeMultiplier}×
          </p>
          {quote.riskFlags.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {quote.riskFlags.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
        </section>
      )}

      <details className="border rounded-md p-3">
        <summary className="cursor-pointer font-medium">Debug: form JSON</summary>
        <pre className="text-xs overflow-x-auto">{JSON.stringify(form, null, 2)}</pre>
      </details>
    </main>
  );
}
