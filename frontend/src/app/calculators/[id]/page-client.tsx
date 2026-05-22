'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { getCalculator } from '@/lib/calculators/calculator-registry';
import { useUIStore } from '@/store/ui.store';
import dynamic from 'next/dynamic';

const EgfrForm        = dynamic(() => import('@/components/calculators/egfr-form').then(m => ({ default: m.EgfrForm })), { ssr: false });
const ChildPughForm   = dynamic(() => import('@/components/calculators/child-pugh-form').then(m => ({ default: m.ChildPughForm })), { ssr: false });
const MeldNaForm      = dynamic(() => import('@/components/calculators/meld-na-form').then(m => ({ default: m.MeldNaForm })), { ssr: false });
const BmiForm         = dynamic(() => import('@/components/calculators/bmi-form').then(m => ({ default: m.BmiForm })), { ssr: false });
const EddForm         = dynamic(() => import('@/components/calculators/edd-form').then(m => ({ default: m.EddForm })), { ssr: false });
const SofaForm        = dynamic(() => import('@/components/calculators/sofa-form').then(m => ({ default: m.SofaForm })), { ssr: false });
const Sofa2Form       = dynamic(() => import('@/components/calculators/sofa-2-form').then(m => ({ default: m.Sofa2Form })), { ssr: false });
const GcsForm         = dynamic(() => import('@/components/calculators/gcs-form').then(m => ({ default: m.GcsForm })), { ssr: false });
const AihForm         = dynamic(() => import('@/components/calculators/aih-form').then(m => ({ default: m.AihForm })), { ssr: false });
const OriginalAihForm = dynamic(() => import('@/components/calculators/original-aih-form').then(m => ({ default: m.OriginalAihForm })), { ssr: false });
const FraxForm        = dynamic(() => import('@/components/calculators/frax-form').then(m => ({ default: m.FraxForm })), { ssr: false });
const CdaiForm        = dynamic(() => import('@/components/calculators/cdai-form').then(m => ({ default: m.CdaiForm })), { ssr: false });
const SdaiForm        = dynamic(() => import('@/components/calculators/sdai-form').then(m => ({ default: m.SdaiForm })), { ssr: false });
const BasdaiForm      = dynamic(() => import('@/components/calculators/basdai-form').then(m => ({ default: m.BasdaiForm })), { ssr: false });
const SledaiForm      = dynamic(() => import('@/components/calculators/sledai-form').then(m => ({ default: m.SledaiForm })), { ssr: false });
const Das28EsrForm    = dynamic(() => import('@/components/calculators/das28-esr-form').then(m => ({ default: m.Das28EsrForm })), { ssr: false });
const ApriForm        = dynamic(() => import('@/components/calculators/apri-form').then(m => ({ default: m.ApriForm })), { ssr: false });
const Fib4Form        = dynamic(() => import('@/components/calculators/fib-4-form').then(m => ({ default: m.Fib4Form })), { ssr: false });
const VasopressorForm  = dynamic(() => import('@/components/calculators/vasopressor-form').then(m => ({ default: m.VasopressorForm })), { ssr: false });
const TsatForm         = dynamic(() => import('@/components/calculators/tsat-form').then(m => ({ default: m.TsatForm })), { ssr: false });
const OsmolalityForm   = dynamic(() => import('@/components/calculators/osmolality-form').then(m => ({ default: m.OsmolalityForm })), { ssr: false });
const OsmolarGapForm   = dynamic(() => import('@/components/calculators/osmolar-gap-form').then(m => ({ default: m.OsmolarGapForm })), { ssr: false });
const CppForm              = dynamic(() => import('@/components/calculators/cpp-form').then(m => ({ default: m.CppForm })), { ssr: false });
const SodiumCorrectionForm  = dynamic(() => import('@/components/calculators/sodium-correction-form').then(m => ({ default: m.SodiumCorrectionForm })), { ssr: false });
const CockcroftGaultForm    = dynamic(() => import('@/components/calculators/cockcroft-gault-form').then(m => ({ default: m.CockcroftGaultForm })), { ssr: false });
const FenaForm              = dynamic(() => import('@/components/calculators/fena-form').then(m => ({ default: m.FenaForm })), { ssr: false });
const AnionGapForm          = dynamic(() => import('@/components/calculators/anion-gap-form').then(m => ({ default: m.AnionGapForm })), { ssr: false });
const WintersFormulaForm    = dynamic(() => import('@/components/calculators/winters-formula-form').then(m => ({ default: m.WintersFormulaForm })), { ssr: false });
const KtvForm               = dynamic(() => import('@/components/calculators/ktv-form').then(m => ({ default: m.KtvForm })), { ssr: false });
const UrrForm               = dynamic(() => import('@/components/calculators/urr-form').then(m => ({ default: m.UrrForm })), { ssr: false });
const AcrForm               = dynamic(() => import('@/components/calculators/acr-form').then(m => ({ default: m.AcrForm })), { ssr: false });
const Cha2ds2VascForm       = dynamic(() => import('@/components/calculators/cha2ds2-vasc-form').then(m => ({ default: m.Cha2ds2VascForm })), { ssr: false });
const HasBledForm           = dynamic(() => import('@/components/calculators/has-bled-form').then(m => ({ default: m.HasBledForm })), { ssr: false });
const TimiUaNstemiForm      = dynamic(() => import('@/components/calculators/timi-ua-nstemi-form').then(m => ({ default: m.TimiUaNstemiForm })), { ssr: false });
const GraceForm             = dynamic(() => import('@/components/calculators/grace-form').then(m => ({ default: m.GraceForm })), { ssr: false });
const QtcForm               = dynamic(() => import('@/components/calculators/qtc-form').then(m => ({ default: m.QtcForm })), { ssr: false });

