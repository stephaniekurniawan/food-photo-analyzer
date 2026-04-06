'use client';
import { useState, useEffect, useMemo } from 'react';
import PhotoGrid from '@/components/PhotoGrid';
import FilterPanel from '@/components/FilterPanel';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import PhotoModal from '@/components/PhotoModal';
import { MealRecord, Filters } from '@/lib/types';

const MARKETS = ['SG', 'ID', 'JP', 'MY', 'PH'] as const;
const MARKET_LABELS: Record<string, string> = { SG: 'Singapore', ID: 'Indonesia', JP: 'Japan', MY: 'Malaysia', PH: 'Philippines' };
const MARKET_COLORS: Record<string, string> = { SG: '#E8493F', ID: '#378ADD', JP: '#1D9E75', MY: '#BA7517', PH: '#7F77DD' };

function rowToRecord(row: Record<string, string>, market: string): MealRecord | null {
  const photoUrl = row['写真URL']?.trim();
  if (!photoUrl) return null;
  return {
    seq: row['SEQ'] || '', country: market, residence: row['居住地'] || row['RESIDENCE'] || '',
    sex: row['性別'] || row['SEX'] || '', age: parseInt(row['年齢'] || row['AGE'] || '0') || 0,
    income: row['世帯 収入'] || row['HINCOME'] || '', marriage: row['未既婚'] || row['MARRIAGE'] || '',
    child: row['子どもの有無'] || row['CHILD'] || '', job: row['職業'] || row['JOB'] || '',
    description: row['Q33'] || '', analysis: row['Q34_JP'] || '',
    photoUrl, colors: [row['カラー１'], row['カラー２'], row['カラー３'], row['カラー４'], row['カラー５'], row['カラー６'], row['カラー７']].filter(Boolean),
    weight: parseFloat(row['容量（g）'] || '0') || 0, sugar: parseFloat(row['糖分（g）'] || '0') || 0,
    salt: parseFloat(row['塩分（g）'] || '0') || 0, potassium: parseFloat(row['カリウム（mg）'] || '0') || 0,
    calories: parseFloat(row['カロリー (kcal)'] || '0') || 0, protein: parseFloat(row['タンパク質 (g)'] || '0') || 0,
    fat: parseFloat(row['脂肪 (g)'] || '0') || 0, carbs: parseFloat(row['炭水化物 (g)'] || '0') || 0,
    fiber: parseFloat(row['繊維 (g)'] || '0') || 0, servings: parseFloat(row['推定人数'] || '1') || 1,
    cuisine: row['カテゴリ'] || '', companion: row['食事の相手'] || '',
  };
}

const initFilters: Filters = { markets: [...MARKETS], cuisine: '', companion: '', sex: '', minCal: 0, maxCal: 2000 };

export default function Home() {
  const [data, setData] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(initFilters);
  const [selected, setSelected] = useState<MealRecord | null>(null);
  const [tab, setTab] = useState<'grid' | 'analysis'>('grid');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const results: MealRecord[] = [];
      await Promise.all(MARKETS.map(async market => {
        try {
          const res = await fetch(`/api/sheets?market=${market}`);
          if (!res.ok) return;
          const rows: Record<string, string>[] = await res.json();
          rows.forEach(row => { const rec = rowToRecord(row, market); if (rec) results.push(rec); });
        } catch {}
      }));
      setData(results);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => data.filter(r => {
    if (!filters.markets.includes(r.country)) return false;
    if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
    if (filters.companion && r.companion !== filters.companion) return false;
    if (filters.sex && r.sex !== filters.sex) return false;
    if (r.calories > 0 && r.calories > filters.maxCal) return false;
    return true;
  }), [data, filters]);

  const cuisines = useMemo(() => [...new Set(data.map(r => r.cuisine).filter(Boolean))].sort(), [data]);
  const companions = useMemo(() => [...new Set(data.map(r => r.companion).filter(Boolean))].sort(), [data]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center font-bold">🍽</div>
          <div><h1 className="font-bold text-white text-sm leading-none">Dining Scene</h1><p className="text-gray-400 text-xs mt-0.5">5-Market Food Research</p></div>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <span className="text-xs text-gray-400 animate-pulse">Loading…</span> : <span className="text-xs text-gray-400">{filtered.length} / {data.length} meals</span>}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {(['grid', 'analysis'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'grid' ? '📷 Photos' : '📊 Analysis'}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="flex h-[calc(100vh-57px)]">
        <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto p-4 hidden lg:block">
          <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(initFilters)}
            markets={[...MARKETS]} marketLabels={MARKET_LABELS} marketColors={MARKET_COLORS}
            cuisines={cuisines} companions={companions} total={data.length} shown={filtered.length} />
        </aside>
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading meals from Google Sheets…</p>
            </div>
          ) : tab === 'grid' ? (
            <PhotoGrid photos={filtered} marketColors={MARKET_COLORS} onSelect={setSelected} />
          ) : (
            <AnalysisDashboard data={filtered} allData={data} marketLabels={MARKET_LABELS} marketColors={MARKET_COLORS} />
          )}
        </main>
      </div>
      {selected && <PhotoModal record={selected} marketColors={MARKET_COLORS} marketLabels={MARKET_LABELS} onClose={() => setSelected(null)} />}
    </div>
  );
}
