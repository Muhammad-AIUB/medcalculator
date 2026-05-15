'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { calculateSOFA } from '@/lib/calculators/sofa';
import { FieldRow, NumInput, ResultBox, OrDivider, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'sofa';

interface SofaFormProps {
  onResult: (result: any) => void;
}

function ScoreDot({ score }: { score: number | null }) {
  if (score === null) return <span className="h-3 w-3 rounded-full bg-muted-foreground/20 inline-block" />;
  const colors = ['bg-emerald-500', 'bg-yellow-400', 'bg-amber-500', 'bg-red-400', 'bg-red-600'];
  return <span className={cn('h-3 w-3 rounded-full inline-block', colors[score] ?? 'bg-muted')} />;
}

function ScoreLabel({ score }: { score: number | null }) {
  if (score === null) return null;
  const c = score === 0 ? 'text-emerald-600' : score <= 2 ? 'text-amber-600' : 'text-red-600';
  return <span className={cn('text-xs font-bold ml-auto', c)}>{score}/4</span>;
}

export function SofaForm({ onResult }: SofaFormProps) {
  const [pao2, setPao2] = useState(() => getSaved(CID, 'pao2'));
  const [fio2, setFio2] = useState(() => getSaved(CID, 'fio2'));
  const [spo2, setSpo2] = useState(() => getSaved(CID, 'spo2'));
  const [ventilated, setVentilated] = useState(() => getSaved(CID, 'vent') === 'true');
  const [platelets, setPlatelets] = useState(() => getSaved(CID, 'plt'));
  const [bilMgStr, setBilMgStr] = useState(() => getSaved(CID, 'bilMg'));
  const [bilUmolStr, setBilUmolStr] = useState(() => getSaved(CID, 'bilUmol'));
  const [mapStr, setMapStr] = useState(() => getSaved(CID, 'map'));
  const [gcs, setGcs] = useState(() => getSaved(CID, 'gcs') || '15');
  const [creatMgStr, setCreatMgStr] = useState(() => getSaved(CID, 'creatMg'));
  const [creatUmolStr, setCreatUmolStr] = useState(() => getSaved(CID, 'creatUmol'));
  const [urineOutput, setUrineOutput] = useState(() => getSaved(CID, 'urine'));

  const onBilMgChange = useCallback((v: string) => {
    setBilMgStr(v); saveField(CID, 'bilMg', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 17.1, 1) : '';
    setBilUmolStr(u); saveField(CID, 'bilUmol', u);
  }, []);
  const onBilUmolChange = useCallback((v: string) => {
    setBilUmolStr(v); saveField(CID, 'bilUmol', v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 17.1, 2) : '';
    setBilMgStr(m); saveField(CID, 'bilMg', m);
  }, []);
  const onCreatMgChange = useCallback((v: string) => {
    setCreatMgStr(v); saveField(CID, 'creatMg', v);
    const n = parseFloat(v);
    const u = Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '';
    setCreatUmolStr(u); saveField(CID, 'creatUmol', u);
  }, []);
  const onCreatUmolChange = useCallback((v: string) => {
    setCreatUmolStr(v); saveField(CID, 'creatUmol', v);
    const n = parseFloat(v);
    const m = Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '';
    setCreatMgStr(m); saveField(CID, 'creatMg', m);
  }, []);

  const bilMg = parseFloat(bilMgStr) || 0;
  const creatMg = parseFloat(creatMgStr) || 0;

  const partialScores = useMemo(() => {
    const pao2n = parseFloat(pao2);
    const fio2n = parseFloat(fio2);
    const spo2n = parseFloat(spo2);
    const platN = parseFloat(platelets);
    const gcsN = parseFloat(gcs);

    let pulm: number | null = null;
    if (fio2n > 0) {
      const ratio = pao2n > 0 ? pao2n / fio2n : spo2n > 0 ? (spo2n / fio2n) * 0.64 : null;
      if (ratio !== null) {
        if (ratio >= 400) pulm = 0;
        else if (ratio >= 300) pulm = 1;
        else if (ratio >= 200 && !ventilated) pulm = 2;
        else if (ratio >= 100 && ventilated) pulm = 3;
        else if (ratio < 100 && ventilated) pulm = 4;
        else pulm = 2;
      }
    }

    let plat: number | null = null;
    if (platN > 0) {
      if (platN >= 150) plat = 0;
      else if (platN >= 100) plat = 1;
      else if (platN >= 50) plat = 2;
      else if (platN >= 20) plat = 3;
      else plat = 4;
    }

    let neuro: number | null = null;
    if (gcsN > 0) {
      if (gcsN === 15) neuro = 0;
      else if (gcsN >= 13) neuro = 1;
      else if (gcsN >= 10) neuro = 2;
      else if (gcsN >= 6) neuro = 3;
      else neuro = 4;
    }

    return { pulm, plat, neuro };
  }, [pao2, fio2, spo2, ventilated, platelets, gcs]);

  const canSave = !!platelets && bilMg > 0 && !!mapStr && !!gcs && creatMg > 0;

  const liveResult = useMemo(() => {
    if (!canSave) return null;
    try {
      return calculateSOFA({
        pao2: pao2 ? parseFloat(pao2) : undefined,
        fio2: fio2 ? parseFloat(fio2) : undefined,
        spo2: spo2 ? parseFloat(spo2) : undefined,
        ventilated,
        platelets: parseFloat(platelets),
        bilirubin: bilMg,
        bilirubinUnit: 'mg/dL',
        map: parseFloat(mapStr),
        gcs: parseFloat(gcs) || 15,
        creatinine: creatMg,
        creatinineUnit: 'mg/dL',
        urineOutput: urineOutput ? parseFloat(urineOutput) : undefined,
      });
    } catch { return null; }
  }, [canSave, pao2, fio2, spo2, ventilated, platelets, bilMg, mapStr, gcs, creatMg, urineOutput]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'sofa', label: 'SOFA Score', value: liveResult.score ?? 0, unit: '/24',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { pao2, fio2, spo2, ventilated, platelets, bilirubin: bilMg, bilirubinUnit: 'mg/dL', map: mapStr, gcs, creatinine: creatMg, creatinineUnit: 'mg/dL', urineOutput },
      references: liveResult.references,
      formulaUsed: 'SOFA 2016',
      warnings: liveResult.score && liveResult.score >= 11 ? ['SOFA ≥ 11: Predicted mortality > 40%'] : [],
    });
  }, [liveResult]);

  const sectionClass = 'rounded-lg border-2 border-[#0E7490]/30 bg-card p-4 space-y-3';
  const clearAll = () => { setPao2(''); setFio2(''); setSpo2(''); setVentilated(false); setPlatelets(''); setBilMgStr(''); setBilUmolStr(''); setMapStr(''); setGcs(''); setCreatMgStr(''); setCreatUmolStr(''); setUrineOutput(''); saveField(CID, 'bilMg', ''); saveField(CID, 'bilUmol', ''); saveField(CID, 'creatMg', ''); saveField(CID, 'creatUmol', ''); saveField(CID, 'pao2', ''); saveField(CID, 'fio2', ''); saveField(CID, 'spo2', ''); saveField(CID, 'vent', ''); saveField(CID, 'plt', ''); saveField(CID, 'map', ''); saveField(CID, 'gcs', ''); saveField(CID, 'urine', ''); };

  return (
    <div className="space-y-4">
      {/* Respiratory */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2">
          <ScoreDot score={partialScores.pulm} />
          <h3 className="text-sm font-semibold">Respiratory</h3>
          <ScoreLabel score={partialScores.pulm} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumInput value={pao2} onChange={(v) => { setPao2(v); saveField(CID, 'pao2', v); }} suffix="PaO₂ mmHg" step="1" min={20} max={600} />
          <NumInput value={fio2} onChange={(v) => { setFio2(v); saveField(CID, 'fio2', v); }} suffix="FiO₂" step="0.01" min={0.21} max={1.0} placeholder="0.21–1.0" />
        </div>
        <NumInput value={spo2} onChange={(v) => { setSpo2(v); saveField(CID, 'spo2', v); }} suffix="SpO₂ %" step="1" min={50} max={100} placeholder="if PaO₂ unavailable" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mechanically Ventilated</span>
          <button
            type="button"
            onClick={() => setVentilated(v => { const next = !v; saveField(CID, 'vent', String(next)); return next; })}
            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', ventilated ? 'bg-[#0E7490]' : 'bg-muted-foreground/30')}
          >
            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', ventilated ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        </div>
      </div>

      {/* Coagulation */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2">
          <ScoreDot score={partialScores.plat} />
          <h3 className="text-sm font-semibold">Coagulation</h3>
          <ScoreLabel score={partialScores.plat} />
        </div>
        <NumInput value={platelets} onChange={(v) => { setPlatelets(v); saveField(CID, 'plt', v); }} suffix="×10³/µL" step="1" min={0} max={1000} />
      </div>

      {/* Liver */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold">Liver — Bilirubin</h3>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={bilMgStr} onChange={onBilMgChange} suffix="mg/dL" step="0.1" />
          <OrDivider />
          <NumInput value={bilUmolStr} onChange={onBilUmolChange} suffix="µmol/L" step="1" />
        </div>
      </div>

      {/* Cardiovascular */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold">Cardiovascular</h3>
        <NumInput value={mapStr} onChange={(v) => { setMapStr(v); saveField(CID, 'map', v); }} suffix="MAP mmHg" step="1" min={20} max={200} />
      </div>

      {/* Neurological */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2">
          <ScoreDot score={partialScores.neuro} />
          <h3 className="text-sm font-semibold">Neurological (GCS)</h3>
          <ScoreLabel score={partialScores.neuro} />
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min={3} max={15} value={gcs} onChange={e => { setGcs(e.target.value); saveField(CID, 'gcs', e.target.value); }} className="flex-1 accent-[#0E7490]" />
          <ResultBox value={gcs} />
        </div>
      </div>

      {/* Renal */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold">Renal — Creatinine</h3>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={creatMgStr} onChange={onCreatMgChange} suffix="mg/dL" step="0.01" />
          <OrDivider />
          <NumInput value={creatUmolStr} onChange={onCreatUmolChange} suffix="µmol/L" step="1" />
        </div>
        <NumInput value={urineOutput} onChange={(v) => { setUrineOutput(v); saveField(CID, 'urine', v); }} suffix="mL/24h" step="10" min={0} max={10000} placeholder="optional" />
      </div>

    </div>
  );
}
