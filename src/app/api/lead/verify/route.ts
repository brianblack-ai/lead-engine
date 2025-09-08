export const runtime = "nodejs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAllRows, updateRow } from "@/lib/sheets";
import { verifyToken } from "@/lib/tokens";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const v = verifyToken(token);
  if (!v) return NextResponse.redirect(new URL("/verify-failed", process.env.APP_URL!));

  const rows = await getAllRows();
  const H = rows[0];
  const iToken = H.indexOf("VerifyToken");
  const iVerified = H.indexOf("Verified");
  const iVerifiedAt = H.indexOf("VerifiedAt");
  if (iToken < 0 || iVerified < 0) return NextResponse.redirect(new URL("/verify-failed", process.env.APP_URL!));

  let idx = -1;
  for (let r = 1; r < rows.length; r++) if (rows[r][iToken] === token) { idx = r + 1; break; }
  if (idx < 0) return NextResponse.redirect(new URL("/verify-failed", process.env.APP_URL!));

  const row = rows[idx - 1];
  row[iVerified] = "true";
  if (iVerifiedAt >= 0) row[iVerifiedAt] = new Date().toISOString();
  await updateRow(idx, row);

  cookies().set("verifiedLead", "1", { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
  return NextResponse.redirect(new URL("/estimate", process.env.APP_URL!));
}