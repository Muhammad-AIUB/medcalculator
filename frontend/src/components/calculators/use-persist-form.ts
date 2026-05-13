const STORAGE_KEY = 'medcalc-form-data';

function getStore(): Record<string, Record<string, string>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

export function getSaved(calcId: string, field: string): string {
  return getStore()[calcId]?.[field] ?? '';
}

export function saveField(calcId: string, field: string, value: string) {
  const store = getStore();
  if (!store[calcId]) store[calcId] = {};
  store[calcId][field] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
