'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateQTc } from '@/lib/calculators/qtc';
import { NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

type Formula    = 'bazett' | 'fridericia' | 'framingham' | 'hodges' | 'rautaharju';
type PaperSpeed = 25 | 50;
type QtUnit     = 'msec' | 'small boxes';

const FORMULA_OPTIONS: { value: Formula; label: string }[] = [
  { value: 'bazett',      label: 'Bazett'      },
  { value: 'fridericia',  label: 'Fridericia'  },
  { value: 'framingham',  label: 'Framingham'  },
  { value: 'hodges',      label: 'Hodges'      },
  { value: 'rautaharju',  label: 'Rautaharju'  },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="sm:w-1/2 flex-shrink-0 pt-1">
        <span className="text-sm text-gray-700 leading-snug">{label}</span>
        {hint && <p className="text-xs text-[#0E7490] mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

export function QtcForm({ onResult }: Props) {
  const [formula,    setFormula]    = useState<Formula>('bazett');
  const [hrStr,      setHrStr]      = useState('');
  const [paperSpeed, setPaperSpeed] = useState<PaperSpeed>(25);
  const [qtStr,      setQtStr]      = useState('');
  const [qtUnit,     setQtUnit]     = useState<QtUnit>('msec');

  // Convert between msec and small boxes on unit toggle
  const toggleQtUnit = () => {
    const n = parseFloat(qtStr);
    const msPerBox = paperSpeed === 25 ? 40 : 20;
    if (qtUnit === 'msec') {
      setQtUnit('small boxes');
      setQtStr(Number.isFinite(n) && n > 0 ? String(Math.round((n / msPerBox) * 10) / 10) : '');
    } else {
      setQtUnit('msec');
      setQtStr(Number.isFinite(n) && n > 0 ? String(Math.round(n * msPerBox)) : '');
    }
  };

  const hr = parseFloat(hrStr) || 0;
  const msPerBox = paperSpeed === 25 ? 40 : 20;
  const qtMs = (() => {
    const n = parseFloat(qtStr) || 0;
    return qtUnit === 'small boxes' ? n * msPerBox : n;
  })();

  const liveResult = useMemo(() => {
    if (hr <= 0 || qtMs <= 0) return null;
    try { return calculateQTc({ qtMs, heartRate: hr }); }
    catch { return null; }
  }, [hr, qtMs]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const r = liveResult.results;
    const primary = r[formula];
    const interp  = liveResult.interpretation(primary);

    onResultRef.current({
      outputs: [
        { id: formula,      label: `QTc (${formula.charAt(0).toUpperCase() + formula.slice(1)})`, value: primary,       unit: 'ms', interpretation: { text: interp.text, severity: interp.severity } },
        { id: 'bazett',     label: 'QTc (Bazett)',     value: r.bazett,     unit: 'ms', interpretation: { text: '', severity: 'neutral' as const } },
        { id: 'fridericia', label: 'QTc (Fridericia)', value: r.fridericia, unit: 'ms', interpretation: { text: '', severity: 'neutral' as const } },
        { id: 'framingham', label: 'QTc (Framingham)', value: r.framingham, unit: 'ms', interpretation: { text: '', severity: 'neutral' as const } },
        { id: 'hodges',     label: 'QTc (Hodges)',     value: r.hodges,     unit: 'ms', interpretation: { text: '', severity: 'neutral' as const } },
        { id: 'rautaharju', label: 'QTc (Rautaharju)', value: r.rautaharju, unit: 'ms', interpretation: { text: '', severity: 'neutral' as const } },
      ].filter((o, i) => i === 0 || o.id !== formula),  // deduplicate selected formula
      inputs: { qtMs, heartRate: hr, formula, paperSpeed },
      formulaUsed:
        'RR interval = 60 / HR\n\n' +
        'Bazett:     QTc = QT / sqrt(RR)\n' +
        'Fridericia: QTc = QT / RR^(1/3)\n' +
        'Framingham: QTc = QT + 154 x (1 - RR)\n' +
        'Hodges:     QTc = QT + 1.75 x (HR - 60)\n' +
        'Rautaharju: QTc = QT x (120 + HR) / 180\n\n' +
        'QT and RR in seconds for Bazett/Fridericia; QT in ms for others',
      references: liveResult.references,
    });
  }, [liveResult, formula, hr, paperSpeed, qtMs]);

  return (
    <div className="divide-y divide-gray-100">

      {/* Formula selector — 5 vertical options */}
      <Field label="Formula">
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {FORMULA_OPTIONS.map((opt) => {
            const active = formula === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormula(opt.value)}
                className="w-full h-11 text-sm font-semibold transition-colors border-b border-gray-200 last:border-0"
                style={{ background: active ? '#0E7490' : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Heart rate */}
      <Field label="Heart rate/pulse">
        <NumInput value={hrStr} onChange={setHrStr} suffix="beats/min" step="1" min={20} max={300} placeholder="Norm: 60 - 100" />
      </Field>

      {/* Paper speed */}
      <Field label="Paper speed, mm/sec">
        <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
          {([25, 50] as PaperSpeed[]).map((spd) => {
            const active = paperSpeed === spd;
            return (
              <button
                key={spd}
                type="button"
                onClick={() => setPaperSpeed(spd)}
                className="h-11 text-sm font-semibold transition-colors"
                style={{ background: active ? '#0E7490' : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}
              >
                {spd}
              </button>
            );
          })}
        </div>
      </Field>

      {/* QT interval with msec / small boxes toggle */}
      <Field
        label="QT interval"
        hint={`1 small box = ${msPerBox} msec (paper speed ${paperSpeed} mm/sec)`}
      >
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={qtStr}
              onChange={setQtStr}
              suffix={qtUnit === 'msec' ? 'msec' : 'boxes'}
              step={qtUnit === 'msec' ? '1' : '0.5'}
              min={0}
              max={qtUnit === 'msec' ? 800 : Math.round(800 / msPerBox)}
            />
          </div>
          <button
            type="button"
            onClick={toggleQtUnit}
            className="h-11 px-3 rounded-lg border-2 border-[#0E7490]/50 text-xs font-semibold text-[#0E7490] whitespace-nowrap hover:bg-[#0E7490]/10 transition-colors"
          >
            {qtUnit === 'msec' ? 'small boxes ⇌' : 'msec ⇌'}
          </button>
        </div>
      </Field>

    </div>
  );
}
