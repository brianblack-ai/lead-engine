// app/api/lead/route.ts
import { google } from "googleapis";

export const runtime = "nodejs";

// --- helpers ---
function getPrivateKey(): string {
  // Supports BOTH styles:
  // 1) Multi-line PEM pasted in Vercel
  // 2) Single-line with literal "\n"
  const raw = (process.env.GOOGLE_PRIVATE_KEY || "").trim().replace(/^"|"$/g, "");
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function sanity(label = "pre-jwt") {
  const k = getPrivateKey();
  const looksPEM =
    k.startsWith("-----BEGIN PRIVATE KEY-----") && k.includes("-----END PRIVATE KEY-----");
  console.log("[lead] sanity:", {
    label,
    hasKey: !!k,
    len: k.length,
    nlCount: (k.match(/\n/g) || []).length,
    looksPEM,
    hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasSheetId: !!process.env.SHEET_ID,
  });
}

async function getSheets() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = getPrivateKey();
  if (!email || !key) throw new Error("missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// --- routes ---
export async function GET() {
  sanity("GET-check");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    sanity("POST-check");

    const { name = "", email = "", message = "", source = "web" } = await req.json();

    const spreadsheetId = process.env.SHEET_ID;
    if (!spreadsheetId) throw new Error("missing SHEET_ID");

    const sheets = await getSheets();

    const rows = [[new Date().toISOString(), name, email, message, source]];
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A1",
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });

    return new Response(
      JSON.stringify({ ok: true, updatedRange: res.data.updates?.updatedRange }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[lead] error:", err?.message);
    return new Response(
      JSON.stringify({ ok: false, error: `lead append error: ${err?.message || "unknown"}` }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
