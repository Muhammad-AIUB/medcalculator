'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { getCalculator } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import dynamic from 'next/dynamic';

const EgfrForm = dynamic(() => import('@/components/calculators/egfr-form').then(m => ({ default: m.EgfrForm })), { ssr: false });
const ChildPughForm = dynamic(() => import('@/components/calculators/child-pugh-form').then(m => ({ default: m.ChildPughForm })), { ssr: false });
const MeldNaForm = dynamic(() => import('@/components/calculators/meld-na-form').then(m => ({ default: m.MeldNaForm })), { ssr: false });
const BmiForm = dynamic(() => import('@/components/calculators/bmi-form').then(m => ({ default: m.BmiForm })), { ssr: false });
const EddForm = dynamic(() => import('@/components/calculators/edd-form').then(m => ({ default: m.EddForm })), { ssr: false });
const SofaForm = dynamic(() => import('@/components/calculators/sofa-form').then(m => ({ default: m.SofaForm })), { ssr: false });
const Sofa2Form = dynamic(() => import('@/components/calculators/sofa-2-form').then(m => ({ default: m.Sofa2Form })), { ssr: false });
const GcsForm = dynamic(() => import('@/components/calculators/gcs-form').then(m => ({ default: m.GcsForm })), { ssr: false });
const VasopressorForm = dynamic(() => import('@/components/calculators/vasopressor-form').then(m => ({ default: m.VasopressorForm })), { ssr: false });
const TsatForm = dynamic(() => import('@/components/calculators/tsat-form').then(m => ({ default: m.TsatForm })), { ssr: false });

const FORM_MAP: Record<string, React.ComponentType<any>> = {
  egfr: EgfrForm,
  'child-pugh': ChildPughForm,
  'meld-na': MeldNaForm,
  bmi: BmiForm,
  edd: EddForm,
  sofa: SofaForm,
  'sofa-2': Sofa2Form,
  gcs: GcsForm,
  vasopressor: VasopressorForm,
  tsat: TsatForm,
};

const BMI_FORMULA = 'Body mass index, kg/m2 = weight, kg / (height, m)2\nBody surface area (Mosteller), m2 = [(height, cm x weight, kg) / 3600]1/2';
const MELD_NA_FORMULA = 'MELD = 3.78 x ln(bilirubin) + 11.2 x ln(INR) + 9.57 x ln(creatinine) + 6.43\nMELD-Na = MELD Score - Na - 0.025 x MELD x (140-Na) + 140';
const GCS_FORMULA = 'The Glasgow Coma Score is calculated by addition of the total points selected under each component (eye, verbal, motor) below, e.g. "15 points".\nThe Glasgow Coma Scale is comprised of the individual components, e.g. "E(4) V(5) M(6)".';
const SOFA2_FORMULA = 'To calculate the SOFA-2 Score, add the points for each variable.';

const FORMULA_MAP: Record<string, string> = {
  bmi:          'BMI = Weight (kg) Ã· HeightÂ² (mÂ²)',
  egfr:         ‘GFR = 175 × Scr⁻¹·¹⁵⁴ × Age⁻⁰·²⁰³ × 1.212 (if Black) × 0.742 (if Female)’,
  'meld-na':    MELD_NA_FORMULA,
  'child-pugh': 'Addition of assigned points.',
  sofa:         'SOFA = Respiratory + Coagulation + Liver + Cardiovascular + CNS + Renal (each 0â€“4 pts)',
  'sofa-2':     SOFA2_FORMULA,
  vasopressor:  'VIS = Dopamine + Dobutamine + (EpinephrineÃ—100) + (NorepinephrineÃ—100) + (VasopressinÃ—2.5) + (MilrinoneÃ—10) + Phenylephrine',
  tsat:         'TSAT (%) = (Serum Iron Ã· TIBC) Ã— 100',
  edd:          "Naegele's Rule: EDD = LMP + 9 months + 7 days\nUltrasound: EDD = Scan Date âˆ’ GA + 280 days",
};

const severityColors: Record<string, string> = {
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  info:    '#3b82f6',
  neutral: '#64748b',
};

const severityBg: Record<string, string> = {
  success: '#f0fdf4',
  warning: '#fffbeb',
  danger:  '#fef2f2',
  info:    '#eff6ff',
  neutral: '#f8fafc',
};

interface Props { id: string; }

export function CalculatorPageClient({ id }: Props) {
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
          <p className="text-4xl mb-3">âš ï¸</p>
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

  const primary = result?.outputs?.[0];
  const sev = primary?.interpretation?.severity ?? 'neutral';
  const color = severityColors[sev] ?? severityColors.neutral;
  const bg = primary ? (severityBg[sev] ?? severityBg.neutral) : '#f8fafc';

  return (
    <AppShell title={calculator.title} showBack backHref="/">
      <div className="space-y-6">

        {/* Form inputs */}
        <FormComponent key={resetKey} onResult={handleResult} />

        {/* Result â€” always visible */}
        <div
          className="rounded-2xl border-2 p-5 space-y-3"
          style={{ borderColor: primary ? color : '#e2e8f0', background: bg }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Result
          </p>

          {primary ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold" style={{ color }}>
                  {typeof primary.value === 'number'
                    ? primary.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                    : primary.value}
                </span>
                {primary.unit && (
                  <span className="text-base font-medium text-gray-500">{primary.unit}</span>
                )}
              </div>
              {result.warnings?.length > 0 && (
                <div className="pt-2 border-t border-amber-200 space-y-1">
                  {result.warnings.map((w: string, i: number) => (
                    <p key={i} className="text-xs text-amber-700">âš  {w}</p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-3xl font-bold text-gray-300">â€”</p>
          )}
        </div>

        {/* Formula â€” always visible */}
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Formula Used
          </p>
          <p className="text-sm font-medium text-foreground whitespace-pre-line">
            {id === 'bmi'
              ? (result?.formulaUsed ?? BMI_FORMULA)
              : id === 'meld-na'
                ? (result?.formulaUsed ?? MELD_NA_FORMULA)
                : id === 'gcs'
                  ? (result?.formulaUsed ?? GCS_FORMULA)
                  : (result?.formulaUsed ?? FORMULA_MAP[id] ?? '—')}
          </p>
        </div>

      </div>
    </AppShell>
  );
}
