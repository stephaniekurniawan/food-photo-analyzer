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
  const ageStr = row['AGE'] || '';
  const age = parseInt(ageStr) || 0;

  // Estimated people: raw number in the unnamed "" column, or from "Estimated Number" column
  const rawNum = parseInt(row[''] || '0') || 0;
  const estNumStr = row['Estimated Number'] || row['推定人数カテゴリ'] || '';
  const peopleNum = rawNum || (estNumStr.includes('4') ? 4 : estNumStr.includes('3') ? 3 : estNumStr.includes('2') ? 2 : estNumStr.includes('1') ? 1 : 0);
  const peopleCategory = estNumStr || (peopleNum >= 4 ? '4人以上' : peopleNum === 3 ? '3人' : peopleNum === 2 ? '2人' : peopleNum === 1 ? '1人' : '');

  // Colors from カラー１〜７ columns
  const colors: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const c = (row[`カラー${i}`] || row[`Color${i}`] || row[`color${i}`] || '').trim();
    if (c && c !== '0' && c.startsWith('#')) colors.push(c);
  }

  // Photo URL: 写真URL column or construct from Q33 filename
  const photoUrl = row['写真URL'] || row['Photo URL'] || (row['Q33'] ? `https://food-img.s3.ap-northeast-1.amazonaws.com/${country.toLowerCase()}/${row['Q33']}` : '');

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
    photoUrl,
    colors,
    nutrition: {
      calories:  n('カロリー (kcal)') || n('Calories (kcal)') || n('calories'),
      protein:   n('タンパク質 (g)') || n('Protein (g)') || n('protein'),
      fat:       n('脂肪 (g)')       || n('Fat (g)')      || n('fat'),
      carbs:     n('炭水化物 (g)')   || n('Carbs (g)')    || n('carbs'),
      fiber:     n('繊維 (g)')       || n('Fiber (g)')    || n('fiber'),
      sugar:     n('糖分（g）')      || n('Sugar (g)')    || n('sugar'),
      salt:      n('塩分（g）')      || n('Salt (g)')     || n('salt'),
      potassium: n('カリウム（mg）') || n('Potassium (mg)') || n('potassium'),
    },
    estimatedPeople: peopleCategory,
    cuisineType: row['CUISINE'] || row['料理'] || row['カテゴリ'] || '',
    peopleCategory,
    diningCompanion: row['Dining Companion'] || row['食事の相手'] || '',
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
