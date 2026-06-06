'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

export function NumInput({
  value, onChange, suffix, min, max, step, placeholder, disabled, readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-stretch overflow-hidden rounded-lg border-2 bg-background',
      disabled ? 'opacity-50 border-[#0E7490]/40' : 'border-[#0E7490]/50 focus-within:border-[#0E7490]',
    )}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          // type="text" + manual numeric filtering avoids a type="number" quirk
          // where some Android keyboards/locales report an empty value, which
          // silently broke the auto unit-conversion. Allow digits, one dot, and
          // an optional leading minus.
          let v = e.target.value.replace(/[^0-9.-]/g, '');
          const dot = v.indexOf('.');
          if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
          onChange(v);
        }}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder ?? '0'}
        disabled={disabled}
        readOnly={readOnly}
        className="min-w-0 flex-1 h-11 px-2 bg-transparent text-base font-medium text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
      />
      <div className="flex items-center pr-2 pl-1 h-11 text-xs font-medium text-muted-foreground justify-center whitespace-nowrap">
        {suffix}
      </div>
    </div>
  );
}

export function ResultBox({ value, suffix, alignRight }: { value: string; suffix?: string; alignRight?: boolean }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border-2 border-[#0E7490]/50 bg-background">
      <div className={cn(
        'min-w-0 flex-1 h-11 px-3 flex items-center text-base font-semibold',
        alignRight ? 'justify-end' : '',
      )}>
        {value || <span className="text-muted-foreground/40">&mdash;</span>}
      </div>
      {suffix && (
        <div className="flex items-center px-2 h-11 text-xs font-medium text-muted-foreground min-w-12 justify-center whitespace-nowrap">
          {suffix}
        </div>
      )}
    </div>
  );
}

export function OrDivider() {
  return <span className="px-1 text-xs font-medium text-muted-foreground">OR</span>;
}

export function OptionButtons<T extends string | undefined>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className={cn('grid gap-0 rounded-lg overflow-hidden border border-gray-200', `grid-cols-${columns}`)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className="h-11 text-sm font-semibold transition-colors"
            style={{
              background: active ? '#0E7490' : '#ffffff',
              color:      active ? '#ffffff' : '#1e293b',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function InterpretationTable({ rows }: { rows: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">Interpretation</h3>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([range, label]) => (
            <tr key={range} className="border border-border">
              <td className="border-r border-border px-3 py-2 font-medium w-1/2">{range}</td>
              <td className="px-3 py-2 text-muted-foreground">{label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const round = (n: number, d = 1) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
export const fmt = (n: number, d = 1) => (Number.isFinite(n) ? round(n, d).toString() : '');
