'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateEDSS } from '@/lib/calculators/edss';

interface Props { onResult: (result: any) => void; }
interface Option { label: string; score: number; }

// ── Ambulation options ────────────────────────────────────────────────────────
const AMBULATION: Option[] = [
  { label: 'Fully ambulatory',                                                                                                                               score: 0   },
  { label: 'Fully ambulatory, self-sufficient, up 12 hours a day despite relatively severe disability. Able to walk ≥500 meters without aid/rest.',           score: 4   },
  { label: 'Fully ambulatory, able to work a full day, may require minimal assistance. Able to walk ≥300 meters without aid/rest.',                           score: 4.5 },
  { label: 'Ambulatory for 200 meters without aid/rest; disability that impairs full daily activities (eg, to work full day without special provisions).',    score: 5   },
  { label: 'Ambulatory for 100 meters without aid/rest; disability precludes full daily activities.',                                                          score: 5.5 },
  { label: 'Intermittent or unilateral constant assistance required to walk 100 meters, with/without resting.',                                               score: 6   },
  { label: 'Constant bilateral assistance (canes, crutches, or braces) required to walk 20 meters without resting.',                                          score: 6.5 },
  { label: 'Unable to walk >5 meters even with aid; (restricted to wheelchair); wheels self in standard wheelchair and transfers alone.',                     score: 7   },
  { label: 'Unable to take more than steps; restricted to wheelchair; may need aid in transfer; wheels self but cannot use standard wheelchair a full day; may require motorized wheelchair.', score: 7.5 },
  { label: 'Restricted to bed/chair or perambulated in wheelchair, but may be out of bed itself much of the day; retains many self-care functions; generally has effective use of arms.', score: 8   },
  { label: 'Restricted to bed much of the day; has some effective use of arms; retains some self-care functions.',                                            score: 8.5 },
  { label: 'Helpless bed patient; can communicate and eat.',                                                                                                  score: 9   },
  { label: 'Totally helpless bed patient; unable to communicate effectively or eat/swallow.',                                                                 score: 9.5 },
  { label: 'Death due to MS.',                                                                                                                                score: 10  },
];

// ── Functional Systems fields ─────────────────────────────────────────────────
interface FSSField { id: string; label: string; options: Option[]; }

const FSS_FIELDS: FSSField[] = [
  {
    id: 'pyramidal', label: 'Pyramidal',
    options: [
      { label: 'Normal',                                                                                   score: 0 },
      { label: 'Abnormal signs without disability',                                                        score: 1 },
      { label: 'Minimal disability',                                                                       score: 2 },
      { label: 'Mild or moderate paraparesis or hemiparesis; severe monoparesis',                         score: 3 },
      { label: 'Marked paraparesis or hemiparesis; moderate quadriparesis; or monoplegia',                score: 4 },
      { label: 'Paraplegia, hemiplegia, or marked quadriparesis',                                         score: 5 },
      { label: 'Quadriplegia',                                                                             score: 6 },
    ],
  },
  {
    id: 'cerebellar', label: 'Cerebellar',
    options: [
      { label: 'Normal',                                                     score: 0 },
      { label: 'Abnormal signs without disability',                          score: 1 },
      { label: 'Mild ataxia',                                                score: 2 },
      { label: 'Moderate truncal or limb ataxia',                           score: 3 },
      { label: 'Severe ataxia, all limbs',                                   score: 4 },
      { label: 'Unable to perform coordinated movements due to ataxia',     score: 5 },
    ],
  },
  {
    id: 'brainstem', label: 'Brainstem',
    options: [
      { label: 'Normal',                                                                                        score: 0 },
      { label: 'Signs only',                                                                                    score: 1 },
      { label: 'Moderate nystagmus or other mild disability',                                                   score: 2 },
      { label: 'Severe nystagmus, marked extraocular weakness, or moderate disability of other cranial nerves', score: 3 },
      { label: 'Marked dysarthria or other marked disability',                                                  score: 4 },
      { label: 'Inability to swallow or speak',                                                                 score: 5 },
    ],
  },
  {
    id: 'sensory', label: 'Sensory',
    options: [
      { label: 'Normal',                                                                                                                                                           score: 0 },
      { label: 'Vibration or figure-writing decrease only, in 1-2 limbs',                                                                                                         score: 1 },
      { label: 'Mild decrease in touch, pain or position sense, and/or moderate decrease in vibration in 1-2 limbs; or vibratory decrease alone in 3-4 limbs',                   score: 2 },
      { label: 'Moderate decrease in touch, pain or position sense, and/or lost vibration in 1-2 limbs; or mild decrease in touch, pain and/or moderate decrease in all proprioceptive tests in 3-4 limbs', score: 3 },
      { label: 'Marked decrease in touch or pain or loss of proprioception, alone or combined, in 1-2 limbs; or moderate decrease in touch, pain and/or severe proprioceptive decrease in >2 limbs', score: 4 },
      { label: 'Loss of sensation in 1-2 limbs; or moderate decrease in touch, pain and/or loss of proprioception for most of the body below the head',                          score: 5 },
      { label: 'Sensation essentially lost below the head',                                                                                                                        score: 6 },
    ],
  },
  {
    id: 'bowelBladder', label: 'Bowel and bladder',
    options: [
      { label: 'Normal',                                                                                     score: 0 },
      { label: 'Mild urinary hesitancy, urgency, or retention',                                              score: 1 },
      { label: 'Moderate hesitancy, urgency, retention of bowel or bladder, or rare urinary incontinence',  score: 2 },
      { label: 'Frequent urinary incontinence',                                                              score: 3 },
      { label: 'In need of almost constant catheterization',                                                 score: 4 },
      { label: 'Loss of bladder function',                                                                   score: 5 },
      { label: 'Loss of bowel and bladder function',                                                         score: 6 },
    ],
  },
  {
    id: 'visual', label: 'Visual',
    options: [
      { label: 'Normal',                                                                                                                                          score: 0 },
      { label: 'Scotoma with visual acuity (corrected) better than 20/30',                                                                                       score: 1 },
      { label: 'Worse eye with scotoma with maximal visual acuity (corrected) of 20/30 to 20/59',                                                               score: 2 },
      { label: 'Worse eye with large scotoma, or moderate decrease in fields, but with maximal visual acuity (corrected) of 20/60 to 20/99',                    score: 3 },
      { label: 'Worse eye with marked decrease of fields and maximal visual acuity (corrected) of 20/100-20/200; grade 3 plus maximal acuity of better eye of ≤20/60', score: 4 },
      { label: 'Worse eye with maximal visual acuity (corrected) less than 20/200; grade 4 plus maximal acuity of better eye of 20/60 or less',                 score: 5 },
      { label: 'Grade 5 plus maximal visual acuity of better eye of 20/60 or less',                                                                             score: 6 },
    ],
  },
  {
    id: 'cerebral', label: 'Cerebral',
    options: [
      { label: 'Normal',                                                                       score: 0 },
      { label: 'Mood alteration only (Does not affect DSS score)',                             score: 1 },
      { label: 'Mild decrease in mentation',                                                  score: 2 },
      { label: 'Moderate decrease in mentation',                                              score: 3 },
      { label: 'Marked decrease in mentation (chronic brain syndrome -- moderate)',           score: 4 },
      { label: 'Dementia or chronic brain syndrome -- severe or incompetent',                 score: 5 },
    ],
  },
  {
    id: 'other', label: 'Other',
    options: [
      { label: 'Normal',                                             score: 0 },
      { label: 'Any other neurologic findings attributed to MS',    score: 1 },
    ],
  },
];

