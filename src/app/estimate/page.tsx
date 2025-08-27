"use client";
import { useMemo, useState } from "react";

type Num = number | "";
type FormState = {
  eventName: string; orgName: string; contactEmail: string; eventDate: string;
  guestCount: Num; hoursOnsite: Num; ledWall: boolean;
  screensCount: Num; projectorsCount: Num;
  tightWindow: boolean; overnightOrHoliday: boolean; flownElements: boolean; venueRiggingKnown: boolean;
};
type QuoteResponse = {
  gearSubtotal: number; laborSubtotal: number; totalMidpoint: number; totalRange: [number, number];
  riskFlags: string[]; details: { techCount: number; billedHoursPerTech: number; overtimeMultiplier: number; laborRate: number };
};
const toNum = (v: string): Num => (v === "" ? "" : Math.max(0, Number(v)));
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Page() {
  const [form, setForm] = useState<FormState>({
    eventName: "", orgName: "", contactEmail: "", eventDate: "",
    guestCount: "", hoursOnsite: "", ledWall: false,
    screensCount: "", projectorsCount: "", tightWindow: false, overnightOrHoliday: false,
    flownElements: false, venueRiggingKnown: false,
  });
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leadSent, setLeadSent] = useState(false);
	
  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(form.contactEmail), [form.contactEmail]);
  const isValid = useMemo(() => {
    const guest = Number(form.guestCount); const hours = Number(form.hoursOnsite);
    return form.eventName.trim() && form.orgName.trim() && emailOk && Number.isFinite(guest) && guest > 0 && Number.isFinite(hours) && hours > 0;
  }, [form, emailOk]) as boolean;

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!isValid) return;
    setLoading(true); setError(null); setQuote(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
// Post the lead + quote to Slack
const leadRes = await fetch("/api/lead", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    form: {
      ...form,
      guestCount: Number(form.guestCount),
      hoursOnsite: Number(form.hoursOnsite),
      screensCount: Number(form.screensCount || 0),
      projectorsCount: Number(form.projectorsCount || 0),
    },
    quote: data,
  }),
});
if (!leadRes.ok) console.warn("Lead post failed:", await leadRes.text());
setLeadSent(true);
    } catch (err: any) { setError(err?.message || "Request failed"); }
    finally { setLoading(false); }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">AV Budget Reality Check</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 col-span-2">
            <span className="text-sm font-medium">Event name *</span>
            <input className="border rounded-md p-2" value={form.eventName} onChange={(e)=>update("eventName", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Organization *</span>
            <input className="border rounded-md p-2" value={form.orgName} onChange={(e)=>update("orgName", e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Contact email *</span>
            <input type="email" className="border rounded-md p-2" value={form.contactEmail} onChange={(e)=>update("contactEmail", e.target.value)} required />
            {!emailOk && form.contactEmail.length > 0 && <span className="text-xs text-red-600">Enter a valid email.</span>}
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Event date (optional)</span>
            <input type="date" className="border rounded-md p-2" value={form.eventDate} onChange={(e)=>update("eventDate", e.target.value)} />
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Guest count *</span>
            <input type="number" min="1" className="border rounded-md p-2" value={form.guestCount as any} onChange={(e)=>update("guestCount", toNum(e.target.value))} required />
          </label>
          <label className="grid gap-1">
  <span className="text-sm font-medium">
    Show hours (rehearsal → end of show) *
  </span>
  <input
    type="number"
    min="1"
    className="border rounded-md p-2"
    value={form.hoursOnsite as any}
    onChange={(e) => update("hoursOnsite", toNum(e.target.value))}
    placeholder="e.g., 6"
    required
  />
</label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.ledWall} onChange={(e)=>update("ledWall", e.target.checked)} />
            <span>LED wall</span>
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Screens (qty)</span>
            <input type="number" min="0" className="border rounded-md p-2" value={form.screensCount as any} onChange={(e)=>update("screensCount", toNum(e.target.value))} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Projectors (qty)</span>
            <input type="number" min="0" className="border rounded-md p-2" value={form.projectorsCount as any} onChange={(e)=>update("projectorsCount", toNum(e.target.value))} />
          </label>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.tightWindow} onChange={(e)=>update("tightWindow", e.target.checked)} /><span>Tight load-in/out window</span></label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.overnightOrHoliday} onChange={(e)=>update("overnightOrHoliday", e.target.checked)} /><span>Overnight / holiday hours</span></label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.flownElements} onChange={(e)=>update("flownElements", e.target.checked)} /><span>Flown elements (rigging)</span></label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.venueRiggingKnown} onChange={(e)=>update("venueRiggingKnown", e.target.checked)} /><span>Venue rigging/power known</span></label>
        </section>

        <button type="submit" disabled={!isValid || loading}
          className={"rounded-lg px-5 py-3 text-white " + (isValid && !loading ? "bg-black" : "bg-gray-400 cursor-not-allowed")}>
          {loading ? "Calculating…" : "Get Estimate"}
        </button>
      </form>

      {error && <div className="border border-red-300 bg-red-50 p-3 rounded-md text-sm">{String(error)}</div>}
      {quote && (
        <section className="border rounded-md p-4 space-y-2">
          <h2 className="font-semibold">Estimated Range</h2>
          <p>{fmt(quote.totalRange[0])} – {fmt(quote.totalRange[1])} (midpoint {fmt(quote.totalMidpoint)})</p>
          <p className="text-sm">Gear: {fmt(quote.gearSubtotal)} · Labor: {fmt(quote.laborSubtotal)}</p>
          <p className="text-sm">Techs: {quote.details.techCount} · Billed hours/tech: {quote.details.billedHoursPerTech} · Multiplier: {quote.details.overtimeMultiplier}×</p>
          {quote.riskFlags.length > 0 && <ul className="list-disc pl-5 text-sm">{quote.riskFlags.map((r) => <li key={r}>{r}</li>)}</ul>}
        </section>
      )}
    </main>
  );
}
