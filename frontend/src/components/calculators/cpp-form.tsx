'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCPP } from '@/lib/calculators/cpp';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function CppForm({ onResult }: Props) {
  const [mapStr, setMapStr] = useState('');
  const [icpStr, setIcpStr] = useState('');

  const map = parseFloat(mapStr) || 0;
  const icp = parseFloat(icpStr) || 0;

  const liveResult = useMemo(() => {
    if (map <= 0 || icp <= 0) return null;
    try { return calculateCPP({ map, icp }); }
    catch { return null; }
  }, [map, icp]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'cpp',
        label: 'Cerebral Perfusion Pressure',
        value: liveResult.score ?? 0,
        unit: 'mm Hg',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { map, icp },
      formulaUsed: 'CPP = MAP - ICP',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="MAP">
        <NumInput value={mapStr} onChange={setMapStr} suffix="mm Hg" step="1" min={0} max={200} placeholder="Norm: 70 - 100" />
      </FieldRow>

      <FieldRow label="ICP">
        <NumInput value={icpStr} onChange={setIcpStr} suffix="mm Hg" step="1" min={0} max={100} placeholder="Norm: 5 - 15" />
      </FieldRow>
    </div>
  );
}
