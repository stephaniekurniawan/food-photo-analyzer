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
const BASE_URL = 'https://hakuhodo-hill.com/glpe/photos/scenes-of-meals/webp/';

function rowToRecord(row: Record<string, string>, market: string): MealRecord | null {
  const filename = (row['写真URL'] || row['Q33'])?.trim();
  if (!filename) return null;
  const photoUrl = filename.startsWith('http') ? filename : BASE_URL + filename;
  return {
    seq: row['SEQ'] || '', country: market,
    residence: row['居住地'] || row['RESIDENCE'] || '',
    sex: row['性別'] || row['SEX'] || '',
    age: parseInt(row['年齢'] || row['AGE'] || '0') || 0,
    income: row['世帯 収入'] || row['HINCOME'] || '',
    marriage: row['未既婚'] || row['MARRIAGE'] || '',
    child: row['子どもの有無'] || row['CHILD'] || '',
    job: row['職業'] || row['JOB'] || '',
    description: row['Q33'] || '', analysis: row['Q34_JP'] || '',
    photoUrl,
    colors: [row['カラー１'],row['カラー２'],row['カラー３'],row['カラー４'],row['カラー５'],row['カラー６'],row['カラー７']].filter(Boolean),
    weight: parseFloat(row['容量（g）']||'0')||0, sugar: parseFloat(row['糖分（g）']||'0')||0,
    salt: parseFloat(row['塩分（g）']||'0')||0, potassium: parseFloat(row['カリウム（mg）']||'0')||0,
    calories: parseFloat(row['カロリー (kcal)']||'0')||0, protein: parseFloat(row['タンパク質 (g)']||'0')||0,
    fat: parseFloat(row['脂肪 (g)']||'0')||0, carbs: parseFloat(row['炭水化物 (g)']||'0')||0,
    fiber: parseFloat(row['繊維 (g)']||'0')||0, servings: parseFloat(row['推定人数']||'1')||1,
    cuisine: row['カテゴリ']||'', companion: row['食事の相手']||row['']||'',
  };
}

const initFilters: Filters = { markets:[...MARKETS], cuisine:'', companion:'', sex:'', marriage:'', child:'', minCal:0, maxCal:2000 };

const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const pct = (n: number, t: number) => t ? Math.round(n/t*100) : 0;

