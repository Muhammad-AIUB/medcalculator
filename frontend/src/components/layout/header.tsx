'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

interface HeaderProps {
  onSearchClick?: () => void;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  className?: string;
}

export function Header({ onSearchClick, title, showBack, className }: HeaderProps) {
  const router = useRouter();
  const { setLastPage } = useUIStore();

  const handleBack = () => {
    setLastPage(null);
    router.push('/');
  };

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
      className
    )}>
      <div className="flex h-14 items-center gap-3 px-4 max-w-2xl mx-auto">
        {showBack ? (
          <button onClick={handleBack} className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-accent transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-cyan-600 flex items-center justify-center shadow-sm shadow-cyan-200 dark:shadow-cyan-900">
              <Activity style={{ width: 18, height: 18 }} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground leading-none">MedCalc Pro</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Clinical Calculator</p>
            </div>
          </Link>
        )}
        {title && (
          <h1 className="flex-1 text-base font-semibold text-foreground truncate">{title}</h1>
        )}
        {!title && <div className="flex-1" />}
        <div className="flex items-center gap-1">
          {onSearchClick && (
            <Button variant="ghost" size="icon" onClick={onSearchClick} aria-label="Search calculators">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
