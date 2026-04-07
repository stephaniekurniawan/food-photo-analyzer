import { NextRequest, NextResponse } from 'next/server';
import { FoodPhoto } from '@/types';
import fs from 'fs';
import path from 'path';

const CSV_FILES: Record<string, string> = {
  JP: "JP 生活図鑑（写真分析済み） 2026 - Sheet1.csv",
  SG: "SG 生活図鑑（写真分析済み）2026 - Sheet1.csv",
  MY: "MY 生活図鑑（写真分析済み） 2026 - Data.csv",
  ID: "ID 生活図鑑（写真分析済み） 2026 - Sheet1.csv",
  PH: "PH 生活図鑑（写真分析済み）2026 - Sheet1.csv",
};

const SHEET_URLS: Record<string, string> = {
  JP: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdXIIAA0np27JHfPSTQXDyumVylu_9aUJ6oYDiIaEkTQaeGeLlcovKK40bn32c2_gd_Ja8QlxAZKK/pub?output=csv",
  SG: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMmJKk_LNGEKP9vj6o6u2BSpV5m-jC1a53v7oPYKqvOZKAdDDCYZCwdeDSiXHDfOYxgdKgPRomzf-Z/pub?output=csv",
  MY: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMDzy4NikbMIoKT0KtgZH2MmcDqMQ4sTEOvormPRVzK9xLDwM87TZ6LZ7ASoIGtt-UGCTf3KNVz7V4/pub?output=csv",
  ID: "https://docs.google.com/spreadsheets/d/e/2PACX-1vROPYwKEq5NzwUpUCHex7sGZtdL8hHXwnZ5t8bl7H_nlfN7DxkuvonMG65lCDxT_ABcc1BQoQnVaS2l/pub?output=csv",
  PH: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeK6J7RrYqFyu1nczu93ofxt5fSaopQC2Tir-rrb7pMqUJO6BfPNyRtA_D89th8lMm3-m8OMWaRY51/pub?output=csv",
};

function parseCSVRaw(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQ = false;
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"' && t[i+1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function buildColMap(row1: string[], row2: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  row1.forEach((h, i) => { const k = h.trim(); if (k) map[k] = i; });
  row2.forEach((h, i) => { const k = h.trim(); if (k) map[k] = i; });
  return map;
}

function extractPhotoUrl(raw: string): string {
  if (!raw) return '';
  const m = raw.match(/__?(https?:\/\/[^_\s]+\.webp)__?/);
  if (m) return m[1];
  if (raw.startsWith('http')) return raw.trim();
  return '';
}

function toPhoto(cells: string[], colMap: Record<string, number>, country: string): FoodPhoto | null {
  const g = (key: string): string => {
    const idx = colMap[key];
    return idx !== undefined && idx < cells.length ? (cells[idx] || '').trim() : '';
  };
  const num = (key: string): number => parseFloat(g(key)) || 0;

  const seqRaw = g('SEQ');
  const seqVal = parseInt(seqRaw) || 0;
  if (!seqVal) return null;
  if ((g('COUNTRY') || g('国')) === '国') return null;

  const rawUrl = g('写真URL');
  let photoUrl = extractPhotoUrl(rawUrl);
  if (!photoUrl) {
    const fn = g('Q33');
    if (fn) photoUrl = `https://hakuhodo-hill.com/glpe/photos/scenes-of-meals/webp/${fn}`;
  }

  const colors: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const c = g(`カラー${i}`);
    if (c && c.startsWith('#')) colors.push(c);
  }

  const estNumEN = g('Estimated Number');
  const estNumJP = g('推定人数カテゴリ');
  const rawPeopleNum = parseInt(g('推定人数')) || 0;
  const peopleCategory = estNumEN || estNumJP ||
    (rawPeopleNum >= 4 ? '4人以上' : rawPeopleNum === 3 ? '3人' : rawPeopleNum === 2 ? '2人' : rawPeopleNum === 1 ? '1人' : '');

  const cuisineType = g('CUISINE') || g('料理');
  const diningCompanion = g('Dining Companion') || g('食事の相手');
  const age = parseInt((g('AGE') || g('年齢')).replace(/[^0-9]/g, '')) || 0;

  return {
    seq: seqVal,
    country: g('COUNTRY') || g('国') || country,
    residence: g('RESIDENCE') || g('居住地'),
    sex: g('SEX') || g('性別'),
    age,
    income: g('HINCOME') || g('世帯 収入HML'),
    marriage: g('MARRIAGE') || g('未既婚'),
    child: g('CHILD') || g('子どもの有無'),
    job: g('JOB') || g('職業'),
    filename: g('Q33'),
    description: g('Q34_JP'),
    analysisText: '',
    photoUrl,
    colors,
    nutrition: {
      calories:  num('カロリー (kcal)'),
      protein:   num('タンパク質 (g)'),
      fat:       num('脂肪 (g)'),
      carbs:     num('炭水化物 (g)'),
      fiber:     num('繊維 (g)'),
      sugar:     num('糖分（g）'),
      salt:      num('塩分（g）'),
      potassium: num('カリウム（mg）'),
    },
    estimatedPeople: peopleCategory,
    cuisineType,
    peopleCategory,
    diningCompanion,
  };
}

async function fetchFromCSV(market: string): Promise<FoodPhoto[]> {
  try {
    const filename = CSV_FILES[market];
    const filepath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filepath)) return [];
    const text = fs.readFileSync(filepath, 'utf-8');
    if (!text || text.length < 100) return [];
    const allRows = parseCSVRaw(text);
    if (allRows.length < 3) return [];
    const colMap = buildColMap(allRows[0], allRows[1]);
    const photos: FoodPhoto[] = [];
    for (let i = 2; i < allRows.length; i++) {
      const cells = allRows[i];
      if (!cells || cells.every(c => !c.trim())) continue;
      const photo = toPhoto(cells, colMap, market);
      if (photo && photo.seq > 0) photos.push(photo);
    }
    return photos;
  } catch { return []; }
}

async function fetchFromURL(market: string): Promise<FoodPhoto[]> {
  try {
    const res = await fetch(SHEET_URLS[market], { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.length < 100 || text.includes('<!DOCTYPE')) return [];
    const allRows = parseCSVRaw(text);
    if (allRows.length < 3) return [];
    const colMap = buildColMap(allRows[0], allRows[1]);
    const photos: FoodPhoto[] = [];
    for (let i = 2; i < allRows.length; i++) {
      const cells = allRows[i];
      if (!cells || cells.every(c => !c.trim())) continue;
      const photo = toPhoto(cells, colMap, market);
      if (photo && photo.seq > 0) photos.push(photo);
    }
    return photos;
  } catch { return []; }
}

async function fetchMarket(market: string): Promise<FoodPhoto[]> {
  const photos = await fetchFromURL(market);
  if (photos.length > 0) return photos;
  return fetchFromCSV(market);
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get('market')?.toUpperCase();
  if (market && SHEET_URLS[market]) {
    return NextResponse.json(await fetchMarket(market));
  }
  const countries: Record<string, FoodPhoto[]> = {};
  for (const m of ['JP', 'SG', 'MY', 'ID', 'PH']) {
    const photos = await fetchMarket(m);
    if (photos.length > 0) countries[m] = photos;
    await new Promise(r => setTimeout(r, 200));
  }
  return NextResponse.json({ countries });
}
