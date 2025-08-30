import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: true, service: 'lead-engine', time: new Date().toISOString() },
    { status: 500 }
  );
}
