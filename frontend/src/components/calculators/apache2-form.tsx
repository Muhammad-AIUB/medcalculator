'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateApache2 } from '@/lib/calculators/apache2';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

function YesNo({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: 0 | 1; onChange: (v: 0 | 1) => void }) {
  return (
    <FieldRow label={label} hint={hint}>
      <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
           style={{ borderColor: '#0E7490' }}>
        <button type="button" onClick={() => onChange(0)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={value === 0 ? ACTIVE : INACTIVE}>
          <span>No</span><span className="text-xs" style={{ opacity: 0.7 }}>0</span>
        </button>
        <button type="button" onClick={() => onChange(1)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={value === 1 ? ACTIVE : INACTIVE}>
          <span>Yes</span><span className="text-xs" style={{ opacity: 0.7 }}>+1</span>
        </button>
      </div>
    </FieldRow>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pb-1 pt-4 border-b border-gray-200">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
    </div>
  );
}

export function Apache2Form({ onResult }: Props) {
  // ── Chronic health
  const [chronicHealth, setChronicHealth] = useState<0 | 1>(0);

  // ── Demographics
  const [ageStr,   setAgeStr]   = useState('');

  // ── Temperature: °C OR °F
  const [tempCStr, setTempCStr] = useState('');
  const [tempFStr, setTempFStr] = useState('');

  // ── MAP
  const [mapStr,   setMapStr]   = useState('');

  // ── Heart rate
  const [hrStr,    setHrStr]    = useState('');

  // ── Respiratory rate
  const [rrStr,    setRrStr]    = useState('');

  // ── pH
  const [phStr,    setPhStr]    = useState('');

  // ── Sodium: mmol/L OR mEq/L
  const [naMmolStr, setNaMmolStr] = useState('');
  const [naMeqStr,  setNaMeqStr]  = useState('');

  // ── Potassium: mmol/L OR mEq/L
  const [kMmolStr, setKMmolStr] = useState('');
  const [kMeqStr,  setKMeqStr]  = useState('');

  // ── Creatinine: µmol/L OR mg/dL
  const [crUmolStr, setCrUmolStr] = useState('');
  const [crMgdlStr, setCrMgdlStr] = useState('');

  // ── Acute renal failure
  const [arf, setArf] = useState<0 | 1>(0);

  // ── Hematocrit
  const [hctStr, setHctStr] = useState('');

  // ── WBC: ×10⁹/L OR ×10³/µL
  const [wbcAStr, setWbcAStr] = useState('');   // ×10⁹/L
  const [wbcBStr, setWbcBStr] = useState('');   // ×10³/µL

  // ── GCS
  const [gcsStr, setGcsStr] = useState('');

  // ── FiO₂ + conditional oxygenation
  const [fio2High, setFio2High] = useState(false);
  const [pao2Str,  setPao2Str]  = useState('');
  const [aado2Str, setAado2Str] = useState('');

  // ── Resolve to canonical units ────────────────────────────────────────────
  const tempC    = tempCStr  !== '' ? parseFloat(tempCStr)  : tempFStr  !== '' ? (parseFloat(tempFStr)  - 32) * 5 / 9 : NaN;
  const sodium   = naMmolStr !== '' ? parseFloat(naMmolStr) : naMeqStr  !== '' ? parseFloat(naMeqStr)   : NaN;
  const potassium = kMmolStr !== '' ? parseFloat(kMmolStr)  : kMeqStr   !== '' ? parseFloat(kMeqStr)    : NaN;
  const creatinine = crUmolStr !== '' ? parseFloat(crUmolStr) / 88.4    : crMgdlStr !== '' ? parseFloat(crMgdlStr) : NaN;
  const wbc      = wbcAStr   !== '' ? parseFloat(wbcAStr)   : wbcBStr   !== '' ? parseFloat(wbcBStr)    : NaN;

  const age      = parseFloat(ageStr)  || NaN;
  const map_val  = parseFloat(mapStr)  || NaN;
  const hr_val   = parseFloat(hrStr)   || NaN;
  const rr_val   = parseFloat(rrStr)   || NaN;
  const ph_val   = parseFloat(phStr)   || NaN;
  const hct_val  = parseFloat(hctStr)  || NaN;
  const gcs_val  = parseFloat(gcsStr)  || NaN;
  const pao2_val  = pao2Str  !== '' ? parseFloat(pao2Str)  : undefined;
  const aado2_val = aado2Str !== '' ? parseFloat(aado2Str) : undefined;

  const ready = [age, tempC, map_val, hr_val, rr_val, ph_val,
                 sodium, potassium, creatinine, hct_val, wbc, gcs_val]
    .every(v => Number.isFinite(v) && v > 0 || (v === ph_val && Number.isFinite(v)));

  const liveResult = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateApache2({
        chronicHealth, age, tempC, map: map_val, ph: ph_val,
        hr: hr_val, rr: rr_val, sodium, potassium,
        creatinine, acuteRenalFailure: arf, hematocrit: hct_val,
        wbc, gcs: gcs_val, fio2High, pao2: pao2_val, aado2: aado2_val,
      });
    } catch { return null; }
  }, [ready, chronicHealth, age, tempC, map_val, ph_val, hr_val, rr_val,
      sodium, potassium, creatinine, arf, hct_val, wbc, gcs_val,
      fio2High, pao2_val, aado2_val]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'apache2',
        label: 'APACHE II Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: {
        chronicHealth, age, tempC, map: map_val, ph: ph_val,
        hr: hr_val, rr: rr_val, sodium, potassium,
        creatinine, acuteRenalFailure: arf, hematocrit: hct_val, wbc, gcs: gcs_val,
        fio2High, pao2: pao2_val, aado2: aado2_val,
      },
      formulaUsed:
        `APACHE II = APS + Age Points + Chronic Health Points\n` +
        `          = ${liveResult.aps} + ${liveResult.ageScore} + ${liveResult.chronicScore} = ${liveResult.score}\n\n` +
        `APS (${liveResult.aps}): Temperature + MAP + HR + RR + Oxygenation + pH\n` +
        `             + Sodium + Potassium + Creatinine + Hematocrit + WBC + (15 − GCS)`,
      references: liveResult.references,
    });
  }, [liveResult, aado2_val, age, arf, chronicHealth, creatinine, fio2High, gcs_val, hct_val, hr_val, map_val, pao2_val, ph_val, potassium, rr_val, sodium, tempC, wbc]);

  return (
    <div className="space-y-5">

      {/* ── Chronic Health ────────────────────────────────────────────────── */}
      <SectionHeader label="Chronic Health" />
      <YesNo
        label="Severe organ failure or immunocompromise"
        hint="CHF class IV, cirrhosis, COPD, or dialysis-dependent"
        value={chronicHealth}
        onChange={setChronicHealth}
      />

      {/* ── Demographics ─────────────────────────────────────────────────── */}
      <SectionHeader label="Demographics" />
      <FieldRow label="Age">
        <NumInput
          value={ageStr} onChange={setAgeStr}
          suffix="years" step="1" min={0} max={120} placeholder="0 - 120"
        />
      </FieldRow>

      {/* ── Vital Signs ──────────────────────────────────────────────────── */}
      <SectionHeader label="Vital Signs" />

      <FieldRow label="Temperature">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={tempCStr}
            onChange={v => { const n = parseFloat(v); setTempCStr(v); setTempFStr(Number.isFinite(n) ? fmt(n * 9 / 5 + 32, 1) : ''); }}
            suffix="°C" step="0.1" min={20} max={45} placeholder="Norm: 36 - 38.4"
          />
          <OrDivider />
          <NumInput
            value={tempFStr}
            onChange={v => { const n = parseFloat(v); setTempFStr(v); setTempCStr(Number.isFinite(n) ? fmt((n - 32) * 5 / 9, 1) : ''); }}
            suffix="°F" step="0.1" min={68} max={113} placeholder="Norm: 96.8 - 101.1"
          />
        </div>
      </FieldRow>

      <FieldRow label="Mean arterial pressure">
        <NumInput
          value={mapStr} onChange={setMapStr}
          suffix="mmHg" step="1" min={0} max={300} placeholder="Norm: 70 - 110"
        />
      </FieldRow>

      <FieldRow label="Heart rate">
        <NumInput
          value={hrStr} onChange={setHrStr}
          suffix="beats/min" step="1" min={0} max={300} placeholder="Norm: 70 - 109"
        />
      </FieldRow>

      <FieldRow label="Respiratory rate">
        <NumInput
          value={rrStr} onChange={setRrStr}
          suffix="breaths/min" step="1" min={0} max={80} placeholder="Norm: 12 - 24"
        />
      </FieldRow>

      {/* ── Laboratory ───────────────────────────────────────────────────── */}
      <SectionHeader label="Laboratory Values" />

      <FieldRow label="Arterial pH">
        <NumInput
          value={phStr} onChange={setPhStr}
          suffix="pH" step="0.01" min={6.5} max={8.0} placeholder="Norm: 7.33 - 7.49"
        />
      </FieldRow>

      <FieldRow label="Sodium">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={naMmolStr}
            onChange={v => { setNaMmolStr(v); setNaMeqStr(v); }}
            suffix="mmol/L" step="1" min={0} max={250} placeholder="Norm: 130 - 149"
          />
          <OrDivider />
          <NumInput
            value={naMeqStr}
            onChange={v => { setNaMeqStr(v); setNaMmolStr(v); }}
            suffix="mEq/L" step="1" min={0} max={250} placeholder="Norm: 130 - 149"
          />
        </div>
      </FieldRow>

      <FieldRow label="Potassium">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={kMmolStr}
            onChange={v => { setKMmolStr(v); setKMeqStr(v); }}
            suffix="mmol/L" step="0.1" min={0} max={15} placeholder="Norm: 3.5 - 5.4"
          />
          <OrDivider />
          <NumInput
            value={kMeqStr}
            onChange={v => { setKMeqStr(v); setKMmolStr(v); }}
            suffix="mEq/L" step="0.1" min={0} max={15} placeholder="Norm: 3.5 - 5.4"
          />
        </div>
      </FieldRow>

      <FieldRow label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={crUmolStr}
            onChange={v => { const n = parseFloat(v); setCrUmolStr(v); setCrMgdlStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : ''); }}
            suffix="µmol/L" step="1" min={0} max={2000} placeholder="Norm: 62 - 115"
          />
          <OrDivider />
          <NumInput
            value={crMgdlStr}
            onChange={v => { const n = parseFloat(v); setCrMgdlStr(v); setCrUmolStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 0) : ''); }}
            suffix="mg/dL" step="0.1" min={0} max={25} placeholder="Norm: 0.7 - 1.3"
          />
        </div>
      </FieldRow>

      <YesNo
        label="Acute renal failure"
        hint="Doubles creatinine score if present"
        value={arf}
        onChange={setArf}
      />

      <FieldRow label="Hematocrit">
        <NumInput
          value={hctStr} onChange={setHctStr}
          suffix="%" step="0.1" min={0} max={100} placeholder="Norm: 30 - 45.9"
        />
      </FieldRow>

      <FieldRow label="White blood cell count">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wbcAStr}
            onChange={v => { setWbcAStr(v); setWbcBStr(v); }}
            suffix="×10⁹/L" step="0.1" min={0} max={200} placeholder="Norm: 3 - 14.9"
          />
          <OrDivider />
          <NumInput
            value={wbcBStr}
            onChange={v => { setWbcBStr(v); setWbcAStr(v); }}
            suffix="×10³/µL" step="0.1" min={0} max={200} placeholder="Norm: 3 - 14.9"
          />
        </div>
      </FieldRow>

      {/* ── Neurological ─────────────────────────────────────────────────── */}
      <SectionHeader label="Neurological" />

      <FieldRow label="Glasgow Coma Scale">
        <NumInput
          value={gcsStr} onChange={setGcsStr}
          suffix="points" step="1" min={3} max={15} placeholder="Norm: 3 - 15"
        />
      </FieldRow>

      {/* ── Oxygenation ──────────────────────────────────────────────────── */}
      <SectionHeader label="Oxygenation" />

      <FieldRow label="FiO₂">
        <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          {([
            { high: false, label: '<50% (or non-intubated)' },
            { high: true,  label: '≥50%' },
          ] as const).map(opt => {
            const active = fio2High === opt.high;
            return (
              <button key={String(opt.high)} type="button"
                onClick={() => { setFio2High(opt.high); setPao2Str(''); setAado2Str(''); }}
                className="w-full flex items-center px-3 py-2.5 text-xs font-medium text-left transition-colors"
                style={active ? { background: '#0E7490', color: '#ffffff' } : { background: '#ffffff', color: '#1e293b' }}>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </FieldRow>

      {!fio2High && (
        <FieldRow label="PaO₂">
          <NumInput
            value={pao2Str} onChange={setPao2Str}
            suffix="mmHg" step="1" min={0} max={700} placeholder="Norm: >70"
          />
        </FieldRow>
      )}

      {fio2High && (
        <FieldRow label="A-aDO₂">
          <NumInput
            value={aado2Str} onChange={setAado2Str}
            suffix="mmHg" step="1" min={0} max={700} placeholder="Norm: <200"
          />
        </FieldRow>
      )}
    </div>
  );
}
