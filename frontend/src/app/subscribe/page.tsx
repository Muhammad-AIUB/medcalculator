'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing, User, Stethoscope, Hash, Mail, Phone,
  ShieldCheck, CheckCircle2, Sparkles, BadgeCheck,
} from 'lucide-react';
import { BottomBar } from '@/components/layout/bottom-bar';
import { ExhortLogo } from '@/components/brand/exhort-logo';
import { CountryAutocomplete } from '@/components/ui/country-autocomplete';
import { sendSubscription, flushPendingSubscription } from '@/lib/subscribe';

const PROFESSIONS = ['Doctor', 'Doctor assistant', 'Nurse', 'Medical Technologist'];

const EMPTY = {
  name: '',
  profession: '',
  registration: '',
  email: '',
  country: '',
  mobile: '',
};

export default function SubscribePage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [showAlreadyPopup, setShowAlreadyPopup] = useState(false);
  const [form, setForm] = useState(EMPTY);

  // Detect an existing subscription on load, and retry any subscription that
  // failed to reach the sheet earlier (e.g. the user was offline).
  useEffect(() => {
    try {
      if (localStorage.getItem('subscription')) setAlreadySubscribed(true);
    } catch {}
    void flushPendingSubscription();
  }, []);

  const update =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubscribeClick = () => {
    if (alreadySubscribed) {
      setShowAlreadyPopup(true);
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('subscription', JSON.stringify({ ...form, at: Date.now() }));
    } catch {}
    // Send to the Google Sheet (queues for retry if offline).
    void sendSubscription(form);
    setAlreadySubscribed(true);
    setSubmitted(true);
  };

  const fieldWrap = 'relative';
  const iconClass = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0E7490]';
  const inputClass =
    'w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50/70 text-sm text-gray-800 ' +
    'outline-none focus:bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/20 transition-all';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f0fbfa] via-white to-white">
      {/* Teal gradient header band */}
      <div
        className="w-full h-14 shrink-0"
        style={{ background: 'linear-gradient(180deg, #0a5d57 0%, #0e7d74 50%, #16a99c 100%)' }}
      />

      {/* Title + brand */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-5">
        <h1 className="text-[26px] sm:text-3xl font-extrabold tracking-tight text-gray-800 leading-tight">
          Pocket Medical Calculator
        </h1>
        <div className="flex justify-end mt-3">
          <ExhortLogo />
        </div>
      </div>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-6 pb-28">
        {submitted ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-cyan-900/5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            <p className="mt-4 text-xl font-bold text-gray-800">You&apos;re all set!</p>
            <p className="mt-1 text-sm text-gray-500">
              Thanks for subscribing — we&apos;ll keep you updated.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0E7490] to-[#16a99c] text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all"
            >
              Back to calculators
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 shadow-xl shadow-cyan-900/5">
            {/* Icon header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7490] to-[#16a99c] shadow-lg shadow-cyan-900/20">
                <BellRing className="h-8 w-8 text-white" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400">
                  <Sparkles className="h-3 w-3 text-white" />
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-800">
                Subscribe to keep you updated
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Get new calculators, clinical updates &amp; tips — straight to your inbox.
              </p>
            </div>

            {!showForm ? (
              <button
                onClick={handleSubscribeClick}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0E7490] to-[#16a99c] text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all"
              >
                Subscribe <span className="ml-1 font-normal text-white/80">(optional)</span>
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
                <div className={fieldWrap}>
                  <User className={iconClass} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    className={inputClass}
                    placeholder="Full name"
                  />
                </div>

                <div className={fieldWrap}>
                  <Stethoscope className={iconClass} />
                  <select
                    value={form.profession}
                    onChange={update('profession')}
                    className={`${inputClass} appearance-none ${form.profession ? 'text-gray-800' : 'text-gray-400'}`}
                  >
                    <option value="" disabled>
                      Select profession
                    </option>
                    {PROFESSIONS.map(p => (
                      <option key={p} value={p} className="text-gray-800">
                        {p}
                      </option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div className={fieldWrap}>
                  <Hash className={iconClass} />
                  <input
                    type="text"
                    value={form.registration}
                    onChange={update('registration')}
                    className={inputClass}
                    placeholder="Registration number"
                  />
                </div>

                <div className={fieldWrap}>
                  <Mail className={iconClass} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    className={inputClass}
                    placeholder="Email address"
                  />
                </div>

                <CountryAutocomplete
                  value={form.country}
                  onChange={country => setForm(prev => ({ ...prev, country }))}
                  inputClass={inputClass}
                />

                <div className={fieldWrap}>
                  <Phone className={iconClass} />
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={update('mobile')}
                    className={inputClass}
                    placeholder="Mobile number"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 h-12 w-full rounded-xl bg-gradient-to-r from-[#0E7490] to-[#16a99c] text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all"
                >
                  Submit
                </button>

                <div className="flex items-start gap-2 pt-1">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-xs leading-relaxed text-gray-500">
                    EXHORT will not share your identity to any third party for advertising.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Beta notice */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white/70 p-5 text-center shadow-sm">
          <p className="text-sm leading-relaxed text-gray-600">
            This is a <span className="font-semibold text-[#0E7490]">beta version</span>. We are
            testing extensively and repeatedly this app for any anomalies. If you find any, please
            send a screenshot and details to{' '}
            <a
              href="mailto:shahariar.dmc@gmail.com"
              className="font-semibold text-[#0E7490] underline underline-offset-2"
            >
              shahariar.dmc@gmail.com
            </a>
          </p>
          <p className="mt-3 text-sm text-gray-600">Regards</p>
          <p className="text-sm font-semibold text-gray-800">Dr. Shahariar</p>
        </div>
      </main>

      <BottomBar />

      {/* Already-subscribed popup */}
      {showAlreadyPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setShowAlreadyPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50">
              <BadgeCheck className="h-9 w-9 text-[#0E7490]" />
            </div>
            <p className="mt-4 text-xl font-bold text-gray-800">You&apos;re already subscribed</p>
            <p className="mt-1 text-sm text-gray-500">
              You&apos;ve already subscribed with this device, so there&apos;s no need to subscribe again.
            </p>
            <button
              onClick={() => setShowAlreadyPopup(false)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0E7490] to-[#16a99c] text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
