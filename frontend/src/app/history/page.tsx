'use client';
import { AppShell } from '@/components/layout/app-shell';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import { Trash2, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryPage() {
  const { history, removeHistoryEntry, clearHistory } = useUIStore();

  const grouped = history.reduce((acc: Record<string, typeof history>, entry) => {
    const date = new Date(entry.calculatedAt).toLocaleDateString(undefined, {
      weekday: 'long', month: 'short', day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <AppShell title="History">
      <div className="space-y-5">
        {history.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {history.length} calculation{history.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-1.5"
              onClick={clearHistory}
            >
              <Trash2 className="h-3.5 w-3.5" />Clear all
            </Button>
          </div>
        )}

        {history.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-base font-semibold">No history yet</p>
            <p className="text-sm text-muted-foreground mt-1">Calculations you run will appear here</p>
            <Link href="/">
              <Button className="mt-5" variant="medical">Start Calculating</Button>
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <section key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{date}</p>
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{entry.calculatorName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.summary}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(entry.calculatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/calculators/${entry.calculatorId}`}>
                        <Button variant="ghost" size="icon-sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeHistoryEntry(entry.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
