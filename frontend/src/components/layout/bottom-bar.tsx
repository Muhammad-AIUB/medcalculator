'use client';
import { useRouter, usePathname } from 'next/navigation';
import { clearCalculations } from '@/lib/app-data';

export function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Home page shows MORE (→ subscribe); every other page (calculators,
  // subscribe) shows HOME (→ home). Normalize the trailing slash first.
  const onHome = (pathname.replace(/\/+$/, '') || '/') === '/';
  const navLabel = onHome ? 'MORE' : 'HOME';
  const navTarget = onHome ? '/subscribe' : '/';

  // Client-side routing (router.push) — this is what works inside the Capacitor
  // WebView for sub-paths. Hard navigation to a sub-path does NOT resolve there.
  const handleRefresh = () => {
    // Clear calculation results/inputs (placed calculators are kept) and return
    // to a fresh home screen. A hard navigation to the root ('/') is safe (it
    // maps to index.html) and reloads so the cleared state takes effect.
    clearCalculations();
    window.location.href = '/';
  };

  const handleExit = async () => {
    // Exit directly — no confirmation, no goodbye screen, and keep all saved
    // data (placed calculators persist; only the ✕ button removes them).
    const cap = (window as unknown as { Capacitor?: unknown }).Capacitor;
    if (cap) {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
    } else {
      window.close();
    }
  };

  const btnClass =
    'flex items-center justify-center rounded-2xl bg-white border border-gray-200 ' +
    'text-gray-500 font-semibold shadow-sm h-12 px-4 ' +
    'active:scale-[0.97] transition-all';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200">
      <div className="grid grid-cols-3 gap-3 px-4 py-3 max-w-2xl mx-auto">
        <button onClick={() => router.push(navTarget)} className={btnClass}>
          {navLabel}
        </button>
        <button onClick={handleRefresh} className={btnClass}>
          Refresh
        </button>
        <button onClick={handleExit} className={btnClass}>
          EXIT
        </button>
      </div>
    </nav>
  );
}
