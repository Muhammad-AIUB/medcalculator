// Keys that hold *calculations* (form inputs + result history).
// The calculator *names* placed on the home screen ('home-slots') are kept.
const CALCULATION_KEYS = ['medcalc-form-data', 'medcalc-ui-store'];

function removeKeys(keys: string[]) {
  if (typeof window === 'undefined') return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

// Clears calculations only — keeps the calculator names on the home screen.
export function clearCalculations() {
  removeKeys(CALCULATION_KEYS);
}
