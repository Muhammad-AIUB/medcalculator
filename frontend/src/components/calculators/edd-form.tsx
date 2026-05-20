'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInDays, format } from 'date-fns';

interface EddFormProps {
  onResult: (result: any) => void;
}

const FORMULA = 'Uses the first day of your Last Menstrual Period (LMP).';

function toDate(year: string, month: string, day: string) {
  if (!year || !month || !day) return null;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

function OptionRange({ start, end }: { start: number; end: number }) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index).map((value) => (
    <option key={value} value={String(value).padStart(2, '0')}>
      {String(value).padStart(2, '0')}
    </option>
  ));
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function EddForm({ onResult }: EddFormProps) {
  const today = new Date();
  const [todayMonth, setTodayMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [todayDay, setTodayDay] = useState(String(today.getDate()).padStart(2, '0'));
  const [todayYear, setTodayYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  const selectedToday = useMemo(() => toDate(todayYear, todayMonth, todayDay), [todayYear, todayMonth, todayDay]);
  const lmp = useMemo(() => toDate(year, month, day), [year, month, day]);

  const edd = useMemo(() => (lmp ? addDays(lmp, 280) : null), [lmp]);
  const gestationalAge = useMemo(() => {
    if (!lmp || !selectedToday) return '';
    const totalDays = differenceInDays(selectedToday, lmp);
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    return `${weeks} weeks ${days} days`;
  }, [lmp, selectedToday]);

  const eddText = edd ? format(edd, 'MMM d, yyyy') : '';
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (!edd || !gestationalAge) {
      onResultRef.current(null);
      return;
    }

    onResultRef.current({
      outputs: [
        {
          id: 'edd',
          label: 'Estimated due date',
          value: eddText,
          interpretation: {
            text: gestationalAge,
            severity: 'neutral',
            classification: eddText,
          },
        },
        {
          id: 'gestational-age',
          label: 'Estimated gestational age',
          value: gestationalAge,
          interpretation: {
            text: gestationalAge,
            severity: 'neutral',
            classification: gestationalAge,
          },
        },
      ],
      inputs: { todayMonth, todayDay, todayYear, month, day, year },
      formulaUsed: FORMULA,
    });
  }, [day, edd, eddText, gestationalAge, month, todayDay, todayMonth, todayYear, year]);

  const years = Array.from({ length: 80 }, (_, index) => today.getFullYear() - index);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-xl bg-muted px-5 py-8">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-lg font-bold text-foreground sm:w-64 sm:text-right">Today&apos;s date</label>
          <div className="grid grid-cols-3 gap-1.5">
            <select value={todayMonth} onChange={(event) => setTodayMonth(event.target.value)} className="h-9 border border-muted-foreground/60 bg-background px-3 text-base text-foreground">
              {monthNames.map((name, index) => (
                <option key={name} value={String(index + 1).padStart(2, '0')}>
                  {name}
                </option>
              ))}
            </select>
            <select value={todayDay} onChange={(event) => setTodayDay(event.target.value)} className="h-9 border border-muted-foreground/60 bg-background px-3 text-base text-foreground">
              <OptionRange start={1} end={31} />
            </select>
            <select value={todayYear} onChange={(event) => setTodayYear(event.target.value)} className="h-9 border border-muted-foreground/60 bg-background px-3 text-base text-foreground">
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-lg font-bold text-foreground sm:w-64 sm:text-right">First day of last period</label>
          <div className="grid grid-cols-3 gap-1.5">
            <select value={month} onChange={(event) => setMonth(event.target.value)} className="h-9 border border-muted-foreground/60 bg-background px-3 text-base text-foreground">
              <option value="">MM</option>
              <OptionRange start={1} end={12} />
            </select>
            <select value={day} onChange={(event) => setDay(event.target.value)} className="h-9 border border-muted-foreground/60 bg-background px-3 text-base text-foreground">
              <option value="">DD</option>
              <OptionRange start={1} end={31} />
            </select>
            <select value={year} onChange={(event) => setYear(event.target.value)} className="h-9 border border-muted-foreground/60 bg-background px-3 text-base text-foreground">
              <option value="">YYYY</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl bg-muted px-5 py-8">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.7fr] sm:items-center">
          <label className="text-lg font-bold text-foreground sm:text-right">Estimated due date</label>
          <input readOnly value={eddText} className="h-9 border border-muted-foreground/60 bg-background px-2 text-base text-foreground" />
          <label className="text-lg font-bold text-foreground sm:text-right">Estimated gestational age</label>
          <input readOnly value={gestationalAge} className="h-9 border border-muted-foreground/60 bg-background px-2 text-base text-foreground" />
        </div>
      </div>
    </div>
  );
}
