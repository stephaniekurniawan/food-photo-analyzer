import { NextRequest, NextResponse } from 'next/server';
import type { FoodPhoto } from '@/types';

const SHEET_URLS: Record<string, string> = {
  SG: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMmJKk_LNGEKP9vj6o6u2BSpV5m-jC1a53v7oPYKqvOZKAdDDCYZCwdeDSiXHDfOYxgdKgPRomzf-Z/pub?output=csv',
  ID: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vROPYwKEq5NzwUpUCHex7sGZtdL8hHXwnZ5t8bl7H_nlfN7DxkuvonMG65lCDxT_ABcc1BQoQnVaS2l/pub?output=csv',
  JP: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdXIIAA0np27JHfPSTQXDyumVylu_9aUJ6oYDiIaEkTQaeGeLlcovKK40bn32c2_gd_Ja8QlxAZKK/pub?output=csv',
  MY: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMDzy4NikbMIoKT0KtgZH2MmcDqMQ4sTEOvormPRVzK9xLDwM87TZ6LZ7ASoIGtt-UGCTf3KNVz7V4/pub?output=csv',
  PH: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeK6J7RrYqFyu1nczu93ofxt5fSaopQC2Tir-rrb7pMqUJO6BfPNyRtA_D89th8lMm3-m8OMWaRY51/pub?output=csv',
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const u = lines[i].toUpperCase();
    if (u.includes('SEQ') && (u.includes('COUNTRY') || u.includes('\u5199\u771fURL'))) {
      headerIdx = i; break;
    }
  }
  if (headerIdx < 0) return [];
  const parseRow = (line: string) => {
    const vals: string[] = []; let cur = ''; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    return vals;
  };
  const headers = parseRow(lines[headerIdx]).map(h => h.replace(/^"|"$/g, ''));
  const results: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseRow(lines[i]);
    const row = Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? '']));
    const seq = row['SEQ']?.trim();
    if (seq && /^\d+$/.test(seq)) results.push(row);
  }
  return results;
}

function toPhoto(row: Record<string, string>, country: string): FoodPhoto {
  const n = (k: string) => parseFloat(row[k] || '0') || 0;
  const colors = [1,2,3,4,5,6,7].map(i => row[`\u30ab\u30e9\u30fc${i}`] || '').filter(Boolean);
  const age = parseInt((row['AGE'] || '0').replace(/\D/g, '')) || 0;
  const companion = row['\u98df\u4e8b\u306e\u76f8\u624b'] || '\u81ea\u5206';
  const peopleRaw = row['\u63a8\u5b9a\u4eba\u6570'] || '1';
  const peopleNum = parseInt(peopleRaw.replace(/\D/g, '')) || 1;
  const peopleCategory = peopleNum >= 4 ? '4\u4eba\u4ee5\u4e0a' : peopleNum === 3 ? '3\u4eba' : peopleNum === 2 ? '2\u4eba' : '1\u4eba';
  return {
    seq: parseInt(row['SEQ'] || '0') || 0,
    country,
    residence: row['RESIDENCE'] || '',
    sex: row['SEX'] || '',
    age,
    income: row['HINCOME'] || '',
    marriage: row['MARRIAGE'] || '',
    child: row['CHILD'] || '',
    job: row['JOB'] || '',
    filename: row['Q33'] || '',
    description: row['Q34_JP'] || row['Q34_EN'] || '',
    analysisText: '',
    photoUrl: row['\u5199\u771fURL'] ||
      (row['Q33'] ? `https://hakuhodo-hill.com/glpe/photos/scenes-of-meals/webp/${row['Q33']}` : ''),
    colors,
    nutrition: {
      calories: n('\u30ab\u30ed\u30ea\u30fc (kcal)'),
      protein: n('\u30bf\u30f3\u30d1\u30af\u8cac (g)'),
      fat: n('\u8106\u80aa (g)'),
      carbs: n('\u708e\u6c34\u5316\u7269 (g)'),
      fiber: n('\u7e4a\u7dad (g)'),
      sugar: n('\u7cd6\u5206\uff08g\uff09'),
      salt: n('\u5869\u5206\uff08g\uff09'),
      potassium: n('\u30ab\u30ea\u30a6\u30e0\uff08mg\uff09'),
    },
    estimatedPeople: peopleNum,
    cuisineType: row['\u30ab\u30c6\u30b4\u30ea'] || '',
    peopleCategory,
    diningCompanion: companion,
  };
}

async function fetchMarket(market: string): Promise<FoodPhoto[]> {
  try {
    const res = await fetch(SHEET_URLS[market], { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.length < 100) return [];
    return parseCSV(text).map(r => toPhoto(r, market));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get('market')?.toUpperCase();

  if (market && SHEET_URLS[market]) {
    try {
      const res = await fetch(SHEET_URLS[market], { cache: 'no-store' });
      if (!res.ok) return NextResponse.json({ error: `Sheet fetch failed: ${res.status}` }, { status: 500 });
      const rows = parseCSV(await res.text());
      return NextResponse.json(rows);
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  const countries: Record<string, FoodPhoto[]> = {};
  for (const m of ['JP','SG','MY','ID','PH']) {
    const photos = await fetchMarket(m);
    if (photos.length > 0) countries[m] = photos;
    await new Promise(r => setTimeout(r, 200));
  }
  return NextResponse.json({ countries });
}
