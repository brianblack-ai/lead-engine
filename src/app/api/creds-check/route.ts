import { getGoogleCreds } from "@/lib/googleAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { client_email, private_key } = getGoogleCreds();
    return Response.json({
      ok: true,
      client_email_present: !!client_email,
      private_key_len: private_key?.length ?? 0
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
