
"use client";
import { useState, useMemo } from "react";
import { FoodPhoto } from "@/types";
import { Lang, t } from "@/lib/i18n";
interface Props { photos: FoodPhoto[]; lang: Lang; }

export default function AnalysisDashboard({ photos, lang }: Props) {
  const [insights, setInsights] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const avg = useMemo(() => {
    if (!photos.length) return { calories:0,protein:0,fat:0,carbs:0,fiber:0,sugar:0,salt:0 };
    const s = photos.reduce((a,p) => ({
      calories:a.calories+p.nutrition.calories, protein:a.protein+p.nutrition.protein,
      fat:a.fat+p.nutrition.fat, carbs:a.carbs+p.nutrition.carbs,
      fiber:a.fiber+p.nutrition.fiber, sugar:a.sugar+p.nutrition.sugar, salt:a.salt+p.nutrition.salt,
    }), {calories:0,protein:0,fat:0,carbs:0,fiber:0,sugar:0,salt:0});
    const n = photos.length;
    return { calories:Math.round(s.calories/n), protein:Math.round(s.protein/n), fat:Math.round(s.fat/n),
      carbs:Math.round(s.carbs/n), fiber:Math.round(s.fiber/n), sugar:Math.round(s.sugar/n), salt:Math.round((s.salt/n)*10)/10 };
  }, [photos]);

  const topColors = useMemo(() => {
    const c: Record<string,number> = {};
    photos.forEach(p => p.colors.forEach(x => { if(x?.startsWith("#")) c[x]=(c[x]||0)+1; }));
    const total = Object.values(c).reduce((a,b)=>a+b,0);
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([color,count])=>({color,pct:total>0?Math.round((count/total)*100):0}));
  }, [photos]);

  const peopleDist = useMemo(() => {
    const order = ["1人","2人","3人","4人以上"];
    const c: Record<string,number> = {}; order.forEach(k => c[k]=0);
    photos.forEach(p => { const k=p.peopleCategory||"1人"; c[k]=(c[k]||0)+1; });
    const total = photos.length||1;
    return order.map(label => ({label, count:c[label]||0, pct:Math.round(((c[label]||0)/total)*100)}));
  }, [photos]);

  const companionDist = useMemo(() => {
    const order = ["自分","家族","友達","恋人・配偶者","同僚"];
    const colors: Record<string,string> = {"自分":"#6B7280","家族":"#3B82F6","友達":"#10B981","恋人・配偶者":"#EC4899","同僚":"#F59E0B"};
    const c: Record<string,number> = {}; order.forEach(k => c[k]=0);
    photos.forEach(p => { const k=p.diningCompanion||"自分"; c[k]=(c[k]||0)+1; });
    const total = photos.length||1;
    return order.map(label => ({label, count:c[label]||0, pct:Math.round(((c[label]||0)/total)*100), color:colors[label]||"#9CA3AF"}));
  }, [photos]);

  const cuisineDist = useMemo(() => {
    const c: Record<string,number> = {};
    photos.forEach(p => { if(p.cuisineType) c[p.cuisineType]=(c[p.cuisineType]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [photos]);

  const marketDist = useMemo(() => {
    const c: Record<string,number> = {};
    photos.forEach(p => { c[p.country]=(c[p.country]||0)+1; });
    return c;
  }, [photos]);

  async function loadInsights() {
    setLoadingAI(true); setInsights('');
    const summary = `
Total meals: ${photos.length}
Markets: ${Object.entries(marketDist).map(([k,v])=>`${k}(${v})`).join(', ')}
Avg calories: ${avg.calories} kcal | Protein: ${avg.protein}g | Fat: ${avg.fat}g | Carbs: ${avg.carbs}g | Salt: ${avg.salt}g
Top cuisines: ${cuisineDist.map(([c,n])=>`${c}(${n})`).join(', ')}
Companions: ${companionDist.map(d=>`${d.label}(${d.count},${d.pct}%)`).join(', ')}
People/meal: ${peopleDist.map(d=>`${d.label}:${d.count}(${d.pct}%)`).join(', ')}
Male: ${photos.filter(p=>p.sex==='男性').length}, Female: ${photos.filter(p=>p.sex==='女性').length}
Married: ${photos.filter(p=>p.marriage==='既婚').length}, Single: ${photos.filter(p=>p.marriage==='未婚').length}
With children: ${photos.filter(p=>p.child==='いる').length}
    `.trim();
    try {
      const res = await fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({summary})});
      const json = await res.json();
      setInsights(json.insights || 'No insights generated.');
    } catch { setInsights('Failed to load insights.'); }
    setLoadingAI(false);
  }

  const maxMacro = Math.max(avg.protein, avg.fat, avg.carbs, 1);
  if (!photos.length) return null;

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white/90 backdrop-blur px-4 sm:px-6 py-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.dashboard[lang]}</span>
        <span className="text-xs text-gray-400">{photos.length}{t.photos[lang]}</span>
        <span className="text-xs font-semibold text-[#E8493F]">{t.avgCalories[lang]}: {avg.calories} kcal</span>
        <button onClick={loadInsights} disabled={loadingAI}
          className="ml-auto px-4 py-1.5 rounded-full text-xs font-semibold bg-[#E8493F] text-white hover:bg-[#d43d33] disabled:opacity-50 transition-colors shadow-sm">
          {loadingAI ? '✨ Analyzing...' : '✨ AI Insights'}
        </button>
      </div>

      {/* AI insights box */}
      {insights && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">AI Insights</p>
          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{insights}</div>
        </div>
      )}

      {/* 4-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Color palette */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">{t.colorPalette[lang]}</p>
          <div className="flex gap-1.5 flex-wrap">
            {topColors.map(({color,pct},i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{backgroundColor:color}} title={`${color} (${pct}%)`} />
                <span className="text-[9px] text-gray-400">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] w-14 text-gray-500 font-semibold flex-shrink-0">{t.calories[lang]}</span>
            <div className="flex-1 h-3 bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{width:`${Math.min(100,(avg.calories/3000)*100)}%`}} />
            </div>
            <span className="text-[10px] w-14 text-right text-blue-600 font-bold flex-shrink-0">{avg.calories}kcal</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-0.5">{t.nutrition[lang]}</p>
          {[{l:t.protein[lang],v:avg.protein,c:"#E8493F"},{l:t.fat[lang],v:avg.fat,c:"#F59E0B"},{l:t.carbs[lang],v:avg.carbs,c:"#9CA3AF"},{l:t.fiber[lang],v:avg.fiber,c:"#10B981"},{l:t.sugar[lang],v:avg.sugar,c:"#EC4899"},{l:t.salt[lang],v:avg.salt,c:"#6B7280"}].map(n => (
            <div key={n.l} className="flex items-center gap-1">
              <span className="text-[10px] w-14 text-gray-500 flex-shrink-0">{n.l}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:`${Math.min(100,(n.v/maxMacro)*100)}%`,backgroundColor:n.c}} />
              </div>
              <span className="text-[10px] w-10 text-right text-gray-600 font-medium flex-shrink-0">{n.v}g</span>
            </div>
          ))}
        </div>

        {/* People */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">{t.peopleCount[lang]}</p>
          <div className="flex h-8 rounded-full overflow-hidden bg-gray-100 mb-2">
            {peopleDist.map(d => d.pct > 0 ? (
              <div key={d.label} className="h-full flex items-center justify-center"
                style={{width:`${d.pct}%`,backgroundColor:d.label==="1人"?"#93C5FD":d.label==="2人"?"#3B82F6":d.label==="3人"?"#2563EB":"#1D4ED8"}}
                title={`${d.label}: ${d.count} (${d.pct}%)`}>
                {d.pct>=12 && <span className="text-[11px] text-white font-medium">{d.label}</span>}
              </div>
            ) : null)}
          </div>
          <div className="flex gap-2 flex-wrap">
            {peopleDist.map(d => (
              <span key={d.label} className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor:d.label==="1人"?"#93C5FD":d.label==="2人"?"#3B82F6":d.label==="3人"?"#2563EB":"#1D4ED8"}} />
                {d.label}: {d.count} ({d.pct}%)
              </span>
            ))}
          </div>
        </div>

        {/* Companion */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">{t.diningCompanion[lang]}</p>
          <div className="space-y-1.5">
            {companionDist.map(d => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="text-[10px] w-20 text-gray-500 flex-shrink-0 truncate">{d.label}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${d.pct}%`,backgroundColor:d.color}} />
                </div>
                <span className="text-[10px] w-12 text-right text-gray-500 font-medium flex-shrink-0">{d.count} ({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
