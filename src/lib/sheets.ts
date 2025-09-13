import { google } from "googleapis";
import { makeGoogleAuth } from "@/lib/googleAuth";

const auth = makeGoogleAuth();
const sheets = google.sheets({ version: "v4", auth });

const SHEET_ID = process.env.SHEET_ID!;
const TAB = "Sheet1";                 // change to your actual tab name if different
const RANGE = `${TAB}!A:Z`;

export async function appendLeadRow(values: (string | number | boolean)[]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function getAllRows() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });
  return res.data.values ?? [];
}

export async function updateRow(rowIndex1Based: number, row: any[]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A${rowIndex1Based}:Z${rowIndex1Based}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}