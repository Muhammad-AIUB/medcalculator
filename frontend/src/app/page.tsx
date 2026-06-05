'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomBar } from '@/components/layout/bottom-bar';
import { ExhortLogo } from '@/components/brand/exhort-logo';
import { CALCULATORS } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import { X } from 'lucide-react';

const SLOT_COUNT = 5;
const STORAGE_KEY = 'home-slots';

export default function DashboardPage() {
  const router = useRouter();
  const { history } = useUIStore();
  const [slots, setSlots] = useState<(string | null)[]>(Array(SLOT_COUNT).fill(null));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSlots(JSON.parse(saved));
    } catch {}
  }, []);

  const saveSlots = (next: (string | null)[]) => {
    setSlots(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const selectCalc = (id: string) => {
    if (activeSlot === null) return;
    const next = [...slots];
    next[activeSlot] = id;
    saveSlots(next);
    setActiveSlot(null);
    setSearch('');
  };

  const removeSlot = (i: number) => {
    const next = [...slots];
    next[i] = null;
    saveSlots(next);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = CALCULATORS.filter(c =>
    c.title.toLowerCase().startsWith(normalizedSearch)
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Teal gradient header band */}
      <div
        className="w-full h-14 shrink-0"
        style={{ background: 'linear-gradient(180deg, #0a5d57 0%, #0e7d74 50%, #16a99c 100%)' }}
      />

      {/* Title + brand */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-5">
        <h1 className="text-[26px] sm:text-3xl font-extrabold tracking-tight text-gray-800 leading-tight">
          Pocket Medical Calculator
        </h1>
        <div className="flex justify-end mt-3">
          <ExhortLogo />
        </div>
      </div>

      {/* Calculator slots */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24">
        <div className="space-y-3">
          {slots.map((calcId, i) => {
            const calc = calcId ? CALCULATORS.find(c => c.id === calcId) : null;
            return (
              <div key={i} className="flex items-center gap-2">
                {calc ? (
                  /* Filled slot */
                  <button
                    onClick={() => router.push(`/calculators/${calc.id}`)}
                    className="flex-1 text-left px-4 py-3 rounded-xl border-2 border-[#0E7490] bg-[#0E7490]/10 active:scale-[0.98] transition-all"
                  >
                    <p className="text-sm font-semibold text-[#0E7490]">{calc.title}</p>
                    {(() => {
                      const last = history.find(h => h.calculatorId === calc.id);
                      return last ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{last.summary}</p>
                      ) : null;
                    })()}
                  </button>
                ) : (
                  /* Empty slot */
                  <button
                    onClick={() => { setActiveSlot(i); setSearch(''); }}
                    className="flex-1 text-left px-4 py-4 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-[#0E7490]/50 transition-all"
                  >
                    + Add Calculator
                  </button>
                )}
                {calc && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <BottomBar />

      {/* Search modal */}
      {activeSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          onClick={() => { setActiveSlot(null); setSearch(''); }}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0a5d57 0%, #0e7d74 50%, #16a99c 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-4 border-b border-white/10">
              <input
                autoFocus
                type="text"
                placeholder="Search calculator..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-white/10 text-white placeholder-white/40 text-sm font-medium outline-none border border-white/20 focus:border-[#38D8F5]"
              />
            </div>

            {/* Results */}
            <div className="max-h-[calc(80vh-77px)] overflow-y-auto">
              {filtered.map(calc => (
                <button
                  key={calc.id}
                  onClick={() => selectCalc(calc.id)}
                  className="w-full text-left px-5 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5"
                >
                  {calc.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
