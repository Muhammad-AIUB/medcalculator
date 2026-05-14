'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateVasopressor } from '@/lib/calculators/vasopressor';
import { FieldRow, NumInput, ResultBox, OrDivider, InterpretationTable, round, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'vasopressor';

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

const VIS_MULTIPLIERS: Record<string, number> = {
  dopamine: 1, dobutamine: 1, epinephrine: 100, norepinephrine: 100,
  vasopressin: 2.5, milrinone: 10, phenylephrine: 1,
};

interface VasopressorFormProps {
  onResult: (result: any) => void;
}

export function VasopressorForm({ onResult }: VasopressorFormProps) {
  const [kgStr, setKgStr] = useState(() => getSaved(CID, 'kg'));
  const [lbStr, setLbStr] = useState(() => getSaved(CID, 'lb'));
  const [drugs, setDrugs] = useState<DrugState[]>(() => {
    const saved = getSaved(CID, 'drugs');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return DRUGS.map(d => ({ name: d.name, dose: '', unit: d.defaultUnit, enabled: false }));
  });

  const onKgChange = useCallback((v: string) => {
    setKgStr(v); saveField(CID, 'kg', v);
    const n = parseFloat(v);
    const lb = Number.isFinite(n) && n > 0 ? fmt(n * 2.20462, 1) : '';
    setLbStr(lb); saveField(CID, 'lb', lb);
  }, []);
  const onLbChange = useCallback((v: string) => {
    setLbStr(v); saveField(CID, 'lb', v);
    const n = parseFloat(v);
    const kg = Number.isFinite(n) && n > 0 ? fmt(n / 2.20462, 1) : '';
    setKgStr(kg); saveField(CID, 'kg', kg);
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

  const saveDrugs = (next: DrugState[]) => saveField(CID, 'drugs', JSON.stringify(next));
  const toggleDrug = (i: number) => setDrugs(prev => { const next = prev.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d); saveDrugs(next); return next; });
  const updateDrug = (i: number, field: 'dose' | 'unit', value: string) => setDrugs(prev => { const next = prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d); saveDrugs(next); return next; });

  const canSave = weightKg > 0 && drugs.some(d => d.enabled && parseFloat(d.dose) > 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const raw = calculateVasopressor({
      weight: weightKg,
      weightUnit: 'kg',
      drugs: drugs.map(d => ({ ...d, dose: parseFloat(d.dose) || 0 })),
    });
    const severity = raw.severity as any;
    onResult({
      outputs: [
        {
          id: 'vis', label: 'Vasoactive-Inotropic Score (VIS)', value: raw.score ?? 0,
          interpretation: { text: raw.interpretation, severity, classification: raw.label },
        },
        ...(raw.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { weight: weightKg, weightUnit: 'kg', drugs },
      references: raw.references,
      formulaUsed: 'VIS Score',
      warnings: raw.score && raw.score > 30 ? ['VIS > 30: Refractory shock — very high mortality risk'] : [],
    });
  };
  const clearAll = () => { setKgStr(''); setLbStr(''); setDrugs([]); saveField(CID, 'kg', ''); saveField(CID, 'lb', ''); saveField(CID, 'drugs', ''); };


  return (
    <form onSubmit={handleSave} className="space-y-6">
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
                drug.enabled ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20' : 'border-border bg-card'
              )}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleDrug(i)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                      drug.enabled ? 'bg-cyan-600' : 'bg-muted-foreground/30'
                    )}
                  >
                    <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', drug.enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                  <span className="text-sm font-semibold flex-1">{drug.name}</span>
                  {drug.enabled && drug.dose && parseFloat(drug.dose) > 0 && (
                    <span className="text-xs font-bold text-cyan-600">Active</span>
                  )}
                </div>
                {drug.enabled && (
                  <div className="px-4 pb-3 flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Dose"
                      value={drug.dose}
                      onChange={e => updateDrug(i, 'dose', e.target.value)}
                      className="flex-1 h-11 rounded-lg border-2 border-cyan-500/60 bg-background px-3 text-sm font-medium outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <select
                      value={drug.unit}
                      onChange={e => updateDrug(i, 'unit', e.target.value)}
                      className="rounded-lg border-2 border-cyan-500/60 bg-background px-2 text-xs font-medium text-foreground focus:outline-none h-11"
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
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button type="submit" variant="medical" size="lg" disabled={!canSave}>
          Calculate
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={clearAll}>
          Clear
        </Button>
      </div>
    </form>
  );
}
