'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { calculateVasopressor } from '@/lib/calculators/vasopressor';
import { FieldRow, NumInput, ResultBox, OrDivider, round, fmt } from './shared-ui';
interface DrugState {
  name: string;
  dose: string;
  unit: string;
  enabled: boolean;
}

const DRUGS: { name: string; defaultUnit: string; units: string[] }[] = [
  { name: 'Dopamine', defaultUnit: 'mcg/kg/min', units: ['mcg/kg/min', 'mcg/min', 'mg/hr'] },
  { name: 'Norepinephrine', defaultUnit: 'mcg/kg/min', units: ['mcg/kg/min', 'mcg/min', 'mg/hr'] },
  { name: 'Epinephrine', defaultUnit: 'mcg/kg/min', units: ['mcg/kg/min', 'mcg/min', 'mg/hr'] },
  { name: 'Vasopressin', defaultUnit: 'units/min', units: ['units/min', 'units/hr'] },
  { name: 'Dobutamine', defaultUnit: 'mcg/kg/min', units: ['mcg/kg/min', 'mcg/min', 'mg/hr'] },
  { name: 'Milrinone', defaultUnit: 'mcg/kg/min', units: ['mcg/kg/min', 'mcg/min', 'mg/hr'] },
  { name: 'Phenylephrine', defaultUnit: 'mcg/kg/min', units: ['mcg/kg/min', 'mcg/min', 'mg/hr'] },
];

// The unit sits in its own <select>, so the plausible ceiling moves with it.
// These are deliberately far above any real infusion — dopamine tops out near
// 20 mcg/kg/min and vasopressin near 0.06 units/min — because the job is to
// catch a decimal slip or a dose typed under the wrong unit, not to second-guess
// a rescue dose. mcg/min and mg/hr are the same ceiling carried across
// (5000 mcg/min = 300 mg/hr), as are units/min and units/hr.
const DOSE_MAX: Record<string, number> = {
  'mcg/kg/min': 50,
  'mcg/min': 5000,
  'mg/hr': 300,
  'units/min': 1,
  'units/hr': 60,
};

const VIS_MULTIPLIERS: Record<string, number> = {
  dopamine: 1, dobutamine: 1, epinephrine: 100, norepinephrine: 100,
  vasopressin: 2.5, milrinone: 10, phenylephrine: 1,
};

interface VasopressorFormProps {
  onResult: (result: any) => void;
}

