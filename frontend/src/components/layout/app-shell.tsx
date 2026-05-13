import { Header } from './header';
import { BottomNav } from './bottom-nav';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  onSearchClick?: () => void;
}

export function AppShell({ children, title, showBack, backHref, onSearchClick }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} showBack={showBack} backHref={backHref} onSearchClick={onSearchClick} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
