// app/api/lead/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors as any });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name = '', email = '', company = '', estimate = '', source = 'web' } = body || {};

    const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('missing GOOGLE_SERVICE_ACCOUNT env');

    const creds = JSON.parse(raw);
    const jwt = new google.auth.JWT(
      creds.client_email,
      undefined,
      (creds.private_key || '').replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    // 🔑 Ensure we actually obtain an access token (throws if creds/API wrong)
    await jwt.authorize();

    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID!,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[timestamp, name, email, company, String(estimate), source]] },
    });

    return NextResponse.json(
      { ok: true, range: res.data.updates?.updatedRange ?? null },
      { status: 200, headers: cors as any }
    );
  } catch (err: any) {
    console.error('lead append error:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500, headers: cors as any }
    );
  }
}

  }
}

