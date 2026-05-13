'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateTSAT } from '@/lib/calculators/tsat';
import { Save } from 'lucide-react';
import { FieldRow, NumInput, ResultBox, OrDivider, OptionButtons, InterpretationTable, round, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'tsat';

interface TsatFormProps {
  onResult: (result: any) => void;
}

export function TsatForm({ onResult }: TsatFormProps) {
  const [ironUgStr, setIronUgStr] = useState(() => getSaved(CID, 'ironUg'));
  const [ironUmolStr, setIronUmolStr] = useState(() => getSaved(CID, 'ironUmol'));
  const [tibcMethod, setTibcMethod] = useState<'tibc' | 'transferrin'>(() => (getSaved(CID, 'tibcMethod') as 'tibc' | 'transferrin') || 'tibc');
  const [tibcStr, setTibcStr] = useState(() => getSaved(CID, 'tibc'));
  const [tibcUnit, setTibcUnit] = useState(() => getSaved(CID, 'tibcUnit') || 'µg/dL');
  const [ferritinStr, setFerritinStr] = useState(() => getSaved(CID, 'ferritin'));

  const onIronUgChange = useCallback((v: string) => {
    setIronUgStr(v); saveField(CID, 'ironUg', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 0.179, 2) : '';
    setIronUmolStr(u); saveField(CID, 'ironUmol', u);
  }, []);
  const onIronUmolChange = useCallback((v: string) => {
    setIronUmolStr(v); saveField(CID, 'ironUmol', v);
    const n = parseFloat(v);
    const ug = Number.isFinite(n) && n > 0 ? fmt(n / 0.179, 1) : '';
    setIronUgStr(ug); saveField(CID, 'ironUg', ug);
  }, []);

  const ironUg = parseFloat(ironUgStr) || 0;
  const tibcVal = parseFloat(tibcStr) || 0;

  const liveTsat = useMemo(() => {
    if (ironUg <= 0 || tibcVal <= 0) return 0;
    try {
      const raw = calculateTSAT({
        serumIron: ironUg, serumIronUnit: 'µg/dL',
        tibcMethod, tibcValue: tibcVal, tibcUnit,
        ferritin: ferritinStr ? parseFloat(ferritinStr) : undefined,
      });
      return raw.score ?? 0;
    } catch { return 0; }
  }, [ironUg, tibcMethod, tibcVal, tibcUnit, ferritinStr]);

  const tsatColor = !liveTsat ? '' : liveTsat < 20 ? 'text-amber-600' : liveTsat <= 50 ? 'text-emerald-600' : 'text-red-600';
  const tsatLabel = !liveTsat ? '' : liveTsat < 16 ? 'Iron deficiency likely' : liveTsat < 20 ? 'Low — possible iron deficiency' : liveTsat <= 50 ? 'Normal' : 'Elevated — possible iron overload';

  const canSave = ironUg > 0 && tibcVal > 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const raw = calculateTSAT({
      serumIron: ironUg, serumIronUnit: 'µg/dL',
      tibcMethod, tibcValue: tibcVal, tibcUnit,
      ferritin: ferritinStr ? parseFloat(ferritinStr) : undefined,
    });
    const severity = raw.severity as any;
    onResult({
      outputs: [
        {
          id: 'tsat', label: 'Transferrin Saturation (TSAT)', value: raw.score ?? 0, unit: '%',
          interpretation: { text: raw.interpretation, severity, classification: raw.label },
        },
        ...(raw.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { serumIron: ironUg, serumIronUnit: 'µg/dL', tibcMethod, tibcValue: tibcVal, tibcUnit, ferritin: ferritinStr },
      references: raw.references,
      formulaUsed: 'TSAT = (Fe / TIBC) × 100',
    });
  };

  const tibcUnits = tibcMethod === 'tibc' ? ['µg/dL', 'µmol/L'] : ['mg/dL', 'g/L', 'g/dL'];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <FieldRow label="Serum Iron">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={ironUgStr} onChange={onIronUgChange} suffix="µg/dL" step="1" min={1} max={500} />
          <OrDivider />
          <NumInput value={ironUmolStr} onChange={onIronUmolChange} suffix="µmol/L" step="0.1" min={0.1} max={90} />
        </div>
      </FieldRow>

      <FieldRow label="Iron Binding Capacity">
        <OptionButtons
          options={[
            { value: 'tibc' as const, label: 'TIBC' },
            { value: 'transferrin' as const, label: 'Transferrin' },
          ]}
          value={tibcMethod}
          onChange={(v) => { setTibcMethod(v); saveField(CID, 'tibcMethod', v); const u = v === 'tibc' ? 'µg/dL' : 'mg/dL'; setTibcUnit(u); saveField(CID, 'tibcUnit', u); }}
          columns={2}
        />
        <div className="mt-2 flex items-stretch overflow-hidden rounded-lg border-2 border-cyan-500/60 bg-background focus-within:border-cyan-500">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            placeholder={tibcMethod === 'tibc' ? 'e.g. 300' : 'e.g. 250'}
            value={tibcStr}
            onChange={e => { setTibcStr(e.target.value); saveField(CID, 'tibc', e.target.value); }}
            className="min-w-0 flex-1 h-11 px-3 bg-transparent text-base font-medium text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <select
            value={tibcUnit}
            onChange={e => { setTibcUnit(e.target.value); saveField(CID, 'tibcUnit', e.target.value); }}
            className="border-l bg-muted/40 px-2 text-xs font-medium text-foreground focus:outline-none h-11"
          >
            {tibcUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </FieldRow>

      <FieldRow label="Serum Ferritin" hint="optional">
        <NumInput value={ferritinStr} onChange={(v) => { setFerritinStr(v); saveField(CID, 'ferritin', v); }} suffix="ng/mL" step="1" min={0} max={5000} />
      </FieldRow>

      <FieldRow label="Result">
        <div className="flex items-center gap-3">
          <ResultBox value={liveTsat > 0 ? liveTsat.toString() : ''} suffix="%" />
        </div>
        {liveTsat > 0 && (
          <p className={cn('mt-2 text-sm font-semibold', tsatColor)}>{tsatLabel}</p>
        )}
      </FieldRow>

      <InterpretationTable rows={[
        ['TSAT <16%', 'Iron deficiency likely'],
        ['TSAT 16–19%', 'Low — possible iron deficiency'],
        ['TSAT 20–50%', 'Normal'],
        ['TSAT >50%', 'Elevated — possible iron overload'],
      ]} />

      <Button type="submit" variant="medical" className="w-full" size="lg" disabled={!canSave}>
        <Save className="h-4 w-4" />
        Save to History
      </Button>
    </form>
  );
}
