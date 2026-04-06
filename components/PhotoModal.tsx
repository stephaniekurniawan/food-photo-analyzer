'use client';
import { MealRecord } from '@/lib/types';
interface Props { record: MealRecord; marketColors: Record<string, string>; marketLabels: Record<string, string>; onClose: () => void; }
const NRow = ({ label, value, unit }: { label: string; value: number; unit: string }) =>
  value > 0 ? <div className="flex justify-between text-sm"><span className="text-gray-400">{label}</span><span className="text-white font-medium">{Math.round(value * 10) / 10} {unit}</span></div> : null;
export default function PhotoModal({ record: r, marketColors, marketLabels, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <img src={r.photoUrl} alt={r.seq} className="w-full h-64 object-cover rounded-t-2xl" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">✕</button>
          <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: marketColors[r.country] }}>{marketLabels[r.country]}</span>
          {r.colors.length > 0 && <div className="absolute bottom-0 left-0 right-0 h-2 flex">{r.colors.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}</div>}
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[r.cuisine, r.companion && `With: ${r.companion}`, r.sex, r.age && `Age ${r.age}`, r.marriage].filter(Boolean).map((tag, i) => (
              <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
          {r.description && <div><p className="text-xs text-gray-400 uppercase font-medium mb-1">Meal Description</p><p className="text-sm text-gray-200 leading-relaxed">{r.description}</p></div>}
          {r.analysis && <div><p className="text-xs text-gray-400 uppercase font-medium mb-1">Food Analysis</p><p className="text-sm text-gray-200 leading-relaxed">{r.analysis}</p></div>}
          {r.calories > 0 && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase font-medium mb-2">Nutrition</p>
              <NRow label="Calories" value={r.calories} unit="kcal" /><NRow label="Protein" value={r.protein} unit="g" />
              <NRow label="Fat" value={r.fat} unit="g" /><NRow label="Carbs" value={r.carbs} unit="g" />
              <NRow label="Sugar" value={r.sugar} unit="g" /><NRow label="Salt" value={r.salt} unit="g" />
              <NRow label="Fiber" value={r.fiber} unit="g" /><NRow label="Weight" value={r.weight} unit="g" />
            </div>
          )}
          {r.colors.length > 0 && (
            <div><p className="text-xs text-gray-400 uppercase font-medium mb-2">Dominant Colors</p>
              <div className="flex gap-2">{r.colors.map((c, i) => <div key={i} className="flex flex-col items-center gap-1"><div className="w-8 h-8 rounded-lg" style={{ background: c }} /><span className="text-[9px] text-gray-500">{c}</span></div>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
