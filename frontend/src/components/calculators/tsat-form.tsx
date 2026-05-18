'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  // TIBC: µg/dL and µmol/L side by side
  const [tibcUgStr, setTibcUgStr] = useState(() => getSaved(CID, 'tibcUg'));
  const [tibcUmolStr, setTibcUmolStr] = useState(() => getSaved(CID, 'tibcUmol'));
  // Transferrin: mg/dL only
  const [transferrinStr, setTransferrinStr] = useState(() => getSaved(CID, 'transferrin'));
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

  // TIBC: µg/dL ↔ µmol/L (factor 0.179, same as iron)
  const onTibcUgChange = useCallback((v: string) => {
    setTibcUgStr(v); saveField(CID, 'tibcUg', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 0.179, 2) : '';
    setTibcUmolStr(u); saveField(CID, 'tibcUmol', u);
  }, []);
  const onTibcUmolChange = useCallback((v: string) => {
    setTibcUmolStr(v); saveField(CID, 'tibcUmol', v);
    const n = parseFloat(v);
    const ug = Number.isFinite(n) && n > 0 ? fmt(n / 0.179, 1) : '';
    setTibcUgStr(ug); saveField(CID, 'tibcUg', ug);
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
          onChange={(v) => { setTibcMethod(v); saveField(CID, 'tibcMethod', v); }}
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
            <NumInput value={transferrinStr} onChange={(v) => { setTransferrinStr(v); saveField(CID, 'transferrin', v); }} suffix="mg/dL" step="1" min={1} max={600} />
          )}
        </div>
      </FieldRow>

      <FieldRow label="Serum Ferritin" hint="optional">
        <NumInput value={ferritinStr} onChange={(v) => { setFerritinStr(v); saveField(CID, 'ferritin', v); }} suffix="ng/mL" step="1" min={0} max={5000} />
      </FieldRow>
    </div>
  );
}