type FSSIdx = Record<string, number>;
const initFss = (): FSSIdx => Object.fromEntries(FSS_FIELDS.map(f => [f.id, 0]));

export function EdssForm({ onResult }: Props) {
  const [ambulationIdx, setAmbulationIdx] = useState(0);
  const [fssIdx,        setFssIdx]        = useState<FSSIdx>(initFss);

  const fss = useMemo(() => ({
    pyramidal:    FSS_FIELDS[0].options[fssIdx.pyramidal].score,
    cerebellar:   FSS_FIELDS[1].options[fssIdx.cerebellar].score,
    brainstem:    FSS_FIELDS[2].options[fssIdx.brainstem].score,
    sensory:      FSS_FIELDS[3].options[fssIdx.sensory].score,
    bowelBladder: FSS_FIELDS[4].options[fssIdx.bowelBladder].score,
    visual:       FSS_FIELDS[5].options[fssIdx.visual].score,
    cerebral:     FSS_FIELDS[6].options[fssIdx.cerebral].score,
    other:        FSS_FIELDS[7].options[fssIdx.other].score,
  }), [fssIdx]);

  const liveResult = useMemo(
    () => calculateEDSS({ ambulation: AMBULATION[ambulationIdx].score, fss }),
    [ambulationIdx, fss],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'edss',
        label: 'EDSS Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { ambulation: AMBULATION[ambulationIdx].score, ...fss },
      formulaUsed:
        AMBULATION[ambulationIdx].score > 0
          ? `EDSS = Ambulation score (${liveResult.score}) — determined by ambulatory ability`
          : `EDSS derived from Functional Systems Scale (FSS total = ${liveResult.fssTotal})`,
      references: liveResult.references,
    });
  }, [liveResult, ambulationIdx, fss]);

  const setFss = (id: string, idx: number) =>
    setFssIdx(prev => ({ ...prev, [id]: idx }));

  // Stacked button section renderer
  const renderStacked = (
    options: Option[],
    selectedIdx: number,
    onSelect: (i: number) => void,
  ) => (
    <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
         style={{ borderColor: '#0E7490' }}>
      {options.map((opt, i) => {
        const active = selectedIdx === i;
        return (
          <button key={i} type="button" onClick={() => onSelect(i)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
            style={active ? { background: '#0E7490', color: '#ffffff' } : { background: '#ffffff', color: '#1e293b' }}>
            <span className="flex-1 mr-2">{opt.label}</span>
            <span className="shrink-0 font-bold text-xs"
              style={{ color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
              {opt.score === 0 ? '0' : `+${opt.score}`}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Ambulation */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100">
        <div className="space-y-1 pr-1">
          <p className="text-sm font-semibold text-[#0E7490]">Ambulation</p>
        </div>
        {renderStacked(AMBULATION, ambulationIdx, setAmbulationIdx)}
      </div>

      {/* FSS header */}
      <div className="py-3 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Functional Systems</p>
      </div>

      {/* FSS fields */}
      {FSS_FIELDS.map((field) => (
        <div key={field.id}
          className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100 last:border-0">
          <div className="space-y-1 pr-1">
            <p className="text-sm font-semibold text-[#0E7490]">{field.label}</p>
          </div>
          {renderStacked(field.options, fssIdx[field.id], i => setFss(field.id, i))}
        </div>
      ))}
    </div>
  );
}
