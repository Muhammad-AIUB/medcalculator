'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateBMI } from '@/lib/calculators/bmi';
import { Save } from 'lucide-react';
import { FieldRow, NumInput, ResultBox, OrDivider, InterpretationTable, round, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'bmi';

interface BmiFormProps {
  onResult: (result: any) => void;
}

export function BmiForm({ onResult }: BmiFormProps) {
  const [cmStr, setCmStr] = useState(() => getSaved(CID, 'cm'));
  const [ftStr, setFtStr] = useState(() => getSaved(CID, 'ft'));
  const [inStr, setInStr] = useState(() => getSaved(CID, 'in'));
  const [kgStr, setKgStr] = useState(() => getSaved(CID, 'kg'));
  const [lbStr, setLbStr] = useState(() => getSaved(CID, 'lb'));
  const [sex, setSex] = useState<'male' | 'female'>(() => (getSaved(CID, 'sex') as 'male' | 'female') || 'male');

  const heightCm = useMemo(() => parseFloat(cmStr) || 0, [cmStr]);
  const weightKg = useMemo(() => parseFloat(kgStr) || 0, [kgStr]);

  const onCmChange = useCallback((v: string) => {
    setCmStr(v); saveField(CID, 'cm', v);
    const cm = parseFloat(v);
    if (Number.isFinite(cm) && cm > 0) {
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inches = totalIn - ft * 12;
      setFtStr(ft.toString()); saveField(CID, 'ft', ft.toString());
      setInStr(fmt(inches, 1)); saveField(CID, 'in', fmt(inches, 1));
    } else { setFtStr(''); setInStr(''); saveField(CID, 'ft', ''); saveField(CID, 'in', ''); }
  }, []);

  const syncFtIn = useCallback((ft: string, inches: string) => {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    const cm = f > 0 || i > 0 ? fmt(f * 30.48 + i * 2.54, 1) : '';
    setCmStr(cm); saveField(CID, 'cm', cm);
  }, []);

  const onFtChange = useCallback((v: string) => { setFtStr(v); saveField(CID, 'ft', v); syncFtIn(v, inStr); }, [inStr, syncFtIn]);
  const onInChange = useCallback((v: string) => { setInStr(v); saveField(CID, 'in', v); syncFtIn(ftStr, v); }, [ftStr, syncFtIn]);

  const onKgChange = useCallback((v: string) => {
    setKgStr(v); saveField(CID, 'kg', v);
    const kg = parseFloat(v);
    const lb = Number.isFinite(kg) && kg > 0 ? fmt(kg * 2.20462, 1) : '';
    setLbStr(lb); saveField(CID, 'lb', lb);
  }, []);

  const onLbChange = useCallback((v: string) => {
    setLbStr(v); saveField(CID, 'lb', v);
    const lb = parseFloat(v);
    const kg = Number.isFinite(lb) && lb > 0 ? fmt(lb / 2.20462, 1) : '';
    setKgStr(kg); saveField(CID, 'kg', kg);
  }, []);

  const liveBmi = useMemo(() => {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    const m = heightCm / 100;
    return round(weightKg / (m * m), 1);
  }, [heightCm, weightKg]);

  const interpretation = useMemo(() => {
    if (liveBmi <= 0) return null;
    if (liveBmi < 18.5) return { label: 'Below normal weight', tone: 'text-sky-600' };
    if (liveBmi < 25) return { label: 'Normal weight', tone: 'text-emerald-600' };
    if (liveBmi < 30) return { label: 'Overweight', tone: 'text-amber-600' };
    if (liveBmi < 35) return { label: 'Class I Obesity', tone: 'text-orange-600' };
    if (liveBmi < 40) return { label: 'Class II Obesity', tone: 'text-red-600' };
    return { label: 'Class III Obesity', tone: 'text-red-700' };
  }, [liveBmi]);

  const ibw = useMemo(() => {
    if (heightCm <= 0) return null;
    const heightIn = heightCm / 2.54;
    const base = sex === 'female' ? 45.5 : 50;
    const kg = Math.max(base + 2.3 * (heightIn - 60), 30);
    return { kg: round(kg, 1), lb: round(kg * 2.20462, 1) };
  }, [heightCm, sex]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heightCm || !weightKg) return;
    const raw = calculateBMI({ heightCm, weightKg, sex });
    const severity = raw.severity as any;
    onResult({
      outputs: [
        { id: 'bmi', label: 'BMI', value: raw.score ?? 0, unit: 'kg/m²',
          interpretation: { text: raw.interpretation, severity, classification: raw.label } },
        ...(raw.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { heightCm, weightKg, sex },
      references: raw.references,
      formulaUsed: 'WHO BMI',
    });
  };

  const canSave = heightCm > 0 && weightKg > 0;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <FieldRow label="Your Height">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={cmStr} onChange={onCmChange} suffix="cm" min={50} max={300} step="0.1" />
          <OrDivider />
          <div className="grid grid-cols-2 gap-1.5">
            <NumInput value={ftStr} onChange={onFtChange} suffix="ft" min={0} max={9} step="1" />
            <NumInput value={inStr} onChange={onInChange} suffix="in" min={0} max={11.9} step="0.1" />
          </div>
        </div>
      </FieldRow>

      <FieldRow label="Your Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={kgStr} onChange={onKgChange} suffix="kg" min={1} max={500} step="0.1" />
          <OrDivider />
          <NumInput value={lbStr} onChange={onLbChange} suffix="pound" min={1} max={1100} step="0.1" />
        </div>
      </FieldRow>

      <FieldRow label="Biological Sex" hint="for Ideal Weight">
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as const).map((s) => (
            <button key={s} type="button" onClick={() => { setSex(s); saveField(CID, 'sex', s); }}
              className={cn('h-11 rounded-lg border text-sm font-medium transition-all',
                sex === s ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300'
                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground')}>
              {s === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Result">
        <div className="flex items-center gap-3">
          <ResultBox value={liveBmi > 0 ? liveBmi.toString() : ''} />
          <span className="text-sm text-muted-foreground">kg/m²</span>
        </div>
        {interpretation && (
          <p className={cn('mt-2 text-sm font-semibold', interpretation.tone)}>{interpretation.label}</p>
        )}
      </FieldRow>

      <InterpretationTable rows={[
        ['BMI <18.5', 'Below normal weight'],
        ['BMI ≥18.5 and <25', 'Normal weight'],
        ['BMI ≥25 and <30', 'Overweight'],
        ['BMI ≥30 and <35', 'Class I Obesity'],
        ['BMI ≥35 and <40', 'Class II Obesity'],
        ['BMI ≥40', 'Class III Obesity'],
      ]} />

      <div className="rounded-lg bg-muted/40 p-4 space-y-3">
        <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
          <span className="text-sm font-semibold text-foreground">Your Ideal Weight:</span>
          <div className="space-y-2">
            <ResultBox value={ibw ? ibw.lb.toString() : ''} suffix="pound" alignRight />
            <div className="text-center text-xs text-muted-foreground">OR</div>
            <ResultBox value={ibw ? ibw.kg.toString() : ''} suffix="kg" alignRight />
          </div>
        </div>
      </div>

      <Button type="submit" variant="medical" className="w-full" size="lg" disabled={!canSave}>
        <Save className="h-4 w-4" />
        Save to History
      </Button>
    </form>
  );
}
