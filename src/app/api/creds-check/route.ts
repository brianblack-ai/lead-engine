import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const mask = (v?: string) =>
    v ? (v.length > 6 ? v.slice(0, 3) + "…" + v.slice(-2) : "***") : null;

  return NextResponse.json({
    ok: true,
    env: {
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL || null,
      GOOGLE_PRIVATE_KEY: mask(process.env.GOOGLE_PRIVATE_KEY),
      GOOGLE_SERVICE_ACCOUNT: mask(process.env.GOOGLE_SERVICE_ACCOUNT),
      RESEND_API_KEY: mask(process.env.RESEND_API_KEY),
      RESEND_API_KEY_PREVIEW: mask(process.env.RESEND_API_KEY_PREVIEW),
      LEAD_ENGINE_MAGIC_TOKEN_SECRET: mask(process.env.LEAD_ENGINE_MAGIC_TOKEN_SECRET),
      SHEET_ID: process.env.SHEET_ID || null,
    },
  });
}
