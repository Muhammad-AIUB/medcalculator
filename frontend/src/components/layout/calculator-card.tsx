'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Calculator } from '@/types/calculator';

const categoryColors: Record<string, string> = {
  'renal':         'bg-blue-50   border-blue-100   dark:bg-blue-950/20  dark:border-blue-900',
  'liver':         'bg-amber-50  border-amber-100  dark:bg-amber-950/20 dark:border-amber-900',
  'critical-care': 'bg-red-50    border-red-100    dark:bg-red-950/20   dark:border-red-900',
  'nutrition':     'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900',
  'obstetric':     'bg-pink-50   border-pink-100   dark:bg-pink-950/20  dark:border-pink-900',
  'hematology':    'bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900',
  'cardiovascular':'bg-rose-50   border-rose-100   dark:bg-rose-950/20  dark:border-rose-900',
};

const iconColors: Record<string, string> = {
  'renal':         'bg-blue-500',
  'liver':         'bg-amber-500',
  'critical-care': 'bg-red-500',
  'nutrition':     'bg-emerald-500',
  'obstetric':     'bg-pink-500',
  'hematology':    'bg-purple-500',
  'cardiovascular':'bg-rose-500',
};

const categoryLabels: Record<string, string> = {
  'renal':         'Renal',
  'liver':         'Liver',
  'critical-care': 'Critical Care',
  'nutrition':     'Nutrition',
  'obstetric':     'Obstetric',
  'hematology':    'Hematology',
  'cardiovascular':'Cardiovascular',
};

interface CalculatorCardProps {
  calculator: Calculator;
}

export function CalculatorCard({ calculator }: CalculatorCardProps) {
  const bg = categoryColors[calculator.category] ?? 'bg-card border-border';
  const iconBg = iconColors[calculator.category] ?? 'bg-cyan-500';

  return (
    <div className={cn('relative rounded-2xl border p-4 transition-all duration-150 hover:shadow-md active:scale-[0.98]', bg)}>
      <Link href={`/calculators/${calculator.id}`} className="block">
        <div className="flex items-start gap-3">
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-2xl leading-none', iconBg)}>
            <span aria-hidden>{calculator.emoji}</span>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-sm font-semibold text-foreground leading-tight pt-1">{calculator.title}</h3>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Badge variant="neutral" className="text-[10px] capitalize">
            {categoryLabels[calculator.category] ?? calculator.category}
          </Badge>
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Calculate →</span>
        </div>
      </Link>
    </div>
  );
}
