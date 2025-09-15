import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const svc = process.env.GOOGLE_SERVICE_ACCOUNT || "";
  let svcOk = false;
  if (svc) {
    try {
      const p = JSON.parse(svc);
      svcOk = Boolean(p?.client_email && p?.private_key);
    } catch {}
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL || "";
  let key = process.env.GOOGLE_PRIVATE_KEY || "";
  if (key.includes("\\n") && !key.includes("\n")) key = key.replace(/\\n/g, "\n");
  const pairOk = Boolean(email && key.startsWith("-----BEGIN"));

  const ok = svcOk || pairOk;

  return NextResponse.json(
    {
      ok,
      using: svcOk ? "GOOGLE_SERVICE_ACCOUNT" : pairOk ? "CLIENT_EMAIL+PRIVATE_KEY" : "none",
      present: {
        GOOGLE_SERVICE_ACCOUNT: Boolean(svc),
        GOOGLE_CLIENT_EMAIL:   Boolean(email),
        GOOGLE_PRIVATE_KEY:    Boolean(process.env.GOOGLE_PRIVATE_KEY),
      },
    },
    { status: ok ? 200 : 500 }
  );
}
