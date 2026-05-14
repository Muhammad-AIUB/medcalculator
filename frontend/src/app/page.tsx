'use client';
import { useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CalculatorCard } from '@/components/layout/calculator-card';
import { CALCULATORS } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import type { Calculator } from '@/types/calculator';

export default function DashboardPage() {
  const { recentCalculators } = useUIStore();

  const recentCalcs = recentCalculators
    .map((id) => CALCULATORS.find((c) => c.id === id))
    .filter(Boolean) as Calculator[];

  const categoryLabel = (cat: string) =>
    cat.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const grouped = useMemo(() => {
    return CALCULATORS.reduce<Record<string, Calculator[]>>((acc, c) => {
      const cat = categoryLabel(c.category);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    }, {});
  }, []);

  return (
    <AppShell>
      <div className="space-y-5">

        {/* Recent calculators */}
        {recentCalcs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent
              </h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {recentCalcs.map((calc) => (
                <Link
                  key={calc.id}
                  href={`/calculators/${calc.id}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors min-w-[76px] max-w-[90px] text-center"
                >
                  <span className="text-2xl leading-none">{calc.emoji}</span>
                  <span className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground">
                    {calc.shortTitle ?? calc.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Calculator groups */}
        {Object.entries(grouped).map(([group, calcs]) => (
          <section key={group}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group}
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {calcs.map((calc) => (
                <CalculatorCard key={calc.id} calculator={calc} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
