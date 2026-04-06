import { NextRequest, NextResponse } from 'next/server';
import { FoodPhoto } from '@/types';

const SHEET_URLS: Record<string, string> = {
  JP: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdXIIAA0np27JHfPSTQXDyumVylu_9aUJ6oYDiIaEkTQaeGeLlcovKK40bn32c2_gd_Ja8QlxAZKK/pub?output=csv",
  SG: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMmJKk_LNGEKP9vj6o6u2BSpV5m-jC1a53v7oPYKqvOZKAdDDCYZCwdeDSiXHDfOYxgdKgPRomzf-Z/pub?output=csv",
  MY: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMDzy4NikbMIoKT0KtgZH2MmcDqMQ4sTEOvormPRVzK9xLDwM87TZ6LZ7ASoIGtt-UGCTf3KNVz7V4/pub?output=csv",
  ID: "https://docs.google.com/spreadsheets/d/e/2PACX-1vROPYwKEq5NzwUpUCHex7sGZtdL8hHXwnZ5t8bl7H_nlfN7DxkuvonMG65lCDxT_ABcc1BQoQnVaS2l/pub?output=csv",
  PH: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeK6J7RrYqFyu1nczu93ofxt5fSaopQC2Tir-rrb7pMqUJO6BfPNyRtA_D89th8lMm3-m8OMWaRY51/pub?output=csv",
};

// Row 1 (index 0): EN headers  → SEQ, COUNTRY, RESIDENCE, SEX, AGE, HINCOME, MARRIAGE, CHILD, JOB, Q33, Q34_JP, CUISINE, "Estimated Number", "Dining Companion"
// Row 2 (index 1): JP headers  → 国, 居住地, 性別, 年齢, 世帯 収入HML, 未既婚, 子どもの有無, 職業, Q34_JP(long), 写真の内容, 写真URL, カラー１〜７, 容量(g), 糖分(g), 塩分(g), カリウム(mg), カロリー (kcal), タンパク質 (g), 脂肪 (g), 炭水化物 (g), 繊維 (g), 推定人数, 料理, 推定人数カテゴリ, 食事の相手
// Row 3+ (index 2+): actual data

// FIXED column indices based on the exact JP row 2 structure you confirmed.
// EN row has: SEQ(0) COUNTRY(1) RESIDENCE(2) SEX(3) AGE(4) HINCOME(5) MARRIAGE(6) CHILD(7) JOB(8) Q33(9) Q34_JP(10) CUISINE(11) EstimatedNumber(12) DiningCompanion(13)
// JP row (row 2) adds more columns starting from where EN row ends, giving us the full data:
// The full column order in the actual data row is (based on your PH sample):
// 0=SEQ  1=COUNTRY  2=RESIDENCE  3=SEX  4=AGE  5=HINCOME  6=MARRIAGE(未既婚)  7=CHILD  8=JOB
// 9=Q33  10=Q34_JP  11=写真の内容  12=写真URL  13=カラー１  14=カラー２  15=カラー３
// 16=カラー４  17=カラー５  18=カラー６  19=カラー７  20=容量(g)  21=糖分(g)
// 22=塩分(g)  23=カリウム(mg)  24=カロリー(kcal)  25=タンパク質(g)  26=脂肪(g)
// 27=炭水化物(g)  28=繊維(g)  29=推定人数(raw#)  30=料理(cuisine)  31=推定人数カテゴリ  32=食事の相手
// 33=CUISINE(EN)  34=Estimated Number(EN)  35=Dining Companion(EN)

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
  // Build from both header rows — row2 (JP) takes priority for JP column names
  row1.forEach((h, i) => { const k = h.trim(); if (k) map[k] = i; });
  row2.forEach((h, i) => { const k = h.trim(); if (k) map[k] = i; });
  return map;
}

function extractPhotoUrl(raw: string): string {
  if (!raw) return '';
  // Format: __https://...webp__
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

  // SEQ is always col 0
  const seqVal = parseInt((cells[0] || '').trim()) || 0;
  if (!seqVal) return null;

  // Skip the JP header row itself (row 2) — it has 国 in col 1
  if ((cells[1] || '').trim() === '国') return null;

  // Photo URL from 写真URL column — may contain __url__ format
  const rawUrl = g('写真URL');
  let photoUrl = extractPhotoUrl(rawUrl);
  if (!photoUrl) {
    const fn = g('Q33');
    if (fn) photoUrl = `https://hakuhodo-hill.com/glpe/photos/scenes-of-meals/webp/${fn}`;
  }

  // Colors: カラー１〜７
  const colors: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const c = g(`カラー${i}`);
    if (c && c.startsWith('#')) colors.push(c);
  }

  // People category — prefer EN "Estimated Number" col, fall back to JP 推定人数カテゴリ
  const estNumEN = g('Estimated Number');
  const estNumJP = g('推定人数カテゴリ');
  const rawPeopleNum = parseInt(g('推定人数')) || 0;
  const peopleCategory = estNumEN || estNumJP ||
    (rawPeopleNum >= 4 ? '4人以上' : rawPeopleNum === 3 ? '3人' : rawPeopleNum === 2 ? '2人' : rawPeopleNum === 1 ? '1人' : '');

  // Cuisine — prefer EN "CUISINE" col, fall back to JP 料理
  const cuisineType = g('CUISINE') || g('料理');

  // Dining companion — prefer EN "Dining Companion", fall back to JP 食事の相手
  const diningCompanion = g('Dining Companion') || g('食事の相手');

  const age = parseInt((g('AGE') || g('年齢')).replace(/[^0-9]/g, '')) || 0;

  return {
    seq: seqVal,
    country: (g('COUNTRY') || g('国') || country),
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

async function fetchMarket(market: string): Promise<FoodPhoto[]> {
  try {
    const res = await fetch(SHEET_URLS[market], { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.length < 100) return [];

    const allRows = parseCSVRaw(text);
    if (allRows.length < 3) return [];

    // Row 0 = EN headers, Row 1 = JP headers, Row 2+ = data
    const colMap = buildColMap(allRows[0], allRows[1]);

    const photos: FoodPhoto[] = [];
    for (let i = 2; i < allRows.length; i++) {
      const cells = allRows[i];
      if (!cells || cells.every(c => !c.trim())) continue;
      const photo = toPhoto(cells, colMap, market);
      if (photo && photo.seq > 0) photos.push(photo);
    }
    return photos;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const market = req.nextUrl.searchParams.get('market')?.toUpperCase();
  if (market && SHEET_URLS[market]) {
    const photos = await fetchMarket(market);
    return NextResponse.json(photos);
  }
  const countries: Record<string, FoodPhoto[]> = {};
  for (const m of ['JP', 'SG', 'MY', 'ID', 'PH']) {
    const photos = await fetchMarket(m);
    if (photos.length > 0) countries[m] = photos;
    await new Promise(r => setTimeout(r, 200));
  }
  return NextResponse.json({ countries });
}