const FORM_MAP: Record<string, React.ComponentType<any>> = {
  egfr:         EgfrForm,
  'child-pugh': ChildPughForm,
  'meld-na':    MeldNaForm,
  bmi:          BmiForm,
  edd:          EddForm,
  sofa:         SofaForm,
  'sofa-2':     Sofa2Form,
  gcs:          GcsForm,
  aih:          AihForm,
  'original-aih': OriginalAihForm,
  frax:         FraxForm,
  cdai:         CdaiForm,
  sdai:         SdaiForm,
  basdai:       BasdaiForm,
  sledai:       SledaiForm,
  'das28-esr':  Das28EsrForm,
  apri:         ApriForm,
  'fib-4':      Fib4Form,
  vasopressor:    VasopressorForm,
  tsat:           TsatForm,
  osmolality:     OsmolalityForm,
  'osmolar-gap':  OsmolarGapForm,
  cpp:                CppForm,
  'sodium-correction':  SodiumCorrectionForm,
  'cockcroft-gault':    CockcroftGaultForm,
  fena:                 FenaForm,
  'anion-gap':          AnionGapForm,
  'winters-formula':    WintersFormulaForm,
  'ktv':               KtvForm,
  urr:                 UrrForm,
  acr:                 AcrForm,
  'cha2ds2-vasc':      Cha2ds2VascForm,
  'has-bled':          HasBledForm,
  'timi-ua-nstemi':    TimiUaNstemiForm,
  grace:               GraceForm,
  qtc:                 QtcForm,
};

