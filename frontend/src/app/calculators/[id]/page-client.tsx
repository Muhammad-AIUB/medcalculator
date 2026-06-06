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
const MapForm               = dynamic(() => import('@/components/calculators/map-form').then(m => ({ default: m.MapForm })), { ssr: false });
const CardiacOutputForm     = dynamic(() => import('@/components/calculators/cardiac-output-form').then(m => ({ default: m.CardiacOutputForm })), { ssr: false });
const LdlForm               = dynamic(() => import('@/components/calculators/ldl-form').then(m => ({ default: m.LdlForm })), { ssr: false });
const WellsPeForm           = dynamic(() => import('@/components/calculators/wells-pe-form').then(m => ({ default: m.WellsPeForm })), { ssr: false });
const ShockIndexForm        = dynamic(() => import('@/components/calculators/shock-index-form').then(m => ({ default: m.ShockIndexForm })), { ssr: false });
const DaptForm                     = dynamic(() => import('@/components/calculators/dapt-form').then(m => ({ default: m.DaptForm })), { ssr: false });
const CorrectedReticulocyteForm    = dynamic(() => import('@/components/calculators/corrected-reticulocyte-form').then(m => ({ default: m.CorrectedReticulocyteForm })), { ssr: false });
const AncForm                      = dynamic(() => import('@/components/calculators/anc-form').then(m => ({ default: m.AncForm })), { ssr: false });
const MentzerIndexForm             = dynamic(() => import('@/components/calculators/mentzer-index-form').then(m => ({ default: m.MentzerIndexForm })), { ssr: false });
const CalciumCorrectionForm        = dynamic(() => import('@/components/calculators/calcium-correction-form').then(m => ({ default: m.CalciumCorrectionForm })), { ssr: false });
const WellsDvtForm                 = dynamic(() => import('@/components/calculators/wells-dvt-form').then(m => ({ default: m.WellsDvtForm })), { ssr: false });
const FlipIForm                    = dynamic(() => import('@/components/calculators/flipi-form').then(m => ({ default: m.FlipIForm })), { ssr: false });
const CllIpiForm                   = dynamic(() => import('@/components/calculators/cll-ipi-form').then(m => ({ default: m.CllIpiForm })), { ssr: false });
const IpssRForm                    = dynamic(() => import('@/components/calculators/ipss-r-form').then(m => ({ default: m.IpssRForm })), { ssr: false });
const IpssForm                     = dynamic(() => import('@/components/calculators/ipss-form').then(m => ({ default: m.IpssForm })), { ssr: false });
const BloodVolumeForm              = dynamic(() => import('@/components/calculators/blood-volume-form').then(m => ({ default: m.BloodVolumeForm })), { ssr: false });
const CciForm                      = dynamic(() => import('@/components/calculators/cci-form').then(m => ({ default: m.CciForm })), { ssr: false });
const PlasmaDosageForm             = dynamic(() => import('@/components/calculators/plasma-dosage-form').then(m => ({ default: m.PlasmaDosageForm })), { ssr: false });
const IronDeficitForm              = dynamic(() => import('@/components/calculators/iron-deficit-form').then(m => ({ default: m.IronDeficitForm })), { ssr: false });
const NihssForm                    = dynamic(() => import('@/components/calculators/nihss-form').then(m => ({ default: m.NihssForm })), { ssr: false });
const Abcd2Form                    = dynamic(() => import('@/components/calculators/abcd2-form').then(m => ({ default: m.Abcd2Form })), { ssr: false });
const NewsForm                     = dynamic(() => import('@/components/calculators/news-form').then(m => ({ default: m.NewsForm })), { ssr: false });
const IchForm                      = dynamic(() => import('@/components/calculators/ich-form').then(m => ({ default: m.IchForm })), { ssr: false });
const MrsForm                      = dynamic(() => import('@/components/calculators/mrs-form').then(m => ({ default: m.MrsForm })), { ssr: false });
const HuntHessForm                 = dynamic(() => import('@/components/calculators/hunt-hess-form').then(m => ({ default: m.HuntHessForm })), { ssr: false });
const EdssForm                     = dynamic(() => import('@/components/calculators/edss-form').then(m => ({ default: m.EdssForm })), { ssr: false });
const AspectsForm                  = dynamic(() => import('@/components/calculators/aspects-form').then(m => ({ default: m.AspectsForm })), { ssr: false });
const Apache2Form                  = dynamic(() => import('@/components/calculators/apache2-form').then(m => ({ default: m.Apache2Form })), { ssr: false });
const MocaForm                     = dynamic(() => import('@/components/calculators/moca-form').then(m => ({ default: m.MocaForm })), { ssr: false });
const Curb65Form                   = dynamic(() => import('@/components/calculators/curb65-form').then(m => ({ default: m.Curb65Form })), { ssr: false });
const BodeForm                     = dynamic(() => import('@/components/calculators/bode-form').then(m => ({ default: m.BodeForm })), { ssr: false });
const GoldCopdForm                 = dynamic(() => import('@/components/calculators/gold-copd-form').then(m => ({ default: m.GoldCopdForm })), { ssr: false });
const PercForm                     = dynamic(() => import('@/components/calculators/perc-form').then(m => ({ default: m.PercForm })), { ssr: false });
const StopBangForm                 = dynamic(() => import('@/components/calculators/stop-bang-form').then(m => ({ default: m.StopBangForm })), { ssr: false });
const MmrcForm                     = dynamic(() => import('@/components/calculators/mmrc-form').then(m => ({ default: m.MmrcForm })), { ssr: false });
const BsaForm                      = dynamic(() => import('@/components/calculators/bsa-form').then(m => ({ default: m.BsaForm })), { ssr: false });
const BsaCosteffForm               = dynamic(() => import('@/components/calculators/bsa-costeff-form').then(m => ({ default: m.BsaCosteffForm })), { ssr: false });
const EjectionFractionForm         = dynamic(() => import('@/components/calculators/ejection-fraction-form').then(m => ({ default: m.EjectionFractionForm })), { ssr: false });
const ScaiShockForm                = dynamic(() => import('@/components/calculators/scai-shock-form').then(m => ({ default: m.ScaiShockForm })), { ssr: false });

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
  map:                 MapForm,
  'cardiac-output':    CardiacOutputForm,
  ldl:                 LdlForm,
  'wells-pe':          WellsPeForm,
  'shock-index':       ShockIndexForm,
  dapt:                       DaptForm,
  'corrected-reticulocyte':   CorrectedReticulocyteForm,
  anc:                        AncForm,
  'mentzer-index':            MentzerIndexForm,
  'calcium-correction':       CalciumCorrectionForm,
  'wells-dvt':                WellsDvtForm,
  flipi:                      FlipIForm,
  'cll-ipi':                  CllIpiForm,
  'ipss-r':                   IpssRForm,
  ipss:                       IpssForm,
  'blood-volume':             BloodVolumeForm,
  cci:                        CciForm,
  'plasma-dosage':            PlasmaDosageForm,
  'iron-deficit':             IronDeficitForm,
  nihss:                      NihssForm,
  abcd2:                      Abcd2Form,
  news:                       NewsForm,
  ich:                        IchForm,
  mrs:                        MrsForm,
  'hunt-hess':                HuntHessForm,
  edss:                       EdssForm,
  aspects:                    AspectsForm,
  apache2:                    Apache2Form,
  moca:                       MocaForm,
  curb65:                     Curb65Form,
  bode:                       BodeForm,
  'gold-copd':                GoldCopdForm,
  perc:                       PercForm,
  'stop-bang':                StopBangForm,
  mmrc:                       MmrcForm,
  bsa:                        BsaForm,
  'bsa-costeff':              BsaCosteffForm,
  'ejection-fraction':        EjectionFractionForm,
  'scai-shock':               ScaiShockForm,
};

