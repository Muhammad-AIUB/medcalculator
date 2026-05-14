'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { CalculatorCard } from '@/components/layout/calculator-card';
import { CALCULATORS } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import { Clock, Info, Calculator as CalcIcon, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Calculator } from '@/types/calculator';

export default function DashboardPage() {
  const router = useRouter();
  const { recentCalculators } = useUIStore();
  const [showMore, setShowMore] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  const recentCalcs = recentCalculators
    .map((id) => CALCULATORS.find((c) => c.id === id))
    .filter(Boolean) as Calculator[];

  const categoryLabel = (cat: string) =>
    cat.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const grouped = useMemo(() => {
    return CALCULATORS.reduce<Record<string, Calculator[]>>((acc, c) => {
      const cat = categoryLabel(c.category);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    }, {});
  }, []);

  const handleExit = () => {
    if (confirm('Exit MedCalc Pro?')) {
      window.close();
      // Fallback if window.close() is blocked
      setTimeout(() => {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;text-align:center;padding:20px;"><div><h1 style="font-size:24px;margin-bottom:8px;">Goodbye 👋</h1><p>You can close this tab now.</p></div></div>';
      }, 100);
    }
  };

  const handlePickerOk = () => {
    if (selectedId) {
      router.push(`/calculators/${selectedId}`);
      setShowPicker(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5 pb-24">

        {/* Recent calculators */}
        {recentCalcs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent
              </h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {recentCalcs.map((calc) => (
                <Link
                  key={calc.id}
                  href={`/calculators/${calc.id}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors min-w-[76px] max-w-[90px] text-center"
                >
                  <span className="text-2xl leading-none">{calc.emoji}</span>
                  <span className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground">
                    {calc.shortTitle ?? calc.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Calculator groups */}
        {Object.entries(grouped).map(([group, calcs]) => (
          <section key={group}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group}
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {calcs.map((calc) => (
                <CalculatorCard key={calc.id} calculator={calc} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom action bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="grid grid-cols-3 h-16 max-w-2xl mx-auto">
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-5 w-5" />
            <span className="text-[11px] font-semibold">MORE</span>
          </button>
          <button
            onClick={() => { setSelectedId(recentCalcs[0]?.id ?? ''); setShowPicker(true); }}
            className="flex flex-col items-center justify-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
          >
            <CalcIcon className="h-6 w-6" strokeWidth={2.5} />
            <span className="text-[11px] font-bold">CALCULATE</span>
          </button>
          <button
            onClick={handleExit}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[11px] font-semibold">EXIT</span>
          </button>
        </div>
      </nav>

      {/* MORE Modal — About Us */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowMore(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">About MedCalc Pro</h2>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">MedCalc Pro</strong> is a clinical calculator
                platform built for healthcare providers, medical students, and clinicians.
              </p>
              <p>
                All formulas are based on peer-reviewed literature and international clinical
                guidelines.
              </p>
              <p>
                <strong className="text-foreground">Version:</strong> 1.0.0<br />
                <strong className="text-foreground">Developed by:</strong> Muhammad-AIUB
              </p>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs">
                ⚠️ This tool is for clinical decision support only and does not replace
                professional medical judgment. Always consult clinical guidelines and
                institutional protocols.
              </div>
            </div>
            <button
              onClick={() => setShowMore(false)}
              className="mt-5 w-full h-11 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CALCULATE Modal — Calculator picker */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-bold">Choose a Calculator</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {CALCULATORS.map((calc) => (
                <label
                  key={calc.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                    selectedId === calc.id ? 'bg-cyan-50 dark:bg-cyan-950/30' : 'hover:bg-muted'
                  )}
                >
                  <input
                    type="radio"
                    name="calc-picker"
                    value={calc.id}
                    checked={selectedId === calc.id}
                    onChange={() => setSelectedId(calc.id)}
                    className="h-5 w-5 accent-cyan-600"
                  />
                  <span className="text-2xl">{calc.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{calc.title}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowPicker(false)}
                className="px-4 h-10 rounded-lg text-cyan-600 font-semibold hover:bg-muted text-sm"
              >
                CANCEL
              </button>
              <button
                onClick={handlePickerOk}
                disabled={!selectedId}
                className="px-5 h-10 rounded-lg text-cyan-600 font-bold hover:bg-muted text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
