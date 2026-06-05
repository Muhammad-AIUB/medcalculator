'use client';
import { useRouter } from 'next/navigation';
import { clearAppData, clearCalculations } from '@/lib/app-data';

export function BottomBar() {
  const router = useRouter();

  const handleRefresh = () => {
    clearCalculations();
    window.location.reload();
  };

  const handleExit = () => {
    if (confirm('Exit Pocket Medical Calculator?')) {
      clearAppData();
      window.close();
      setTimeout(() => {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;text-align:center;padding:20px;"><div><h1 style="font-size:24px;margin-bottom:8px;">Goodbye</h1><p>Your app data has been removed. You can close this tab now.</p></div></div>';
      }, 100);
    }
  };

  const btnClass =
    'flex items-center justify-center rounded-2xl bg-white border border-gray-200 ' +
    'text-gray-500 font-semibold shadow-sm h-12 px-4 ' +
    'active:scale-[0.97] transition-all';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200">
      <div className="grid grid-cols-3 gap-3 px-4 py-3 max-w-2xl mx-auto">
        <button onClick={() => router.push('/subscribe')} className={btnClass}>
          Home
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
