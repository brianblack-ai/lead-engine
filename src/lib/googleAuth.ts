export function getGoogleCreds() {
  const svc = process.env.GOOGLE_SERVICE_ACCOUNT;
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || "";

  // 1) Prefer full JSON blob (no newline drama)
  if (svc) {
    const j = JSON.parse(svc);
    if (!j.client_email || !j.private_key) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT missing client_email or private_key");
    }
    return { client_email: j.client_email as string, private_key: j.private_key as string };
  }

  // 2) Fallback to split vars
  if (email && key) {
    // Normalize literal \n to real newlines if needed
    if (key.includes("\\n")) key = key.replace(/\\n/g, "\n");
    // Ensure header/footer if someone pasted a bare key
    if (!key.includes("BEGIN PRIVATE KEY")) {
      key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----\n`;
    }
    return { client_email: email, private_key: key };
  }

  throw new Error(
    "Missing Google credentials: set GOOGLE_SERVICE_ACCOUNT or (GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)"
  );
}
