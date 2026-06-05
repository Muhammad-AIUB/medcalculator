'use client';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  className?: string;
}

export function Header({ title, showBack, backHref = '/', className }: HeaderProps) {
  return (
    <header
      className={cn('sticky top-0 z-40 w-full', className)}
      style={{
        background: 'linear-gradient(180deg, #0a5d57 0%, #0e7d74 50%, #16a99c 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex h-14 items-center gap-3 px-4 max-w-2xl mx-auto">
        {showBack ? (
          <Link
            href={backHref}
            className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: '#0E7490' }}
            >
              <Activity style={{ width: 18, height: 18 }} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Pocket Medical Calculator</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Clinical Calculator
              </p>
            </div>
          </Link>
        )}
        {title && (
          <h1 className="flex-1 text-base font-semibold text-white truncate">{title}</h1>
        )}
        {!title && <div className="flex-1" />}
      </div>
    </header>
  );
}