const COMPANION_COLORS: Record<string, string> = {
  '自分': '#888', '家族': '#378ADD', '友達': '#1D9E75', '恋人・配偶者': '#E8A0C0',
  '同僚': '#BA7517', '友人': '#1D9E75',
};
const SERVINGS_COLORS = ['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'];

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
      setData(results); setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => data.filter(r => {
    if (!filters.markets.includes(r.country)) return false;
    if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
    if (filters.companion && r.companion !== filters.companion) return false;
    if (filters.sex && r.sex !== filters.sex) return false;
    if (filters.marriage && r.marriage !== filters.marriage) return false;
    if (filters.child && r.child !== filters.child) return false;
    if (r.calories > 0 && r.calories > filters.maxCal) return false;
    return true;
  }), [data, filters]);

  const cuisines = useMemo(() => [...new Set(data.map(r => r.cuisine).filter(Boolean))].sort(), [data]);
  const companions = useMemo(() => [...new Set(data.map(r => r.companion).filter(Boolean))].sort(), [data]);

  // Stats for bottom panel
  const calRows = filtered.filter(r => r.calories > 0);
  const avgCal = Math.round(avg(calRows.map(r => r.calories)));
  const avgProtein = avg(calRows.map(r => r.protein));
  const avgFat = avg(calRows.map(r => r.fat));
  const avgCarbs = avg(calRows.map(r => r.carbs));
  const avgFiber = avg(calRows.map(r => r.fiber));
  const avgSugar = avg(calRows.map(r => r.sugar));
  const avgSalt = avg(calRows.map(r => r.salt));
  const maxNutr = Math.max(avgProtein, avgFat, avgCarbs, 1);

  // Color palette
  const colorFreq: Record<string, number> = {};
  filtered.forEach(r => r.colors.forEach(c => { if(c) colorFreq[c]=(colorFreq[c]||0)+1; }));
  const topColors = Object.entries(colorFreq).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const totalColorCount = topColors.reduce((s,[,v])=>s+v,0);

  // Servings breakdown
  const servingsMap: Record<string, number> = {};
  filtered.forEach(r => {
    const s = r.servings <= 1 ? '1 person' : r.servings <= 2 ? '2 people' : r.servings <= 3 ? '3 people' : '4+ people';
    servingsMap[s] = (servingsMap[s]||0)+1;
  });
  const servingsOrder = ['1 person','2 people','3 people','4+ people'];
  const maxServings = Math.max(...Object.values(servingsMap), 1);

  // Companion breakdown
  const compMap: Record<string, number> = {};
  filtered.forEach(r => { if(r.companion) compMap[r.companion]=(compMap[r.companion]||0)+1; });
  const compEntries = Object.entries(compMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxComp = Math.max(...compEntries.map(([,v])=>v), 1);

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
            {(['grid','analysis'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab===t?'bg-red-500 text-white':'text-gray-400 hover:text-white'}`}>
                {t==='grid'?'📷 Photos':'📊 Analysis'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex" style={{height:'calc(100vh - 57px)'}}>
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto p-4 hidden lg:block">
          <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(initFilters)}
            markets={[...MARKETS]} marketLabels={MARKET_LABELS} marketColors={MARKET_COLORS}
            cuisines={cuisines} companions={companions} total={data.length} shown={filtered.length} />
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading meals from Google Sheets…</p>
            </div>
          ) : tab === 'analysis' ? (
            <AnalysisDashboard data={filtered} allData={data} marketLabels={MARKET_LABELS} marketColors={MARKET_COLORS} />
          ) : (
            <>
              {/* Photo Grid */}
              <PhotoGrid photos={filtered} marketColors={MARKET_COLORS} onSelect={setSelected} />

              {/* Bottom Analysis Panel */}
              {filtered.length > 0 && (
                <div className="border-t border-gray-800 bg-gray-900 px-6 py-5">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Analysis</span>
                    <span className="text-red-400 font-bold text-sm">{filtered.length} meals</span>
                    <span className="text-gray-500 text-xs">·</span>
                    <span className="text-gray-300 text-sm">Average calories: <span className="text-red-400 font-bold">{avgCal} kcal</span></span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Color Palette */}
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-3">Color Palette</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {topColors.slice(0,6).map(([c]) => (
                          <div key={c} className="w-8 h-8 rounded-md border border-gray-700" style={{background:c}} title={c} />
                        ))}
                      </div>
                      <div className="space-y-1">
                        {topColors.slice(0,5).map(([c,cnt]) => (
                          <div key={c} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <div className="w-2 h-2 rounded-sm shrink-0" style={{background:c}} />
                            <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${pct(cnt,totalColorCount)}%`, background:c}} />
                            </div>
                            <span>{pct(cnt,totalColorCount)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nutritional Components */}
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-3">Nutritional components</p>
                      <div className="space-y-2">
                        {[
                          { label: 'protein', val: avgProtein, unit: 'g', color: '#E8493F' },
                          { label: 'Lipids', val: avgFat, unit: 'g', color: '#F59E0B' },
                          { label: 'carbohydrates', val: avgCarbs, unit: 'g', color: '#9CA3AF' },
                          { label: 'Dietary fiber', val: avgFiber, unit: 'g', color: '#10B981' },
                          { label: 'sugar content', val: avgSugar, unit: 'g', color: '#EC4899' },
                          { label: 'salt', val: avgSalt, unit: 'g', color: '#6B7280' },
                        ].map(({label, val, unit, color}) => (
                          <div key={label} className="flex items-center gap-2 text-xs">
                            <span className="w-24 text-gray-400 text-right shrink-0">{label}</span>
                            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${Math.min((val/maxNutr)*100,100)}%`, background:color}} />
                            </div>
                            <span className="text-gray-300 w-12 text-right">{val.toFixed(1)} {unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estimated number */}
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-3">Estimated number</p>
                      {/* Stacked bar */}
                      <div className="flex rounded-full overflow-hidden h-8 mb-3">
                        {servingsOrder.map((s,i) => {
                          const cnt = servingsMap[s]||0;
                          const w = pct(cnt, filtered.length);
                          return w > 0 ? (
                            <div key={s} className="flex items-center justify-center text-[9px] text-white font-medium" style={{width:`${w}%`, background:SERVINGS_COLORS[i]}}>
                              {w > 8 ? s.split(' ')[0] : ''}
                            </div>
                          ) : null;
                        })}
                      </div>
                      <div className="space-y-1">
                        {servingsOrder.map((s,i) => {
                          const cnt = servingsMap[s]||0;
                          if(!cnt) return null;
                          return (
                            <div key={s} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{background:SERVINGS_COLORS[i]}} />
                              <span className="text-gray-300">{s} : {cnt} pieces ( {pct(cnt,filtered.length)}% )</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dining companion */}
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-3">Dining companion</p>
                      <div className="space-y-2">
                        {compEntries.map(([c,cnt]) => (
                          <div key={c} className="flex items-center gap-2 text-xs">
                            <span className="w-20 text-gray-300 shrink-0 truncate">{c === '自分' ? 'myself' : c === '家族' ? 'family' : c === '友達' ? 'friend' : c === '恋人・配偶者' ? 'Lover/Spouse' : c === '同僚' ? 'colleague' : c}</span>
                            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${pct(cnt,maxComp)}%`, background: COMPANION_COLORS[c]||'#6B7280'}} />
                            </div>
                            <span className="text-gray-400 w-16 text-right">{cnt} ({pct(cnt,filtered.length)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {selected && <PhotoModal record={selected} marketColors={MARKET_COLORS} marketLabels={MARKET_LABELS} onClose={() => setSelected(null)} />}
    </div>
  );
}
