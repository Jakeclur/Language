// Small wrapper around localStorage that never throws (private mode, sandboxed frames…).
const PREFIX = "leer-afrikaans:";

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: progress lives in memory for this visit */
  }
}

export function storageAvailable(): boolean {
  try {
    localStorage.setItem(PREFIX + "_t", "1");
    localStorage.removeItem(PREFIX + "_t");
    return true;
  } catch {
    return false;
  }
}
