export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { appendLeadRow } from "@/lib/sheets";
import { createToken } from "@/lib/tokens";
import { sendMagicLink } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name = "", email = "", ...rest } = body;
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  const { token, exp } = createToken(email);

  const url = new URL(req.url);
  const base = process.env.APP_URL ?? `https://${url.host}`;
  const verifyUrl = `${base}/api/lead/verify?token=${encodeURIComponent(token)}`;

  const now = new Date().toISOString();
  await appendLeadRow([
    name, email, JSON.stringify(rest), now, "", "",
    "false", "", token, new Date(exp).toISOString()
  ]);

  await sendMagicLink(email, verifyUrl);
  return NextResponse.json({ ok: true });
}