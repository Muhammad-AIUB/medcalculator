'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateEDD } from '@/lib/calculators/edd';
import { FieldRow, NumInput, ResultBox, OptionButtons } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'edd';

interface EddFormProps {
  onResult: (result: any) => void;
}

export function EddForm({ onResult }: EddFormProps) {
  const [method, setMethod] = useState<'lmp' | 'ultrasound'>(() => (getSaved(CID, 'method') as 'lmp' | 'ultrasound') || 'lmp');
  const [lmpDate, setLmpDate] = useState(() => getSaved(CID, 'lmpDate'));
  const [cycleLength, setCycleLength] = useState(() => getSaved(CID, 'cycleLength') || '28');
  const [scanDate, setScanDate] = useState(() => getSaved(CID, 'scanDate'));
  const [gaWeeks, setGaWeeks] = useState(() => getSaved(CID, 'gaWeeks'));
  const [gaDays, setGaDays] = useState(() => getSaved(CID, 'gaDays') || '0');

  const today = new Date().toISOString().split('T')[0];

  const liveResult = useMemo(() => {
    if (method === 'lmp' && !lmpDate) return null;
    if (method === 'ultrasound' && (!scanDate || !gaWeeks)) return null;
    try {
      return calculateEDD({
        method,
        lmpDate: method === 'lmp' ? lmpDate : undefined,
        cycleLength: method === 'lmp' ? parseInt(cycleLength) || 28 : undefined,
        scanDate: method === 'ultrasound' ? scanDate : undefined,
        gestationalWeeks: method === 'ultrasound' ? parseInt(gaWeeks) || 0 : undefined,
        gestationalDays: method === 'ultrasound' ? parseInt(gaDays) || 0 : undefined,
      });
    } catch { return null; }
  }, [method, lmpDate, cycleLength, scanDate, gaWeeks, gaDays]);

  const eddDate = liveResult?.value ?? liveResult?.label ?? '';
  const currentWeek = liveResult?.subResults?.find(sr => sr.label?.toLowerCase().includes('current'))?.value ?? '';
  const trimester = liveResult?.subResults?.find(sr => sr.label?.toLowerCase().includes('trimester'))?.value ?? '';

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'edd', label: 'Estimated Due Date', value: eddDate,
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
        ...(liveResult.subResults?.slice(0, 4).map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { method, lmpDate, cycleLength, scanDate, gaWeeks, gaDays },
      references: liveResult.references,
      formulaUsed: method === 'lmp' ? "Naegele's Rule" : 'Ultrasound Dating',
    });
  }, [liveResult]);

  const clearAll = () => { setMethod('lmp'); setLmpDate(''); setCycleLength('28'); setScanDate(''); setGaWeeks(''); setGaDays('0'); saveField(CID, 'method', ''); saveField(CID, 'lmpDate', ''); saveField(CID, 'cycleLength', ''); saveField(CID, 'scanDate', ''); saveField(CID, 'gaWeeks', ''); saveField(CID, 'gaDays', ''); };

  return (
    <div className="space-y-6">
      <FieldRow label="Calculate Based On">
        <OptionButtons
          options={[
            { value: 'lmp' as const, label: 'LMP Date' },
            { value: 'ultrasound' as const, label: 'Ultrasound' },
          ]}
          value={method}
          onChange={(v) => { setMethod(v); saveField(CID, 'method', v); }}
          columns={2}
        />
      </FieldRow>

      {method === 'lmp' && (
        <>
          <FieldRow label="1st Day of Last Menstruation">
            <input
              type="date"
              max={today}
              value={lmpDate}
              onChange={e => { setLmpDate(e.target.value); saveField(CID, 'lmpDate', e.target.value); }}
              className="flex h-11 w-full rounded-lg border-2 border-cyan-500/60 bg-background px-3 text-base font-medium outline-none focus:border-cyan-500"
            />
          </FieldRow>

          <FieldRow label="Cycle Length">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={20}
                max={45}
                value={cycleLength}
                onChange={e => { setCycleLength(e.target.value); saveField(CID, 'cycleLength', e.target.value); }}
                className="flex-1 accent-cyan-600"
              />
              <ResultBox value={cycleLength} suffix="days" />
            </div>
          </FieldRow>
        </>
      )}

      {method === 'ultrasound' && (
        <>
          <FieldRow label="Date of Ultrasound">
            <input
              type="date"
              max={today}
              value={scanDate}
              onChange={e => { setScanDate(e.target.value); saveField(CID, 'scanDate', e.target.value); }}
              className="flex h-11 w-full rounded-lg border-2 border-cyan-500/60 bg-background px-3 text-base font-medium outline-none focus:border-cyan-500"
            />
          </FieldRow>

          <FieldRow label="Gestational Age at Scan">
            <div className="grid grid-cols-2 gap-2">
              <NumInput value={gaWeeks} onChange={(v) => { setGaWeeks(v); saveField(CID, 'gaWeeks', v); }} suffix="weeks" min={0} max={42} step="1" />
              <NumInput value={gaDays} onChange={(v) => { setGaDays(v); saveField(CID, 'gaDays', v); }} suffix="days" min={0} max={6} step="1" />
            </div>
          </FieldRow>
        </>
      )}

      <FieldRow label="Current Week">
        <ResultBox value={currentWeek ? String(currentWeek) : ''} />
      </FieldRow>

      <FieldRow label="EDD">
        <ResultBox value={eddDate ? String(eddDate) : ''} />
      </FieldRow>

      {trimester && (
        <p className={cn(
          'text-sm font-semibold',
          String(trimester).includes('1st') ? 'text-sky-600' : String(trimester).includes('2nd') ? 'text-amber-600' : 'text-emerald-600',
        )}>
          {String(trimester)}
        </p>
      )}

      <Button type="button" variant="outline" size="lg" className="w-full" onClick={clearAll}>
        Clear
      </Button>
    </div>
  );
}
