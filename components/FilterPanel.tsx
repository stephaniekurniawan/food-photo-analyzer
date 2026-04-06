
"use client";
import { useMemo } from "react";
import { Filters } from "@/types";
import { Lang, t, countryNames } from "@/lib/i18n";

interface ColorFreq { color: string; count: number; }
interface Props {
  filters: Filters; onChange: (f: Filters) => void; onReset: () => void;
  photoCount: number; totalCount: number; cuisines: string[];
  cuisineCounts: Record<string,number>; colorFrequencies: ColorFreq[]; lang: Lang;
}

const CUISINE_ORDER = ["和食","中華","洋食","韓国料理","伝統ローカル料理","東南アジア料理","多国籍料理","その他"];
const COUNTRIES = ["JP","SG","MY","ID","PH"] as const;
function toggle(arr: string[], v: string) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

function luminance(hex: string) {
  const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  return 0.299*r + 0.587*g + 0.114*b;
}

export default function FilterPanel({ filters, onChange, onReset, photoCount, totalCount, cuisines, cuisineCounts, colorFrequencies, lang }: Props) {
  const pillOn = "bg-[#E8493F] text-white border-[#E8493F]";
  const pillOff = "border-gray-200 text-gray-600 hover:border-[#E8493F] hover:text-[#E8493F]";
  const cuisineTotal = Object.values(cuisineCounts).reduce((s,n) => s+n, 0);
  const orderedCuisines = [
    ...CUISINE_ORDER.filter(c => cuisines.includes(c)),
    ...cuisines.filter(c => !CUISINE_ORDER.includes(c))
  ];

  return (
    <aside className="w-72 bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">{t.filters[lang]}</h2>
        <button onClick={onReset} className="text-xs bg-[#E8493F] text-white px-3 py-1 rounded-full hover:bg-[#d43d33] transition-colors">
          {t.reset[lang]}
        </button>
      </div>
      <p className="text-xs text-gray-400">{photoCount} / {totalCount} {t.photos[lang]}</p>

      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.gender[lang]}</p>
        <div className="flex gap-2">
          {[["男性", lang==="ja"?"男性":"Male"],["女性", lang==="ja"?"女性":"Female"]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({...filters, sex: toggle(filters.sex, v)})}
              className={`flex-1 py-1.5 text-xs rounded-full border transition-colors ${filters.sex.includes(v) ? pillOn : pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.age[lang]}: {filters.ageRange[0]} – {filters.ageRange[1]}</p>
        <div className="flex gap-2">
          {([0,1] as const).map(i => (
            <input key={i} type="range" min={15} max={70} value={filters.ageRange[i]}
              onChange={e => { const r:[number,number]=[...filters.ageRange]; r[i]=Number(e.target.value); onChange({...filters,ageRange:r}); }}
              className="flex-1 accent-[#E8493F]" />
          ))}
        </div>
      </div>

      {/* Marital */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.marriage[lang]}</p>
        <div className="flex flex-wrap gap-1.5">
          {[["未婚",lang==="ja"?"未婚":"Single"],["既婚",lang==="ja"?"既婚":"Married"],["離婚別",lang==="ja"?"離婚別":"Divorced"]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({...filters, marriage: toggle(filters.marriage, v)})}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filters.marriage.includes(v) ? pillOn : pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Children */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.child[lang]}</p>
        <div className="flex gap-2">
          {[["いる",lang==="ja"?"いる":"Yes"],["いない",lang==="ja"?"いない":"No"]].map(([v,l]) => (
            <button key={v} onClick={() => onChange({...filters, child: toggle(filters.child, v)})}
              className={`flex-1 py-1.5 text-xs rounded-full border transition-colors ${filters.child.includes(v) ? pillOn : pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.area[lang]}</p>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map(code => (
            <button key={code} onClick={() => onChange({...filters, residence: toggle(filters.residence, code)})}
              className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${filters.residence.includes(code) ? pillOn : pillOff}`}>
              {countryNames[code][lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
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
                  className={`flex items-center justify-between px-3 py-1.5 text-[11px] rounded-xl border transition-colors ${isOn ? pillOn : pillOff}`}>
                  <span className="font-medium">{c}</span>
                  <span className={`text-[10px] ${isOn ? "text-white/80" : "text-gray-400"}`}>{count}件 ({pct}%)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color palette */}
      {colorFrequencies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.colorPalette[lang]}</p>
          <div className="flex flex-wrap gap-1.5">
            {colorFrequencies.slice(0,20).map(({color,count},i) => {
              const total = colorFrequencies.reduce((s,c)=>s+c.count,0);
              const pct = total > 0 ? Math.round((count/total)*100) : 0;
              const isOn = filters.selectedColors.includes(color);
              const lum = luminance(color);
              return (
                <button key={i} onClick={() => onChange({...filters, selectedColors: toggle(filters.selectedColors, color)})}
                  title={`${color} (${pct}%)`}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${isOn ? "border-[#E8493F] scale-110 shadow-md" : "border-white shadow"}`}
                  style={{ backgroundColor: color, opacity: filters.selectedColors.length > 0 && !isOn ? 0.4 : 1 }}
                />
              );
            })}
          </div>
          {filters.selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.selectedColors.map(c => (
                <button key={c} onClick={() => onChange({...filters, selectedColors: toggle(filters.selectedColors, c)})}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-[#E8493F] text-[#E8493F] hover:bg-red-50">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor:c}} />
                  {c} <span>&times;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
