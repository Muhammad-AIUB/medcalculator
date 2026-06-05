'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateNIHSS } from '@/lib/calculators/nihss';

interface Props { onResult: (result: any) => void; }
interface Option  { label: string; score: number; }
interface FieldDef { id: string; label: string; hint?: string; options: Option[]; }

const FIELDS: FieldDef[] = [
  {
    id: 'loc', label: '1A: Level of consciousness',
    hint: 'May be assessed casually while taking history',
    options: [
      { label: 'Alert; keenly responsive',              score: 0 },
      { label: 'Arouses to minor stimulation',          score: 1 },
      { label: 'Requires repeated stimulation to arouse', score: 2 },
      { label: 'Movements to pain',                     score: 2 },
      { label: 'Postures or unresponsive',              score: 3 },
    ],
  },
  {
    id: 'locQ', label: '1B: Ask month and age',
    options: [
      { label: 'Both questions right',                           score: 0 },
      { label: '1 question right',                               score: 1 },
      { label: '0 questions right',                              score: 2 },
      { label: 'Dysarthric/intubated/trauma/language barrier',   score: 1 },
      { label: 'Aphasic',                                        score: 2 },
    ],
  },
  {
    id: 'locC', label: "1C: 'Blink eyes' & 'squeeze hands'",
    hint: 'Pantomime commands if communication barrier',
    options: [
      { label: 'Performs both tasks', score: 0 },
      { label: 'Performs 1 task',     score: 1 },
      { label: 'Performs 0 tasks',    score: 2 },
    ],
  },
  {
    id: 'gaze', label: '2: Horizontal extraocular movements',
    hint: 'Only assess horizontal gaze',
    options: [
      { label: 'Normal',                                                  score: 0 },
      { label: 'Partial gaze palsy: can be overcome',                     score: 1 },
      { label: 'Partial gaze palsy: corrects with oculocephalic reflex',  score: 1 },
      { label: 'Forced gaze palsy: cannot be overcome',                   score: 2 },
    ],
  },
  {
    id: 'visual', label: '3: Visual fields',
    options: [
      { label: 'No visual loss',               score: 0 },
      { label: 'Partial hemianopia',            score: 1 },
      { label: 'Complete hemianopia',           score: 2 },
      { label: 'Patient is bilaterally blind',  score: 3 },
      { label: 'Bilateral hemianopia',          score: 3 },
    ],
  },
  {
    id: 'facial', label: '4: Facial palsy',
    hint: 'Use grimace if obtunded',
    options: [
      { label: 'Normal symmetry',                                              score: 0 },
      { label: 'Minor paralysis (flat nasolabial fold, smile asymmetry)',      score: 1 },
      { label: 'Partial paralysis (lower face)',                               score: 2 },
      { label: 'Unilateral complete paralysis (upper/lower face)',             score: 3 },
      { label: 'Bilateral complete paralysis (upper/lower face)',              score: 3 },
    ],
  },
  {
    id: 'leftArm', label: '5A: Left arm motor drift',
    hint: 'Count out loud and use your fingers to show the patient your count',
    options: [
      { label: 'No drift for 10 seconds',       score: 0 },
      { label: "Drift, but doesn't hit bed",    score: 1 },
      { label: 'Drift, hits bed',               score: 2 },
      { label: 'Some effort against gravity',   score: 2 },
      { label: 'No effort against gravity',     score: 3 },
      { label: 'No movement',                   score: 4 },
      { label: 'Amputation/joint fusion',       score: 0 },
    ],
  },
  {
    id: 'rightArm', label: '5B: Right arm motor drift',
    hint: 'Count out loud and use your fingers to show the patient your count',
    options: [
      { label: 'No drift for 10 seconds',       score: 0 },
      { label: "Drift, but doesn't hit bed",    score: 1 },
      { label: 'Drift, hits bed',               score: 2 },
      { label: 'Some effort against gravity',   score: 2 },
      { label: 'No effort against gravity',     score: 3 },
      { label: 'No movement',                   score: 4 },
      { label: 'Amputation/joint fusion',       score: 0 },
    ],
  },
  {
    id: 'leftLeg', label: '6A: Left leg motor drift',
    hint: 'Count out loud and use your fingers to show the patient your count',
    options: [
      { label: 'No drift for 5 seconds',        score: 0 },
      { label: "Drift, but doesn't hit bed",    score: 1 },
      { label: 'Drift, hits bed',               score: 2 },
      { label: 'Some effort against gravity',   score: 2 },
      { label: 'No effort against gravity',     score: 3 },
      { label: 'No movement',                   score: 4 },
      { label: 'Amputation/joint fusion',       score: 0 },
    ],
  },
  {
    id: 'rightLeg', label: '6B: Right leg motor drift',
    hint: 'Count out loud and use your fingers to show the patient your count',
    options: [
      { label: 'No drift for 5 seconds',        score: 0 },
      { label: "Drift, but doesn't hit bed",    score: 1 },
      { label: 'Drift, hits bed',               score: 2 },
      { label: 'Some effort against gravity',   score: 2 },
      { label: 'No effort against gravity',     score: 3 },
      { label: 'No movement',                   score: 4 },
      { label: 'Amputation/joint fusion',       score: 0 },
    ],
  },
  {
    id: 'ataxia', label: '7: Limb Ataxia',
    hint: 'FNF/heel-shin',
    options: [
      { label: 'No ataxia',               score: 0 },
      { label: 'Ataxia in 1 Limb',        score: 1 },
      { label: 'Ataxia in 2 Limbs',       score: 2 },
      { label: 'Does not understand',     score: 0 },
      { label: 'Paralyzed',               score: 0 },
      { label: 'Amputation/joint fusion', score: 0 },
    ],
  },
  {
    id: 'sensation', label: '8: Sensation',
    options: [
      { label: 'Normal; no sensory loss',                            score: 0 },
      { label: 'Mild-moderate loss: less sharp/more dull',           score: 1 },
      { label: 'Mild-moderate loss: can sense being touched',        score: 1 },
      { label: 'Complete loss: cannot sense being touched at all',   score: 2 },
      { label: 'No response and quadriplegic',                       score: 2 },
      { label: 'Coma/unresponsive',                                  score: 2 },
    ],
  },
  {
    id: 'language', label: '9: Language/aphasia',
    hint: 'Describe the scene; name the items; read the sentences',
    options: [
      { label: 'Normal; no aphasia',                                                                  score: 0 },
      { label: 'Mild-moderate aphasia: some obvious changes, without significant limitation',         score: 1 },
      { label: 'Severe aphasia: fragmentary expression, inference needed, cannot identify materials', score: 2 },
      { label: 'Mute/global aphasia: no usable speech/auditory comprehension',                       score: 3 },
      { label: 'Coma/unresponsive',                                                                   score: 3 },
    ],
  },
  {
    id: 'dysarthria', label: '10: Dysarthria',
    hint: 'Read the words',
    options: [
      { label: 'Normal',                                                                   score: 0 },
      { label: 'Mild-moderate dysarthria: slurring but can be understood',                score: 1 },
      { label: 'Severe dysarthria: unintelligible slurring or out of proportion to dysphasia', score: 2 },
      { label: 'Mute/anarthric',                                                          score: 2 },
      { label: 'Intubated/unable to test',                                                score: 0 },
    ],
  },
  {
    id: 'extinction', label: '11: Extinction/inattention',
    options: [
      { label: 'No abnormality',                                                    score: 0 },
      { label: 'Visual/tactile/auditory/spatial/personal inattention',              score: 1 },
      { label: 'Extinction to bilateral simultaneous stimulation',                  score: 1 },
      { label: 'Profound hemi-inattention (ex: does not recognize own hand)',       score: 2 },
      { label: 'Extinction to >1 modality',                                         score: 2 },
    ],
  },
];

