'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { calculateMELDNa } from '@/lib/calculators/meld-na';
import { AlertTriangle } from 'lucide-react';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';
interface MeldNaFormProps {
  onResult: (result: any) => void;
}

export function MeldNaForm({ onResult }: MeldNaFormProps) {
  const [bilMgStr, setBilMgStr] = useState('');
  const [bilUmolStr, setBilUmolStr] = useState('');
  const [inrStr, setInrStr] = useState('');
  const [creatMgStr, setCreatMgStr] = useState('');
  const [creatUmolStr, setCreatUmolStr] = useState('');
  const [sodiumStr, setSodiumStr] = useState('');
  const [onDialysis, setOnDialysis] = useState(false);

  const onBilMgChange = useCallback((v: string) => {
    setBilMgStr(v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 17.1, 1) : '';
    setBilUmolStr(u);
  }, []);
  const onBilUmolChange = useCallback((v: string) => {
    setBilUmolStr(v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 17.1, 2) : '';
    setBilMgStr(m);
  }, []);
  const onCreatMgChange = useCallback((v: string) => {
    setCreatMgStr(v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '';
    setCreatUmolStr(u);
  }, []);
  const onCreatUmolChange = useCallback((v: string) => {
    setCreatUmolStr(v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '';
    setCreatMgStr(m);
  }, []);

  const bilMg = parseFloat(bilMgStr) || 0;
  const inr = parseFloat(inrStr) || 0;
  const creatMg = onDialysis ? 4.0 : (parseFloat(creatMgStr) || 0);
  const sodium = parseFloat(sodiumStr) || 0;

  const liveResult = useMemo(() => {
    if (bilMg <= 0 || inr <= 0 || creatMg <= 0 || sodium <= 0) return null;
    try {
      return calculateMELDNa({
        bilirubin: bilMg, bilirubinUnit: 'mg/dL',
        inr, creatinine: creatMg, creatinineUnit: 'mg/dL',
        sodium, onDialysis,
      });
    } catch { return null; }
  }, [bilMg, inr, creatMg, sodium, onDialysis]);

  const liveScore = liveResult?.score ?? 0;

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'meld-na', label: 'MELD-Na Score', value: liveResult.score ?? 0,
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { bilirubin: bilMg, bilirubinUnit: 'mg/dL', inr, creatinine: creatMg, creatinineUnit: 'mg/dL', sodium, onDialysis },
      references: liveResult.references,
      formulaUsed: 'MELD-Na',
      warnings: liveScore >= 25 ? ['MELD-Na ≥ 25: High transplant priority. Consider urgent hepatology/transplant referral.'] : [],
    });
  }, [liveResult]);

  const clearAll = () => { setBilMgStr(''); setBilUmolStr(''); setInrStr(''); setCreatMgStr(''); setCreatUmolStr(''); setSodiumStr(''); setOnDialysis(false); };

  return (
    <div className="space-y-6">
      <FieldRow label="Total Bilirubin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={bilMgStr} onChange={onBilMgChange} suffix="mg/dL" step="0.1" min={0.1} max={50} />
          <OrDivider />
          <NumInput value={bilUmolStr} onChange={onBilUmolChange} suffix="µmol/L" step="1" min={1} max={855} />
        </div>
      </FieldRow>

      <FieldRow label="INR">
        <NumInput value={inrStr} onChange={(v) => { setInrStr(v); }} suffix="ratio" step="0.01" min={0.5} max={15} />
      </FieldRow>

      {/* Dialysis toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#0E7490]/50 bg-background">
        <div>
          <p className="text-sm font-semibold">On Dialysis</p>
          <p className="text-xs text-muted-foreground">Sets creatinine to 4.0 mg/dL</p>
        </div>
        <button
          type="button"
          onClick={() => setOnDialysis(v => !v)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            onDialysis ? 'bg-[#0E7490]' : 'bg-muted-foreground/30'
          )}
        >
          <span className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            onDialysis ? 'translate-x-6' : 'translate-x-1'
          )} />
        </button>
      </div>

      {onDialysis && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5" />
          Creatinine set to 4.0 mg/dL per MELD guidelines
        </div>
      )}

      <FieldRow label="Serum Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={onDialysis ? '4.0' : creatMgStr} onChange={onCreatMgChange} suffix="mg/dL" step="0.01" min={0.1} max={15} disabled={onDialysis} />
          <OrDivider />
          <NumInput value={onDialysis ? fmt(4.0 * 88.4, 1) : creatUmolStr} onChange={onCreatUmolChange} suffix="µmol/L" step="1" min={1} max={1326} disabled={onDialysis} />
        </div>
      </FieldRow>

      <FieldRow label="Serum Sodium">
        <NumInput value={sodiumStr} onChange={(v) => { setSodiumStr(v); }} suffix="mEq/L" step="1" min={100} max={160} />
      </FieldRow>

    </div>
  );
}
