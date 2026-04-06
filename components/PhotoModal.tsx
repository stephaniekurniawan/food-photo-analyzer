"use client";
import { useState } from "react";
import { FoodPhoto, AnalysisResult } from "@/types";
import Image from "next/image";
import { Lang, t, countryNames } from "@/lib/i18n";
interface Props { photo: FoodPhoto; onClose: () => void; lang: Lang; }
export default function PhotoModal({ photo, onClose, lang }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const dn = result?.nutrition??photo.nutrition, dc = result?.colors??photo.colors, dct = result?.cuisineType??photo.cuisineType, dp = result?.estimatedPeople??photo.estimatedPeople;
  const hs = result?.healthScore??photo.healthScore??0;
  const hc = hs>=7?"text-green-500":hs>=4?"text-yellow-500":"text-red-500";
  const maxN = Math.max(dn.protein,dn.fat,dn.carbs,1);
  const runAnalysis = async () => {
    setAnalyzing(true); setErr(null);
    try {
      const res = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageUrl:photo.photoUrl})});
      const json = await res.json();
      if (json.error) setErr(json.error); else setResult(json.result);
    } catch(e) { setErr(String(e)); }
    setAnalyzing(false);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-[#E8493F] text-white rounded-full flex items-center justify-center hover:bg-[#d43d33] text-xl font-bold">&times;</button>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <div className="bg-[#E8493F] text-white px-4 py-2 text-sm font-semibold rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none">{t.image[lang]}</div>
            <div className="relative aspect-[4/3] w-full"><Image src={photo.photoUrl} alt={photo.description} fill className="object-cover" unoptimized /></div>
            <div className="p-3 border-t">
              <button onClick={runAnalysis} disabled={analyzing} className="w-full py-2 bg-gradient-to-r from-[#E8493F] to-[#FF6B5A] text-white rounded-lg text-sm font-semibold hover:shadow-lg disabled:opacity-50">{analyzing?t.analyzing[lang]:result?t.reanalyze[lang]:t.analyze[lang]}</button>
              {err&&<p className="text-xs text-red-500 mt-1">{err}</p>}
              {result&&<p className="text-xs text-green-500 mt-1">{t.analysisComplete[lang]}</p>}
            </div>
          </div>
          <div className="md:w-1/2 p-5 flex flex-col gap-4">
            <div className="bg-[#E8493F] text-white px-4 py-2 text-sm font-semibold rounded-lg">{t.info[lang]}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[["country",countryNames[photo.country]?.[lang]??photo.country],["genderLabel",photo.sex],["ageLabel",`${photo.age}${lang==="ja"?"歳":""}`],["marriageLabel",photo.marriage],["childLabel",photo.child],["areaLabel",photo.residence]].map(([k,v])=>(
                <div key={k as string}><span className="text-gray-400 text-xs">{t[k as keyof typeof t][lang]}</span><p className="font-semibold">{v}</p></div>
              ))}
            </div>
            <div><span className="text-gray-400 text-xs">{t.comment[lang]}</span><p className="text-sm font-medium text-[#E8493F] mt-1 whitespace-pre-line">{photo.description}</p></div>
            {result?.description&&<div><span className="text-gray-400 text-xs">{t.aiDescription[lang]}</span><p className="text-sm font-medium text-gray-700 mt-1">{result.description}</p></div>}
            {result?.ingredients&&<div><span className="text-gray-400 text-xs">{t.ingredients[lang]}</span><div className="flex flex-wrap gap-1 mt-1">{result.ingredients.map((ing,i)=><span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{ing}</span>)}</div></div>}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{dct}</span>
              {hs>0&&<span className={`text-sm font-bold ${hc}`}>{t.health[lang]}: {hs}/10</span>}
              <span className="text-xs text-gray-400">{dp}{t.people[lang]} / {result?.plateCount??"?"} {t.plates[lang]}</span>
            </div>
            <div><span className="text-gray-400 text-xs block mb-2">{t.colorPalette[lang]}</span><div className="flex gap-1.5">{dc.slice(0,7).map((c,i)=><div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{backgroundColor:c}} title={c} />)}</div></div>
            <div>
              <span className="text-gray-400 text-xs block mb-2">{t.nutrition[lang]} ({dn.calories} kcal)</span>
              <div className="space-y-1.5">
                {[{l:t.protein[lang],v:dn.protein,c:"#E8493F"},{l:t.fat[lang],v:dn.fat,c:"#F59E0B"},{l:t.carbs[lang],v:dn.carbs,c:"#9CA3AF"},{l:t.fiber[lang],v:dn.fiber,c:"#10B981"},{l:t.sugar[lang],v:dn.sugar,c:"#EC4899"},{l:t.salt[lang],v:dn.salt,c:"#6B7280"}].map(n=>(
                  <div key={n.l} className="flex items-center gap-2">
                    <span className="text-xs w-16 text-gray-500">{n.l}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(100,(n.v/maxN)*100)}%`,backgroundColor:n.c}} /></div>
                    <span className="text-xs w-12 text-right text-gray-600">{n.v}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
