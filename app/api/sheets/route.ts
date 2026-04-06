import { NextRequest, NextResponse } from 'next/server';

const SHEET_URLS: Record<string, string> = {
  SG: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMmJKk_LNGEKP9vj6o6u2BSpV5m-jC1a53v7oPYKqvOZKAdDDCYZCwdeDSiXHDfOYxgdKgPRomzf-Z/pub?output=csv',
  ID: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vROPYwKEq5NzwUpUCHex7sGZtdL8hHXwnZ5t8bl7H_nlfN7DxkuvonMG65lCDxT_ABcc1BQoQnVaS2l/pub?output=csv',
  JP: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdXIIAA0np27JHfPSTQXDyumVylu_9aUJ6oYDiIaEkTQaeGeLlcovKK40bn32c2_gd_Ja8QlxAZKK/pub?output=csv',
  MY: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMDzy4NikbMIoKT0KtgZH2MmcDqMQ4sTEOvormPRVzK9xLDwM87TZ6LZ7ASoIGtt-UGCTf3KNVz7V4/pub?output=csv',
  PH: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeK6J7RrYqFyu1nczu93ofxt5fSaopQC2Tir-rrb7pMqUJO6BfPNyRtA_D89th8lMm3-m8OMWaRY51/pub?output=csv',
};

function splitCSVLine(line: string): string[] {
  const vals: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  vals.push(cur.trim());
  return vals;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');

  // Find the row that contains 写真URL — this is the real full header
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (lines[i].includes('写真URL')) { headerIdx = i; break; }
  }
  // Fallback: find SEQ row
  if (headerIdx === -1) {
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].startsWith('SEQ,') || lines[i].includes(',SEQ,')) { headerIdx = i; break; }
    }
  }
  if (headerIdx === -1 || lines.length <= headerIdx + 1) return [];

  const headers = splitCSVLine(lines[headerIdx]);

  const results: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const row = Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? '']));
    const seq = row['SEQ']?.trim();
    if (seq && /^\d+$/.test(seq)) {
      results.push(row);
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get('market')?.toUpperCase();
  if (!market || !SHEET_URLS[market]) return NextResponse.json({ error: 'Invalid market' }, { status: 400 });
  try {
    const res = await fetch(SHEET_URLS[market], { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const rows = parseCSV(await res.text());
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
