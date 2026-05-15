'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { calculateMELDNa } from '@/lib/calculators/meld-na';
import { AlertTriangle } from 'lucide-react';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'meld-na';

interface MeldNaFormProps {
  onResult: (result: any) => void;
}

export function MeldNaForm({ onResult }: MeldNaFormProps) {
  const [bilMgStr, setBilMgStr] = useState(() => getSaved(CID, 'bilMg'));
  const [bilUmolStr, setBilUmolStr] = useState(() => getSaved(CID, 'bilUmol'));
  const [inrStr, setInrStr] = useState(() => getSaved(CID, 'inr'));
  const [creatMgStr, setCreatMgStr] = useState(() => getSaved(CID, 'creatMg'));
  const [creatUmolStr, setCreatUmolStr] = useState(() => getSaved(CID, 'creatUmol'));
  const [sodiumStr, setSodiumStr] = useState(() => getSaved(CID, 'sodium'));
  const [onDialysis, setOnDialysis] = useState(() => getSaved(CID, 'dialysis') === 'true');

  const onBilMgChange = useCallback((v: string) => {
    setBilMgStr(v); saveField(CID, 'bilMg', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 17.1, 1) : '';
    setBilUmolStr(u); saveField(CID, 'bilUmol', u);
  }, []);
  const onBilUmolChange = useCallback((v: string) => {
    setBilUmolStr(v); saveField(CID, 'bilUmol', v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 17.1, 2) : '';
    setBilMgStr(m); saveField(CID, 'bilMg', m);
  }, []);
  const onCreatMgChange = useCallback((v: string) => {
    setCreatMgStr(v); saveField(CID, 'creatMg', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '';
    setCreatUmolStr(u); saveField(CID, 'creatUmol', u);
  }, []);
  const onCreatUmolChange = useCallback((v: string) => {
    setCreatUmolStr(v); saveField(CID, 'creatUmol', v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '';
    setCreatMgStr(m); saveField(CID, 'creatMg', m);
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

  const clearAll = () => { setBilMgStr(''); setBilUmolStr(''); setInrStr(''); setCreatMgStr(''); setCreatUmolStr(''); setSodiumStr(''); setOnDialysis(false); saveField(CID, 'bilMg', ''); saveField(CID, 'bilUmol', ''); saveField(CID, 'creatMg', ''); saveField(CID, 'creatUmol', ''); saveField(CID, 'inr', ''); saveField(CID, 'dialysis', ''); saveField(CID, 'sodium', ''); };

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
        <NumInput value={inrStr} onChange={(v) => { setInrStr(v); saveField(CID, 'inr', v); }} suffix="ratio" step="0.01" min={0.5} max={15} />
      </FieldRow>

      {/* Dialysis toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#0E7490]/50 bg-background">
        <div>
          <p className="text-sm font-semibold">On Dialysis</p>
          <p className="text-xs text-muted-foreground">Sets creatinine to 4.0 mg/dL</p>
        </div>
        <button
          type="button"
          onClick={() => setOnDialysis(v => { const next = !v; saveField(CID, 'dialysis', String(next)); return next; })}
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
        <NumInput value={sodiumStr} onChange={(v) => { setSodiumStr(v); saveField(CID, 'sodium', v); }} suffix="mEq/L" step="1" min={100} max={160} />
      </FieldRow>

    </div>
  );
}
