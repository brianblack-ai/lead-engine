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

    // --- Load Google credentials (supports both styles) ---
    let creds: { client_email: string; private_key: string };

    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      // Case A: full JSON string in one env var
      creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
      console.log('[lead] creds mode = full JSON');
    } else {
      // Case B: split env vars
      creds = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL || '',
        // IMPORTANT: turn the literal "\n" back into newlines
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
      };
      console.log('[lead] creds mode = split vars');
    }

    if (!creds.client_email || !creds.private_key) {
      throw new Error('Google credentials are missing');
    }

    const jwt = new google.auth.JWT(
      creds.client_email,
      undefined,
      creds.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    await jwt.authorize();

    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
    });

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, company, String(estimate), source]],
      },
    });

    return NextResponse.json(
      { ok: true, range: res.data.updates?.updatedRange ?? null },
      { status: 200, headers: cors as any },
    );
  } catch (err: any) {
    console.error('lead append error:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500, headers: cors as any },
    );
  }
}
