'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateMoCA } from '@/lib/calculators/moca';

interface Props { onResult: (result: any) => void; }

interface Option  { label: string; score: number; }
interface FieldDef { id: string; label: string; noScore?: boolean; options: Option[]; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

// ── Field definitions ────────────────────────────────────────────────────────

const FIELDS_VISUO: FieldDef[] = [
  {
    id: 'trail',
    label: 'Ask patient to trace the diagram in order',
    options: [
      { label: 'Completed correctly',       score: 1 },
      { label: 'Did not complete correctly', score: 0 },
    ],
  },
  {
    id: 'cube',
    label: 'Ask patient to copy cube',
    options: [
      { label: 'Completed correctly',       score: 1 },
      { label: 'Did not complete correctly', score: 0 },
    ],
  },
  {
    id: 'clock',
    label: 'Ask patient to draw a clock (ten past eleven)',
    options: [
      { label: 'Correctly drew all features (i.e., contour, numbers, and hands)', score: 3 },
      { label: 'Correctly drew two out of three features (i.e., two out of contour, numbers, and hands)', score: 2 },
      { label: 'Correctly drew contour only',  score: 1 },
      { label: 'Correctly drew numbers only',  score: 1 },
      { label: 'Correctly drew hands only',    score: 1 },
      { label: 'None of the above',            score: 0 },
    ],
  },
];

const FIELDS_NAMING: FieldDef[] = [
  {
    id: 'lion',
    label: 'Ask patient to name the first animal',
    options: [
      { label: 'Named lion',         score: 1 },
      { label: 'Did not name lion',  score: 0 },
    ],
  },
  {
    id: 'rhino',
    label: 'Ask patient to name the second animal',
    options: [
      { label: 'Named rhinoceros',         score: 1 },
      { label: 'Did not name rhinoceros',  score: 0 },
    ],
  },
  {
    id: 'camel',
    label: 'Ask patient to name the third animal',
    options: [
      { label: 'Named camel',         score: 1 },
      { label: 'Did not name camel',  score: 0 },
    ],
  },
];

const FIELD_MEMORY: FieldDef = {
  id: 'memory',
  noScore: true,
  label: 'Read "Face", "Velvet", "Church", "Daisy", "Red", and ask patient to repeat (do two trials and a recall later in exam)',
  options: [
    { label: 'Completed both trials correctly',       score: 0 },
    { label: 'Did not complete both trials correctly', score: 0 },
  ],
};

const FIELDS_ATTENTION: FieldDef[] = [
  {
    id: 'digitFwd',
    label: 'Read list of digits (2, 1, 8, 5, 4) at 1 digit/sec and ask patient to repeat them in the forward order',
    options: [
      { label: 'Repeated correctly',       score: 1 },
      { label: 'Did not repeat correctly', score: 0 },
    ],
  },
  {
    id: 'digitBwd',
    label: 'Read list of digits (7, 4, 2) at 1 digit/sec and ask patient to repeat them in the backward order',
    options: [
      { label: 'Repeated correctly',       score: 1 },
      { label: 'Did not repeat correctly', score: 0 },
    ],
  },
  {
    id: 'vigilance',
    label: 'Read list of letters and ask patient to tap with their hand at each letter A: FBAC MNAA JKLB AFAK DEAA AJAM OFAAB',
    options: [
      { label: '<2 errors',  score: 1 },
      { label: '≥2 errors',  score: 0 },
    ],
  },
  {
    id: 'serial7',
    label: 'Ask patient to do five serial 7 subtractions starting at 100; patient should say 93, 86, 79, 72, 65',
    options: [
      { label: '4 or 5 correct', score: 3 },
      { label: '2 or 3 correct', score: 2 },
      { label: '1 correct',      score: 1 },
      { label: '0 correct',      score: 0 },
    ],
  },
];

const FIELDS_LANGUAGE: FieldDef[] = [
  {
    id: 'sentence1',
    label: 'Read and ask patient to repeat: "I only know that John is the one to help today"',
    options: [
      { label: 'Repeated correctly',       score: 1 },
      { label: 'Did not repeat correctly', score: 0 },
    ],
  },
  {
    id: 'sentence2',
    label: 'Read and ask patient to repeat: "The cat always hid under the couch when dogs were in the room"',
    options: [
      { label: 'Repeated correctly',       score: 1 },
      { label: 'Did not repeat correctly', score: 0 },
    ],
  },
  {
    id: 'fluency',
    label: 'Ask patient to name maximum number of words in 1 minute that begin with the letter F',
    options: [
      { label: 'Named ≥11 words', score: 1 },
      { label: 'Named <11 words', score: 0 },
    ],
  },
];

const FIELDS_ABSTRACTION: FieldDef[] = [
  {
    id: 'abstract1',
    label: 'Ask patient similarity between train and bicycle (e.g. both are modes of transportation)',
    options: [
      { label: 'Answered correctly',       score: 1 },
      { label: 'Did not answer correctly', score: 0 },
    ],
  },
  {
    id: 'abstract2',
    label: 'Ask patient similarity between watch and ruler (e.g. both are measuring tools)',
    options: [
      { label: 'Answered correctly',       score: 1 },
      { label: 'Did not answer correctly', score: 0 },
    ],
  },
];

const FIELD_RECALL: FieldDef = {
  id: 'recall',
  label: 'Ask patient to recall the words with no cue from the memory test previously conducted ("Face", "Velvet", "Church", "Daisy", "Red")',
  options: [
    { label: 'Recalled all words',        score: 5 },
    { label: 'Recalled 4 words',          score: 4 },
    { label: 'Recalled 3 words',          score: 3 },
    { label: 'Recalled 2 words',          score: 2 },
    { label: 'Recalled 1 words',          score: 1 },
    { label: 'Did not recall any words',  score: 0 },
  ],
};

const FIELD_ORIENTATION: FieldDef = {
  id: 'orientation',
  label: 'Ask patient the date, month, year, day, place, and city',
  options: [
    { label: 'All correct',   score: 6 },
    { label: '5 correct',     score: 5 },
    { label: '4 correct',     score: 4 },
    { label: '3 correct',     score: 3 },
    { label: '2 correct',     score: 2 },
    { label: '1 correct',     score: 1 },
    { label: 'None correct',  score: 0 },
  ],
};

const ALL_FIELDS: FieldDef[] = [
  ...FIELDS_VISUO,
  ...FIELDS_NAMING,
  FIELD_MEMORY,
  ...FIELDS_ATTENTION,
  ...FIELDS_LANGUAGE,
  ...FIELDS_ABSTRACTION,
  FIELD_RECALL,
  FIELD_ORIENTATION,
];

type SelState = Record<string, number>;
const initSel = (): SelState => Object.fromEntries(ALL_FIELDS.map(f => [f.id, 0]));

// ── Render helpers ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pb-1 pt-4 border-b border-gray-200">
      <p className="text-sm font-bold text-gray-700">{label}</p>
    </div>
  );
}

