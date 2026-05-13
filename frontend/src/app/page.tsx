'use client';
import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CalculatorCard } from '@/components/layout/calculator-card';
import { CALCULATORS } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import { Search, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Calculator } from '@/types/calculator';

const CATEGORY_TABS = [
  { id: 'all',          label: 'All' },
  { id: 'critical-care',label: 'Critical Care' },
  { id: 'renal',        label: 'Renal' },
  { id: 'liver',        label: 'Liver' },
  { id: 'nutrition',    label: 'Nutrition' },
  { id: 'obstetric',    label: 'Obstetric' },
];

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const { recentCalculators } = useUIStore();

  const filtered = useMemo(() => {
    let list = CALCULATORS;
    if (activeCategory !== 'all') list = list.filter((c) => c.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, activeCategory]);

  const recentCalcs = recentCalculators
    .map((id) => CALCULATORS.find((c) => c.id === id))
    .filter(Boolean) as Calculator[];

  // Group by category label when in "All" view without search
  const categoryLabel = (cat: string) =>
    cat.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const grouped = useMemo(() => {
    if (activeCategory !== 'all' || search.trim()) {
      return { Results: filtered };
    }
    return filtered.reduce<Record<string, Calculator[]>>((acc, c) => {
      const cat = categoryLabel(c.category);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    }, {});
  }, [filtered, activeCategory, search]);

  return (
    <AppShell onSearchClick={() => setShowSearch((s) => !s)}>
      <div className="space-y-5">

        {/* Search bar */}
        {showSearch && (
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              style={{ width: 18, height: 18 }}
            />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search calculators, tags..."
              className="w-full h-12 pl-10 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Recent calculators */}
        {recentCalcs.length > 0 && !search && (
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

        {/* Category tabs */}
        {!search && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                  activeCategory === cat.id
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-background text-muted-foreground border-border hover:border-cyan-400 hover:text-cyan-600'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Calculator groups */}
        {Object.entries(grouped).map(([group, calcs]) => (
          <section key={group}>
            {Object.keys(grouped).length > 1 && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-2.5">
              {calcs.map((calc) => (
                <CalculatorCard key={calc.id} calculator={calc} />
              ))}
            </div>
          </section>
        ))}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-base font-semibold text-foreground">No calculators found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search term or category
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
