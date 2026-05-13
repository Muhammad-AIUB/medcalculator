'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';
import { Badge } from './badge';
import type { BadgeProps } from './badge';

type Severity = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface ResultOutput {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  interpretation: {
    text: string;
    severity: Severity;
    classification?: string;
    clinicalNote?: string;
  };
}

interface ResultCardProps {
  calculatorName: string;
  outputs: ResultOutput[];
  warnings?: string[];
  references?: string[];
  formulaUsed?: string;
  className?: string;
}

const severityToVariant: Record<Severity, BadgeProps['variant']> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

const severityColors: Record<Severity, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-slate-600 dark:text-slate-400',
};

const severityBg: Record<Severity, string> = {
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  danger: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  neutral: 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700',
};

export function ResultCard({ calculatorName, outputs, warnings, references, formulaUsed, className }: ResultCardProps) {
  const [showRef, setShowRef] = useState(false);
  const primary = outputs[0];
  if (!primary) return null;
  const sev = primary.interpretation.severity;

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden', severityBg[sev], className)}>
      {/* Primary result */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{calculatorName} Result</p>
            {primary.interpretation.classification && (
              <Badge variant={severityToVariant[sev]} className="mb-2">{primary.interpretation.classification}</Badge>
            )}
          </div>
          {formulaUsed && (
            <span className="text-xs bg-background/70 border border-border rounded-full px-2.5 py-1 text-muted-foreground whitespace-nowrap">
              {formulaUsed}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className={cn('text-5xl font-bold tracking-tight', severityColors[sev])}>
            {typeof primary.value === 'number'
              ? primary.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : primary.value}
          </span>
          {primary.unit && <span className="text-lg text-muted-foreground font-medium">{primary.unit}</span>}
        </div>
        <p className="text-sm font-medium text-foreground/80">{primary.interpretation.text}</p>
        {primary.interpretation.clinicalNote && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{primary.interpretation.clinicalNote}</p>
        )}
      </div>

      {/* Secondary outputs */}
      {outputs.length > 1 && (
        <div className="border-t border-current/10 bg-background/50 px-5 py-3 grid grid-cols-2 gap-3">
          {outputs.slice(1).map((out) => (
            <div key={out.id} className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">{out.label}</p>
              <p className="text-sm font-semibold">
                {typeof out.value === 'number'
                  ? out.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                  : out.value}
                {out.unit && <span className="text-xs text-muted-foreground ml-1">{out.unit}</span>}
              </p>
              {out.interpretation.classification && (
                <Badge
                  variant={severityToVariant[out.interpretation.severity]}
                  className="text-[10px] px-1.5 py-0"
                >
                  {out.interpretation.classification}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="border-t border-current/10 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-3 space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* References toggle */}
      {references && references.length > 0 && (
        <div className="border-t border-current/10 bg-background/30">
          <button
            onClick={() => setShowRef(!showRef)}
            className="flex items-center justify-between w-full px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />References
            </span>
            {showRef ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showRef && (
            <div className="px-5 pb-3 space-y-1">
              {references.map((ref, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">{i + 1}. {ref}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
