
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
  const r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  return 0.299*r+0.587*g+0.114*b;
}

// Squarified treemap
function treemapLayout(items: ColorFreq[], W: number, H: number) {
  if (!items.length) return [];
  const total = items.reduce((s,i)=>s+i.count,0);
  if (!total) return [];
  type Rect = {color:string;count:number;x:number;y:number;w:number;h:number};
  const rects: Rect[] = [];
  function worst(row: ColorFreq[], rowTotal: number, side: number) {
    let w=0;
    for (const it of row) { const area=(it.count/total)*W*H, rArea=(rowTotal/total)*W*H, rLen=rArea/side, iLen=area/rLen; w=Math.max(w,Math.max(rLen/iLen,iLen/rLen)); }
    return w;
  }
  function layoutRow(row: ColorFreq[], rowTotal: number, x:number,y:number,w:number,h:number,remTotal:number) {
    const aFrac=rowTotal/(remTotal+rowTotal), isH=w>=h, rSize=isH?w*aFrac:h*aFrac;
    let off=0;
    for (const it of row) { const frac=it.count/rowTotal, sz=isH?h*frac:w*frac; rects.push({color:it.color,count:it.count,x:isH?x:x+off,y:isH?y+off:y,w:isH?rSize:sz,h:isH?sz:rSize}); off+=sz; }
    return {x:isH?x+rSize:x,y:isH?y:y+rSize,w:isH?w-rSize:w,h:isH?h:h-rSize};
  }
  let cx=0,cy=0,cw=W,ch=H,rem=[...items],remTotal=total;
  while (rem.length>0) {
    const side=Math.min(cw,ch), row=[rem[0]]; let rowSum=rem[0].count, i=1;
    while (i<rem.length) { const nr=[...row,rem[i]], ns=rowSum+rem[i].count; if(worst(nr,ns,side)<=worst(row,rowSum,side)){row.push(rem[i]);rowSum=ns;i++;}else break; }
    const next=layoutRow(row,rowSum,cx,cy,cw,ch,remTotal-rowSum);
    cx=next.x;cy=next.y;cw=next.w;ch=next.h;remTotal-=rowSum;rem=rem.slice(i);
  }
  return rects;
}

