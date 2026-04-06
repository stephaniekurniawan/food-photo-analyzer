'use client';
import { useEffect, useState, useMemo } from 'react';
import { MealRecord, Filters } from '@/lib/types';
import FilterPanel from '@/components/FilterPanel';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoModal from '@/components/PhotoModal';
import AnalysisDashboard from '@/components/AnalysisDashboard';

const MARKETS = ['SG','ID','JP','MY','PH'];
const MARKET_LABELS: Record<string,string> = { SG:'Singapore', ID:'Indonesia', JP:'Japan', MY:'Malaysia', PH:'Philippines' };
const MARKET_COLORS: Record<string,string> = { SG:'#E8493F', ID:'#378ADD', JP:'#1D9E75', MY:'#BA7517', PH:'#7F77DD' };

const AGE_RANGES: Record<string,[number,number]> = {
  '10s':[10,19], '20s':[20,29], '30s':[30,39], '40s':[40,49], '50s+':[50,120]
};

function parseAge(s: string): number {
  const m = s?.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function toRecord(row: Record<string,string>, country: string): MealRecord {
  return {
    seq: row['SEQ'] || '',
    country,
    residence: row['RESIDENCE'] || '',
    sex: row['SEX'] || '',
    age: parseAge(row['AGE'] || ''),
    income: row['HINCOME'] || '',
    marriage: row['MARRIAGE'] || '',
    child: row['CHILD'] || '',
    job: row['JOB'] || '',
    description: row['Q34_JP'] || row['Q34_EN'] || '',
    analysis: '',
    photoUrl: row['写真URL'] || '',
    colors: [1,2,3,4,5,6,7].map(i => row[`カラー${i}`] || '').filter(Boolean),
    weight: parseFloat(row['容量（g）'] || '0') || 0,
    sugar: parseFloat(row['糖分（g）'] || '0') || 0,
    salt: parseFloat(row['塩分（g）'] || '0') || 0,
    potassium: parseFloat(row['カリウム（mg）'] || '0') || 0,
    calories: parseFloat(row['カロリー (kcal)'] || '0') || 0,
    protein: parseFloat(row['タンパク質 (g)'] || '0') || 0,
    fat: parseFloat(row['脂肪 (g)'] || '0') || 0,
    carbs: parseFloat(row['炭水化物 (g)'] || '0') || 0,
    fiber: parseFloat(row['繊維 (g)'] || '0') || 0,
    servings: 1,
    cuisine: row['カテゴリ'] || '',
    companion: row['食事の相手'] || '',
    peopleCount: row['推定人数'] || '',
  };
}

const INIT: Filters = {
  markets: MARKETS, cuisine: '', companion: '', sex: '',
  marriage: '', child: '', minCal: 0, maxCal: 2000, ageGroup: ''
};

function avg(arr: number[]) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

export default function Page() {
  const [data, setData] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(INIT);
  const [selected, setSelected] = useState<MealRecord|null>(null);
  const [tab, setTab] = useState<'grid'|'analysis'>('grid');
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    Promise.all(MARKETS.map(m =>
      fetch(`/api/sheets?market=${m}`).then(r=>r.json()).then((rows:Record<string,string>[]) =>
        rows.filter(r=>r['SEQ']&&/^\d+$/.test(r['SEQ'])).map(r=>toRecord(r,m))
      ).catch(()=>[])
    )).then(all => { setData(all.flat()); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (!filters.markets.includes(r.country)) return false;
      if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
      if (filters.companion && r.companion !== filters.companion) return false;
      if (filters.sex && r.sex !== filters.sex) return false;
      if (filters.marriage && r.marriage !== filters.marriage) return false;
      if (filters.child && r.child !== filters.child) return false;
      if (r.calories > 0 && r.calories > filters.maxCal) return false;
      if (filters.ageGroup) {
        const [lo,hi] = AGE_RANGES[filters.ageGroup];
        if (r.age < lo || r.age > hi) return false;
      }
      return true;
    });
  }, [data, filters]);

  const cuisines = useMemo(() => [...new Set(data.map(r=>r.cuisine).filter(Boolean))].sort(), [data]);
  const companions = useMemo(() => [...new Set(data.map(r=>r.companion).filter(Boolean))].sort(), [data]);

  const cuisineCounts = useMemo(() => {
    const counts: Record<string,number> = {};
    filtered.forEach(r => { if (r.cuisine) counts[r.cuisine] = (counts[r.cuisine]||0) + 1; });
    return counts;
  }, [filtered]);

  const colorFreq = useMemo(() => {
    const freq: Record<string,number> = {};
    let total = 0;
    filtered.forEach(r => r.colors.forEach(c => { freq[c] = (freq[c]||0)+1; total++; }));
    return Object.entries(freq)
      .map(([color,n]) => ({ color, pct: Math.round(n/total*100) }))
      .sort((a,b) => b.pct-a.pct);
  }, [filtered]);

  // Bottom analysis stats
  const withCal = filtered.filter(r => r.calories > 0);
  const avgCal = Math.round(avg(withCal.map(r=>r.calories)));
  const avgProt = Math.round(avg(withCal.map(r=>r.protein)));
  const avgFat = Math.round(avg(withCal.map(r=>r.fat)));
  const avgCarbs = Math.round(avg(withCal.map(r=>r.carbs)));
  const avgSalt = avg(withCal.map(r=>r.salt)).toFixed(1);
  const avgFiber = avg(withCal.map(r=>r.fiber)).toFixed(1);

  const peopleCounts = useMemo(() => {
    const c: Record<string,number> = {};
    filtered.forEach(r => { if (r.peopleCount) c[r.peopleCount] = (c[r.peopleCount]||0)+1; });
    return c;
  }, [filtered]);

  const companionCounts = useMemo(() => {
    const c: Record<string,number> = {};
    filtered.forEach(r => { if (r.companion) c[r.companion] = (c[r.companion]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]);
  }, [filtered]);

  const maxCompanion = companionCounts[0]?.[1] || 1;

  const COMPANION_COLORS: Record<string,string> = {
    '自分':'#6B7280','家族':'#378ADD','友達':'#1D9E75','恋人・配偶者':'#E8493F','同僚':'#BA7517','友人':'#7F77DD'
  };

  async function loadInsights() {
    setInsightsLoading(true);
    setInsights('');
    const summary = `
Total meals: ${filtered.length}
Markets: ${filters.markets.join(', ')}
Age group: ${filters.ageGroup || 'All'}
Avg calories: ${avgCal} kcal | Protein: ${avgProt}g | Fat: ${avgFat}g | Carbs: ${avgCarbs}g | Salt: ${avgSalt}g
Top cuisines: ${Object.entries(cuisineCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n])=>`${c}(${n})`).join(', ')}
Companions: ${companionCounts.slice(0,5).map(([c,n])=>`${c}(${n})`).join(', ')}
People per meal: ${Object.entries(peopleCounts).map(([k,v])=>`${k}:${v}`).join(', ')}
Gender split: Male=${filtered.filter(r=>r.sex==='男性').length}, Female=${filtered.filter(r=>r.sex==='女性').length}
Married: ${filtered.filter(r=>r.marriage==='既婚').length}, Single: ${filtered.filter(r=>r.marriage==='未婚').length}
With children: ${filtered.filter(r=>r.child==='いる').length}, Without: ${filtered.filter(r=>r.child==='いない').length}
    `.trim();
    try {
      const res = await fetch('/api/insights', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ summary }) });
      const json = await res.json();
      setInsights(json.insights || 'No insights.');
    } catch { setInsights('Failed to load insights.'); }
    setInsightsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center font-bold">🍽</div>
          <div>
            <h1 className="font-bold text-white text-sm leading-none">Dining Scene</h1>
            <p className="text-gray-400 text-xs mt-0.5">5-Market Food Research</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{filtered.length} / {data.length} meals</span>
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button onClick={()=>setTab('grid')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab==='grid'?'bg-red-500 text-white':'text-gray-400 hover:text-white'}`}>📷 Photos</button>
            <button onClick={()=>setTab('analysis')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab==='analysis'?'bg-red-500 text-white':'text-gray-400 hover:text-white'}`}>📊 Analysis</button>
          </div>
        </div>
      </header>

      <div className="flex" style={{ height:'calc(100vh - 57px)' }}>
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto p-4 hidden lg:block">
          <FilterPanel
            filters={filters}
            onChange={p => setFilters(f=>({...f,...p}))}
            onReset={() => setFilters(INIT)}
            total={data.length}
            shown={filtered.length}
            cuisines={cuisines}
            companions={companions}
            colorFreq={colorFreq}
            cuisineCounts={cuisineCounts}
          />
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading meals from Google Sheets…</p>
            </div>
          ) : tab === 'grid' ? (
            <>
              <PhotoGrid photos={filtered} marketColors={MARKET_COLORS} onSelect={setSelected} />

              {/* ── Bottom Analysis Bar ── */}
              {filtered.length > 0 && (
                <div className="border-t border-gray-800 bg-gray-900 px-6 py-5">
                  <div className="flex flex-wrap gap-8">

                    {/* Avg Calories + Nutrition */}
                    <div className="min-w-[200px]">
                      <p className="text-xs text-gray-400 uppercase mb-2">ANALYSIS <span className="text-gray-500">{filtered.length} photos</span> <span className="text-red-400 font-semibold ml-2">Avg {avgCal} kcal</span></p>
                      <div className="space-y-1.5">
                        {[['Calorie','kcal',avgCal,2000,'#E8493F'],['Protein','g',avgProt,100,'#378ADD'],['Fat','g',avgFat,100,'#BA7517'],['Carbs','g',avgCarbs,300,'#7F77DD'],['Fiber','g',parseFloat(avgFiber),30,'#1D9E75'],['Salt','g',parseFloat(avgSalt),10,'#E8774A']].map(([label,unit,val,max,color])=>(
                          <div key={label as string} className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs w-14">{label as string}</span>
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width:`${Math.min((val as number)/(max as number)*100,100)}%`, background: color as string }} />
                            </div>
                            <span className="text-gray-300 text-xs w-16 text-right">{val}{unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* People Count */}
                    {Object.keys(peopleCounts).length > 0 && (
                      <div className="min-w-[160px]">
                        <p className="text-xs text-gray-400 uppercase mb-2">Estimated People</p>
                        {Object.entries(peopleCounts).sort((a,b)=>b[1]-a[1]).map(([k,v]) => {
                          const pct = Math.round(v/filtered.length*100);
                          return (
                            <div key={k} className="mb-1">
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gray-400">{k}</span>
                                <span className="text-gray-500">{v} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-400" style={{ width:`${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Companion */}
                    {companionCounts.length > 0 && (
                      <div className="min-w-[180px]">
                        <p className="text-xs text-gray-400 uppercase mb-2">Dining Companion</p>
                        {companionCounts.map(([c,n]) => (
                          <div key={c} className="flex items-center gap-2 mb-1.5">
                            <span className="text-gray-400 text-xs w-20">{c}</span>
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width:`${Math.round(n/maxCompanion*100)}%`, background: COMPANION_COLORS[c]||'#6B7280' }} />
                            </div>
                            <span className="text-gray-400 text-xs w-14 text-right">{n} ({Math.round(n/filtered.length*100)}%)</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Insights */}
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-gray-400 uppercase">AI Insights</p>
                        <button onClick={loadInsights} disabled={insightsLoading}
                          className="px-2 py-0.5 rounded text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors">
                          {insightsLoading ? '...' : '✨ Generate'}
                        </button>
                      </div>
                      {insights ? (
                        <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{insights}</div>
                      ) : (
                        <p className="text-gray-600 text-xs">Click Generate to get AI-powered insights about the current filtered data.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </>
          ) : (
            <AnalysisDashboard data={filtered} allData={data} marketLabels={MARKET_LABELS} marketColors={MARKET_COLORS} />
          )}
        </main>
      </div>

      {selected && <PhotoModal record={selected} marketColors={MARKET_COLORS} marketLabels={MARKET_LABELS} onClose={() => setSelected(null)} />}
    </div>
  );
}
