'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateAnionGap } from '@/lib/calculators/anion-gap';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function AnionGapForm({ onResult }: Props) {
  // Sodium: mmol/L OR mEq/L (1:1)
  const [naMmolStr, setNaMmolStr] = useState('');
  const [naMeqStr,  setNaMeqStr]  = useState('');

  // Chloride: mmol/L OR mEq/L (1:1)
  const [clMmolStr, setClMmolStr] = useState('');
  const [clMeqStr,  setClMeqStr]  = useState('');

  // Bicarbonate: mmol/L OR mEq/L (1:1)
  const [hco3MmolStr, setHco3MmolStr] = useState('');
  const [hco3MeqStr,  setHco3MeqStr]  = useState('');

  // Albumin: g/L OR g/dL (g/dL = g/L / 10)
  const [albGLStr,  setAlbGLStr]  = useState('');
  const [albGdLStr, setAlbGdLStr] = useState('');

  const onNaMmolChange   = (v: string) => { setNaMmolStr(v);   setNaMeqStr(v);   };
  const onNaMeqChange    = (v: string) => { setNaMeqStr(v);    setNaMmolStr(v);  };
  const onClMmolChange   = (v: string) => { setClMmolStr(v);   setClMeqStr(v);   };
  const onClMeqChange    = (v: string) => { setClMeqStr(v);    setClMmolStr(v);  };
  const onHco3MmolChange = (v: string) => { setHco3MmolStr(v); setHco3MeqStr(v); };
  const onHco3MeqChange  = (v: string) => { setHco3MeqStr(v);  setHco3MmolStr(v); };

  // Albumin: g/L <-> g/dL (factor 10)
  const onAlbGLChange = useCallback((v: string) => {
    setAlbGLStr(v);
    const n = parseFloat(v);
    setAlbGdLStr(Number.isFinite(n) && n > 0 ? fmt(n / 10, 2) : '');
  }, []);
  const onAlbGdLChange = useCallback((v: string) => {
    setAlbGdLStr(v);
    const n = parseFloat(v);
    setAlbGLStr(Number.isFinite(n) && n > 0 ? fmt(n * 10, 1) : '');
  }, []);

  const na   = parseFloat(naMmolStr)   || 0;
  const cl   = parseFloat(clMmolStr)   || 0;
  const hco3 = parseFloat(hco3MmolStr) || 0;
  const albGdL = albGdLStr ? parseFloat(albGdLStr) : undefined;

  const liveResult = useMemo(() => {
    if (na <= 0 || cl <= 0 || hco3 <= 0) return null;
    try {
      return calculateAnionGap({
        sodium: na, chloride: cl, bicarbonate: hco3,
        albumin: albGdL,
      });
    } catch { return null; }
  }, [na, cl, hco3, albGdL]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'ag',
          label: 'Anion Gap',
          value: liveResult.ag,
          unit: 'mEq/L',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        {
          id: 'delta-gap',
          label: 'Delta Gap',
          value: liveResult.deltaGap,
          unit: 'mEq/L',
          interpretation: { text: '', severity: 'neutral' as const },
        },
        {
          id: 'delta-ratio',
          label: 'Delta Ratio',
          value: liveResult.deltaRatio,
          unit: '',
          interpretation: { text: '', severity: 'neutral' as const },
        },
        ...(liveResult.correctedAg !== undefined ? [
          {
            id: 'corrected-ag',
            label: 'Albumin Corrected Anion Gap',
            value: liveResult.correctedAg,
            unit: 'mEq/L',
            interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
          },
          {
            id: 'corrected-delta-gap',
            label: 'Albumin Corrected Delta Gap',
            value: liveResult.correctedDeltaGap,
            unit: 'mEq/L',
            interpretation: { text: '', severity: 'neutral' as const },
          },
          {
            id: 'corrected-delta-ratio',
            label: 'Albumin Corrected Delta Ratio',
            value: liveResult.correctedDeltaRatio,
            unit: '',
            interpretation: { text: '', severity: 'neutral' as const },
          },
        ] : []),
      ],
      inputs: { sodium: na, chloride: cl, bicarbonate: hco3, albumin: albGdL },
      formulaUsed:
        'Anion Gap = Na - (Cl + HCO3)\n' +
        'Delta Gap = Anion Gap - 12\n' +
        'Albumin Corrected AG = AG + 2.5 x (4 - Albumin g/dL)\n' +
        'Albumin Corrected Delta Gap = Corrected AG - 12\n' +
        'Delta Ratio = Delta Gap / (24 - HCO3)\n' +
        'Albumin Corrected Delta Ratio = Corrected Delta Gap / (24 - HCO3)',
      references: liveResult.references,
    });
  }, [liveResult, albGdL, cl, hco3, na]);

  return (
    <div className="space-y-6">
      <FieldRow label="Sodium">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={naMmolStr} onChange={onNaMmolChange} suffix="mmol/L" step="1" min={100} max={180} />
          <OrDivider />
          <NumInput value={naMeqStr}  onChange={onNaMeqChange}  suffix="mEq/L"  step="1" min={100} max={180} />
        </div>
      </FieldRow>

      <FieldRow label="Chloride">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={clMmolStr} onChange={onClMmolChange} suffix="mmol/L" step="1" min={50} max={150} />
          <OrDivider />
          <NumInput value={clMeqStr}  onChange={onClMeqChange}  suffix="mEq/L"  step="1" min={50} max={150} />
        </div>
      </FieldRow>

      <FieldRow label="Bicarbonate">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={hco3MmolStr} onChange={onHco3MmolChange} suffix="mmol/L" step="1" min={1} max={45} />
          <OrDivider />
          <NumInput value={hco3MeqStr}  onChange={onHco3MeqChange}  suffix="mEq/L"  step="1" min={1} max={45} />
        </div>
      </FieldRow>

      <FieldRow label="Albumin" hint="optional">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={albGLStr}  onChange={onAlbGLChange}  suffix="g/L"  step="0.1" min={0} max={60} />
          <OrDivider />
          <NumInput value={albGdLStr} onChange={onAlbGdLChange} suffix="g/dL" step="0.1" min={0} max={6}  />
        </div>
      </FieldRow>
    </div>
  );
}
