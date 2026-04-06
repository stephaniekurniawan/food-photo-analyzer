'use client';
import { Filters } from '@/lib/types';
interface Props { filters: Filters; onChange: (f: Filters) => void; onReset: () => void; markets: string[]; marketLabels: Record<string, string>; marketColors: Record<string, string>; cuisines: string[]; companions: string[]; total: number; shown: number; }
export default function FilterPanel({ filters, onChange, onReset, markets, marketLabels, marketColors, cuisines, companions, total, shown }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const btn = (active: boolean, color?: string) => `px-2 py-1 rounded-lg text-xs border transition-colors ${active ? 'text-white border-transparent' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">Filters</span>
        <button onClick={onReset} className="text-xs text-red-400 hover:text-red-300">Reset</button>
      </div>
      <p className="text-gray-400 text-xs">{shown} of {total} meals shown</p>

      {/* Markets */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Markets</p>
        <div className="space-y-1">
          {markets.map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={filters.markets.includes(m)} onChange={e => set({ markets: e.target.checked ? [...filters.markets, m] : filters.markets.filter(x => x !== m) })} className="sr-only" />
              <span className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: filters.markets.includes(m) ? marketColors[m] : '#374151' }}>{filters.markets.includes(m) ? '✓' : ''}</span>
              <span className="text-gray-300 group-hover:text-white text-xs">{marketLabels[m]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Cuisine</p>
        <select value={filters.cuisine} onChange={e => set({ cuisine: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
          <option value="">All cuisines</option>
          {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Companion */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Dining Companion</p>
        <select value={filters.companion} onChange={e => set({ companion: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
          <option value="">All companions</option>
          {companions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Gender */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Gender</p>
        <div className="flex gap-1.5">
          {[['', 'All'], ['男性', 'Male'], ['女性', 'Female']].map(([v, label]) => (
            <button key={v} onClick={() => set({ sex: v })} className={btn(filters.sex === v)} style={filters.sex === v ? { background: '#E8493F' } : {}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Marriage */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Marital Status</p>
        <div className="flex gap-1.5 flex-wrap">
          {[['', 'All'], ['未婚', 'Single'], ['既婚', 'Married'], ['離別', 'Divorced']].map(([v, label]) => (
            <button key={v} onClick={() => set({ marriage: v })} className={btn(filters.marriage === v)} style={filters.marriage === v ? { background: '#7F77DD' } : {}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Children */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Children</p>
        <div className="flex gap-1.5">
          {[['', 'All'], ['いる', 'Yes'], ['いない', 'No']].map(([v, label]) => (
            <button key={v} onClick={() => set({ child: v })} className={btn(filters.child === v)} style={filters.child === v ? { background: '#1D9E75' } : {}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Calories */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Max Calories: {filters.maxCal} kcal</p>
        <input type="range" min={0} max={2000} step={50} value={filters.maxCal} onChange={e => set({ maxCal: Number(e.target.value) })} className="w-full accent-red-500" />
      </div>
    </div>
  );
}
