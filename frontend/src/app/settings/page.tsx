'use client';
import { AppShell } from '@/components/layout/app-shell';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Trash2, Activity, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { clearHistory, history } = useUIStore();
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    clearHistory();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-6">
        {/* Appearance */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                  theme === value
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Data */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium">Calculation History</p>
                <p className="text-xs text-muted-foreground">{history.length} saved entries</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {cleared ? 'Cleared!' : 'Clear'}
              </Button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-600 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">MedCalc Pro</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0 — Clinical Edition</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Professional clinical calculator platform for healthcare providers. All formulas are based on peer-reviewed literature and clinical guidelines. Always verify results with clinical judgment.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                This tool is for clinical decision support only. It does not replace professional medical judgment. Always consult clinical guidelines and institutional protocols.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
