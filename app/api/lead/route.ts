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
export async function POST(req: Request) {
  try {
    sanity("POST-check");

    // 1) Read body + log what keys actually arrived
    const body = await req.json();
  console.log("[lead] body keys ->", Object.keys(body));

const name     = body.name ?? "";
const email    = body.email ?? "";
const company  = body.company ?? body.org ?? body.organization ?? body.companyName ?? "";
const estimate = body.estimate ?? body.quote ?? body.estimateRange ?? body.budget ?? "";
const source   = body.source ?? body.utm_source ?? "web";

// 1) Minimal validation
if (!name || !email) {
  return new Response(JSON.stringify({ ok: false, error: "name and email are required" }), {
    status: 400, headers: { "content-type": "application/json" }
  });
}

// 3) Optional: pin to a specific tab (e.g., "Leads")
//   const rangeRef = "Leads!A:F";  // <- if your sheet tab is named "Leads"
const rangeRef = "A:F";             // <- current behavior (first sheet)

// Append to Sheets
const spreadsheetId = process.env.SHEET_ID!;
const sheets = await getSheets();
const values = [[
  new Date().toISOString(), // A Timestamp
  name,                     // B Name
  email,                    // C Email
  company,                  // D Company
  estimate,                 // E Estimate
  source                    // F Source
]];
const appendRes = await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: rangeRef,
  valueInputOption: "RAW",
  requestBody: { values },
});

// 2) Slack notify (best-effort, don't fail the request if Slack is down)
try {
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎯 *New Lead*  
*Name:* ${name}
*Email:* ${email}
*Company:* ${company || "—"}
*Estimate:* ${estimate || "—"}
*Source:* ${source}`
      }),
    });
  }
} catch (e) {
  console.warn("[lead] slack notify failed:", (e as Error).message);
}

return new Response(
  JSON.stringify({ ok: true, updatedRange: appendRes.data.updates?.updatedRange }),
  { status: 200, headers: { "content-type": "application/json" } }
);

