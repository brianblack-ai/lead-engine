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
  const verifyUrl = `${process.env.APP_URL}/api/lead/verify?token=${encodeURIComponent(token)}`;

  const now = new Date().toISOString();
  // A–F: your existing columns; G–J: new verification columns
  await appendLeadRow([
    name, email, JSON.stringify(rest), now, "", "",   // A–F placeholders
    "false", "", token, new Date(exp).toISOString()   // G Verified, H VerifiedAt, I VerifyToken, J TokenExpiresAt
  ]);

  await sendMagicLink(email, verifyUrl);
  return NextResponse.json({ ok: true });
}