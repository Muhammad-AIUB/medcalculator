'use client';
import { useRouter } from 'next/navigation';
import { Home, RefreshCw, LogOut } from 'lucide-react';

export function BottomBar() {
  const router = useRouter();

  const handleExit = () => {
    if (confirm('Exit MedCalc Pro?')) {
      window.close();
      setTimeout(() => {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;text-align:center;padding:20px;"><div><h1 style="font-size:24px;margin-bottom:8px;">Goodbye 👋</h1><p>You can close this tab now.</p></div></div>';
      }, 100);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10" style={{ background: '#0F2744' }}>
      <div className="grid grid-cols-3 h-16 max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="text-[11px] font-semibold tracking-wide">HOME</span>
        </button>
        <button
          onClick={() => { localStorage.removeItem('medcalc-form-data'); window.location.reload(); }}
          className="flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ color: '#38D8F5' }}
        >
          <RefreshCw className="h-6 w-6" strokeWidth={2.5} />
          <span className="text-[11px] font-bold tracking-wide">REFRESH</span>
        </button>
        <button
          onClick={handleExit}
          className="flex flex-col items-center justify-center gap-1 text-white/60 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[11px] font-semibold tracking-wide">EXIT</span>
        </button>
      </div>
    </nav>
  );
}
