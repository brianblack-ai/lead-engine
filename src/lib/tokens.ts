import crypto from "crypto";
const secret = process.env.LEAD_ENGINE_MAGIC_TOKEN_SECRET!;
export function createToken(email: string, ttlMinutes = 30) {
  const exp = Date.now() + ttlMinutes * 60_000;
  const payload = `${email}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { token: `${payload}.${sig}`, exp };
}
export function verifyToken(token: string) {
  const [email, expStr, sig] = token.split(".");
  if (!email || !expStr || !sig) return null;
  const payload = `${email}.${expStr}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  if (Date.now() > Number(expStr)) return null;
  return { email };
}