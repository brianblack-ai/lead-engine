import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export function makeGoogleAuth() {
  let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
  let privateKey  = process.env.GOOGLE_PRIVATE_KEY  || "";

  // Fallback to GOOGLE_SERVICE_ACCOUNT JSON if pair not provided
  if ((!clientEmail || !privateKey) && process.env.GOOGLE_SERVICE_ACCOUNT) {
    try {
      const svc = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
      clientEmail = clientEmail || svc.client_email;
      privateKey  = privateKey  || svc.private_key;
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT is not valid JSON");
    }
  }

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials: set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT");
  }

  // Normalize escaped newlines in the key
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.JWT(clientEmail, undefined, privateKey, SCOPES);
}