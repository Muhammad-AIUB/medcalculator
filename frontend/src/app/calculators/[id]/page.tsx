'use client';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ResultCard } from '@/components/ui/result-card';
import { Button } from '@/components/ui/button';
import { getCalculator } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import { Share2, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';

const EgfrForm = dynamic(() => import('@/components/calculators/egfr-form').then(m => ({ default: m.EgfrForm })), { ssr: false });
const ChildPughForm = dynamic(() => import('@/components/calculators/child-pugh-form').then(m => ({ default: m.ChildPughForm })), { ssr: false });
const MeldNaForm = dynamic(() => import('@/components/calculators/meld-na-form').then(m => ({ default: m.MeldNaForm })), { ssr: false });
const BmiForm = dynamic(() => import('@/components/calculators/bmi-form').then(m => ({ default: m.BmiForm })), { ssr: false });
const EddForm = dynamic(() => import('@/components/calculators/edd-form').then(m => ({ default: m.EddForm })), { ssr: false });
const SofaForm = dynamic(() => import('@/components/calculators/sofa-form').then(m => ({ default: m.SofaForm })), { ssr: false });
const VasopressorForm = dynamic(() => import('@/components/calculators/vasopressor-form').then(m => ({ default: m.VasopressorForm })), { ssr: false });
const TsatForm = dynamic(() => import('@/components/calculators/tsat-form').then(m => ({ default: m.TsatForm })), { ssr: false });

const FORM_MAP: Record<string, React.ComponentType<any>> = {
  egfr: EgfrForm,
  'child-pugh': ChildPughForm,
  'meld-na': MeldNaForm,
  bmi: BmiForm,
  edd: EddForm,
  sofa: SofaForm,
  vasopressor: VasopressorForm,
  tsat: TsatForm,
};

export default function CalculatorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const calculator = useMemo(() => getCalculator(id), [id]);
  const { addToRecent, addHistoryEntry } = useUIStore();
  const [result, setResult] = useState<any>(null);
  const [resetKey, setResetKey] = useState(0);

  const FormComponent = FORM_MAP[id];

  if (!calculator || !FormComponent) {
    return (
      <AppShell title="Not Found" showBack>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-base font-semibold">Calculator not found</p>
          <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </AppShell>
    );
  }

  const handleResult = useCallback((res: any) => {
    setResult(res);
    addToRecent(id);
    if (res) {
      const primaryOutput = res.outputs?.[0];
      addHistoryEntry({
        calculatorId: id,
        calculatorName: calculator.title,
        inputs: res.inputs ?? {},
        outputs: res.outputs ?? [],
        units: res.units,
        calculatedAt: new Date().toISOString(),
        summary: primaryOutput
          ? `${primaryOutput.label}: ${primaryOutput.value}${primaryOutput.unit ? ' ' + primaryOutput.unit : ''}`
          : 'Calculated',
      });
    }
  }, [id, calculator, addToRecent, addHistoryEntry]);

  const handleShare = async () => {
    if (!result) return;
    const text = result.outputs?.map((o: any) => `${o.label}: ${o.value}${o.unit ? ' ' + o.unit : ''}`).join('\n') ?? '';
    if (navigator.share) {
      await navigator.share({ title: calculator.title, text });
    } else {
      await navigator.clipboard.writeText(`${calculator.title}\n${text}`);
    }
  };

  return (
    <AppShell title={calculator.title} showBack backHref="/">
      <div className="space-y-4">
        {/* Action buttons */}
        {result && (
          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" size="icon-sm" onClick={handleShare} aria-label="Share">
              <Share2 className="h-[18px] w-[18px]" />
            </Button>
          </div>
        )}

        {/* Live result */}
        {result && (
          <div className="sticky top-[56px] z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border/60">
            <ResultCard
              calculatorName={calculator.title}
              outputs={result.outputs}
              warnings={result.warnings}
              references={result.references}
              formulaUsed={result.formulaUsed}
            />
          </div>
        )}

        {/* Calculator form */}
        <div className="space-y-4">
          <FormComponent key={resetKey} onResult={handleResult} />
        </div>

        {/* Reset button */}
        {result && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => { setResult(null); setResetKey(k => k + 1); }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Calculator
          </Button>
        )}
      </div>
    </AppShell>
  );
}