function FieldRow({
  field, idx, onChange,
}: { field: FieldDef; idx: number; onChange: (i: number) => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100 last:border-0">
      <p className="text-xs font-medium text-[#0E7490] self-start pr-1 leading-relaxed">
        {field.label}
      </p>
      <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
           style={{ borderColor: '#0E7490' }}>
        {field.options.map((opt, i) => {
          const active = idx === i;
          return (
            <button key={i} type="button" onClick={() => onChange(i)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
              style={active ? { background: '#0E7490', color: '#ffffff' } : { background: '#ffffff', color: '#1e293b' }}>
              <span className="flex-1 mr-2">{opt.label}</span>
              {!field.noScore && (
                <span className="shrink-0 font-bold text-xs"
                  style={{ color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                  {opt.score === 0 ? '0' : `+${opt.score}`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function MocaForm({ onResult }: Props) {
  const [education, setEducation] = useState<0 | 1>(1); // 0=No(≤12 yrs,+1), 1=Yes(>12 yrs,0)
  const [sel, setSel] = useState<SelState>(initSel);

  const set = (id: string, i: number) => setSel(prev => ({ ...prev, [id]: i }));

  const liveResult = useMemo(() => {
    const educationBonus = education === 0 ? 1 : 0;
    const raw = ALL_FIELDS.reduce((sum, f) => {
      if (f.noScore) return sum;
      return sum + f.options[sel[f.id]].score;
    }, 0);
    const total = Math.min(30, raw + educationBonus);
    return calculateMoCA(total);
  }, [education, sel]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    // Section scores for formula breakdown
    const v = ['trail','cube','clock'].reduce((s,id) => s + FIELDS_VISUO.find(f=>f.id===id)!.options[sel[id]].score, 0);
    const n = ['lion','rhino','camel'].reduce((s,id) => s + FIELDS_NAMING.find(f=>f.id===id)!.options[sel[id]].score, 0);
    const a = ['digitFwd','digitBwd','vigilance','serial7'].reduce((s,id) => s + FIELDS_ATTENTION.find(f=>f.id===id)!.options[sel[id]].score, 0);
    const l = ['sentence1','sentence2','fluency'].reduce((s,id) => s + FIELDS_LANGUAGE.find(f=>f.id===id)!.options[sel[id]].score, 0);
    const ab = ['abstract1','abstract2'].reduce((s,id) => s + FIELDS_ABSTRACTION.find(f=>f.id===id)!.options[sel[id]].score, 0);
    const r = FIELD_RECALL.options[sel.recall].score;
    const o = FIELD_ORIENTATION.options[sel.orientation].score;
    const edu = education === 0 ? 1 : 0;

    onResultRef.current({
      outputs: [{
        id: 'moca',
        label: 'MoCA Score',
        value: liveResult.score,
        unit: '/ 30',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { education, ...sel },
      formulaUsed:
        `MoCA = Visuospatial/Exec + Naming + Attention + Language + Abstraction + Delayed Recall + Orientation + Education\n` +
        `     = ${v}/5 + ${n}/3 + ${a}/6 + ${l}/3 + ${ab}/2 + ${r}/5 + ${o}/6 + ${edu}/1\n` +
        `     = ${liveResult.score}/30`,
      references: liveResult.references,
    });
  }, [liveResult, education, sel]);

  return (
    <div className="space-y-0">

      {/* ── Education ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-200">
        <div className="pr-1">
          <p className="text-xs font-medium text-[#0E7490] leading-relaxed">
            Does the patient have more than 12 years of education?
          </p>
          <p className="text-xs text-amber-600 mt-0.5">Do not include kindergarten years</p>
        </div>
        <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          <button type="button" onClick={() => setEducation(0)}
            className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors"
            style={education === 0 ? ACTIVE : INACTIVE}>
            <span>No</span><span style={{ opacity: 0.7 }}>+1</span>
          </button>
          <button type="button" onClick={() => setEducation(1)}
            className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors"
            style={education === 1 ? ACTIVE : INACTIVE}>
            <span>Yes</span><span style={{ opacity: 0.7 }}>0</span>
          </button>
        </div>
      </div>

      {/* ── Visuospatial / Executive ──────────────────────────────────────── */}
      <SectionHeader label="Visuospatial/executive" />
      {FIELDS_VISUO.map(f => (
        <FieldRow key={f.id} field={f} idx={sel[f.id]} onChange={i => set(f.id, i)} />
      ))}

      {/* ── Naming ────────────────────────────────────────────────────────── */}
      <SectionHeader label="Naming" />
      {FIELDS_NAMING.map(f => (
        <FieldRow key={f.id} field={f} idx={sel[f.id]} onChange={i => set(f.id, i)} />
      ))}

      {/* ── Memory (no score) ─────────────────────────────────────────────── */}
      <SectionHeader label="Memory" />
      <FieldRow field={FIELD_MEMORY} idx={sel.memory} onChange={i => set('memory', i)} />

      {/* ── Attention ─────────────────────────────────────────────────────── */}
      <SectionHeader label="Attention" />
      {FIELDS_ATTENTION.map(f => (
        <FieldRow key={f.id} field={f} idx={sel[f.id]} onChange={i => set(f.id, i)} />
      ))}

      {/* ── Language ──────────────────────────────────────────────────────── */}
      <SectionHeader label="Language" />
      {FIELDS_LANGUAGE.map(f => (
        <FieldRow key={f.id} field={f} idx={sel[f.id]} onChange={i => set(f.id, i)} />
      ))}

      {/* ── Abstraction ───────────────────────────────────────────────────── */}
      <SectionHeader label="Abstraction" />
      {FIELDS_ABSTRACTION.map(f => (
        <FieldRow key={f.id} field={f} idx={sel[f.id]} onChange={i => set(f.id, i)} />
      ))}

      {/* ── Delayed Recall ────────────────────────────────────────────────── */}
      <SectionHeader label="Delayed recall" />
      <FieldRow field={FIELD_RECALL} idx={sel.recall} onChange={i => set('recall', i)} />

      {/* ── Orientation ───────────────────────────────────────────────────── */}
      <SectionHeader label="Orientation" />
      <FieldRow field={FIELD_ORIENTATION} idx={sel.orientation} onChange={i => set('orientation', i)} />
    </div>
  );
}
