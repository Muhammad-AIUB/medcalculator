'use client';
import { useEffect } from 'react';

/**
 * Hides the Capacitor native splash screen shortly after the WebView paints.
 * A small delay keeps the branded splash (logo + app name) visible for a moment
 * before fading to the app. The config's launchAutoHide (3s) is a fallback.
 * No-op outside Capacitor.
 */
export function SplashHide() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: unknown }).Capacitor;
    if (!cap) return;
    const timer = setTimeout(() => {
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 300 }))
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
