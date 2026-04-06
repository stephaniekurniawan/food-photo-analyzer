'use client';
import { MealRecord } from '@/lib/types';
interface Props { data: MealRecord[]; allData: MealRecord[]; marketLabels: Record<string, string>; marketColors: Record<string, string>; }
const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const pct = (n: number, t: number) => t ? Math.round(n / t * 100) : 0;
function Bar({ label, value, max, color, extra }: { label: string; value: number; max: number; color: string; extra?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-gray-400 text-xs text-right">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
      </div>
      <span className="w-20 text-xs text-gray-300">{Math.round(value)}{extra ? ` ${extra}` : ''}</span>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-gray-900 rounded-xl p-5 space-y-3"><h3 className="font-semibold text-white text-sm">{title}</h3>{children}</div>;
}
export default function AnalysisDashboard({ data, marketLabels, marketColors }: Props) {
  const markets = Object.keys(marketLabels);
  const byMarket = (field: keyof MealRecord, m: string) => { const rows = data.filter(r => r.country === m && (r[field] as number) > 0); return avg(rows.map(r => r[field] as number)); };
  const topCuisines = Object.entries(data.reduce((acc, r) => { if (r.cuisine) acc[r.cuisine] = (acc[r.cuisine] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const companionCounts = Object.entries(data.reduce((acc, r) => { if (r.companion) acc[r.companion] = (acc[r.companion] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);
  const maxCal = Math.max(...markets.map(m => byMarket('calories', m)));
  const maxProt = Math.max(...markets.map(m => byMarket('protein', m)));
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
      <Card title="📊 Summary">
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Total Meals', val: data.length }, { label: 'Avg Calories', val: `${Math.round(avg(data.filter(r => r.calories > 0).map(r => r.calories)))} kcal` }, { label: 'Markets', val: markets.filter(m => data.some(r => r.country === m)).length }].map(({ label, val }) => (
            <div key={label} className="bg-gray-800 rounded-lg p-3 text-center"><p className="text-xl font-bold text-white">{val}</p><p className="text-xs text-gray-400 mt-0.5">{label}</p></div>
          ))}
        </div>
      </Card>
      <Card title="🔥 Avg Calories by Market">
        <div className="space-y-2">{markets.map(m => <Bar key={m} label={marketLabels[m]} value={byMarket('calories', m)} max={maxCal} color={marketColors[m]} />)}</div>
      </Card>
      <Card title="💪 Avg Protein (g) by Market">
        <div className="space-y-2">{markets.map(m => <Bar key={m} label={marketLabels[m]} value={byMarket('protein', m)} max={maxProt} color={marketColors[m]} />)}</div>
      </Card>
      <Card title="🍜 Top Cuisine Types">
        <div className="space-y-2">{topCuisines.map(([c, n]) => <Bar key={c} label={c} value={n} max={topCuisines[0]?.[1] || 1} color="#E8493F" extra={`(${n})`} />)}</div>
      </Card>
      <Card title="👥 Dining Companion">
        <div className="space-y-2">{companionCounts.map(([c, n]) => (
          <div key={c} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-gray-400 text-xs text-right shrink-0">{c}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden"><div className="h-full rounded-full bg-purple-500" style={{ width: `${pct(n, companionCounts[0]?.[1] || 1)}%` }} /></div>
            <span className="text-xs text-gray-300 w-16">{n} ({pct(n, data.length)}%)</span>
          </div>
        ))}</div>
      </Card>
      <Card title="🥗 Nutrition Table by Market">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead><tr className="text-gray-400 border-b border-gray-800"><th className="pb-2 pr-3">Market</th><th className="pb-2 pr-3 text-right">Cal</th><th className="pb-2 pr-3 text-right">Prot</th><th className="pb-2 pr-3 text-right">Fat</th><th className="pb-2 pr-3 text-right">Carbs</th><th className="pb-2 text-right">Salt</th></tr></thead>
            <tbody>{markets.map(m => { const rows = data.filter(r => r.country === m && r.calories > 0); if (!rows.length) return null; return (<tr key={m} className="border-b border-gray-800/50"><td className="py-1.5 pr-3 font-medium" style={{ color: marketColors[m] }}>{marketLabels[m]}</td><td className="py-1.5 pr-3 text-right text-gray-300">{Math.round(avg(rows.map(r => r.calories)))}</td><td className="py-1.5 pr-3 text-right text-gray-300">{Math.round(avg(rows.map(r => r.protein)))}</td><td className="py-1.5 pr-3 text-right text-gray-300">{Math.round(avg(rows.map(r => r.fat)))}</td><td className="py-1.5 pr-3 text-right text-gray-300">{Math.round(avg(rows.map(r => r.carbs)))}</td><td className="py-1.5 text-right text-gray-300">{avg(rows.map(r => r.salt)).toFixed(1)}</td></tr>); })}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
