"use client";
import { Lang, t } from "@/lib/i18n";
interface HeaderProps { lang: Lang; onLangChange: (l: Lang) => void; onToggleFilter: () => void; filterOpen: boolean; }
export default function Header({ lang, onLangChange, onToggleFilter, filterOpen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#E8493F] text-white shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={onToggleFilter} className="lg:hidden p-1.5 rounded hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {filterOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />}
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-bold tracking-wide">{t.title[lang]}</h1>
        <span className="text-xs sm:text-sm opacity-80 hidden sm:inline">{t.subtitle[lang]}</span>
      </div>
      <div className="flex items-center gap-1">
        {(['en','ja'] as Lang[]).map(l => (
          <button key={l} onClick={() => onLangChange(l)} className={`px-2 sm:px-3 py-1 rounded text-sm font-medium transition-colors ${lang===l?'bg-white text-[#E8493F]':'bg-white/20 text-white hover:bg-white/30'}`}>{l.toUpperCase()}</button>
        ))}
      </div>
    </header>
  );
}
