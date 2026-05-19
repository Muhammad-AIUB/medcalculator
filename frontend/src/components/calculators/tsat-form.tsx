'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { calculateTSAT } from '@/lib/calculators/tsat';
import { FieldRow, NumInput, OrDivider, OptionButtons, fmt } from './shared-ui';
interface TsatFormProps {
  onResult: (result: any) => void;
}

export function TsatForm({ onResult }: TsatFormProps) {
  const [ironUgStr, setIronUgStr] = useState('');
  const [ironUmolStr, setIronUmolStr] = useState('');
  const [tibcMethod, setTibcMethod] = useState<'tibc' | 'transferrin'>('tibc');
  // TIBC: µg/dL and µmol/L side by side
  const [tibcUgStr, setTibcUgStr] = useState('');
  const [tibcUmolStr, setTibcUmolStr] = useState('');
  // Transferrin: mg/dL only
  const [transferrinStr, setTransferrinStr] = useState('');
  const [ferritinStr, setFerritinStr] = useState('');

  const onIronUgChange = useCallback((v: string) => {
    setIronUgStr(v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 0.179, 2) : '';
    setIronUmolStr(u);
  }, []);
  const onIronUmolChange = useCallback((v: string) => {
    setIronUmolStr(v);
    const n = parseFloat(v);
    const ug = Number.isFinite(n) && n > 0 ? fmt(n / 0.179, 1) : '';
    setIronUgStr(ug);
  }, []);

  // TIBC: µg/dL ↔ µmol/L (factor 0.179, same as iron)
  const onTibcUgChange = useCallback((v: string) => {
    setTibcUgStr(v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 0.179, 2) : '';
    setTibcUmolStr(u);
  }, []);
  const onTibcUmolChange = useCallback((v: string) => {
    setTibcUmolStr(v);
    const n = parseFloat(v);
    const ug = Number.isFinite(n) && n > 0 ? fmt(n / 0.179, 1) : '';
    setTibcUgStr(ug);
  }, []);

  const ironUg = parseFloat(ironUgStr) || 0;
  const tibcUg = parseFloat(tibcUgStr) || 0;
  const transferrinVal = parseFloat(transferrinStr) || 0;

  const tibcValue = tibcMethod === 'tibc' ? tibcUg : transferrinVal;
  const tibcUnit  = tibcMethod === 'tibc' ? 'µg/dL' : 'mg/dL';
  const canSave = ironUg > 0 && tibcValue > 0;

  const liveResult = useMemo(() => {
    if (!canSave) return null;
    try {
      return calculateTSAT({
        serumIron: ironUg, serumIronUnit: 'µg/dL',
        tibcMethod, tibcValue, tibcUnit,
        ferritin: ferritinStr ? parseFloat(ferritinStr) : undefined,
      });
    } catch { return null; }
  }, [canSave, ironUg, tibcMethod, tibcValue, tibcUnit, ferritinStr]);

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
      inputs: { serumIron: ironUg, serumIronUnit: 'µg/dL', tibcMethod, tibcValue, tibcUnit, ferritin: ferritinStr },
      references: liveResult.references,
      formulaUsed: 'TSAT = (Fe / TIBC) × 100',
    });
  }, [liveResult]);

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
          onChange={(v) => { setTibcMethod(v); }}
          columns={2}
        />
        <div className="mt-2">
          {tibcMethod === 'tibc' ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <NumInput value={tibcUgStr} onChange={onTibcUgChange} suffix="µg/dL" step="1" min={1} max={1000} />
              <OrDivider />
              <NumInput value={tibcUmolStr} onChange={onTibcUmolChange} suffix="µmol/L" step="0.1" min={0.1} max={180} />
            </div>
          ) : (
            <NumInput value={transferrinStr} onChange={(v) => { setTransferrinStr(v); }} suffix="mg/dL" step="1" min={1} max={600} />
          )}
        </div>
      </FieldRow>

      <FieldRow label="Serum Ferritin" hint="optional">
        <NumInput value={ferritinStr} onChange={(v) => { setFerritinStr(v); }} suffix="ng/mL" step="1" min={0} max={5000} />
      </FieldRow>
    </div>
  );
}
