'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { calculateTSAT } from '@/lib/calculators/tsat';
import { FieldRow, NumInput, OrDivider, OptionButtons, fmt } from './shared-ui';
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
  const canSave = ironUg > 0 && tibcVal > 0;

  const liveResult = useMemo(() => {
    if (!canSave) return null;
    try {
      return calculateTSAT({
        serumIron: ironUg, serumIronUnit: 'µg/dL',
        tibcMethod, tibcValue: tibcVal, tibcUnit,
        ferritin: ferritinStr ? parseFloat(ferritinStr) : undefined,
      });
    } catch { return null; }
  }, [canSave, ironUg, tibcMethod, tibcVal, tibcUnit, ferritinStr]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'tsat', label: 'Transferrin Saturation (TSAT)', value: liveResult.score ?? 0, unit: '%',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { serumIron: ironUg, serumIronUnit: 'µg/dL', tibcMethod, tibcValue: tibcVal, tibcUnit, ferritin: ferritinStr },
      references: liveResult.references,
      formulaUsed: 'TSAT = (Fe / TIBC) × 100',
    });
  }, [liveResult]);

  const tibcUnits = tibcMethod === 'tibc' ? ['µg/dL', 'µmol/L'] : ['mg/dL', 'g/L', 'g/dL'];
  const clearAll = () => { setIronUgStr(''); setIronUmolStr(''); setTibcMethod('tibc'); setTibcStr(''); setTibcUnit('µg/dL'); setFerritinStr(''); saveField(CID, 'ironUg', ''); saveField(CID, 'ironUmol', ''); saveField(CID, 'tibcMethod', ''); saveField(CID, 'tibcUnit', ''); saveField(CID, 'tibc', ''); saveField(CID, 'ferritin', ''); };

  return (
    <div className="space-y-6">
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
        <div className="mt-2 flex items-stretch overflow-hidden rounded-lg border-2 border-[#0E7490]/50 bg-background focus-within:border-cyan-500">
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

      <Button type="button" variant="outline" size="lg" className="w-full" onClick={clearAll}>
        Clear
      </Button>
    </div>
  );
}
