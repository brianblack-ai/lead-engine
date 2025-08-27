export async function GET() {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return new Response("Missing SLACK_WEBHOOK_URL", { status: 500 });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Ping from Next.js ✅" }),
  });

  return new Response(res.ok ? "ok" : "slack failed", { status: res.ok ? 200 : 502 });
}
