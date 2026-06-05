import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * 👉 এখানে আপনার Google Apps Script Web App URL বসান।
 * (Apps Script এ Deploy → New deployment → Web app করলে যে URL পাবেন)
 * উদাহরণ: https://script.google.com/macros/s/AKfycb..../exec
 */
const SUBSCRIBE_ENDPOINT =
  process.env.NEXT_PUBLIC_SUBSCRIBE_URL ?? 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

export interface SubscriptionPayload {
  name: string;
  profession: string;
  registration: string;
  email: string;
  country: string;
  mobile: string;
}

const PENDING_KEY = 'pending-subscription';

function isConfigured(): boolean {
  return !!SUBSCRIBE_ENDPOINT && !SUBSCRIBE_ENDPOINT.startsWith('PASTE_');
}

/** Returns true if the row was successfully sent to the sheet. */
async function postSubscription(payload: SubscriptionPayload): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    if (Capacitor.isNativePlatform()) {
      // Native request — bypasses browser CORS and follows Apps Script's redirect.
      const res = await CapacitorHttp.post({
        url: SUBSCRIBE_ENDPOINT,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
      });
      return res.status >= 200 && res.status < 400;
    }
    // Web fallback (dev preview). Apps Script blocks reading the CORS response,
    // so fire-and-forget; the row still gets appended on the server.
    await fetch(SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends a subscription to the Google Sheet. If it fails (e.g. offline), the
 * payload is queued and retried on the next app launch via flushPendingSubscription().
 */
export async function sendSubscription(payload: SubscriptionPayload): Promise<void> {
  const ok = await postSubscription(payload);
  try {
    if (ok) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    /* ignore storage errors */
  }
}

/** Retries a previously-failed (offline) subscription. Call once on app load. */
export async function flushPendingSubscription(): Promise<void> {
  let pending: SubscriptionPayload | null = null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) pending = JSON.parse(raw) as SubscriptionPayload;
  } catch {
    return;
  }
  if (!pending) return;
  const ok = await postSubscription(pending);
  if (ok) {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  }
}
