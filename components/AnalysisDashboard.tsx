"use client";
import { useMemo } from "react";
import { FoodPhoto } from "@/types";
import { Lang, t } from "@/lib/i18n";
interface Props { photos: FoodPhoto[]; lang: Lang; }
export default function AnalysisDashboard({ photos, lang }: Props) {
  const avgNutrition = useMemo(() => {
    if (!photos.length) return { calories:0,protein:0,fat:0,carbs:0,fiber:0,sugar:0,salt:0 };
    const sum = photos.reduce((a,p)=>({ calories:a.calories+p.nutrition.calories, protein:a.protein+p.nutrition.protein, fat:a.fat+p.nutrition.fat, carbs:a.carbs+p.nutrition.carbs, fiber:a.fiber+p.nutrition.fiber, sugar:a.sugar+p.nutrition.sugar, salt:a.salt+p.nutrition.salt }),{calories:0,protein:0,fat:0,carbs:0,fiber:0,sugar:0,salt:0});
    const n=photos.length;
    return { calories:Math.round(sum.calories/n), protein:Math.round(sum.protein/n), fat:Math.round(sum.fat/n), carbs:Math.round(sum.carbs/n), fiber:Math.round(sum.fiber/n), sugar:Math.round(sum.sugar/n), salt:Math.round((sum.salt/n)*10)/10 };
  },[photos]);
  const topColors = useMemo(()=>{
    const counts:Record<string,number>={};
    photos.forEach(p=>p.colors.forEach(c=>{if(c&&c.startsWith("#"))counts[c]=(counts[c]||0)+1;}));
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([color,count])=>({color,count,pct:total>0?Math.round((count/total)*100):0}));
  },[photos]);
  const peopleDist = useMemo(()=>{
    const order=["1人","2人","3人","4人以上"]; const counts:Record<string,number>={};
    order.forEach(k=>counts[k]=0); photos.forEach(p=>{const cat=p.peopleCategory||"1人";counts[cat]=(counts[cat]||0)+1;});
    const total=photos.length||1;
    return order.map(label=>({label,count:counts[label]||0,pct:Math.round(((counts[label]||0)/total)*100)}));
  },[photos]);
  const companionDist = useMemo(()=>{
    const order=["自分","家族","友達","恋人・配偶者","同僚"];
    const colors:Record<string,string>={"自分":"#6B7280","家族":"#3B82F6","友達":"#10B981","恋人・配偶者":"#EC4899","同僚":"#F59E0B"};
    const counts:Record<string,number>={};
    order.forEach(k=>counts[k]=0); photos.forEach(p=>{const c=p.diningCompanion||"自分";counts[c]=(counts[c]||0)+1;});
    const total=photos.length||1;
    return order.map(label=>({label,count:counts[label]||0,pct:Math.round(((counts[label]||0)/total)*100),color:colors[label]||"#9CA3AF"}));
  },[photos]);
  const maxMacro=Math.max(avgNutrition.protein,avgNutrition.fat,avgNutrition.carbs,1);
  if (!photos.length) return null;
  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.dashboard[lang]}</span>
        <span className="text-xs text-gray-400">{photos.length}{t.photos[lang]}</span>
        <span className="text-xs font-semibold text-[#E8493F]">{t.avgCalories[lang]}: {avgNutrition.calories}kcal</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] text-gray-400 block mb-2">{t.colorPalette[lang]}</span>
          <div className="flex gap-1.5 flex-wrap">
            {topColors.map(({color,pct},i)=>(
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md" style={{backgroundColor:color}} title={`${color} (${pct}%)`} />
                <span className="text-[9px] text-gray-400">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] w-14 text-gray-500 flex-shrink-0 font-semibold">{t.calories[lang]}</span>
            <div className="flex-1 h-3 bg-blue-50 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width:`${Math.min(100,(avgNutrition.calories/3000)*100)}%`}} /></div>
            <span className="text-[10px] w-14 text-right text-blue-600 flex-shrink-0 font-bold">{avgNutrition.calories}kcal</span>
          </div>
          <span className="text-[10px] text-gray-400 block mb-0.5">{t.nutrition[lang]}</span>
          {[{label:t.protein[lang],val:avgNutrition.protein,color:"#E8493F"},{label:t.fat[lang],val:avgNutrition.fat,color:"#F59E0B"},{label:t.carbs[lang],val:avgNutrition.carbs,color:"#9CA3AF"},{label:t.fiber[lang],val:avgNutrition.fiber,color:"#10B981"},{label:t.sugar[lang],val:avgNutrition.sugar,color:"#EC4899"},{label:t.salt[lang],val:avgNutrition.salt,color:"#6B7280"}].map(n=>(
            <div key={n.label} className="flex items-center gap-1">
              <span className="text-[9px] sm:text-[10px] w-14 text-gray-500 flex-shrink-0">{n.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(100,(n.val/maxMacro)*100)}%`,backgroundColor:n.color}} /></div>
              <span className="text-[9px] sm:text-[10px] w-10 text-right text-gray-600 flex-shrink-0 font-medium">{n.val}g</span>
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block mb-1.5">{t.peopleCount[lang]}</span>
          <div className="flex h-7 sm:h-8 rounded-full overflow-hidden bg-gray-100">
            {peopleDist.map(d=>d.pct>0?(
              <div key={d.label} className="h-full flex items-center justify-center" style={{width:`${d.pct}%`,backgroundColor:d.label==="1人"?"#93C5FD":d.label==="2人"?"#3B82F6":d.label==="3人"?"#2563EB":"#1D4ED8"}} title={`${d.label}: ${d.count} (${d.pct}%)`}>
                {d.pct>=10&&<span className="text-[10px] sm:text-[11px] text-white font-medium">{d.label}</span>}
              </div>
            ):null)}
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {peopleDist.map(d=>(
              <span key={d.label} className="text-[10px] text-gray-500 whitespace-nowrap">
                <span className="inline-block w-2 h-2 rounded-full mr-0.5 align-middle" style={{backgroundColor:d.label==="1人"?"#93C5FD":d.label==="2人"?"#3B82F6":d.label==="3人"?"#2563EB":"#1D4ED8"}} />
                {d.label}: {d.count}{t.photos[lang]} ({d.pct}%)
              </span>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-gray-400 block mb-1.5">{t.diningCompanion[lang]}</span>
          <div className="space-y-1">
            {companionDist.map(d=>(
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="text-[10px] w-20 text-gray-500 flex-shrink-0 truncate">{d.label}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${d.pct}%`,backgroundColor:d.color}} /></div>
                <span className="text-[10px] w-12 text-right text-gray-500 flex-shrink-0 font-medium">{d.count} ({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
