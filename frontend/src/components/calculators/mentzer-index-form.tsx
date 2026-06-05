'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateMentzerIndex } from '@/lib/calculators/mentzer-index';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function MentzerIndexForm({ onResult }: Props) {
  const [mcvStr,  setMcvStr]  = useState('');
  const [rbcStr,  setRbcStr]  = useState('');
  const [rbcUnit, setRbcUnit] = useState<'e12' | 'e6'>('e12'); // display-only toggle (1:1 equivalent)

  const mcv      = parseFloat(mcvStr) || 0;
  const rbcCount = parseFloat(rbcStr) || 0;

  const liveResult = useMemo(() => {
    if (mcv <= 0 || rbcCount <= 0) return null;
    try { return calculateMentzerIndex({ mcv, rbcCount }); }
    catch { return null; }
  }, [mcv, rbcCount]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'mentzer-index',
        label: 'Mentzer Index',
        value: liveResult.index,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { mcv, rbcCount },
      formulaUsed: 'Mentzer Index = MCV (fL) / RBC count (10⁶/µL)',
      references: liveResult.references,
    });
  }, [liveResult, mcv, rbcCount]);

  return (
    <div className="space-y-6">
      <FieldRow label="MCV">
        <NumInput
          value={mcvStr} onChange={setMcvStr}
          suffix="fL" step="1" min={0} max={150} placeholder="Norm: 80 - 100"
        />
      </FieldRow>

      <FieldRow label="RBC count">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={rbcStr} onChange={setRbcStr}
              suffix={rbcUnit === 'e12' ? '× 10¹² cells/L' : '× 10⁶ cells/µL'}
              step="0.1" min={0} max={10} placeholder="Norm: 4 - 6"
            />
          </div>
          <button
            type="button"
            onClick={() => setRbcUnit(u => u === 'e12' ? 'e6' : 'e12')}
            className="h-11 px-3 rounded-lg border-2 text-xs font-semibold whitespace-nowrap"
            style={{ borderColor: '#0E7490', color: '#0E7490', background: '#ffffff' }}
          >
            {rbcUnit === 'e12' ? '× 10¹²/L ⇌' : '× 10⁶/µL ⇌'}
          </button>
        </div>
      </FieldRow>
    </div>
  );
}
