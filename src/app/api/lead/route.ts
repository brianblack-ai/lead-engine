// src/app/api/lead/route.ts
type Form = {
  eventName: string; orgName: string; contactEmail: string; eventDate?: string;
  guestCount: number; hoursOnsite: number; ledWall: boolean;
  screensCount: number; projectorsCount: number;
  tightWindow: boolean; overnightOrHoliday: boolean; flownElements: boolean; venueRiggingKnown: boolean;
};
type Quote = {
  gearSubtotal: number; laborSubtotal: number; totalMidpoint: number; totalRange: [number, number];
  riskFlags: string[]; details: { techCount: number; billedHoursPerTech: number; overtimeMultiplier: number; laborRate: number; setupStrike?: number };
};

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export async function POST(req: Request) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return new Response(JSON.stringify({ error: "Missing SLACK_WEBHOOK_URL" }), { status: 500 });

  const { form, quote } = (await req.json()) as { form: Form; quote: Quote };
  if (!form?.eventName || !form?.orgName || !form?.contactEmail || !quote?.totalRange) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
  }

  const lines = [
    `*New Lead* — ${form.eventName} (${form.orgName})`,
    `Contact: ${form.contactEmail}${form.eventDate ? `  •  Date: ${form.eventDate}` : ""}`,
    `Guests: ${form.guestCount}  •  Show hours: ${form.hoursOnsite}`,
    `LED wall: ${form.ledWall ? "Yes" : "No"}  •  Screens: ${form.screensCount}  •  Projectors: ${form.projectorsCount}`,
    `Flags: ${
      [
        form.tightWindow && "Tight window",
        form.flownElements && "Flown elements",
        !form.venueRiggingKnown && "Rigging/Power unknown",
        form.overnightOrHoliday && "Overnight/Holiday",
      ].filter(Boolean).join(", ") || "None"
    }`,
    `Quote: ${fmt(quote.totalRange[0])} – ${fmt(quote.totalRange[1])} (mid ${fmt(quote.totalMidpoint)})`,
  ].join("\n");

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lines }),
  });

  const txt = await res.text();             // <-- helpful debug
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Slack webhook failed", status: res.status, txt }), { status: 502 });
  }
  return Response.json({ ok: true });
}
