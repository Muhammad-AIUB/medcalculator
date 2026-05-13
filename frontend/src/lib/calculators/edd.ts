import type { CalculationResult } from '@/types/calculator'
import { format, addDays, addWeeks, differenceInDays, differenceInWeeks, parseISO } from 'date-fns'

interface EDDInput {
  method: 'lmp' | 'ultrasound'
  lmpDate?: string
  cycleLength?: number
  scanDate?: string
  gestationalWeeks?: number
  gestationalDays?: number
}

interface Milestone {
  label: string
  date: string
  weeksGA: number
  daysFromNow: number
}

function getTrimester(gaWeeks: number): string {
  if (gaWeeks < 14) return '1st Trimester'
  if (gaWeeks < 28) return '2nd Trimester'
  return '3rd Trimester'
}

function getMilestones(edd: Date, today: Date): Milestone[] {
  const lmpEstimate = addDays(edd, -280)
  const milestones: Array<{ label: string; weeksGA: number }> = [
    { label: 'Nuchal Translucency (11–13+6)', weeksGA: 12 },
    { label: 'First Trimester Screen', weeksGA: 13 },
    { label: 'Anatomy Scan', weeksGA: 20 },
    { label: 'Glucose Challenge Test', weeksGA: 24 },
    { label: 'Viability (24 weeks)', weeksGA: 24 },
    { label: 'Antenatal Steroids if needed (24–34)', weeksGA: 28 },
    { label: 'Term (37 weeks)', weeksGA: 37 },
    { label: 'Due Date (40 weeks)', weeksGA: 40 },
    { label: 'Post-term induction (42 weeks)', weeksGA: 42 },
  ]

  return milestones.map((m) => {
    const date = addDays(lmpEstimate, m.weeksGA * 7)
    return {
      label: m.label,
      date: format(date, 'MMM dd, yyyy'),
      weeksGA: m.weeksGA,
      daysFromNow: differenceInDays(date, today),
    }
  })
}

export function calculateEDD(input: EDDInput): CalculationResult {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let edd: Date
  let gaWeeksToday: number
  let gaDaysToday: number

  if (input.method === 'lmp' && input.lmpDate) {
    const lmp = parseISO(input.lmpDate)
    const cycleDiff = (input.cycleLength ?? 28) - 28
    // Naegele's rule: LMP + 280 days + cycle correction
    edd = addDays(lmp, 280 + cycleDiff)

    const totalDaysPregnant = differenceInDays(today, lmp)
    gaWeeksToday = Math.floor(totalDaysPregnant / 7)
    gaDaysToday = totalDaysPregnant % 7
  } else if (input.method === 'ultrasound' && input.scanDate && input.gestationalWeeks !== undefined) {
    const scanDate = parseISO(input.scanDate)
    const gaAtScanDays = (input.gestationalWeeks * 7) + (input.gestationalDays ?? 0)
    const daysFromScanToToday = differenceInDays(today, scanDate)
    const gaTodayDays = gaAtScanDays + daysFromScanToToday

    gaWeeksToday = Math.floor(gaTodayDays / 7)
    gaDaysToday = gaTodayDays % 7
    edd = addDays(scanDate, (40 * 7) - gaAtScanDays)
  } else {
    return {
      calculatorId: 'edd',
      severity: 'neutral',
      label: 'Incomplete',
      interpretation: 'Please fill in all required fields',
      timestamp: new Date().toISOString(),
    }
  }

  const daysToEDD = differenceInDays(edd, today)
  const trimester = getTrimester(gaWeeksToday)
  const eddFormatted = format(edd, 'MMMM dd, yyyy')
  const milestones = getMilestones(edd, today)

  let severity: 'success' | 'warning' | 'danger'
  if (daysToEDD > 0) severity = gaWeeksToday >= 37 ? 'warning' : 'success'
  else severity = 'danger'

  return {
    calculatorId: 'edd',
    value: eddFormatted,
    severity,
    label: `EDD: ${eddFormatted}`,
    interpretation: `Gestational age today: ${gaWeeksToday}w ${gaDaysToday}d — ${trimester}`,
    details: [
      { label: 'EDD', value: eddFormatted },
      { label: 'Gestational Age', value: `${gaWeeksToday}w ${gaDaysToday}d` },
      { label: 'Trimester', value: trimester },
      { label: daysToEDD >= 0 ? 'Days Until EDD' : 'Days Past EDD', value: Math.abs(daysToEDD), unit: 'days' },
      { label: 'Method', value: input.method === 'lmp' ? 'Last Menstrual Period' : 'Ultrasound Dating' },
    ],
    subResults: milestones.slice(0, 5).map((m) => ({
      label: m.label,
      value: `${m.date} (GA ${m.weeksGA}w)`,
      severity: m.daysFromNow < 0 ? 'neutral' : m.daysFromNow < 14 ? 'warning' : 'info',
    })),
    formula: input.method === 'lmp'
      ? "Naegele's Rule: EDD = LMP + 280 days (adjusted for cycle length)"
      : 'Ultrasound Dating: EDD = Scan date + (280 − GA at scan) days',
    references: ["Naegele FC. Erfahrungen und Untersuchungen. 1812", 'ACOG Practice Bulletin 700. 2022'],
    timestamp: new Date().toISOString(),
  }
}