const FORMULA_MAP: Record<string, string> = {
  egfr:         'GFR = 175 x Scr^-1.154 x Age^-0.203 x 1.212 (if Black) x 0.742 (if Female)',
  bmi:          'BMI = Weight (kg) / Height^2 (m^2)',
  bsa:          'BSA (m²) = √[(Height in cm × Weight in kg) / 3600]   (Mosteller)',
  'bsa-costeff': 'BSA (m²) = (4 × W + 7) / (90 + W)   (Costeff, W in kg)',
  'ejection-fraction': 'LVEF (%) = (EDV − ESV) / EDV × 100   |   Stroke Volume = EDV − ESV',
  'scai-shock': 'SCAI SHOCK staging — select the highest stage (A–E) whose criteria the patient meets',
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
  map:                 'MAP = 1/3 x SBP + 2/3 x DBP',
  'cardiac-output':    'BSA = sqrt((Height cm x Weight kg) / 3600)\nVO2 = 125 x BSA  (or 110 x BSA if age >= 70)\n\nCO (L/min) = VO2 / [(SaO2 - SvO2) x Hb x 13.4]\nCI (L/min/m2) = CO / BSA\nSV (mL/beat) = CO / HR x 1000\n\nSaO2 and SvO2 as decimals (auto-converted from %)',
  ldl:                 'LDL (mg/dL) = Total Cholesterol (mg/dL) - HDL (mg/dL) - Triglycerides (mg/dL) / 5\n\nNote: Friedewald equation — not valid when Triglycerides > 400 mg/dL',
  'wells-pe':          'Addition of selected points:\n\nClinical signs/symptoms of DVT: +3\nPE is #1 diagnosis or equally likely: +3\nHeart rate > 100: +1.5\nImmobilization >=3 days or surgery in past 4 weeks: +1.5\nPrevious objectively diagnosed PE or DVT: +1.5\nHemoptysis: +1\nMalignancy (treatment within 6 months or palliative): +1\n\nThree-Tier: 0-1 Low | 2-6 Moderate | >6 High\nTwo-Tier: <=4 PE Unlikely (D-dimer) | >=5 PE Likely (CTPA)',
  'shock-index':       'Shock Index = HR / SBP\n\nNormal: 0.5 – 0.7\n>0.7 – 1.0: Mild compromise\n>1.0 – 1.4: Moderate shock\n>1.4:       Severe shock',
  dapt:                'Addition of the selected points:\n\nAge ≥75: -2 | 65-74: -1 | <65: 0\nCigarette smoking (within 1 year): +1\nDiabetes mellitus: +1\nMI at presentation: +1\nPrior PCI or prior MI: +1\nPaclitaxel-eluting stent: +1\nStent diameter <3 mm: +1\nCHF or LVEF <30%: +2\nVein graft stent: +2\n\nScore ≥ 2: Prolonged DAPT (>12 months) reasonable\nScore < 2: Standard DAPT (≤12 months) recommended',
  'corrected-reticulocyte': 'ARC (cells/µL) = (Reticulocyte % / 100) × RBC (cells/µL)\n\nCorrected Reticulocyte % = Reticulocyte % × (Measured Hct / Normal Hct)\n\nRPI = Corrected Reticulocyte % / Maturation Factor\n\nMaturation Factor:\n≥35%: 1.0 | 25–<35%: 1.5 | 20–<25%: 2.0 | <20%: 2.5\n\nRPI ≥ 3: Hyperproliferative\nRPI 2–3: Borderline\nRPI < 2: Hypoproliferative',
  anc:                 'ANC = 10 × WBC count (×10³/µL) × (% PMNs + % bands)\n\nANC ≥ 1500 cells/µL: Normal\nANC 1000–1499:       Mild neutropenia\nANC 500–999:         Moderate neutropenia\nANC < 500:           Severe neutropenia',
  'mentzer-index':        'Mentzer Index = MCV (fL) / RBC count (10⁶/µL)\n\n< 13: Thalassaemia trait likely\n= 13: Indeterminate\n> 13: Iron deficiency anaemia likely',
  'calcium-correction':   'Corrected Calcium (mg/dL) = (0.8 × (Normal Albumin − Patient Albumin)) + Serum Ca\n\nNote: formula uses albumin in g/dL and calcium in mg/dL\nNormal albumin reference: 4 g/dL (40 g/L)\n\n< 8.5 mg/dL:  Hypocalcaemia\n8.5–10.5:     Normal\n> 10.5 mg/dL: Hypercalcaemia',
  flipi:                  'Addition of the selected points (each +1):\n\nAge >60 years\n>4 nodal sites\nLDH elevated\nHemoglobin <120 g/L (12 g/dL)\nStage III–IV\n\n0–1: Low Risk (~71% 10-yr OS)\n2:   Intermediate Risk (~51% 10-yr OS)\n3–5: High Risk (~36% 10-yr OS)',
  cci:                    'CCI = Count Increment (×10⁹/L) × BSA (m²) / Unit Content (×10¹¹) × 1000\n\nBSA (Mosteller) = √(Height cm × Weight kg / 3600)\n\n1-hour CCI ≥ 7,500:  Adequate response\n1-hour CCI < 7,500:  Poor response\n20-hour CCI ≥ 4,500: Adequate response\n20-hour CCI < 4,500: Poor response (platelet refractoriness)',
  'plasma-dosage':        'Total plasma dosage (mL) = Desired dosage (mL/kg) × Weight (kg)\n\nUnits needed = ⌈Total mL / Unit volume mL⌉\n\nStandard dose: 10 mL/kg\nRange: 10–20 mL/kg\nExpected effect: ~20% increase in coagulation factors immediately after infusion',
  'blood-volume':         'Adults / Children ≥25 kg (Nadler formula):\nMale:   TBV (L) = 0.3669 × H(m)³ + 0.03219 × W(kg) + 0.6041\nFemale: TBV (L) = 0.3561 × H(m)³ + 0.03308 × W(kg) + 0.1833\n\nNeonates / Children <25 kg:\nPreterm neonate: 100 mL/kg\nTerm neonate:    85 mL/kg\nInfant 1-4 mo:   75 mL/kg\nChild <25 kg:    70 mL/kg\n\nRBC Volume (mL)   = TBV × Hct / 100\nPlasma Volume (mL) = TBV × (1 − Hct / 100)',
  'ipss-r':               'Addition of the selected points:\n\nCytogenetic group: Very good 0 | Good +1 | Intermediate +2 | Poor +3 | Very poor +4\nMedullary blasts %: ≤2→0, >2 to <5→+1, 5–10→+2, >10→+3\nHemoglobin (g/dL): ≥10→0, 8–<10→+1, <8→+1.5\nPlatelets (×10³/µL): ≥100→0, 50–<100→+0.5, <50→+1\nANC (×10³/µL): ≥0.8→0, <0.8→+0.5\n\n≤1.5: Very Low | >1.5–3: Low | >3–4.5: Intermediate | >4.5–6: High | >6: Very High',
  ipss:                   'Addition of the selected points:\n\nKaryotype: Good→0, Intermediate→+0.5, Poor→+1\nMarrow blasts %: <5→0, 5–10→+0.5, 11–20→+1.5, 21–30→+2\nNumber of cytopenias: 0–1→0, 2–3→+0.5\n\n0: Low | 0.5–1.0: INT-1 | 1.5–2.0: INT-2 | ≥2.5: High',
  'cll-ipi':              'Addition of the selected criteria:\n\nAge >65 years: +1\nBinet B-C or Rai I-IV: +1\nSerum β2-microglobulin >3.5 mg/L: +2\nIGHV unmutated: +2\nDeletion 17p and/or TP53 mutation: +4\n\n0–1: Low (~93% 5-yr OS)\n2–3: Intermediate (~79% 5-yr OS)\n4–6: High (~64% 5-yr OS)\n7–10: Very High (~23% 5-yr OS)',
  'wells-dvt':            'Addition of the selected points:\n\nActive cancer (treatment/palliation within 6 months): +1\nBedridden >3 days or major surgery within 12 weeks: +1\nCalf swelling >3 cm vs other leg: +1\nCollateral (nonvaricose) superficial veins: +1\nEntire leg swollen: +1\nLocalized tenderness along deep venous system: +1\nPitting edema, confined to symptomatic leg: +1\nParalysis, paresis, or recent plaster immobilization: +1\nPreviously documented DVT: +1\nAlternative diagnosis as likely or more likely: -2\n\n≤ 0: Low probability\n1–2: Moderate probability\n≥ 3: High probability',
  osmolality:     'Osmolality = 2 x Na + BUN/2.8 + Glucose/18',
  'osmolar-gap':  'Method 1: Stool Osmolal Gap = Stool Osm - (2 x (Na + K))\nMethod 2: Stool Osmolal Gap = 290 mOsm/kg - (2 x (Na + K))',
  'iron-deficit': 'Total iron deficit (mg) = Weight (kg) × (Target Hb − Actual Hb) g/dL × 2.4 + Iron stores (mg)\n\nNote: Iron stores = 500 mg for adults / patients ≥35 kg; 15 mg/kg for patients <35 kg\n\n≤ 0 mg:    No deficit\n1–500 mg:  Mild deficit\n501–1500:  Moderate deficit\n> 1500 mg: Severe deficit — IV iron therapy likely needed',
  nihss: 'Addition of the selected points across 15 neurological items:\n\n1A: LOC (0–3) | 1B: LOC Questions (0–2) | 1C: LOC Commands (0–2)\n2: Gaze (0–2) | 3: Visual fields (0–3) | 4: Facial palsy (0–3)\n5A: Left arm (0–4) | 5B: Right arm (0–4)\n6A: Left leg (0–4)  | 6B: Right leg (0–4)\n7: Limb ataxia (0–2) | 8: Sensation (0–2)\n9: Language/aphasia (0–3) | 10: Dysarthria (0–2) | 11: Extinction (0–2)\n\nMax score: 42\n\n0:     No stroke symptoms\n1–4:   Minor stroke\n5–15:  Moderate stroke\n16–20: Moderate to severe stroke\n21–42: Severe stroke',
  abcd2: 'ABCD² = Age(≥60) + BP(≥140/90) + Clinical + Duration + Diabetes\n\nAge ≥60 years: +1\nBP ≥140/90 mmHg: +1\nClinical features: Unilateral weakness +2 | Speech disturbance +1 | Other 0\nDuration: <10 min 0 | 10-59 min +1 | ≥60 min +2\nHistory of diabetes: +1\n\nMax score: 7\n\n0–3: Low risk (~1% 2-day stroke risk)\n4–5: Moderate risk (~4% 2-day stroke risk)\n6–7: High risk (~8% 2-day stroke risk)',
  news: 'NEWS = Respiratory rate + SpO₂ + Supplemental O₂ + Temperature + Systolic BP + Heart rate + Consciousness (AVPU)\n\nRespiratory rate: ≤8 +3 | 9-11 +1 | 12-20 0 | 21-24 +2 | ≥25 +3\nOxygen saturation: ≤91% +3 | 92-93% +2 | 94-95% +1 | ≥96% 0\nAny supplemental oxygen: Yes +2 | No 0\nTemperature: ≤35.0 +3 | 35.1-36.0 +1 | 36.1-38.0 0 | 38.1-39.0 +1 | ≥39.1 +2\nSystolic BP: ≤90 +3 | 91-100 +2 | 101-110 +1 | 111-219 0 | ≥220 +3\nHeart rate: ≤40 +3 | 41-50 +1 | 51-90 0 | 91-110 +1 | 111-130 +2 | ≥131 +3\nConsciousness: Alert 0 | Voice/Pain/Unresponsive +3\n\nMax score: 20\n\n0: Continue routine monitoring\n1–4: Low risk — registered nurse assessment\n5–6 OR any single parameter = 3 (RED): Medium risk — urgent clinician review\n≥7: High risk — emergency assessment / critical care',
  ich: 'ICH Score = GCS + Age(≥80) + ICH Volume(≥30mL) + IVH + Infratentorial\n\nGCS 13-15: 0 | 5-12: +1 | 3-4: +2\nAge ≥80: +1\nICH volume ≥30 mL: +1\nIntraventricular hemorrhage: +1\nInfratentorial origin: +1\n\nMax score: 6\n\nScore | 30-day Mortality\n0     | 0%\n1     | 13%\n2     | 26%\n3     | 72%\n4     | 97%\n5–6   | 100%',
  mrs: 'Assignation of points based on severity of disability:\n\n0: No symptoms at all\n1: No significant disability despite symptoms\n2: Slight disability\n3: Moderate disability (some help, walks unaided)\n4: Moderately severe disability (cannot walk/self-care unaided)\n5: Severe disability (bedridden, incontinent)\n6: Dead',
  'hunt-hess': 'Selection of group of symptoms, assigned point value:\n\nGrade 1: Mild headache, alert, minimal nuchal rigidity (~70% survival)\nGrade 2: Full nuchal rigidity, moderate-severe headache, no neuro deficit (~60% survival)\nGrade 3: Lethargy/confusion, mild focal deficit (~50% survival)\nGrade 4: Stuporous, more severe focal deficit (~20% survival)\nGrade 5: Comatose, severe neurological impairment (~10% survival)',
  aspects: 'ASPECTS = 10 − (1 point for each region with early ischemic change)\n\nSubcortical Structures (3 pts): C (Caudate), IC (Internal Capsule), L (Lentiform nucleus)\nMCA Cortex (7 pts): I (Insular ribbon), M1 (Anterior MCA cortex), M2 (Lateral to insular ribbon),\nM3 (Posterior MCA cortex), M4 (Rostral to M1), M5 (Rostral to M3), M6 (Posterior rostral to M3)\n\n10:  Normal CT scan\n8–9: Minimal ischemic change\n≤7:  Highly correlates with negative functional outcome (mRS)\n0:   Diffuse involvement throughout MCA territory',
  apache2: 'APACHE II = APS + Age Points + Chronic Health Points\n\nAPS (Acute Physiology Score, 0–60): sum of 12 physiological variables\n  Temperature | MAP | Heart rate | Respiratory rate | Oxygenation\n  Arterial pH | Sodium | Potassium | Creatinine (×2 if ARF)\n  Hematocrit | WBC | (15 − GCS)\n\nAge Points: <44→0, 45-54→+2, 55-64→+3, 65-74→+5, ≥75→+6\nChronic Health: +5 if severe organ failure/immunocompromise\n\nMax score: 71\n\nScore  | Predicted Hospital Mortality\n0–4    | ~4%\n5–9    | ~8%\n10–14  | ~15%\n15–19  | ~25%\n20–24  | ~40%\n25–29  | ~55%\n30–34  | ~75%\n≥35    | ~85%',
  'stop-bang': 'STOP-BANG = S + T + O + P + B + A + N + G (each = 1 point)\n\nS — Snoring loudly (louder than talking or heard through closed doors)\nT — Tired / fatigued / sleepy during daytime\nO — Observed to stop breathing during sleep\nP — Pressure — high blood pressure (or being treated for it)\nB — BMI >35 kg/m²\nA — Age >50 years\nN — Neck circumference >40 cm\nG — Gender male\n\nMax score: 8\n\n0–2: Low risk for moderate-to-severe OSA\n3–4: Moderate risk for moderate-to-severe OSA\n5–8: High risk for moderate-to-severe OSA',
  mmrc: 'mMRC Grade = selection of appropriate grade (0–4)\n\nGrade 0: Dyspnea only with strenuous exercise\nGrade 1: Dyspnea when hurrying or walking up a slight hill\nGrade 2: Walks slower than people of the same age because of dyspnea, or has to stop for breath when walking at own pace on level ground\nGrade 3: Stops for breath after walking 100 yards (91 m) or after a few minutes on level ground\nGrade 4: Too dyspneic to leave house or breathless when dressing\n\nNote: Walking should be assessed on level ground',
  perc: 'PERC Rule — if ANY criterion is present, PE cannot be ruled out:\n\n1. Age ≥50\n2. HR ≥100 bpm\n3. O₂ sat <95% on room air\n4. Unilateral leg swelling\n5. Hemoptysis\n6. Recent surgery or trauma (≤4 weeks, requiring general anesthesia)\n7. Prior PE or DVT\n8. Hormone use (oral contraceptives, HRT, or estrogenic hormones)\n\nScore 0 (PERC Negative): PE can be ruled out without further testing in LOW pre-test probability patients\nScore ≥1 (PERC Positive): PE cannot be ruled out — proceed with further workup (D-dimer or imaging)\n\nNote: PERC is only valid when pre-test probability is low (<15%)',
  'gold-copd': 'GOLD Grade (1–4) — from post-bronchodilator FEV₁ % predicted (requires FEV₁/FVC <0.7):\n  GOLD 1: ≥80% (Mild)\n  GOLD 2: 50–79% (Moderate)\n  GOLD 3: 30–49% (Severe)\n  GOLD 4: <30% (Very Severe)\n\nGOLD Group (A/B/E) — from exacerbation history + symptom burden:\n  Group E: ≥2 moderate exacerbations OR ≥1 leading to hospitalization\n  Group A: 0 or 1 moderate exacerbation (not leading to admission) AND mMRC <2 / CAT <10\n  Group B: 0 or 1 moderate exacerbation (not leading to admission) AND mMRC ≥2 / CAT ≥10\n\nNote: GOLD 1–4 = grade of airflow obstruction; GOLD A/B/E = groups for treatment decisions\nSource: Global Initiative for Chronic Obstructive Lung Disease (GOLD) 2024 Report',
  bode: 'BODE = FEV₁ score + 6MWD score + mMRC score + BMI score\n\nFEV₁ (% predicted): ≥65→0, 50-64→+1, 36-49→+2, ≤35→+3\n6 Minute Walk Distance: ≥350m→0, 250-349m→+1, 150-249m→+2, ≤149m→+3\nmMRC Dyspnea Scale: 0-1→0, 2→+1, 3→+2, 4→+3\nBMI (kg/m²): >21→0, ≤21→+1\n\nMax score: 10\n\nQuartile 1 (0–2):  ~80% 4-year survival\nQuartile 2 (3–4):  ~67% 4-year survival\nQuartile 3 (5–6):  ~57% 4-year survival\nQuartile 4 (7–10): ~18% 4-year survival',
  curb65: 'CURB-65 = C + U + R + B + 65 (each criterion = 1 point)\n\nC — Confusion (new-onset disorientation to person, place, or time)\nU — Urea >7 mmol/L (BUN >19 mg/dL)\nR — Respiratory rate ≥30 breaths/min\nB — Blood pressure: SBP <90 mmHg or DBP ≤60 mmHg\n65 — Age ≥65 years\n\nMax score: 5\n\nScore | 30-day Mortality | Recommendation\n0–1   | ~1–3%           | Low risk — outpatient treatment\n2     | ~6.8%           | Moderate risk — consider short hospitalization\n3     | ~14%            | High risk — hospitalize\n4–5   | ~27.8%          | Very high risk — hospitalize, consider ICU',
  moca: 'Addition of assigned points across all domains:\n\nVisuospatial/Executive (5 pts): Trail making (1), Cube copy (1), Clock drawing (0–3)\nNaming (3 pts): Lion (1), Rhinoceros (1), Camel (1)\nAttention (6 pts): Digit span forward (1), Digit span backward (1), Vigilance (1), Serial 7s (0–3)\nLanguage (3 pts): Sentence repetition ×2 (1 each), Letter fluency ≥11 words (1)\nAbstraction (2 pts): Two similarity items (1 each)\nDelayed Recall (5 pts): Recall of 5 words (0–5)\nOrientation (6 pts): Date, month, year, day, place, city (0–6)\nEducation correction: +1 if ≤12 years of formal education (max total = 30)\n\n≥ 26:    Normal cognition\n18–25:  Mild cognitive impairment\n10–17:  Moderate cognitive impairment\n< 10:   Severe cognitive impairment',
  edss: 'EDSS: Points assigned based on level of disability.\nFSS: Addition of selected points within each body system.\n\nAmbulation score (4.0–10.0) takes precedence when ambulatory function is impaired.\nWhen fully ambulatory, EDSS is derived from FSS subscores (0–3.5):\n\n0:   Normal\n1.0: One FS grade 1\n1.5: >1 FS grade 1\n2.0: One FS grade 2\n2.5: Two FS grade 2\n3.0: One FS grade 3\n3.5: ≥2 FS grade 3, or more complex impairment\n\nFunctional Systems (FSS): Pyramidal (0-6), Cerebellar (0-5), Brainstem (0-5),\nSensory (0-6), Bowel/Bladder (0-6), Visual (0-6), Cerebral (0-5), Other (0-1)',
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
  const [resetKey] = useState(0);

  const FormComponent = FORM_MAP[id];

  // Hooks must run on every render in the same order, so this useCallback has
  // to be declared before any early return below.
  const handleResult = useCallback((res: any) => {
    setResult(res);
    addToRecent(id);
    if (res) {
      const primaryOutput = res.outputs?.[0];
      addHistoryEntry({
        calculatorId: id,
        calculatorName: calculator?.title ?? '',
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
