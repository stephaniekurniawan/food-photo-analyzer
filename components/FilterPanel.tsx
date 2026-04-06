
"use client";
import { useMemo } from "react";
import { FoodPhoto } from "@/types";
import { Lang, t } from "@/lib/i18n";

export interface Filters {
  sex: string[];
  ageMin: number;
  ageMax: number;
  marriage: string[];
  child: string[];
  residence: string[];   // country codes JP/SG/MY/ID/PH
  cuisineType: string[];
  estimatedPeople: string[];
  diningCompanion: string[];
  selectedColors: string[];
}

export const DEFAULT_FILTERS: Filters = {
  sex: [], ageMin: 10, ageMax: 70, marriage: [], child: [],
  residence: [], cuisineType: [], estimatedPeople: [], diningCompanion: [],
  selectedColors: [],
};

interface Props {
  photos: FoodPhoto[];
  filters: Filters;
  onChange: (f: Filters) => void;
  lang: Lang;
}

const COUNTRIES = ["JP","SG","MY","ID","PH"];
const countryNames: Record<string,Record<Lang,string>> = {
  JP:{en:"Japan",ja:"日本"},
  SG:{en:"Singapore",ja:"シンガポール"},
  MY:{en:"Malaysia",ja:"マレーシア"},
  ID:{en:"Indonesia",ja:"インドネシア"},
  PH:{en:"Philippines",ja:"フィリピン"},
};

const pillOn  = "bg-[#E8493F] text-white border-[#E8493F]";
const pillOff = "border-gray-300 text-gray-600 hover:border-[#E8493F]";

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

