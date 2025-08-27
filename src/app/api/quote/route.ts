type Body = {
  eventName: string; orgName: string; contactEmail: string; eventDate?: string;
  guestCount: number; hoursOnsite: number; ledWall: boolean;
  screensCount: number; projectorsCount: number; tightWindow: boolean;
  overnightOrHoliday: boolean; flownElements: boolean; venueRiggingKnown: boolean;
};

const num = (n: any, d = 0) => { const v = Number(n); return Number.isFinite(v) ? v : d; };

// Setup/strike tiers by guest count (tweak later if needed)
function setupStrikeHours(guests: number): number {
  if (guests <= 100) return 1;
  if (guests <= 300) return 2;
  if (guests <= 600) return 3;
  if (guests <= 1000) return 4;
  return 5;
}

export async function POST(req: Request) {
  const b = (await req.json()) as Partial<Body>;

  const guestCount = num(b.guestCount);
  const hoursOnsite = num(b.hoursOnsite);
  if (!b.eventName || !b.orgName || !b.contactEmail || guestCount <= 0 || hoursOnsite <= 0) {
    return new Response(JSON.stringify({ error: "Invalid or missing fields" }), { status: 400 });
  }

  // --- Gear ---
  const ledWallCost = b.ledWall ? 3500 : 0;
  const screensCost = num(b.screensCount) * 200;
  const projectorsCost = num(b.projectorsCount) * 450;
  const gearSubtotal = ledWallCost + screensCost + projectorsCost;

  // --- Labor ---
  let techCount = 2 + (b.ledWall ? 2 : 0) + Math.ceil((num(b.screensCount) + num(b.projectorsCount)) / 3);
  if (b.tightWindow) techCount += 1;
  if (b.flownElements) techCount += 1;

  const setupStrike = setupStrikeHours(guestCount);
  const billedHoursPerTech = Math.max(5, hoursOnsite + setupStrike);

  let overtimeMultiplier = 1;
  if (b.overnightOrHoliday) overtimeMultiplier = 2;
  else if (billedHoursPerTech > 10) overtimeMultiplier = 1.5;

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
    gearSubtotal: Math.round(gearSubtotal),
    laborSubtotal: Math.round(laborSubtotal),
    totalMidpoint: Math.round(midpoint),
    totalRange,
    riskFlags,
    details: { techCount, billedHoursPerTech, overtimeMultiplier, laborRate, setupStrike }
  });
}
