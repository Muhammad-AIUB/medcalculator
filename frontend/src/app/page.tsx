'use client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { CALCULATORS } from '@/lib/calculators/calculator-registry';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-3 py-2">
        {CALCULATORS.map((calc) => (
          <Link
            key={calc.id}
            href={`/calculators/${calc.id}`}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl border-2 border-[#0E7490]/30 bg-card hover:border-[#0E7490] hover:bg-[#0E7490]/5 transition-all active:scale-[0.98]"
          >
            <span className="text-sm font-semibold text-foreground">{calc.title}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
