import type { AppConfig, Audit } from '../types';

const KEYS = {
  audits: 'aud_auditorias',
  config: 'aud_config',
  sequence: 'aud_sequence',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readLegacySnapshot(): {
  audits: Audit[];
  config: AppConfig | null;
  sequence: number;
} {
  return {
    audits: load<Audit[]>(KEYS.audits, []),
    config: load<AppConfig | null>(KEYS.config, null),
    sequence: load<number>(KEYS.sequence, 0),
  };
}

export function hasLegacyLocalData(): boolean {
  const snapshot = readLegacySnapshot();
  return snapshot.audits.length > 0 || snapshot.sequence > 0 || snapshot.config !== null;
}

export function clearLegacySnapshot(): void {
  window.localStorage.removeItem(KEYS.audits);
  window.localStorage.removeItem(KEYS.config);
  window.localStorage.removeItem(KEYS.sequence);
}