export function VasopressorForm({ onResult }: VasopressorFormProps) {
  const [kgStr, setKgStr] = useState('');
  const [lbStr, setLbStr] = useState('');
  const [drugs, setDrugs] = useState<DrugState[]>(() =>
    DRUGS.map(d => ({ name: d.name, dose: '', unit: d.defaultUnit, enabled: false }))
  );

  const onKgChange = useCallback((v: string) => {
    setKgStr(v);
    const n = parseFloat(v);
    const lb = Number.isFinite(n) && n > 0 ? fmt(n * 2.20462, 1) : '';
    setLbStr(lb);
  }, []);
  const onLbChange = useCallback((v: string) => {
    setLbStr(v);
    const n = parseFloat(v);
    const kg = Number.isFinite(n) && n > 0 ? fmt(n / 2.20462, 1) : '';
    setKgStr(kg);
  }, []);

  const weightKg = parseFloat(kgStr) || 0;

  const liveVIS = useMemo(() => {
    if (!weightKg) return 0;
    let vis = 0;
    drugs.forEach(drug => {
      if (!drug.enabled || !drug.dose) return;
      const dose = parseFloat(drug.dose);
      if (!dose) return;
      const name = drug.name.toLowerCase();
      let mcgKgMin = 0;
      if (drug.unit === 'mcg/kg/min') mcgKgMin = dose;
      else if (drug.unit === 'mcg/min') mcgKgMin = dose / weightKg;
      else if (drug.unit === 'mg/hr') mcgKgMin = (dose * 1000 / 60) / weightKg;
      else if (drug.unit === 'units/min') mcgKgMin = dose * 2.5;
      else if (drug.unit === 'units/hr') mcgKgMin = (dose / 60) * 2.5;
      vis += mcgKgMin * (VIS_MULTIPLIERS[name] ?? 1);
    });
    return round(vis, 1);
  }, [drugs, weightKg]);

  const visColor = !liveVIS ? '' : liveVIS <= 5 ? 'text-emerald-600' : liveVIS <= 15 ? 'text-amber-600' : 'text-red-600';

  const toggleDrug = (i: number) => setDrugs(prev => prev.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d));
  const updateDrug = (i: number, field: 'dose' | 'unit', value: string) => setDrugs(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const canSave = weightKg > 0 && drugs.some(d => d.enabled && parseFloat(d.dose) > 0);

  const liveResult = useMemo(() => {
    if (!canSave) return null;
    try {
      return calculateVasopressor({
        weight: weightKg,
        weightUnit: 'kg',
        drugs: drugs.map(d => ({ ...d, dose: parseFloat(d.dose) || 0 })),
      });
    } catch { return null; }
  }, [canSave, weightKg, drugs]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) {
      onResultRef.current(null);
      return;
    }
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'vis', label: 'Vasoactive-Inotropic Score (VIS)', value: liveResult.score ?? 0,
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { weight: weightKg, weightUnit: 'kg', drugs },
      references: liveResult.references,
      formulaUsed: 'VIS Score',
      warnings: liveResult.score && liveResult.score > 30 ? ['VIS > 30: Refractory shock — very high mortality risk'] : [],
    });
  }, [liveResult, drugs, weightKg]);

  return (
    <div className="space-y-6">
      <FieldRow label="Patient Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={kgStr} onChange={onKgChange} suffix="kg" step="0.1" min={1} max={300} />
          <OrDivider />
          <NumInput value={lbStr} onChange={onLbChange} suffix="pound" step="0.1" min={1} max={660} />
        </div>
      </FieldRow>

      {/* Live VIS */}
      <FieldRow label="VIS Score">
        <div className="flex items-center gap-3">
          <ResultBox value={liveVIS > 0 ? liveVIS.toString() : ''} />
        </div>
        {liveVIS > 0 && (
          <p className={cn('mt-2 text-sm font-semibold', visColor)}>
            {liveVIS <= 5 ? 'Low support' : liveVIS <= 15 ? 'Moderate support' : liveVIS <= 30 ? 'High support' : 'Refractory shock'}
          </p>
        )}
      </FieldRow>

      {/* Drug list */}
      <FieldRow label="Vasopressors / Inotropes">
        <div className="space-y-2">
          {drugs.map((drug, i) => {
            const drugDef = DRUGS[i];
            return (
              <div key={drug.name} className={cn(
                'rounded-lg border-2 transition-all overflow-hidden',
                drug.enabled ? 'border-[#0E7490] bg-[#0E7490]/5 dark:bg-[#0E7490]/10' : 'border-border bg-card'
              )}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleDrug(i)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                      drug.enabled ? 'bg-[#0E7490]' : 'bg-muted-foreground/30'
                    )}
                  >
                    <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', drug.enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                  <span className="text-sm font-semibold flex-1">{drug.name}</span>
                  {drug.enabled && drug.dose && parseFloat(drug.dose) > 0 && (
                    <span className="text-xs font-bold text-[#0E7490]">Active</span>
                  )}
                </div>
                {drug.enabled && (
                  <div className="px-4 pb-3 flex gap-2">
                    <div className="min-w-0 flex-1">
                      <NumInput
                        value={drug.dose}
                        onChange={v => updateDrug(i, 'dose', v)}
                        suffix=""
                        min={0}
                        max={DOSE_MAX[drug.unit]}
                        step="0.01"
                        placeholder="Dose"
                      />
                    </div>
                    <select
                      value={drug.unit}
                      onChange={e => updateDrug(i, 'unit', e.target.value)}
                      className="rounded-lg border-2 border-[#0E7490]/50 bg-background px-2 text-xs font-medium text-foreground focus:outline-none h-11"
                    >
                      {drugDef.units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FieldRow>

    </div>
  );
}
