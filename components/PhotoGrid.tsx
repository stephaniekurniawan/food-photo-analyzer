'use client';
import { MealRecord } from '@/lib/types';
interface Props { photos: MealRecord[]; marketColors: Record<string, string>; onSelect: (r: MealRecord) => void; }
export default function PhotoGrid({ photos, marketColors, onSelect }: Props) {
  if (!photos.length) return <div className="flex items-center justify-center h-full text-gray-500">No meals match your filters.</div>;
  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
      {photos.map(r => (
        <button key={r.seq + r.photoUrl} onClick={() => onSelect(r)}
          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-500">
          <img src={r.photoUrl} alt={r.seq} className="w-full h-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).src = ''; }} />
          <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow" style={{ background: marketColors[r.country] || '#666' }}>{r.country}</span>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
            <p className="text-white text-[10px] font-medium leading-tight line-clamp-2">{r.cuisine}</p>
            {r.calories > 0 && <p className="text-yellow-300 text-[10px] mt-0.5">{Math.round(r.calories)} kcal</p>}
          </div>
          {r.colors.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 flex">
              {r.colors.slice(0, 5).map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
