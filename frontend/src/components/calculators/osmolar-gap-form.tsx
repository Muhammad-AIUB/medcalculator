'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
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

  const osm = parseFloat(osmMosmStr) || 0;
  const na  = parseFloat(naMeqStr)   || 0;
  const k   = parseFloat(kMeqStr)    || 0;

  const liveResult = useMemo(() => {
    if (osm <= 0 || na <= 0) return null;
    const gap1 = osm - 2 * (na + k);           // formula 1: measured
    const gap2 = 290 - 2 * (na + k);           // formula 2: assumed 290
    const score1 = Math.round(gap1 * 10) / 10;
    const score2 = Math.round(gap2 * 10) / 10;

    const getSeverity = (gap: number) => {
      if (gap < 50)       return { severity: 'info'    as const, text: 'Secretory diarrhea likely (gap <50 mOsm/kg)' };
      if (gap <= 125)     return { severity: 'warning' as const, text: 'Indeterminate / mixed (gap 50–125 mOsm/kg)' };
      return               { severity: 'danger'  as const, text: 'Osmotic diarrhea likely (gap >125 mOsm/kg)' };
    };

    const s1 = getSeverity(gap1);
    return { score1, score2, s1, s2: getSeverity(gap2) };
  }, [osm, na, k]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'gap-measured',
          label: 'Stool Osmolal Gap (Measured)',
          value: liveResult.score1,
          unit: 'mOsm/kg',
          interpretation: { text: liveResult.s1.text, severity: liveResult.s1.severity },
        },
        {
          id: 'gap-290',
          label: 'Stool Osmolal Gap (290 assumed)',
          value: liveResult.score2,
          unit: 'mOsm/kg',
          interpretation: { text: liveResult.s2.text, severity: liveResult.s2.severity },
        },
      ],
      inputs: { stoolOsm: osm, sodium: na, potassium: k },
      formulaUsed: 'Stool Osmolal Gap = Stool Osm - (2 x (Na + K))\nStool Osmolal Gap = 290 mOsm/kg - (2 x (Na + K))',
    });
  }, [liveResult, k, na, osm]);

  return (
    <div className="space-y-6">
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

      <FieldRow label="Stool Osm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={osmMosmStr} onChange={onOsmMosmChange} suffix="mOsm/kg" step="1" min={50} max={600} />
          <OrDivider />
          <NumInput value={osmMmolStr} onChange={onOsmMmolChange} suffix="mmol/kg" step="1" min={50} max={600} />
        </div>
      </FieldRow>
    </div>
  );
}
