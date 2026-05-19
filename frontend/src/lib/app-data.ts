const APP_STORAGE_KEYS = [
  'home-slots',
  'medcalc-form-data',
  'medcalc-ui-store',
];

export function clearAppData() {
  if (typeof window === 'undefined') return;

  APP_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
