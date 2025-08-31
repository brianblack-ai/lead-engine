import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name = '', email = '', company = '', estimate = '', source = 'web' } = body || {};

    // 1) Auth with service account from env
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
    const jwt = new google.auth.JWT(
      creds.client_email,
      undefined,
      (creds.private_key || '').replace(/\\n/g, '\n'), // Vercel newline fix
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    // 2) Build one row
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const values = [[timestamp, name, email, company, String(estimate), source]]; // A:F

    // 3) Append to the Sheet
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID!,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json(
      { ok: true, range: res.data.updates?.updatedRange ?? null },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('lead append error:', err?.message || err);
    return NextResponse.json({ ok: false, error: 'sheet_append_failed' }, { status: 500 });
  }
}

