// Keys that hold the calculator *names* placed on the home screen.
const SLOT_KEYS = ['home-slots'];

// Keys that hold *calculations* (form inputs + result history).
const CALCULATION_KEYS = ['medcalc-form-data', 'medcalc-ui-store'];

const APP_STORAGE_KEYS = [...SLOT_KEYS, ...CALCULATION_KEYS];

function removeKeys(keys: string[]) {
  if (typeof window === 'undefined') return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

// Clears calculations only — keeps the calculator names on the home screen.
export function clearCalculations() {
  removeKeys(CALCULATION_KEYS);
}

// Full wipe (used on Exit).
export function clearAppData() {
  removeKeys(APP_STORAGE_KEYS);
}