function ColorTreemap({colorFrequencies,selectedColors,onToggle}:{colorFrequencies:ColorFreq[];selectedColors:string[];onToggle:(c:string)=>void}) {
  const W=240,H=160;
  const rects = useMemo(()=>treemapLayout(colorFrequencies.slice(0,40),W,H),[colorFrequencies]);
  const totalCount = colorFrequencies.reduce((s,c)=>s+c.count,0);
  if (!rects.length) return null;
  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{width:W,height:H}}>
      {rects.map(r => {
        const isOn=selectedColors.includes(r.color), pct=totalCount>0?((r.count/totalCount)*100).toFixed(1):"0";
        const textColor=luminance(r.color)>0.6?"rgba(0,0,0,0.7)":"rgba(255,255,255,0.85)";
        return (
          <button key={r.color} onClick={()=>onToggle(r.color)} title={`${r.color} (${pct}%)`}
            className="absolute transition-all duration-150 hover:brightness-110"
            style={{left:r.x,top:r.y,width:Math.max(r.w,1),height:Math.max(r.h,1),backgroundColor:r.color,
              outline:isOn?"3px solid #E8493F":"none",outlineOffset:"-3px",zIndex:isOn?10:1,
              opacity:selectedColors.length>0&&!isOn?0.4:1}}>
            {r.w>28&&r.h>16&&<span className="text-[9px] font-bold leading-none" style={{color:textColor}}>{pct}%</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterPanel({filters,onChange,onReset,photoCount,totalCount,cuisines,cuisineCounts,colorFrequencies,lang}:Props) {
  const pillOn = "bg-[#E8493F] text-white border-[#E8493F]";
  const pillOff = "border-gray-300 text-gray-600 hover:border-[#E8493F]";
  const cuisineTotal = Object.values(cuisineCounts).reduce((s,n)=>s+n,0);
  const orderedCuisines = [...CUISINE_ORDER.filter(c=>cuisines.includes(c)), ...cuisines.filter(c=>!CUISINE_ORDER.includes(c as any))];

  return (
    <aside className="w-72 bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">{t.filters[lang]}</h2>
        <button onClick={onReset} className="text-xs bg-[#E8493F] text-white px-3 py-1 rounded-full hover:bg-[#d43d33]">{t.reset[lang]}</button>
      </div>
      <p className="text-xs text-gray-400">{photoCount} / {totalCount} {t.photos[lang]}</p>

      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.gender[lang]}</p>
        <div className="flex gap-2">
          {[["男性",lang==="ja"?"男性":"Male"],["女性",lang==="ja"?"女性":"Female"]].map(([v,l])=>(
            <button key={v} onClick={()=>onChange({...filters,sex:toggle(filters.sex,v)})}
              className={`flex-1 py-1.5 text-xs rounded-full border transition-colors ${filters.sex.includes(v)?pillOn:pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.age[lang]}: {filters.ageRange[0]} – {filters.ageRange[1]}</p>
        <div className="flex gap-2">
          {([0,1] as const).map(i=>(
            <input key={i} type="range" min={15} max={70} value={filters.ageRange[i]}
              onChange={e=>{const r:[number,number]=[...filters.ageRange];r[i]=Number(e.target.value);onChange({...filters,ageRange:r});}}
              className="flex-1 accent-[#E8493F]" />
          ))}
        </div>
      </div>

      {/* Marital */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.marriage[lang]}</p>
        <div className="flex flex-wrap gap-2">
          {[["未婚",lang==="ja"?"未婚":"Single"],["既婚",lang==="ja"?"既婚":"Married"],["離婚別",lang==="ja"?"離婚別":"Divorced"]].map(([v,l])=>(
            <button key={v} onClick={()=>onChange({...filters,marriage:toggle(filters.marriage,v)})}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filters.marriage.includes(v)?pillOn:pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Children */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.child[lang]}</p>
        <div className="flex gap-2">
          {[["いる",lang==="ja"?"いる":"Yes"],["いない",lang==="ja"?"いない":"No"]].map(([v,l])=>(
            <button key={v} onClick={()=>onChange({...filters,child:toggle(filters.child,v)})}
              className={`flex-1 py-1.5 text-xs rounded-full border transition-colors ${filters.child.includes(v)?pillOn:pillOff}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.area[lang]}</p>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map(code=>(
            <button key={code} onClick={()=>onChange({...filters,residence:toggle(filters.residence,code)})}
              className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${filters.residence.includes(code)?pillOn:pillOff}`}>
              {countryNames[code][lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine — full-width pills with count + % like original */}
      {orderedCuisines.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.cuisine[lang]}</p>
          <div className="flex flex-col gap-1.5">
            {orderedCuisines.map(c => {
              const count = cuisineCounts[c] || 0;
              const pct = cuisineTotal > 0 ? ((count/cuisineTotal)*100).toFixed(1) : "0.0";
              const isOn = filters.cuisineType.includes(c);
              return (
                <button key={c} onClick={()=>onChange({...filters,cuisineType:toggle(filters.cuisineType,c)})}
                  className={`flex items-center justify-between w-full px-3 py-2 text-[11px] rounded-xl border transition-colors ${isOn?pillOn:pillOff}`}>
                  <span className="font-medium">{c}</span>
                  <span className={`text-[10px] ${isOn?"text-white/80":"text-gray-400"}`}>{count} items ({pct} %)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color treemap */}
      {colorFrequencies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#E8493F] mb-2">{t.colorPalette[lang]}</p>
          <ColorTreemap colorFrequencies={colorFrequencies} selectedColors={filters.selectedColors}
            onToggle={color=>onChange({...filters,selectedColors:toggle(filters.selectedColors,color)})} />
          {filters.selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.selectedColors.map(c=>(
                <button key={c} onClick={()=>onChange({...filters,selectedColors:toggle(filters.selectedColors,c)})}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-[#E8493F] text-[#E8493F] hover:bg-red-50">
                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-gray-300" style={{backgroundColor:c}} />{c}<span>&times;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
