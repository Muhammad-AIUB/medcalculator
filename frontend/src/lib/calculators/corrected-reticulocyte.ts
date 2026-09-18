// Corrected Reticulocyte Percentage, Absolute Reticulocyte Count & RPI

interface CorrectedReticulocyteInput {
  reticulocytePct: number;  // %
  rbcCount:        number;  // × 10⁶ cells/µL  (= × 10¹² cells/L — numerically identical)
  measuredHct:     number;  // %
  normalHct:       number;  // %
}

function maturationFactor(measuredHct: number): number {
  if (measuredHct >= 35) return 1.0;
  if (measuredHct >= 25) return 1.5;
  if (measuredHct >= 20) return 2.0;
  return 2.5;
}

export function calculateCorrectedReticulocyte(input: CorrectedReticulocyteInput): {
  correctedRetic: number;   // %
  arc:            number;   // cells/µL
  rpi:            number;
  matFactor:      number;
  interpretation: string;
  severity:       'success' | 'warning' | 'danger';
  references:     string[];
} {
  const { reticulocytePct, rbcCount, measuredHct, normalHct } = input;

  // Absolute reticulocyte count (cells/µL) = (retic% / 100) × RBC (cells/µL)
  // RBC input is in × 10⁶ cells/µL, so actual = rbcCount × 10⁶
  const arc = Math.round((reticulocytePct / 100) * rbcCount * 1e6);

  // Corrected reticulocyte %. Keep the raw value for the RPI below: MDCalc divides the
  // UNROUNDED corrected value by the maturation factor, so rounding here first shifts the
  // RPI (retic 10, Hct 30, normal 45: 6.67/1.5 = 4.45 -> 4.5, but MDCalc shows 4.4).
  const correctedRaw   = reticulocytePct * (measuredHct / normalHct);
  const correctedRetic = Math.round(correctedRaw * 100) / 100;

  // Maturation factor & RPI
  const matFactor = maturationFactor(measuredHct);
  const rpi       = correctedRaw / matFactor;              // raw; the panel rounds once
  const shownRpi  = Math.round(rpi * 10) / 10;             // 1 dp, as MDCalc shows the RPI

  let interpretation: string;
  let severity: 'success' | 'warning' | 'danger';

  if (rpi >= 3) {
    severity       = 'warning';
    interpretation = `RPI ${shownRpi} ≥ 3 — hyperproliferative; adequate marrow response (suggests hemolysis or acute blood loss)`;
  } else if (rpi >= 2) {
    severity       = 'warning';
    interpretation = `RPI ${shownRpi} (2–3) — borderline marrow response`;
  } else {
    severity       = 'danger';
    interpretation = `RPI ${shownRpi} < 2 — hypoproliferative; inadequate bone marrow response`;
  }

  return {
    correctedRetic,
    arc,
    rpi,
    matFactor,
    interpretation,
    severity,
    references: [
      'Hillman RS, Finch CA. Red Cell Manual. 7th ed. Philadelphia: FA Davis; 1996',
      'Buttarello M, Plebani M. Automated blood cell counts: state of the art. Am J Clin Pathol. 2008;130(1):104-116',
    ],
  };
}
