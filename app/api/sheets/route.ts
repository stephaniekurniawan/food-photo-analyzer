import { NextRequest, NextResponse } from 'next/server';
import { FoodPhoto } from '@/types';

const SHEET_URLS: Record<string, string> = {
  JP: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdXIIAA0np27JHfPSTQXDyumVylu_9aUJ6oYDiIaEkTQaeGeLlcovKK40bn32c2_gd_Ja8QlxAZKK/pub?output=csv",
  SG: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRMmJKk_LNGEKP9vj6o6u2BSpV5m-jC1a53v7oPYKqvOZKAdDDCYZCwdeDSiXHDfOYxgdKgPRomzf-Z/pub?output=csv",
  MY: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMDzy4NikbMIoKT0KtgZH2MmcDqMQ4sTEOvormPRVzK9xLDwM87TZ6LZ7ASoIGtt-UGCTf3KNVz7V4/pub?output=csv",
  ID: "https://docs.google.com/spreadsheets/d/e/2PACX-1vROPYwKEq5NzwUpUCHex7sGZtdL8hHXwnZ5t8bl7H_nlfN7DxkuvonMG65lCDxT_ABcc1BQoQnVaS2l/pub?output=csv",
  PH: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeK6J7RrYqFyu1nczu93ofxt5fSaopQC2Tir-rrb7pMqUJO6BfPNyRtA_D89th8lMm3-m8OMWaRY51/pub?output=csv",
};

// Parse CSV text into array of string arrays (rows of cells)
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

// The sheet structure:
// Row 1 (index 0): English headers — SEQ, COUNTRY, RESIDENCE, SEX, AGE, HINCOME, MARRIAGE, CHILD, JOB, Q33, Q34_JP, CUISINE, "Estimated Number", "Dining Companion"
// Row 2 (index 1): Japanese headers — 国, 居住地, 性別, 年齢, ... 写真URL, カラー１〜７, 容量, 糖分, 塩分, カリウム, カロリー, タンパク質, 脂肪, 炭水化物, 繊維, 推定人数, 料理, 推定人数カテゴリ, 食事の相手
// Row 3+: actual data

// Column indices based on the FULL header (JP row 2 which has all columns):
// From your shared header:
// 0=国(COUNTRY) 1=居住地(RESIDENCE) 2=性別(SEX) 3=年齢(AGE) 4=世帯収入(HINCOME)
// 5=MARRIAGE 6=CHILD 7=JOB 8=Q33(filename) 9=Q34_JP(description)
// 10=写真の内容 11=写真URL 12=カラー１ 13=カラー２ 14=カラー３ 15=カラー４ 16=カラー５ 17=カラー６ 18=カラー７
// 19=容量(g) 20=糖分(g) 21=塩分(g) 22=カリウム(mg) 23=カロリー(kcal) 24=タンパク質(g) 25=脂肪(g) 26=炭水化物(g) 27=繊維(g)
// 28=推定人数(raw number) 29=料理(cuisine) 30=推定人数カテゴリ(people category) 31=食事の相手(companion)

// BUT the EN row (row 1) has different/fewer columns. We need to use the JP row to find column indices.
// Strategy: use row 2 (JP headers) as the column index reference, skip it as data.

function buildColMap(jpHeaderRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  jpHeaderRow.forEach((h, i) => { map[h.trim()] = i; });
  return map;
}

// Also build from EN header row for the new columns added
function mergeColMaps(enRow: string[], jpRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  enRow.forEach((h, i) => { if (h.trim()) map[h.trim()] = i; });
  jpRow.forEach((h, i) => { if (h.trim()) map[h.trim()] = i; });
  return map;
}

function toPhoto(cells: string[], colMap: Record<string, number>, country: string): FoodPhoto | null {
  const get = (key: string) => (cells[colMap[key] ?? -1] || '').trim();
  const num = (key: string) => parseFloat(get(key)) || 0;

  const seq = parseInt(get('SEQ') || get('国') !== '' ? cells[0] : '0') || 0; // SEQ is col 0 in EN
  // Actually SEQ is always col 0 in both rows
  const seqVal = parseInt((cells[0] || '').trim()) || 0;
  if (!seqVal) return null; // skip empty/header rows

  const countryVal = (cells[colMap['COUNTRY'] ?? colMap['国'] ?? 1] || '').trim() || country;

  // Photo URL — from 写真URL column
  let photoUrl = get('写真URL');
  // Extract just the URL if it has __ delimiters
  if (photoUrl.includes('__')) {
    const parts = photoUrl.split('__').filter(p => p.startsWith('http'));
    photoUrl = parts[0] || '';
  }
  // Fallback: construct from filename
  if (!photoUrl) {
    const filename = get('Q33');
    if (filename) photoUrl = `https://hakuhodo-hill.com/glpe/photos/scenes-of-meals/webp/${filename}`;
  }

  // Colors from カラー１〜７
  const colors: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const c = get(`カラー${i}`);
    if (c && c.startsWith('#')) colors.push(c);
  }

  // People category
  const estNumCategory = get('推定人数カテゴリ') || get('Estimated Number');
  const rawPeopleNum = parseInt(get('推定人数')) || 0;
  const peopleCategory = estNumCategory ||
    (rawPeopleNum >= 4 ? '4人以上' : rawPeopleNum === 3 ? '3人' : rawPeopleNum === 2 ? '2人' : rawPeopleNum === 1 ? '1人' : '');

  const age = parseInt((get('AGE') || get('年齢')).replace(/[^0-9]/g, '')) || 0;

  return {
    seq: seqVal,
    country: countryVal || country,
    residence: get('RESIDENCE') || get('居住地'),
    sex: get('SEX') || get('性別'),
    age,
    income: get('HINCOME') || get('世帯 収入HML'),
    marriage: get('MARRIAGE') || get('未既婚'),
    child: get('CHILD') || get('子どもの有無'),
    job: get('JOB') || get('職業'),
    filename: get('Q33'),
    description: get('Q34_JP') || get('最近の、あなたの「食事の風景」写真の説明（和訳） ・撮影した食事　・撮影した時期　・時間帯 ・どこで　・誰と　・何をしながら　・何を食べたか ・誰が作った料理か、あるいは、どこで買った料理か'),
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
    cuisineType: get('CUISINE') || get('料理'),
    peopleCategory,
    diningCompanion: get('Dining Companion') || get('食事の相手'),
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
    const enRow = allRows[0];
    const jpRow = allRows[1];
    const colMap = mergeColMaps(enRow, jpRow);

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
