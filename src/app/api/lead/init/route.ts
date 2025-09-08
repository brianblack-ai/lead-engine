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
  await appendLeadRow([
    name, email, JSON.stringify(rest), now, "", "", // A–F: adjust to your headers
    "false", "", token, new Date(exp).toISOString()  // G–J: Verified, VerifiedAt, VerifyToken, TokenExpiresAt
  ]);

  await sendMagicLink(email, verifyUrl);
  return NextResponse.json({ ok: true });
}