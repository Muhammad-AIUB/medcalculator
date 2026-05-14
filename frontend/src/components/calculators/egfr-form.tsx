'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { calculateEGFR } from '@/lib/calculators/egfr';
import { FieldRow, NumInput, OrDivider, OptionButtons, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'egfr';

interface EgfrFormProps {
  onResult: (result: any) => void;
}

export function EgfrForm({ onResult }: EgfrFormProps) {
  const [mgdlStr, setMgdlStr] = useState(() => getSaved(CID, 'mgdl'));
  const [umolStr, setUmolStr] = useState(() => getSaved(CID, 'umol'));
  const [ageStr, setAgeStr] = useState(() => getSaved(CID, 'age'));
  const [sex, setSex] = useState<'male' | 'female'>(() => (getSaved(CID, 'sex') as 'male' | 'female') || 'male');
  const [formula, setFormula] = useState<'ckd-epi-2021' | 'mdrd'>(() => (getSaved(CID, 'formula') as 'ckd-epi-2021' | 'mdrd') || 'ckd-epi-2021');

  const onMgdlChange = useCallback((v: string) => {
    setMgdlStr(v); saveField(CID, 'mgdl', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '';
    setUmolStr(u); saveField(CID, 'umol', u);
  }, []);

  const onUmolChange = useCallback((v: string) => {
    setUmolStr(v); saveField(CID, 'umol', v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '';
    setMgdlStr(m); saveField(CID, 'mgdl', m);
  }, []);

  const creatMgdl = parseFloat(mgdlStr) || 0;
  const age = parseInt(ageStr) || 0;

  const liveResult = useMemo(() => {
    if (creatMgdl <= 0 || age < 18) return null;
    try {
      return calculateEGFR({ creatinine: creatMgdl, creatinineUnit: 'mg/dL', age, sex, formula });
    } catch { return null; }
  }, [creatMgdl, age, sex, formula]);

  const liveEgfr = liveResult?.score ?? 0;

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'egfr', label: 'eGFR', value: liveResult.score ?? 0, unit: 'mL/min/1.73m²',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { creatinine: creatMgdl, creatinineUnit: 'mg/dL', age, sex, formula },
      formulaUsed: formula === 'ckd-epi-2021' ? 'CKD-EPI 2021' : 'MDRD',
      references: liveResult.references,
      warnings: liveEgfr && liveEgfr < 15 ? ['eGFR < 15: Consider nephrology referral for renal replacement therapy'] : [],
    });
  }, [liveResult]);

  const clearAll = () => { setMgdlStr(''); setUmolStr(''); setAgeStr(''); setSex('male'); setFormula('ckd-epi-2021'); saveField(CID, 'mgdl', ''); saveField(CID, 'umol', ''); saveField(CID, 'age', ''); saveField(CID, 'sex', ''); saveField(CID, 'formula', ''); };

  return (
    <div className="space-y-6">
      <FieldRow label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={mgdlStr} onChange={onMgdlChange} suffix="mg/dL" step="0.01" min={0.1} max={30} />
          <OrDivider />
          <NumInput value={umolStr} onChange={onUmolChange} suffix="µmol/L" step="1" min={1} max={2650} />
        </div>
      </FieldRow>

      <FieldRow label="Age">
        <NumInput value={ageStr} onChange={(v) => { setAgeStr(v); saveField(CID, 'age', v); }} suffix="year" step="1" min={18} max={120} />
      </FieldRow>

      <FieldRow label="Sex">
        <OptionButtons
          options={[{ value: 'male' as const, label: 'Male' }, { value: 'female' as const, label: 'Female' }]}
          value={sex}
          onChange={(v) => { setSex(v); saveField(CID, 'sex', v); }}
          columns={2}
        />
      </FieldRow>

      <FieldRow label="Formula">
        <OptionButtons
          options={[
            { value: 'ckd-epi-2021' as const, label: 'CKD-EPI 2021' },
            { value: 'mdrd' as const, label: 'MDRD' },
          ]}
          value={formula}
          onChange={(v) => { setFormula(v); saveField(CID, 'formula', v); }}
          columns={2}
        />
      </FieldRow>

      <Button type="button" variant="outline" size="lg" className="w-full" onClick={clearAll}>
        Clear
      </Button>
    </div>
  );
}
