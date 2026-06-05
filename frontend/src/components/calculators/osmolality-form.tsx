'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateOsmolality } from '@/lib/calculators/osmolality';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function OsmolalityForm({ onResult }: Props) {
  // Sodium: mmol/L OR mEq/L (1:1)
  const [naMmolStr, setNaMmolStr] = useState('');
  const [naMeqStr,  setNaMeqStr]  = useState('');

  // BUN: mmol/L OR mg/dL (×2.8)
  const [bunMmStr, setBunMmStr] = useState('');
  const [bunMgStr, setBunMgStr] = useState('');

  // Glucose: mmol/L OR mg/dL (×18)
  const [glcMmStr, setGlcMmStr] = useState('');
  const [glcMgStr, setGlcMgStr] = useState('');

  // Serum Alcohol (Ethanol): mmol/L OR mg/dL (×4.6) — optional
  const [etohMmStr, setEtohMmStr] = useState('');
  const [etohMgStr, setEtohMgStr] = useState('');

  // Measured serum osm: mmol/kg OR mOsm/kg (1:1) — optional
  const [osmMmolStr, setOsmMmolStr] = useState('');
  const [osmMosmStr, setOsmMosmStr] = useState('');

  // Na (1:1)
  const onNaMmolChange = (v: string) => { setNaMmolStr(v); setNaMeqStr(v);  };
  const onNaMeqChange  = (v: string) => { setNaMeqStr(v);  setNaMmolStr(v); };

  // BUN: mmol/L <-> mg/dL (×2.8)
  const onBunMmChange = useCallback((v: string) => {
    setBunMmStr(v);
    const n = parseFloat(v);
    setBunMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.8, 1) : '');
  }, []);
  const onBunMgChange = useCallback((v: string) => {
    setBunMgStr(v);
    const n = parseFloat(v);
    setBunMmStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.8, 2) : '');
  }, []);

  // Glucose: mmol/L <-> mg/dL (×18)
  const onGlcMmChange = useCallback((v: string) => {
    setGlcMmStr(v);
    const n = parseFloat(v);
    setGlcMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 18, 1) : '');
  }, []);
  const onGlcMgChange = useCallback((v: string) => {
    setGlcMgStr(v);
    const n = parseFloat(v);
    setGlcMmStr(Number.isFinite(n) && n > 0 ? fmt(n / 18, 2) : '');
  }, []);

  // Ethanol: mmol/L <-> mg/dL (×4.6)
  const onEtohMmChange = useCallback((v: string) => {
    setEtohMmStr(v);
    const n = parseFloat(v);
    setEtohMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 4.6, 1) : '');
  }, []);
  const onEtohMgChange = useCallback((v: string) => {
    setEtohMgStr(v);
    const n = parseFloat(v);
    setEtohMmStr(Number.isFinite(n) && n > 0 ? fmt(n / 4.6, 2) : '');
  }, []);

  // Measured Osm (1:1)
  const onOsmMmolChange = (v: string) => { setOsmMmolStr(v); setOsmMosmStr(v); };
  const onOsmMosmChange = (v: string) => { setOsmMosmStr(v); setOsmMmolStr(v); };

  const na      = parseFloat(naMmolStr)  || 0;
  const bunMg   = parseFloat(bunMgStr)   || 0;
  const glcMg   = parseFloat(glcMgStr)   || 0;
  const etohMg  = etohMgStr ? parseFloat(etohMgStr) : undefined;
  const measOsm = osmMmolStr ? parseFloat(osmMmolStr) : undefined;

  const liveResult = useMemo(() => {
    if (na <= 0 || bunMg <= 0 || glcMg <= 0) return null;
    try {
      return calculateOsmolality({
        sodium: na, bun: bunMg, glucose: glcMg,
        ethanol: etohMg && etohMg > 0 ? etohMg : undefined,
        measuredOsm: measOsm && measOsm > 0 ? measOsm : undefined,
      });
    } catch { return null; }
  }, [na, bunMg, glcMg, etohMg, measOsm]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'traditional',
          label: 'Serum Osmolarity (Traditional)',
          value: liveResult.traditional,
          unit: 'mmol/kg',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        {
          id: 'purssell',
          label: 'Serum Osmolarity (Purssell)',
          value: liveResult.purssell,
          unit: 'mmol/kg',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        ...(liveResult.osmolarGap !== undefined ? [{
          id: 'osmolar-gap',
          label: 'Osmolar Gap (Purssell)',
          value: liveResult.osmolarGap,
          unit: 'mmol/kg',
          interpretation: { text: '', severity: 'neutral' as const },
        }] : []),
      ],
      inputs: { sodium: na, bun: bunMg, glucose: glcMg, ethanol: etohMg, measuredOsm: measOsm },
      formulaUsed:
        'Traditional: Serum Osm = 2 x Na + BUN/2.8 + Glucose/18 + Ethanol/4.6\n' +
        'Purssell:    Serum Osm = 2 x Na + BUN/2.8 + Glucose/18 + Ethanol/3.7\n' +
        'Osmolar Gap = Measured Serum Osm - Calculated Serum Osm (Purssell)',
      references: liveResult.references,
    });
  }, [liveResult, bunMg, etohMg, glcMg, measOsm, na]);

  return (
    <div className="space-y-6">
      <FieldRow label="Sodium">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={naMmolStr} onChange={onNaMmolChange} suffix="mmol/L" step="1" min={100} max={180} />
          <OrDivider />
          <NumInput value={naMeqStr}  onChange={onNaMeqChange}  suffix="mEq/L"  step="1" min={100} max={180} />
        </div>
      </FieldRow>

      <FieldRow label="BUN">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={bunMmStr} onChange={onBunMmChange} suffix="mmol/L" step="0.1" min={0.1} max={107} />
          <OrDivider />
          <NumInput value={bunMgStr} onChange={onBunMgChange} suffix="mg/dL"  step="1"   min={1}   max={300} />
        </div>
      </FieldRow>

      <FieldRow label="Glucose">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={glcMmStr} onChange={onGlcMmChange} suffix="mmol/L" step="0.1" min={0.1} max={111}  />
          <OrDivider />
          <NumInput value={glcMgStr} onChange={onGlcMgChange} suffix="mg/dL"  step="1"   min={1}   max={2000} />
        </div>
      </FieldRow>

      <FieldRow label="Serum Alcohol (Ethanol)" hint="optional — for more accurate estimation">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={etohMmStr} onChange={onEtohMmChange} suffix="mmol/L" step="0.1" min={0} max={200} />
          <OrDivider />
          <NumInput value={etohMgStr} onChange={onEtohMgChange} suffix="mg/dL"  step="1"   min={0} max={920} />
        </div>
      </FieldRow>

      <FieldRow label="Measured Serum Osm" hint="optional — normal value is 285 mmol/kg">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={osmMmolStr} onChange={onOsmMmolChange} suffix="mmol/kg" step="1" min={200} max={400} />
          <OrDivider />
          <NumInput value={osmMosmStr} onChange={onOsmMosmChange} suffix="mOsm/kg" step="1" min={200} max={400} />
        </div>
      </FieldRow>
    </div>
  );
}