type Sel = Record<string, number>;
const initSel = (): Sel => Object.fromEntries(FIELDS.map(f => [f.id, 0]));

export function NihssForm({ onResult }: Props) {
  const [sel, setSel] = useState<Sel>(initSel);

  const totalScore = useMemo(
    () => FIELDS.reduce((sum, f) => sum + f.options[sel[f.id]].score, 0),
    [sel],
  );

  const liveResult = useMemo(() => calculateNIHSS(totalScore), [totalScore]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'nihss',
        label: 'NIHSS Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: sel,
      formulaUsed: 'Addition of the selected points across all 15 NIHSS items (1A, 1B, 1C, 2–11).\n\nMax score: 42',
      references: liveResult.references,
    });
  }, [liveResult, sel]);

  const set = (id: string, idx: number) =>
    setSel(prev => ({ ...prev, [id]: idx }));

  return (
    <div className="divide-y divide-gray-100">
      {FIELDS.map(field => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr] gap-4 py-4">
          {/* Label */}
          <div className="space-y-1 pr-1">
            <p className="text-sm font-semibold text-[#0E7490]">{field.label}</p>
            {field.hint && (
              <p className="text-xs text-gray-500 leading-snug">{field.hint}</p>
            )}
          </div>

          {/* Stacked options */}
          <div
            className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
            style={{ borderColor: '#0E7490' }}
          >
            {field.options.map((opt, i) => {
              const active = sel[field.id] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => set(field.id, i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
                  style={
                    active
                      ? { background: '#0E7490', color: '#ffffff' }
                      : { background: '#ffffff', color: '#1e293b' }
                  }
                >
                  <span className="flex-1 mr-2">{opt.label}</span>
                  <span
                    className="shrink-0 font-bold text-xs"
                    style={{ color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}
                  >
                    {opt.score === 0 ? '0' : `+${opt.score}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
