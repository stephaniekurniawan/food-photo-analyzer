import { NextResponse } from 'next/server';
import type { FoodPhoto } from '@/types';

const SHEET_URLS: Record<string, string> = {
  JP: 'https://docs.google.com/spreadsheets/d/1tp6Q37OwweyqIfMEDVapCQ7N0yrru6eisqgDzXOxvvA/export?format=csv&gid=0',
  SG: 'https://docs.google.com/spreadsheets/d/1JwESIC8gEmZQKQ1kWC2mp_GqHpzoRHBNkgBnBh-Nius/export?format=csv&gid=0',
  MY: 'https://docs.google.com/spreadsheets/d/1CEd_qe4chbbdqVyx5tSShcarDqoB-SdPQ-yKzIHZ4V8/export?format=csv&gid=0',
  ID: 'https://docs.google.com/spreadsheets/d/1nKyunGQCz-uS1XcLubf_ROgEu9wis0DLJuC9NuVLo64/export?format=csv&gid=0',
  PH: 'https://docs.google.com/spreadsheets/d/1yGrdc0x6Z8s5hq63rIE9-NX-zSJsdcq8HLjIJBhgxBo/export?format=csv&gid=0',
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const u = lines[i].toUpperCase();
    if (u.includes('SEQ') && (u.includes('COUNTRY') || u.includes('写真URL'))) { headerIdx = i; break; }
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
  const colors = [1,2,3,4,5,6,7].map(i => row[`カラー${i}`] || '').filter(Boolean);
  const age = parseInt((row['AGE'] || row['年齢'] || '0').replace(/\D/g, '')) || 0;
  const companion = row['食事の相手'] || row['diningCompanion'] || '自分';
  const peopleRaw = row['推定人数'] || row['estimatedPeople'] || '1';
  const peopleNum = parseInt(peopleRaw.replace(/\D/g, '')) || 1;
  let peopleCategory = '1人';
  if (peopleNum >= 4) peopleCategory = '4人以上';
  else if (peopleNum === 3) peopleCategory = '3人';
  else if (peopleNum === 2) peopleCategory = '2人';
  return {
    seq: parseInt(row['SEQ'] || '0') || 0,
    country,
    residence: row['RESIDENCE'] || row['居住地'] || '',
    sex: row['SEX'] || row['性別'] || '',
    age,
    income: row['HINCOME'] || row['収入'] || '',
    marriage: row['MARRIAGE'] || row['婚姻'] || '',
    child: row['CHILD'] || row['子供'] || '',
    job: row['JOB'] || row['職業'] || '',
    filename: row['Q33'] || '',
    description: row['Q34_JP'] || row['Q34_EN'] || row['説明'] || '',
    analysisText: row['分析'] || '',
    photoUrl: row['写真URL'] || '',
    colors,
    nutrition: {
      calories: n('カロリー (kcal)'), protein: n('タンパク質 (g)'),
      fat: n('脂肪 (g)'), carbs: n('炭水化物 (g)'),
      fiber: n('繊維 (g)'), sugar: n('糖分（g）'),
      salt: n('塩分（g）'), potassium: n('カリウム（mg）'),
    },
    estimatedPeople: peopleNum,
    cuisineType: row['カテゴリ'] || row['cuisineType'] || '',
    peopleCategory,
    diningCompanion: companion,
  };
}

export async function GET() {
  const MARKETS = ['JP','SG','MY','ID','PH'];
  const countries: Record<string, FoodPhoto[]> = {};
  await Promise.all(MARKETS.map(async m => {
    try {
      const res = await fetch(SHEET_URLS[m], { next: { revalidate: 300 } });
      if (!res.ok) return;
      const rows = parseCSV(await res.text());
      countries[m] = rows.map(r => toPhoto(r, m));
    } catch { /* skip */ }
  }));
  return NextResponse.json({ countries });
}
