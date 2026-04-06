'use client';
import { Filters } from '@/lib/types';

const AGE_GROUPS = ['10s','20s','30s','40s','50s+'];

interface Props {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  total: number;
  shown: number;
  cuisines: string[];
  companions: string[];
  colorFreq: { color: string; pct: number }[];
  cuisineCounts: Record<string, number>;
}

const btn = (active: boolean) =>
  `px-2 py-1 rounded-lg text-xs border transition-colors ${active ? 'text-white border-transparent' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`;

export default function FilterPanel({ filters, onChange, onReset, total, shown, cuisines, companions, colorFreq, cuisineCounts }: Props) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">Filters</span>
        <button onClick={onReset} className="text-xs text-red-400 hover:text-red-300">Reset</button>
      </div>
      <p className="text-gray-400 text-xs">{shown} of {total} meals shown</p>

      {/* Age Group */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Age Group</p>
        <div className="flex flex-wrap gap-1.5">
          {['', ...AGE_GROUPS].map((g, i) => (
            <button key={g} onClick={() => onChange({ ageGroup: g })}
              className={btn(filters.ageGroup === g)}
              style={filters.ageGroup === g ? { background: '#E8493F' } : {}}>
              {g || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Markets */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Markets</p>
        <div className="space-y-1">
          {[['SG','Singapore','#E8493F'],['ID','Indonesia','#378ADD'],['JP','Japan','#1D9E75'],['MY','Malaysia','#BA7517'],['PH','Philippines','#7F77DD']].map(([code,label,color]) => {
            const on = filters.markets.includes(code);
            return (
              <label key={code} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="sr-only" checked={on} onChange={() => {
                  const next = on ? filters.markets.filter(m => m !== code) : [...filters.markets, code];
                  onChange({ markets: next });
                }} />
                <span className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: on ? color : '#374151' }}>{on ? '✓' : ''}</span>
                <span className="text-gray-300 group-hover:text-white text-xs">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Cuisine</p>
        <select value={filters.cuisine} onChange={e => onChange({ cuisine: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
          <option value="">All cuisines</option>
          {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Cuisine counts */}
      {Object.keys(cuisineCounts).length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase mb-2">Cooking Type</p>
          <div className="space-y-1">
            {Object.entries(cuisineCounts).sort((a,b) => b[1]-a[1]).map(([c,n]) => (
              <div key={c} className="flex items-center justify-between cursor-pointer hover:bg-gray-800/50 px-1 py-0.5 rounded"
                onClick={() => onChange({ cuisine: filters.cuisine === c ? '' : c })}>
                <span className={`text-xs ${filters.cuisine === c ? 'text-white font-medium' : 'text-gray-400'}`}>{c}</span>
                <span className="text-gray-500 text-xs">{n} ({Math.round(n/shown*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Companion */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Dining Companion</p>
        <select value={filters.companion} onChange={e => onChange({ companion: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none">
          <option value="">All companions</option>
          {companions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Gender */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Gender</p>
        <div className="flex gap-1.5">
          {[['','All'],['男性','Male'],['女性','Female']].map(([v,label]) => (
            <button key={v} onClick={() => onChange({ sex: v })} className={btn(filters.sex === v)}
              style={filters.sex === v ? { background: '#E8493F' } : {}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Marital */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Marital Status</p>
        <div className="flex gap-1.5 flex-wrap">
          {[['','All'],['未婚','Single'],['既婚','Married'],['離別','Divorced']].map(([v,label]) => (
            <button key={v} onClick={() => onChange({ marriage: v })} className={btn(filters.marriage === v)}
              style={filters.marriage === v ? { background: '#7F77DD' } : {}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Children */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Children</p>
        <div className="flex gap-1.5">
          {[['','All'],['いる','Yes'],['いない','No']].map(([v,label]) => (
            <button key={v} onClick={() => onChange({ child: v })} className={btn(filters.child === v)}
              style={filters.child === v ? { background: '#1D9E75' } : {}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Calories */}
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase mb-2">Max Calories: {filters.maxCal} kcal</p>
        <input type="range" min={0} max={2000} step={50} value={filters.maxCal}
          onChange={e => onChange({ maxCal: Number(e.target.value) })} className="w-full accent-red-500" />
      </div>

      {/* Color Palette */}
      {colorFreq.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase mb-2">Color Palette</p>
          <div className="grid grid-cols-5 gap-0.5">
            {colorFreq.slice(0, 20).map((cf, i) => (
              <div key={i} className="relative group">
                <div className="w-full aspect-square rounded-sm" style={{ background: cf.color }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-bold text-white drop-shadow">{cf.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
