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

// Cuisine keywords to detect from description text
const CUISINE_KEYWORDS: Record<string, string> = {
  '洋食': '洋食', 'Western': '洋食',
  '和食': '和食', 'Japanese': '和食',
  '中華': '中華', 'Chinese': '中華',
  '韓国': '韓国料理', 'Korean': '韓国料理',
  '伝統ローカル': '伝統ローカル料理', 'Traditional': '伝統ローカル料理',
  '東南アジア': '東南アジア料理', 'Southeast': '東南アジア料理',
  '多国籍': '多国籍料理', 'Multinational': '多国籍料理',
  'インド': 'インド料理', 'Indian': 'インド料理',
  'イタリア': 'イタリア料理', 'Italian': 'イタリア料理',
};

function detectCuisine(text: string): string {
  for (const [key, val] of Object.entries(CUISINE_KEYWORDS)) {
    if (text.includes(key)) return val;
  }
  return '';
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Find header row — look for the row starting with SEQ
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols[0] === 'SEQ' || cols[0] === '"SEQ"') { headerIdx = i; break; }
  }

  const headers = splitCSVLine(lines[headerIdx]);
  const results: Record<string, string>[] = [];
  let lastRecord: Record<string, string> | null = null;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const row = Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? '']));
    const seq = row['SEQ']?.trim();

    if (seq && /^\d+$/.test(seq)) {
      // New respondent row
      if (lastRecord) results.push(lastRecord);
      lastRecord = { ...row };
    } else if (lastRecord) {
      // Extra data row — check if it contains cuisine, photo URL, colors, nutrition
      const fullText = vals.join(',');

      // Extract photo URL
      const urlMatch = fullText.match(/https:\/\/hakuhodo-hill\.com\/[^\s,]+\.webp/);
      if (urlMatch && !lastRecord['写真URL']) lastRecord['写真URL'] = urlMatch[0];

      // Extract cuisine
      if (!lastRecord['カテゴリ'] || lastRecord['カテゴリ'] === '') {
        const cuisine = detectCuisine(fullText);
        if (cuisine) lastRecord['カテゴリ'] = cuisine;
      }

      // Extract companion from unnamed column
      if (!lastRecord['食事の相手'] || lastRecord['食事の相手'] === '') {
        const companion = lastRecord[''] || '';
        if (companion) lastRecord['食事の相手'] = companion;
      }

      // Extract color codes
      const colors = fullText.match(/#[0-9A-Fa-f]{6}/g);
      if (colors && colors.length > 0) {
        colors.slice(0, 7).forEach((c, idx) => {
          const key = ['カラー１','カラー２','カラー３','カラー４','カラー５','カラー６','カラー７'][idx];
          if (!lastRecord![key]) lastRecord![key] = c;
        });
      }

      // Extract nutrition numbers — look for pattern: weight,sugar,salt,potassium,calories,protein,fat,carbs,fiber
      const numMatch = fullText.match(/(\d+\.?\d*),(\d+\.?\d*),(\d+\.?\d*),(\d+),(\d+\.?\d*),(\d+\.?\d*),(\d+\.?\d*),(\d+\.?\d*),(\d+\.?\d*),(\d+)/);
      if (numMatch && !lastRecord!['カロリー (kcal)']) {
        const [,w,su,sa,k,cal,prot,fat,carbs,fiber] = numMatch;
        lastRecord!['容量（g）'] = w;
        lastRecord!['糖分（g）'] = su;
        lastRecord!['塩分（g）'] = sa;
        lastRecord!['カリウム（mg）'] = k;
        lastRecord!['カロリー (kcal)'] = cal;
        lastRecord!['タンパク質 (g)'] = prot;
        lastRecord!['脂肪 (g)'] = fat;
        lastRecord!['炭水化物 (g)'] = carbs;
        lastRecord!['繊維 (g)'] = fiber;
      }

      // Extract companion from end of data rows (e.g. "2人,友達")
      const companionMatch = fullText.match(/(\d+人(?:以上)?),(自分|家族|友達|同僚|恋人・配偶者|友人)/);
      if (companionMatch && !lastRecord!['食事の相手']) {
        lastRecord!['食事の相手'] = companionMatch[2];
        lastRecord!['推定人数'] = companionMatch[1];
      }

      // Cuisine from end pattern
      const cuisineMatch = fullText.match(/(洋食|和食|中華|韓国料理|伝統ローカル料理|東南アジア料理|多国籍料理|インド料理|イタリア料理)/);
      if (cuisineMatch && (!lastRecord!['カテゴリ'] || lastRecord!['カテゴリ'] === '')) {
        lastRecord!['カテゴリ'] = cuisineMatch[1];
      }
    }
  }
  if (lastRecord) results.push(lastRecord);
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
