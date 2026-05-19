'use client';
import React, { useCallback, useState } from 'react';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface MeldNaFormProps {
  onResult: (result: any) => void;
}

export function MeldNaForm({ onResult }: MeldNaFormProps) {
  const [onDialysis, setOnDialysis] = useState(false);
  const [bilUmolStr, setBilUmolStr] = useState('');
  const [bilMgStr, setBilMgStr] = useState('');
  const [inrStr, setInrStr] = useState('');
  const [creatUmolStr, setCreatUmolStr] = useState('');
  const [creatMgStr, setCreatMgStr] = useState('');
  const [sodiumMmolStr, setSodiumMmolStr] = useState('');
  const [sodiumMeqStr, setSodiumMeqStr] = useState('');

  void onResult;

  const onBilUmolChange = useCallback((v: string) => {
    setBilUmolStr(v);
    const n = parseFloat(v);
    const mg = Number.isFinite(n) && v !== '' ? fmt(n / 17.1, 2) : '';
    setBilMgStr(mg);
  }, []);

  const onBilMgChange = useCallback((v: string) => {
    setBilMgStr(v);
    const n = parseFloat(v);
    const umol = Number.isFinite(n) && v !== '' ? fmt(n * 17.1, 1) : '';
    setBilUmolStr(umol);
  }, []);

  const onCreatUmolChange = useCallback((v: string) => {
    setCreatUmolStr(v);
    const n = parseFloat(v);
    const mg = Number.isFinite(n) && v !== '' ? fmt(n / 88.4, 2) : '';
    setCreatMgStr(mg);
  }, []);

  const onCreatMgChange = useCallback((v: string) => {
    setCreatMgStr(v);
    const n = parseFloat(v);
    const umol = Number.isFinite(n) && v !== '' ? fmt(n * 88.4, 1) : '';
    setCreatUmolStr(umol);
  }, []);

  const onSodiumMmolChange = useCallback((v: string) => {
    setSodiumMmolStr(v);
    setSodiumMeqStr(v);
  }, []);

  const onSodiumMeqChange = useCallback((v: string) => {
    setSodiumMeqStr(v);
    setSodiumMmolStr(v);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-medium text-foreground">Dialysis at least twice in the past week</p>
        <div className="grid h-12 w-full grid-cols-2 overflow-hidden rounded-lg border border-border bg-background shadow-sm sm:w-[min(48%,420px)]">
          <button
            type="button"
            onClick={() => setOnDialysis(false)}
            className={`text-sm font-bold transition-colors ${!onDialysis ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => setOnDialysis(true)}
            className={`border-l border-border text-sm font-bold transition-colors ${onDialysis ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            Yes
          </button>
        </div>
      </div>

      <FieldRow label="Total Bilirubin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={bilUmolStr}
            onChange={onBilUmolChange}
            suffix="µmol/L"
            step="1"
            min={1}
            max={855}
          />
          <OrDivider />
          <NumInput
            value={bilMgStr}
            onChange={onBilMgChange}
            suffix="mg/dL"
            step="0.1"
            min={0.1}
            max={50}
          />
        </div>
      </FieldRow>

      <FieldRow label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={onDialysis ? fmt(4.0 * 88.4, 1) : creatUmolStr}
            onChange={onCreatUmolChange}
            suffix="µmol/L"
            step="1"
            min={1}
            max={1326}
            disabled={onDialysis}
          />
          <OrDivider />
          <NumInput
            value={onDialysis ? '4.0' : creatMgStr}
            onChange={onCreatMgChange}
            suffix="mg/dL"
            step="0.01"
            min={0.1}
            max={15}
            disabled={onDialysis}
          />
        </div>
      </FieldRow>

      <FieldRow label="INR">
        <NumInput value={inrStr} onChange={setInrStr} suffix="ratio" step="0.01" min={0.5} max={15} />
      </FieldRow>

      <FieldRow label="Sodium">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={sodiumMmolStr}
            onChange={onSodiumMmolChange}
            suffix="mmol/L"
            step="1"
            min={100}
            max={160}
          />
          <OrDivider />
          <NumInput
            value={sodiumMeqStr}
            onChange={onSodiumMeqChange}
            suffix="mEq/L"
            step="1"
            min={100}
            max={160}
          />
        </div>
      </FieldRow>
    </div>
  );
}
