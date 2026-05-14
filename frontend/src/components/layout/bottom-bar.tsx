'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Calculator as CalcIcon, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CALCULATORS } from '@/lib/calculators/calculator-registry';

export function BottomBar() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  const handleExit = () => {
    if (confirm('Exit MedCalc Pro?')) {
      window.close();
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
      setSelectedId('');
    }
  };

  return (
    <>
      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10" style={{ background: '#0F2744' }}>
        <div className="grid grid-cols-3 h-16 max-w-2xl mx-auto">
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <Info className="h-5 w-5" />
            <span className="text-[11px] font-semibold tracking-wide">MORE</span>
          </button>
          <button
            onClick={() => { setSelectedId(''); setShowPicker(true); }}
            className="flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ color: '#38D8F5' }}
          >
            <CalcIcon className="h-6 w-6" strokeWidth={2.5} />
            <span className="text-[11px] font-bold tracking-wide">CALCULATE</span>
          </button>
          <button
            onClick={handleExit}
            className="flex flex-col items-center justify-center gap-1 text-white/60 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[11px] font-semibold tracking-wide">EXIT</span>
          </button>
        </div>
      </nav>

      {/* MORE Modal */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowMore(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#0F2744', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white">About MedCalc Pro</h2>
              <button onClick={() => setShowMore(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-white/70 leading-relaxed">
              <p>
                <strong className="text-white">MedCalc Pro</strong> is a clinical calculator
                platform built for healthcare providers, medical students, and clinicians.
              </p>
              <p>
                All formulas are based on peer-reviewed literature and international clinical
                guidelines.
              </p>
              <p>
                <strong className="text-white">Version:</strong> 1.0.0<br />
                <strong className="text-white">Developed by:</strong> Muhammad-AIUB
              </p>
              <div className="p-3 rounded-lg bg-amber-900/30 text-amber-300 text-xs">
                ⚠️ This tool is for clinical decision support only and does not replace
                professional medical judgment.
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setShowMore(false)}
                className="w-full h-11 rounded-xl font-semibold text-white text-sm transition-colors"
                style={{ background: '#0E7490' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATE Picker Modal */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#0F2744', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Choose a Calculator</h2>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {CALCULATORS.map((calc) => (
                <label
                  key={calc.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                    selectedId === calc.id ? 'bg-[#0E7490]/30' : 'hover:bg-white/5'
                  )}
                >
                  <input
                    type="radio"
                    name="calc-picker"
                    value={calc.id}
                    checked={selectedId === calc.id}
                    onChange={() => setSelectedId(calc.id)}
                    className="h-4 w-4 accent-[#38D8F5]"
                  />
                  <span className="text-xl">{calc.emoji}</span>
                  <p className="text-sm font-medium text-white">{calc.title}</p>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
              <button
                onClick={() => setShowPicker(false)}
                className="px-4 h-10 rounded-lg text-white/60 hover:text-white font-semibold text-sm transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handlePickerOk}
                disabled={!selectedId}
                className="px-5 h-10 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{ background: selectedId ? '#0E7490' : undefined }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
