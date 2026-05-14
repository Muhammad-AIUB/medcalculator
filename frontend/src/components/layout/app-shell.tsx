import { Header } from './header';
import { BottomBar } from './bottom-bar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export function AppShell({ children, title, showBack, backHref }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} showBack={showBack} backHref={backHref} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
      <BottomBar />
    </div>
  );
}
