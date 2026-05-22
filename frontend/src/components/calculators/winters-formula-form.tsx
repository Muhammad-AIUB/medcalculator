'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateWintersFormula } from '@/lib/calculators/winters-formula';
import { FieldRow, NumInput, OrDivider } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function WintersFormulaForm({ onResult }: Props) {
  // Bicarbonate: mmol/L OR mEq/L (1:1)
  const [hco3MmolStr, setHco3MmolStr] = useState('');
  const [hco3MeqStr,  setHco3MeqStr]  = useState('');

  const onHco3MmolChange = (v: string) => { setHco3MmolStr(v); setHco3MeqStr(v); };
  const onHco3MeqChange  = (v: string) => { setHco3MeqStr(v);  setHco3MmolStr(v); };

  const hco3 = parseFloat(hco3MmolStr) || 0;

  const liveResult = useMemo(() => {
    if (hco3 <= 0) return null;
    try { return calculateWintersFormula({ bicarbonate: hco3 }); }
    catch { return null; }
  }, [hco3]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'expected-pco2',
          label: 'Expected pCO2',
          value: liveResult.expectedPco2,
          unit: 'mmHg',
          interpretation: { text: '', severity: 'info' as const },
        },
        {
          id: 'range-2',
          label: 'Expected Range (±2, original)',
          value: `${liveResult.rangeMin2} – ${liveResult.rangeMax2}`,
          unit: 'mmHg',
          interpretation: { text: '', severity: 'neutral' as const },
        },
        {
          id: 'range-5',
          label: 'Expected Range (±5, newer data)',
          value: `${liveResult.rangeMin5} – ${liveResult.rangeMax5}`,
          unit: 'mmHg',
          interpretation: { text: '', severity: 'neutral' as const },
        },
      ],
      inputs: { bicarbonate: hco3 },
      formulaUsed:
        'Expected pCO2 = 1.5 x HCO3- + 8 ± 2\n\n' +
        'Note: although the original Winters formula used ±2,\nnewer data suggest pCO2 may vary up to ±5',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Bicarbonate (HCO3-)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={hco3MmolStr} onChange={onHco3MmolChange} suffix="mmol/L" step="1" min={1} max={45} />
          <OrDivider />
          <NumInput value={hco3MeqStr}  onChange={onHco3MeqChange}  suffix="mEq/L"  step="1" min={1} max={45} />
        </div>
      </FieldRow>
    </div>
  );
}
