// app/api/lead/route.ts
import { google } from "googleapis";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";             // IMPORTANT: Google auth needs Node, not Edge
export const dynamic = "force-dynamic";

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY || "";
  // Handle three common cases:
  // 1) Real multiline key (Vercel "Paste" with \n): needs \\n -> \n
  // 2) Already-correct newlines: leave as-is
  // 3) Accidentally double-escaped or quoted: trim quotes
  const trimmed = raw.trim().replace(/^"|"$/g, ""); // strip wrapping quotes if any
  // If you pasted with literal "\n", Node reads them as \\n characters.
  const normalized =
    trimmed.includes("\\n") ? trimmed.replace(/\\n/g, "\n") : trimmed;
  return normalized;
}

function envSanity() {
  const key = getPrivateKey();
  const starts = key.startsWith("-----BEGIN PRIVATE KEY-----");
  const ends = key.endsWith("-----END PRIVATE KEY-----\n") || key.endsWith("-----END PRIVATE KEY-----");
  const len = key.length;
  // DO NOT log the key; just shape checks:
  console.log("[lead] env check:", {
    hasKey: Boolean(key),
    keyLooksPEM: starts && ends,
    keyLen: len,
    hasClientEmail: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
    hasSheetId: Boolean(process.env.SHEET_ID),
    runtime: process.env.VERCEL ? "vercel" : "local",
  });
  return starts && ends && len > 1000; // a PEM is typically > 1000 chars
}

async function getSheets() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();
  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function POST(req: NextRequest) {
  try {
    envSanity(); // logs shape once per invocation

    const body = await req.json().catch(() => ({}));
    // Minimal example payload; extend as needed:
    const { name = "", email = "", message = "", source = "web" } = body;

    const SHEET_ID = process.env.SHEET_ID;
    if (!SHEET_ID) throw new Error("Missing SHEET_ID");

    const sheets = await getSheets();

    // Append to first sheet, columns A:D (adjust range to your sheet/tab)
    const rows = [[new Date().toISOString(), name, email, message, source]];
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "A1",
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });

    return new Response(
      JSON.stringify({ ok: true, updatedRange: res.data.updates?.updatedRange }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    // Bubble up precise, sanitized error
    console.error("[lead] error:", { message: err?.message, stack: err?.stack });
    const msg =
      err?.message === "Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY"
        ? "lead append error: missing credentials"
        : err?.message?.includes("PERMISSION")
        ? "lead append error: service account lacks Editor on the Sheet"
        : `lead append error: ${err?.message || "unknown"}`;
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET() {
  // Quick ping for debugging
  const ok = Boolean(process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL && process.env.SHEET_ID);
  return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 500 });
}
