"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { FoodPhoto, Filters } from "@/types";
import { Lang, t } from "@/lib/i18n";
import Header from "@/components/Header";
import FilterPanel from "@/components/FilterPanel";
import PhotoGrid from "@/components/PhotoGrid";
import PhotoModal from "@/components/PhotoModal";
import AnalysisDashboard from "@/components/AnalysisDashboard";

const initialFilters: Filters = { sex:[], ageRange:[15,70], marriage:[], child:[], incomeLevel:[], residence:[], cuisineType:[], selectedColors:[] };

export default function Home() {
  const [allPhotos, setAllPhotos] = useState<Record<string,FoodPhoto[]>>({});
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedPhoto, setSelectedPhoto] = useState<FoodPhoto|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [lang, setLang] = useState<Lang>("ja");
  const [filterOpen, setFilterOpen] = useState(false);
  const toggleFilter = useCallback(()=>setFilterOpen(v=>!v),[]);

  useEffect(()=>{
    setLoading(true);
    fetch("/api/sheets").then(r=>r.json()).then(json=>{
      if (json.countries&&Object.keys(json.countries).length>0) setAllPhotos(json.countries);
      else if (json.error) setError(json.error);
    }).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[]);

  const currentPhotos = useMemo(()=>Object.values(allPhotos).flat(),[allPhotos]);
  const filteredPhotos = useMemo(()=>currentPhotos.filter(p=>{
    if (filters.sex.length>0&&!filters.sex.includes(p.sex)) return false;
    if (p.age<filters.ageRange[0]||p.age>filters.ageRange[1]) return false;
    if (filters.marriage.length>0&&!filters.marriage.includes(p.marriage)) return false;
    if (filters.child.length>0&&!filters.child.includes(p.child)) return false;
    if (filters.residence.length>0&&!filters.residence.includes(p.country)) return false;
    if (filters.cuisineType.length>0&&!filters.cuisineType.includes(p.cuisineType)) return false;
    if (filters.selectedColors.length>0&&!p.colors.some(c=>filters.selectedColors.includes(c))) return false;
    return true;
  }),[currentPhotos,filters]);

  const availableCuisines = useMemo(()=>[...new Set(currentPhotos.map(p=>p.cuisineType).filter(Boolean))].sort(),[currentPhotos]);
  const cuisineCounts = useMemo(()=>{
    const f=currentPhotos.filter(p=>{
      if (filters.sex.length>0&&!filters.sex.includes(p.sex)) return false;
      if (p.age<filters.ageRange[0]||p.age>filters.ageRange[1]) return false;
      if (filters.marriage.length>0&&!filters.marriage.includes(p.marriage)) return false;
      if (filters.child.length>0&&!filters.child.includes(p.child)) return false;
      if (filters.residence.length>0&&!filters.residence.includes(p.country)) return false;
      if (filters.selectedColors.length>0&&!p.colors.some(c=>filters.selectedColors.includes(c))) return false;
      return true;
    });
    const counts:Record<string,number>={};
    f.forEach(p=>{if(p.cuisineType)counts[p.cuisineType]=(counts[p.cuisineType]||0)+1;});
    return counts;
  },[currentPhotos,filters.sex,filters.ageRange,filters.marriage,filters.child,filters.residence,filters.selectedColors]);

  const colorFrequencies = useMemo(()=>{
    const f=currentPhotos.filter(p=>{
      if (filters.sex.length>0&&!filters.sex.includes(p.sex)) return false;
      if (p.age<filters.ageRange[0]||p.age>filters.ageRange[1]) return false;
      if (filters.marriage.length>0&&!filters.marriage.includes(p.marriage)) return false;
      if (filters.child.length>0&&!filters.child.includes(p.child)) return false;
      if (filters.residence.length>0&&!filters.residence.includes(p.country)) return false;
      if (filters.cuisineType.length>0&&!filters.cuisineType.includes(p.cuisineType)) return false;
      return true;
    });
    const counts:Record<string,number>={};
    f.forEach(p=>p.colors.forEach(c=>{if(c&&c.startsWith("#"))counts[c]=(counts[c]||0)+1;}));
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([color,count])=>({color,count}));
  },[currentPhotos,filters.sex,filters.ageRange,filters.marriage,filters.child,filters.residence,filters.cuisineType]);

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <Header lang={lang} onLangChange={setLang} onToggleFilter={toggleFilter} filterOpen={filterOpen} />
      <div className="flex pt-16">
        {filterOpen&&<div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={()=>setFilterOpen(false)} />}
        <div className={`fixed left-0 top-16 z-40 p-4 transition-transform duration-300 lg:translate-x-0 ${filterOpen?"translate-x-0":"-translate-x-full"}`}>
          <FilterPanel filters={filters} onChange={setFilters} onReset={()=>setFilters(initialFilters)} photoCount={filteredPhotos.length} totalCount={currentPhotos.length} cuisines={availableCuisines} cuisineCounts={cuisineCounts} colorFrequencies={colorFrequencies} lang={lang} />
        </div>
        <div className="lg:ml-80 flex-1 flex flex-col h-[calc(100vh-4rem)]">
          {loading?(
            <div className="flex items-center justify-center flex-1"><div className="text-center"><div className="animate-spin w-10 h-10 border-4 border-[#E8493F] border-t-transparent rounded-full mx-auto mb-3" /><p className="text-gray-500 text-sm">{t.loading[lang]}</p></div></div>
          ):error?(
            <div className="flex items-center justify-center flex-1"><p className="text-red-500">{error}</p></div>
          ):(
            <>
              <PhotoGrid photos={filteredPhotos} onPhotoClick={setSelectedPhoto} />
              <AnalysisDashboard photos={filteredPhotos} lang={lang} />
            </>
          )}
        </div>
      </div>
      {selectedPhoto&&<PhotoModal photo={selectedPhoto} onClose={()=>setSelectedPhoto(null)} lang={lang} />}
    </div>
  );
}
