'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateANC } from '@/lib/calculators/anc';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function AncForm({ onResult }: Props) {
  const [neutrophilsStr, setNeutrophilsStr] = useState('');
  const [bandsStr,       setBandsStr]       = useState('');
  const [wbcStr,         setWbcStr]         = useState('');
  const [wbcUnit,        setWbcUnit]        = useState<'e9' | 'e3'>('e9'); // display-only toggle (1:1 equivalent)

  const neutrophilsPct = parseFloat(neutrophilsStr) || 0;
  const bandsPct       = parseFloat(bandsStr)       || 0;
  const wbcCount       = parseFloat(wbcStr)         || 0;

  const liveResult = useMemo(() => {
    if (neutrophilsPct <= 0 || wbcCount <= 0) return null;
    try {
      return calculateANC({ neutrophilsPct, bandsPct, wbcCount });
    } catch { return null; }
  }, [neutrophilsPct, bandsPct, wbcCount]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'anc',
        label: 'ANC',
        value: liveResult.anc,
        unit: 'cells/µL',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { neutrophilsPct, bandsPct, wbcCount },
      formulaUsed: 'ANC = 10 × WBC count (×10³/µL) × (% neutrophils + % bands)',
      references: liveResult.references,
    });
  }, [liveResult, bandsPct, neutrophilsPct, wbcCount]);

  return (
    <div className="space-y-6">
      <FieldRow label="% neutrophils">
        <NumInput
          value={neutrophilsStr} onChange={setNeutrophilsStr}
          suffix="%" step="1" min={0} max={100} placeholder="0"
        />
      </FieldRow>

      <FieldRow label="% bands">
        <NumInput
          value={bandsStr} onChange={setBandsStr}
          suffix="%" step="1" min={0} max={100} placeholder="0"
        />
      </FieldRow>

      <FieldRow label="WBC count" hint="Per 1000. Enter as 8.4, not 8400">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={wbcStr} onChange={setWbcStr}
              suffix={wbcUnit === 'e9' ? '× 10⁹ cells/L' : '× 10³ cells/µL'}
              step="0.1" min={0} max={100} placeholder="Norm: 3.7 - 10.7"
            />
          </div>
          <button
            type="button"
            onClick={() => setWbcUnit(u => u === 'e9' ? 'e3' : 'e9')}
            className="h-11 px-3 rounded-lg border-2 text-xs font-semibold whitespace-nowrap"
            style={{ borderColor: '#0E7490', color: '#0E7490', background: '#ffffff' }}
          >
            {wbcUnit === 'e9' ? '× 10⁹/L ⇌' : '× 10³/µL ⇌'}
          </button>
        </div>
      </FieldRow>
    </div>
  );
}
