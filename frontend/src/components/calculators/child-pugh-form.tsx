'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { calculateChildPugh } from '@/lib/calculators/child-pugh';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'child-pugh';

interface ChildPughFormProps {
  onResult: (result: any) => void;
}

function scoreBilirubin(mgDL: number) { return mgDL < 2 ? 1 : mgDL <= 3 ? 2 : 3; }
function scoreAlbumin(gDL: number) { return gDL > 3.5 ? 1 : gDL >= 2.8 ? 2 : 3; }
function scoreINR(inr: number) { return inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3; }
function scoreAscites(a: string) { return a === 'none' ? 1 : a === 'mild' ? 2 : 3; }
function scoreEnceph(e: string) { return e === 'none' ? 1 : e === 'grade1-2' ? 2 : 3; }

export function ChildPughForm({ onResult }: ChildPughFormProps) {
  const [bilMgStr, setBilMgStr] = useState(() => getSaved(CID, 'bilMg'));
  const [bilUmolStr, setBilUmolStr] = useState(() => getSaved(CID, 'bilUmol'));
  const [albGdlStr, setAlbGdlStr] = useState(() => getSaved(CID, 'albGdl'));
  const [albGlStr, setAlbGlStr] = useState(() => getSaved(CID, 'albGl'));
  const [inrStr, setInrStr] = useState(() => getSaved(CID, 'inr'));
  const [ascites, setAscites] = useState<'none' | 'mild' | 'moderate-severe' | undefined>(() => (getSaved(CID, 'ascites') as any) || undefined);
  const [encephalopathy, setEncephalopathy] = useState<'none' | 'grade1-2' | 'grade3-4' | undefined>(() => (getSaved(CID, 'enceph') as any) || undefined);

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
  const onAlbGdlChange = useCallback((v: string) => {
    setAlbGdlStr(v); saveField(CID, 'albGdl', v);
    const n = parseFloat(v);
    const gl = Number.isFinite(n) && n > 0 ? fmt(n * 10, 1) : '';
    setAlbGlStr(gl); saveField(CID, 'albGl', gl);
  }, []);
  const onAlbGlChange = useCallback((v: string) => {
    setAlbGlStr(v); saveField(CID, 'albGl', v);
    const n = parseFloat(v);
    const gdl = Number.isFinite(n) && n > 0 ? fmt(n / 10, 2) : '';
    setAlbGdlStr(gdl); saveField(CID, 'albGdl', gdl);
  }, []);

  const bilMg = parseFloat(bilMgStr) || 0;
  const albGdl = parseFloat(albGdlStr) || 0;
  const inr = parseFloat(inrStr) || 0;

  const partialScores = useMemo(() => {
    const bil = bilMg > 0 ? scoreBilirubin(bilMg) : null;
    const alb = albGdl > 0 ? scoreAlbumin(albGdl) : null;
    const i = inr > 0 ? scoreINR(inr) : null;
    const asc = ascites ? scoreAscites(ascites) : null;
    const enc = encephalopathy ? scoreEnceph(encephalopathy) : null;
    const all = [bil, alb, i, asc, enc];
    const filled = all.filter(s => s !== null) as number[];
    return { bil, alb, inr: i, asc, enc, total: filled.reduce((a, b) => a + b, 0), count: filled.length };
  }, [bilMg, albGdl, inr, ascites, encephalopathy]);

  const canSave = bilMg > 0 && albGdl > 0 && inr > 0 && !!ascites && !!encephalopathy;

  const liveResult = useMemo(() => {
    if (!canSave) return null;
    try {
      return calculateChildPugh({
        bilirubin: bilMg, bilirubinUnit: 'mg/dL',
        albumin: albGdl, albuminUnit: 'g/dL',
        inr, ascites: ascites!, encephalopathy: encephalopathy!,
      });
    } catch { return null; }
  }, [canSave, bilMg, albGdl, inr, ascites, encephalopathy]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'child-pugh', label: 'Child-Pugh Score', value: liveResult.score ?? 0, unit: '/15',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { bilirubin: bilMg, bilirubinUnit: 'mg/dL', albumin: albGdl, albuminUnit: 'g/dL', inr, ascites, encephalopathy },
      references: liveResult.references,
      formulaUsed: 'Child-Pugh',
    });
  }, [liveResult]);

  const ScoreTag = ({ score }: { score: number | null }) => {
    if (score === null) return null;
    const c = score === 1 ? 'bg-emerald-100 text-emerald-700' : score === 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    return <span className={cn('ml-auto px-2 py-0.5 rounded text-xs font-bold', c)}>{score} pt{score > 1 ? 's' : ''}</span>;
  };

  const clearAll = () => { setBilMgStr(''); setBilUmolStr(''); setAlbGdlStr(''); setAlbGlStr(''); setInrStr(''); setAscites(undefined); setEncephalopathy(undefined); saveField(CID, 'bilMg', ''); saveField(CID, 'bilUmol', ''); saveField(CID, 'albGdl', ''); saveField(CID, 'albGl', ''); saveField(CID, 'inr', ''); saveField(CID, 'ascites', ''); saveField(CID, 'enceph', ''); };

  return (
    <div className="space-y-6">
      <FieldRow label="Total Bilirubin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={bilMgStr} onChange={onBilMgChange} suffix="mg/dL" step="0.1" min={0.1} max={50} />
          <OrDivider />
          <NumInput value={bilUmolStr} onChange={onBilUmolChange} suffix="µmol/L" step="1" min={1} max={855} />
        </div>
        <div className="flex justify-end mt-1"><ScoreTag score={partialScores.bil} /></div>
      </FieldRow>

      <FieldRow label="Serum Albumin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={albGdlStr} onChange={onAlbGdlChange} suffix="g/dL" step="0.1" min={0.5} max={6} />
          <OrDivider />
          <NumInput value={albGlStr} onChange={onAlbGlChange} suffix="g/L" step="1" min={5} max={60} />
        </div>
        <div className="flex justify-end mt-1"><ScoreTag score={partialScores.alb} /></div>
      </FieldRow>

      <FieldRow label="INR (PT)">
        <NumInput value={inrStr} onChange={(v) => { setInrStr(v); saveField(CID, 'inr', v); }} suffix="ratio" step="0.01" min={0.5} max={15} />
        <div className="flex justify-end mt-1"><ScoreTag score={partialScores.inr} /></div>
      </FieldRow>

      <FieldRow label="Ascites">
        <div className="space-y-2">
          {([
            { value: 'none' as const, label: 'None' },
            { value: 'mild' as const, label: 'Mild (controlled with diuretics)' },
            { value: 'moderate-severe' as const, label: 'Moderate–Severe (refractory)' },
          ]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setAscites(opt.value); saveField(CID, 'ascites', opt.value); }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all',
                ascites === opt.value
                  ? 'border-[#0E7490] bg-[#0E7490]/10 text-[#0E7490] dark:bg-[#0E7490]/20 dark:text-cyan-300 font-medium'
                  : 'border-border bg-background text-foreground hover:border-muted-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-1"><ScoreTag score={partialScores.asc} /></div>
      </FieldRow>

      <FieldRow label="Hepatic Encephalopathy">
        <div className="space-y-2">
          {([
            { value: 'none' as const, label: 'None' },
            { value: 'grade1-2' as const, label: 'Grade I–II' },
            { value: 'grade3-4' as const, label: 'Grade III–IV' },
          ]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setEncephalopathy(opt.value); saveField(CID, 'enceph', opt.value); }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all',
                encephalopathy === opt.value
                  ? 'border-[#0E7490] bg-[#0E7490]/10 text-[#0E7490] dark:bg-[#0E7490]/20 dark:text-cyan-300 font-medium'
                  : 'border-border bg-background text-foreground hover:border-muted-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-1"><ScoreTag score={partialScores.enc} /></div>
      </FieldRow>

    </div>
  );
}