const FORMULA_MAP: Record<string, string> = {
  egfr:         'GFR = 175 x Scr^-1.154 x Age^-0.203 x 1.212 (if Black) x 0.742 (if Female)',
  bmi:          'BMI = Weight (kg) / Height^2 (m^2)',
  'meld-na':    'MELD = 3.78 x ln(Bilirubin) + 11.2 x ln(INR) + 9.57 x ln(Creatinine) + 6.43\nMELD-Na = MELD - Na - 0.025 x MELD x (140 - Na) + 140',
  'child-pugh': 'Addition of assigned points.',
  sofa:         'SOFA = Coagulation + CNS + Liver + Cardiovascular + Renal (each 0-4 pts)',
  'sofa-2':     'SOFA-2 Score = sum of all component points.',
  aih:          'Addition of assigned points.',
  'original-aih': 'Addition of assigned points.',
  frax:         'Addition of assigned points.',
  cdai:         'CDAI = Tender Joint Count + Swollen Joint Count + Patient Global Activity + Provider Global Activity',
  sdai:         'SDAI = Tender Joint Count + Swollen Joint Count + CRP, mg/dL + Patient Global Activity + Provider Global Activity',
  basdai:       'BASDAI = ((Q1 + Q2 + Q3 + Q4) + ((Q5 + Q6) / 2)) / 5',
  sledai:       'SLEDAI Score = sum of all selected item points.',
  'das28-esr':  'DAS28-ESR= (0.56*sqrt(Tender Joint Count)+0.28*sqrt(Swollen Joint Count)+0.7*ln(ESR)+0.014*(global health))',
  apri:         'APRI = (AST in IU/L) / (AST Upper Limit of Normal in IU/L) / (Platelets in 10^9/L)',
  'fib-4':      'FIB-4 Score = (Age x AST) / (Platelets x sqrt(ALT))',
  vasopressor:  'VIS = Dopamine + Dobutamine + (Epinephrine x 100) + (Norepinephrine x 100) + (Vasopressin x 2.5) + (Milrinone x 10) + Phenylephrine',
  tsat:         'TS = (Fe / TIBC) * 100',
  gcs:            'GCS = Eye (1-4) + Verbal (1-5) + Motor (1-6)',
  edd:            'Uses the first day of your Last Menstrual Period (LMP).',
  cpp:                 'CPP = MAP - ICP',
  'sodium-correction':  'Corrected Na (Katz, 1973) = Measured Na + 0.016 x (Serum glucose - 100)\nCorrected Na (Hillier, 1999) = Measured Na + 0.024 x (Serum glucose - 100)\n\nNote: Serum glucose must be in mg/dL',
  'cockcroft-gault':    'CrCl = (140 - Age) x Weight(kg) x (0.85 if Female) / (72 x Cr mg/dL)\nIBW male = 50 + 2.3 x (Height inches - 60)\nIBW female = 45.5 + 2.3 x (Height inches - 60)\nABW = IBW + 0.4 x (Actual weight - IBW)',
  fena:                 'FENa (%) = 100 x (SCr x UNa) / (SNa x UCr)\n\nSCr = serum creatinine, UNa = urine sodium\nSNa = serum sodium, UCr = urine creatinine',
  'anion-gap':          'Anion Gap = Na - (Cl + HCO3)\nDelta Gap = Anion Gap - 12\nAlbumin Corrected AG = AG + 2.5 x (4 - Albumin g/dL)\nAlbumin Corrected Delta Gap = Corrected AG - 12\nDelta Ratio = Delta Gap / (24 - HCO3)\nAlbumin Corrected Delta Ratio = Corrected Delta Gap / (24 - HCO3)',
  'winters-formula':    'Expected pCO2 = 1.5 x HCO3- + 8 +/- 2\n\nNote: although the original Winters formula used +/-2, newer data suggest pCO2 may vary up to +/-5',
  ktv:                 'Kt/V, where\nK = dialyzer clearance of urea\nt = dialysis time\nV = volume of distribution of urea ~ patient total body water\n\nKt/V = (K x t) / V',
  urr:                 'URR = (Upre - Upost) / Upre x 100\n    = (1 - Upost / Upre) x 100',
  acr:                 'ACR (mg/g) = Albumin (mg/dL) / Creatinine (g/dL)',
  'cha2ds2-vasc':      'Addition of the selected points:\n\nAge <65: 0 | 65-74: +1 | >=75: +2\nSex female: +1\nCHF history: +1\nHypertension history: +1\nStroke/TIA/thromboembolism history: +2\nVascular disease history: +1\nDiabetes history: +1',
  'has-bled':          'Addition of the selected points (each +1):\n\nH - Hypertension (uncontrolled, >160 mmHg systolic)\nA - Abnormal renal function (dialysis, transplant, Cr >2.26 mg/dL)\nA - Abnormal liver function (cirrhosis or bilirubin >2x normal)\nS - Stroke history\nB - Bleeding history or predisposition\nL - Labile INR (time in therapeutic range <60%)\nE - Elderly (age >65)\nD - Drugs predisposing to bleeding (aspirin, clopidogrel, NSAIDs)\nD - Alcohol use (>=8 drinks/week)',
  'timi-ua-nstemi':    'Addition of the selected points (each +1):\n\nAge >=65\n>=3 CAD risk factors (hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker)\nKnown CAD (stenosis >=50%)\nASA use in past 7 days\nSevere angina (>=2 episodes in 24 hrs)\nEKG ST changes >=0.5mm\nPositive cardiac marker',
  grace:               'Nomogram (Fox Model) — point-based sum:\nAge + Heart rate + Systolic BP + Creatinine + Killip class + Cardiac arrest + ST deviation + Abnormal enzymes\n\nScore  | 6-month mortality\n0-87   | 0-2%\n88-128 | 3-10%\n129-149| 10-20%\n150-173| 20-30%\n174-182| 40%\n183-190| 50%\n191-199| 60%\n200-207| 70%\n208-218| 80%\n219-284| 90%\n>=285  | 99%',
  qtc:                 'RR interval = 60 / HR\n\nBazett:     QTc = QT / sqrt(RR)\nFridericia: QTc = QT / RR^(1/3)\nFramingham: QTc = QT + 154 x (1 - RR)\nHodges:     QTc = QT + 1.75 x (HR - 60)\nRautaharju: QTc = QT x (120 + HR) / 180\n\nQT and RR in seconds for Bazett/Fridericia; QT in ms for others',
  osmolality:     'Osmolality = 2 x Na + BUN/2.8 + Glucose/18',
  'osmolar-gap':  'Method 1: Stool Osmolal Gap = Stool Osm - (2 x (Na + K))\nMethod 2: Stool Osmolal Gap = 290 mOsm/kg - (2 x (Na + K))',
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
          <p className="text-4xl mb-3">&#9888;</p>
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
  const sev   = primary?.interpretation?.severity ?? 'neutral';
  const color = severityColors[sev] ?? severityColors.neutral;
  const bg    = primary ? (severityBg[sev] ?? severityBg.neutral) : '#f8fafc';

  return (
    <AppShell title={calculator.title} showBack backHref="/">
      <div className="space-y-6">

        {/* Form */}
        <FormComponent key={resetKey} onResult={handleResult} />

        {/* Result */}
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
                    <p key={i} className="text-xs text-amber-700">&#9888; {w}</p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-3xl font-bold text-gray-300">--</p>
          )}
        </div>

        {/* Interpretation */}
        {primary?.interpretation?.text ? (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Interpretation
            </p>
            <p className="text-sm font-medium text-foreground">
              {primary.interpretation.text}
            </p>
          </div>
        ) : null}

        {/* Formula */}
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Formula Used
          </p>
          <p className="text-sm font-medium text-foreground whitespace-pre-line">
            {result?.formulaUsed ?? FORMULA_MAP[id] ?? '--'}
          </p>
        </div>

      </div>
    </AppShell>
  );
}
