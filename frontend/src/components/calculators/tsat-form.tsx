'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface TsatFormProps {
  onResult: (result: any) => void;
}

const FORMULA = 'TS = (Fe / TIBC) * 100';

export function TsatForm({ onResult }: TsatFormProps) {
  const [feMcgDlStr, setFeMcgDlStr] = useState('');
  const [feNgMlStr, setFeNgMlStr] = useState('');
  const [tibcMcgDlStr, setTibcMcgDlStr] = useState('');
  const [tibcNgMlStr, setTibcNgMlStr] = useState('');

  const onFeMcgDlChange = useCallback((v: string) => {
    setFeMcgDlStr(v);
    const n = parseFloat(v);
    setFeNgMlStr(Number.isFinite(n) && v !== '' ? fmt(n * 10, 1) : '');
  }, []);

  const onFeNgMlChange = useCallback((v: string) => {
    setFeNgMlStr(v);
    const n = parseFloat(v);
    setFeMcgDlStr(Number.isFinite(n) && v !== '' ? fmt(n / 10, 2) : '');
  }, []);

  const onTibcMcgDlChange = useCallback((v: string) => {
    setTibcMcgDlStr(v);
    const n = parseFloat(v);
    setTibcNgMlStr(Number.isFinite(n) && v !== '' ? fmt(n * 10, 1) : '');
  }, []);

  const onTibcNgMlChange = useCallback((v: string) => {
    setTibcNgMlStr(v);
    const n = parseFloat(v);
    setTibcMcgDlStr(Number.isFinite(n) && v !== '' ? fmt(n / 10, 2) : '');
  }, []);

  const fe = parseFloat(feMcgDlStr) || 0;
  const tibc = parseFloat(tibcMcgDlStr) || 0;

  const result = useMemo(() => {
    if (fe <= 0 || tibc <= 0) return null;
    return fmt((fe / tibc) * 100, 1);
  }, [fe, tibc]);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (!result) {
      onResultRef.current(null);
      return;
    }

    const numericResult = parseFloat(result);
    onResultRef.current({
      outputs: [
        {
          id: 'tsat',
          label: 'TS',
          value: numericResult,
          unit: '%',
          interpretation: {
            text: `${result}%`,
            severity: 'neutral',
            classification: `${result}%`,
          },
        },
      ],
      inputs: {
        fe,
        feUnit: 'mcg/dL',
        tibc,
        tibcUnit: 'mcg/dL',
      },
      formulaUsed: FORMULA,
    });
  }, [fe, tibc, result]);

  return (
    <div className="space-y-6">
      <FieldRow label="Fe">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={feMcgDlStr} onChange={onFeMcgDlChange} suffix="mcg/dL" step="1" min={0} />
          <OrDivider />
          <NumInput value={feNgMlStr} onChange={onFeNgMlChange} suffix="ng/mL" step="1" min={0} />
        </div>
      </FieldRow>

      <FieldRow label="TIBC">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={tibcMcgDlStr} onChange={onTibcMcgDlChange} suffix="mcg/dL" step="1" min={0} />
          <OrDivider />
          <NumInput value={tibcNgMlStr} onChange={onTibcNgMlChange} suffix="ng/mL" step="1" min={0} />
        </div>
      </FieldRow>
    </div>
  );
}
