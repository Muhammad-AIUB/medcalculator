'use client';
import { useEffect } from 'react';

/**
 * Hides the Capacitor native splash screen as soon as the WebView has painted
 * the first screen, so cold-start feels instant (the config's launchAutoHide
 * after 3s is only a fallback if JS never runs). No-op outside Capacitor.
 */
export function SplashHide() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: unknown }).Capacitor;
    if (!cap) return;
    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 200 }))
      .catch(() => {});
  }, []);
  return null;
}
