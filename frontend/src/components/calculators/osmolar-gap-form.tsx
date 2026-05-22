'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateOsmolarGap } from '@/lib/calculators/osmolar-gap';
import { FieldRow, NumInput, OrDivider } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function OsmolarGapForm({ onResult }: Props) {
  // Stool Osm: mOsm/kg OR mmol/kg (1:1)
  const [osmMosmStr, setOsmMosmStr] = useState('');
  const [osmMmolStr, setOsmMmolStr] = useState('');

  // Stool Na: mEq/L OR mmol/L (1:1)
  const [naMeqStr,  setNaMeqStr]  = useState('');
  const [naMmolStr, setNaMmolStr] = useState('');

  // Stool K: mEq/L OR mmol/L (1:1)
  const [kMeqStr,  setKMeqStr]  = useState('');
  const [kMmolStr, setKMmolStr] = useState('');

  const onOsmMosmChange = (v: string) => { setOsmMosmStr(v); setOsmMmolStr(v); };
  const onOsmMmolChange = (v: string) => { setOsmMmolStr(v); setOsmMosmStr(v); };
  const onNaMeqChange   = (v: string) => { setNaMeqStr(v);   setNaMmolStr(v); };
  const onNaMmolChange  = (v: string) => { setNaMmolStr(v);  setNaMeqStr(v);  };
  const onKMeqChange    = (v: string) => { setKMeqStr(v);    setKMmolStr(v);  };
  const onKMmolChange   = (v: string) => { setKMmolStr(v);   setKMeqStr(v);   };

  const measured = parseFloat(osmMosmStr) || 0;
  const na       = parseFloat(naMeqStr)   || 0;
  const k        = parseFloat(kMeqStr)    || 0;

  const liveResult = useMemo(() => {
    if (na <= 0) return null;
    try {
      // Always calculate formula 2 (290 assumed)
      const gap290 = 290 - 2 * (na + k);
      // Formula 1 only if measured Osm provided
      const gapMeasured = measured > 0 ? measured - 2 * (na + k) : null;

      const primaryGap   = gapMeasured !== null ? gapMeasured : gap290;
      const primaryScore = Math.round(primaryGap * 10) / 10;

      let severity: 'success' | 'warning' | 'danger' | 'info';
      let interpretation: string;
      if (primaryScore < 50)       { severity = 'info';    interpretation = 'Secretory diarrhea likely (gap <50 mOsm/kg)'; }
      else if (primaryScore <= 125) { severity = 'warning'; interpretation = 'Indeterminate / mixed (gap 50–125 mOsm/kg)'; }
      else                          { severity = 'danger';  interpretation = 'Osmotic diarrhea likely (gap >125 mOsm/kg)'; }

      return { primaryScore, gap290: Math.round(gap290 * 10) / 10, gapMeasured: gapMeasured !== null ? Math.round(gapMeasured * 10) / 10 : null, severity, interpretation };
    } catch { return null; }
  }, [na, k, measured]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        ...(liveResult.gapMeasured !== null ? [{
          id: 'gap-measured',
          label: 'Stool Osmolal Gap (Measured)',
          value: liveResult.gapMeasured,
          unit: 'mOsm/kg',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        }] : []),
        {
          id: 'gap-290',
          label: 'Stool Osmolal Gap (290 assumed)',
          value: liveResult.gap290,
          unit: 'mOsm/kg',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { measuredOsm: measured, sodium: na, potassium: k },
      formulaUsed: liveResult.gapMeasured !== null
        ? 'Stool Osmolal Gap = Stool Osm - (2 x (Na + K))\nStool Osmolal Gap = 290 - (2 x (Na + K))'
        : 'Stool Osmolal Gap = 290 mOsm/kg - (2 x (Na + K))',
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Stool Osmolality" hint="optional">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={osmMosmStr} onChange={onOsmMosmChange} suffix="mOsm/kg" step="1" min={50} max={600} />
          <OrDivider />
          <NumInput value={osmMmolStr} onChange={onOsmMmolChange} suffix="mmol/kg" step="1" min={50} max={600} />
        </div>
      </FieldRow>

      <FieldRow label="Stool Sodium (Na)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={naMeqStr}  onChange={onNaMeqChange}  suffix="mEq/L"  step="1" min={0} max={200} />
          <OrDivider />
          <NumInput value={naMmolStr} onChange={onNaMmolChange} suffix="mmol/L" step="1" min={0} max={200} />
        </div>
      </FieldRow>

      <FieldRow label="Stool Potassium (K)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={kMeqStr}  onChange={onKMeqChange}  suffix="mEq/L"  step="1" min={0} max={150} />
          <OrDivider />
          <NumInput value={kMmolStr} onChange={onKMmolChange} suffix="mmol/L" step="1" min={0} max={150} />
        </div>
      </FieldRow>
    </div>
  );
}
