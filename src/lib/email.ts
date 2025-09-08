import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.FROM_EMAIL || "no-reply@notify.brianblack.ai";

export async function sendMagicLink(to: string, url: string) {
  await resend.emails.send({
    from: `Lead Engine <${FROM}>`,
    to,
    subject: "Verify your email to view your estimate",
    html: `<p>Tap to verify:</p><p><a href="${url}">${url}</a></p>`
  });
}