export default function FilterPanel({ photos, filters, onChange, lang }: Props) {

  // ── cuisine counts from ALL loaded photos (not filtered) ──────────────────
  const cuisineCounts = useMemo(() => {
    const counts: Record<string,number> = {};
    photos.forEach(p => {
      if (p.cuisineType) counts[p.cuisineType] = (counts[p.cuisineType]||0) + 1;
    });
    return counts;
  }, [photos]);

  const orderedCuisines = useMemo(() =>
    Object.entries(cuisineCounts).sort((a,b) => b[1]-a[1]).map(([c]) => c),
  [cuisineCounts]);

  const cuisineTotal = useMemo(() =>
    Object.values(cuisineCounts).reduce((s,n) => s+n, 0),
  [cuisineCounts]);

  // ── estimated people counts ───────────────────────────────────────────────
  const peopleCounts = useMemo(() => {
    const counts: Record<string,number> = {};
    photos.forEach(p => {
      if (p.estimatedPeople) counts[p.estimatedPeople] = (counts[p.estimatedPeople]||0) + 1;
    });
    return counts;
  }, [photos]);

  // ── dining companion counts ───────────────────────────────────────────────
  const companionCounts = useMemo(() => {
    const counts: Record<string,number> = {};
    photos.forEach(p => {
      if (p.diningCompanion) counts[p.diningCompanion] = (counts[p.diningCompanion]||0) + 1;
    });
    return counts;
  }, [photos]);

  // ── color frequencies ─────────────────────────────────────────────────────
  const colorFrequencies = useMemo(() => {
    const counts: Record<string,number> = {};
    photos.forEach(p => p.colors?.forEach(c => { counts[c] = (counts[c]||0)+1; }));
    return Object.entries(counts)
      .sort((a,b) => b[1]-a[1])
      .slice(0,20)
      .map(([color,count]) => ({color,count}));
  }, [photos]);

  const PEOPLE_ORDER = ["1人","2人","3人","4人以上"];
  const COMPANION_ORDER = ["自分","家族","友達","同僚","恋人・配偶者"];

  return (
    <aside className="w-72 bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">{t.filter[lang]}</h2>
        <button onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-xs bg-[#E8493F] text-white px-3 py-1 rounded-full hover:bg-[#d43d33]">
          {t.reset[lang]}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        {photos.length} {lang==="ja"?"件":"items"}
      </p>

      {/* Sex */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.sex[lang]}</p>
        <div className="flex gap-2">
          {[["男性", lang==="ja"?"男性":"Male"],["女性",lang==="ja"?"女性":"Female"]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({...filters, sex: toggle(filters.sex, v)})}
              className={`flex-1 py-1.5 text-xs rounded-full border transition-colors ${filters.sex.includes(v)?pillOn:pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">
          {t.age[lang]}: {filters.ageMin} – {filters.ageMax}
        </p>
        <div className="flex gap-2">
          <input type="range" min={10} max={70} value={filters.ageMin} className="flex-1 accent-[#E8493F]"
            onChange={e => onChange({...filters, ageMin: +e.target.value})} />
          <input type="range" min={10} max={70} value={filters.ageMax} className="flex-1 accent-[#E8493F]"
            onChange={e => onChange({...filters, ageMax: +e.target.value})} />
        </div>
      </div>

      {/* Marriage */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.marriage[lang]}</p>
        <div className="flex flex-wrap gap-2">
          {[["未婚",lang==="ja"?"未婚":"Single"],["既婚",lang==="ja"?"既婚":"Married"],["離別",lang==="ja"?"離別":"Divorced"]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({...filters, marriage: toggle(filters.marriage, v)})}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filters.marriage.includes(v)?pillOn:pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Children */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.child[lang]}</p>
        <div className="flex gap-2">
          {[["いる",lang==="ja"?"いる":"Yes"],["いない",lang==="ja"?"いない":"No"]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({...filters, child: toggle(filters.child, v)})}
              className={`flex-1 py-1.5 text-xs rounded-full border transition-colors ${filters.child.includes(v)?pillOn:pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Area / Country */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.area[lang]}</p>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map(code => (
            <button key={code} onClick={() => onChange({...filters, residence: toggle(filters.residence, code)})}
              className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${filters.residence.includes(code)?pillOn:pillOff}`}>
              {countryNames[code][lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Type */}
      {orderedCuisines.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.cuisine[lang]}</p>
          <div className="flex flex-col gap-1">
            {orderedCuisines.map(c => {
              const count = cuisineCounts[c] || 0;
              const pct = cuisineTotal > 0 ? ((count/cuisineTotal)*100).toFixed(1) : "0.0";
              const isOn = filters.cuisineType.includes(c);
              return (
                <button key={c} onClick={() => onChange({...filters, cuisineType: toggle(filters.cuisineType, c)})}
                  className={`flex items-center justify-between px-3 py-1.5 text-[11px] rounded-xl border transition-colors ${isOn?pillOn:pillOff}`}>
                  <span className="font-medium">{c}</span>
                  <span className={`text-[10px] ${isOn?"text-white/80":"text-gray-400"}`}>{count}{lang==="ja"?"件":"x"} ({pct}%)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Estimated Number of People */}
      {Object.keys(peopleCounts).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.estimatedPeople[lang]}</p>
          <div className="flex flex-wrap gap-1.5">
            {PEOPLE_ORDER.filter(p => peopleCounts[p]).map(p => {
              const isOn = filters.estimatedPeople.includes(p);
              return (
                <button key={p} onClick={() => onChange({...filters, estimatedPeople: toggle(filters.estimatedPeople, p)})}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${isOn?pillOn:pillOff}`}>
                  {p} ({peopleCounts[p]})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dining Companion */}
      {Object.keys(companionCounts).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.diningCompanion[lang]}</p>
          <div className="flex flex-col gap-1">
            {COMPANION_ORDER.filter(c => companionCounts[c]).map(c => {
              const isOn = filters.diningCompanion.includes(c);
              const count = companionCounts[c] || 0;
              const total = Object.values(companionCounts).reduce((s,n)=>s+n,0);
              const pct = total > 0 ? ((count/total)*100).toFixed(1) : "0.0";
              return (
                <button key={c} onClick={() => onChange({...filters, diningCompanion: toggle(filters.diningCompanion, c)})}
                  className={`flex items-center justify-between px-3 py-1.5 text-[11px] rounded-xl border transition-colors ${isOn?pillOn:pillOff}`}>
                  <span className="font-medium">{c}</span>
                  <span className={`text-[10px] ${isOn?"text-white/80":"text-gray-400"}`}>{count}{lang==="ja"?"件":"x"} ({pct}%)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Palette */}
      {colorFrequencies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.colorPalette[lang]}</p>
          <div className="flex flex-wrap gap-1.5">
            {colorFrequencies.slice(0,20).map(({color,count}) => {
              const total = colorFrequencies.reduce((s,c)=>s+c.count,0);
              const pct = total > 0 ? ((count/total)*100).toFixed(1) : "0";
              const isOn = filters.selectedColors.includes(color);
              return (
                <button key={color} onClick={() => onChange({...filters, selectedColors: toggle(filters.selectedColors, color)})}
                  title={`${color} (${pct}%)`}
                  className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${isOn?"border-[#E8493F] scale-110":"border-transparent"}`}
                  style={{backgroundColor: color}} />
              );
            })}
          </div>
          {filters.selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.selectedColors.map(c => (
                <button key={c} onClick={() => onChange({...filters, selectedColors: toggle(filters.selectedColors, c)})}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-[#E8493F] text-[#E8493F] hover:bg-red-50">
                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-gray-300" style={{backgroundColor:c}} />
                  {c}<span className="ml-0.5">&times;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
