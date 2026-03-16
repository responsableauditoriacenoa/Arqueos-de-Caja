import type {
  Audit, RubricDetail, RubricKey, AppConfig, DashboardStats
} from '../types';
import type { RubricFormData } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { getComplianceResult, getBilleteoComplianceByDifference } from '../constants';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  AUDITS:  'aud_auditorias',
  CONFIG:  'aud_config',
  SEQ:     'aud_sequence',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nextAuditNumber(): string {
  const seq = load<number>(KEYS.SEQ, 0) + 1;
  save(KEYS.SEQ, seq);
  const year = new Date().getFullYear();
  return `AUD-${year}-${String(seq).padStart(3, '0')}`;
}

// ─── RubricDetail calc ────────────────────────────────────────────────────────

export function calcRubric(data: RubricFormData, key: RubricKey, auditoriaId: string): RubricDetail {
  const esperado   = Number(data.valorEsperado)  || 0;
  const observado  = Number(data.valorObservado) || 0;
  const diferencia = observado - esperado;
  const isCountRubric = key === 'cupones' || key === 'depositos' || key === 'vales' || key === 'transferencias';
  let cumplimiento = 100;
  if (key === 'billeteo') {
    cumplimiento = getBilleteoComplianceByDifference(diferencia);
  } else if (isCountRubric) {
    if (esperado > 0) {
      cumplimiento = Math.max(0, Math.min(100, Math.round((1 - (observado / esperado)) * 100)));
    } else {
      cumplimiento = observado === 0 ? 100 : 0;
    }
  } else if (esperado > 0) {
    cumplimiento = Math.max(0, Math.min(100, Math.round((observado / esperado) * 100)));
  }
  return {
    id: nextId(),
    auditoriaId,
    rubrica: key,
    valorEsperado: esperado,
    valorObservado: observado,
    diferencia,
    cumplimiento,
    observaciones: data.observaciones,
    items: (data.items || []).map(i => ({ ...i, id: nextId() })),
  };
}

export function calcWeightedCompliance(rubros: RubricDetail[], config: AppConfig): number {
  if (!rubros.length) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const rubro of rubros) {
    const cfg = config.rubros.find(r => r.key === rubro.rubrica);
    if (!cfg) continue;
    weighted    += rubro.cumplimiento * cfg.peso;
    totalWeight += cfg.peso;
  }
  if (totalWeight === 0) return 0;
  return Math.round(weighted / totalWeight);
}

// ─── Audit CRUD ───────────────────────────────────────────────────────────────

export function getAllAudits(): Audit[] {
  return load<Audit[]>(KEYS.AUDITS, []).sort(
    (a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime()
  );
}

export function getAuditById(id: string): Audit | undefined {
  return getAllAudits().find(a => a.id === id);
}

export function createAudit(data: Partial<Audit>): Audit {
  const now = new Date().toISOString();
  const audit: Audit = {
    id: nextId(),
    numero: nextAuditNumber(),
    fecha: data.fecha ?? now.slice(0, 10),
    sucursalId: data.sucursalId ?? '',
    sucursalNombre: data.sucursalNombre ?? '',
    auditor: data.auditor ?? '',
    responsable: data.responsable ?? '',
    tipo: data.tipo ?? 'rutinaria',
    estado: 'borrador',
    observacionGeneral: data.observacionGeneral ?? '',
    rubros: [],
    hallazgos: [],
    recomendaciones: [],
    firmas: [],
    cumplimientoTotal: 0,
    resultadoFinal: '',
    creadoEn: now,
    actualizadoEn: now,
  };
  const all = getAllAudits();
  save(KEYS.AUDITS, [audit, ...all]);
  return audit;
}

export function updateAudit(id: string, changes: Partial<Audit>): Audit | null {
  const all = getAllAudits();
  const idx = all.findIndex(a => a.id === id);
  if (idx < 0) return null;
  const updated: Audit = {
    ...all[idx],
    ...changes,
    actualizadoEn: new Date().toISOString(),
  };
  // recalculate compliance if rubros changed
  if (changes.rubros !== undefined) {
    const cfg = getConfig();
    updated.cumplimientoTotal = calcWeightedCompliance(updated.rubros, cfg);
    updated.resultadoFinal    = getComplianceResult(updated.cumplimientoTotal);
  }
  all[idx] = updated;
  save(KEYS.AUDITS, all);
  return updated;
}

export function deleteAudit(id: string): void {
  const all = getAllAudits().filter(a => a.id !== id);
  save(KEYS.AUDITS, all);
}

// ─── Config CRUD ──────────────────────────────────────────────────────────────

export function getConfig(): AppConfig {
  const stored = load<Partial<AppConfig>>(KEYS.CONFIG, {});

  const empresas = Array.isArray(stored.empresas) && stored.empresas.length > 0
    ? stored.empresas
    : stored.empresa
      ? Array.from(new Set([stored.empresa, ...DEFAULT_CONFIG.empresas]))
      : DEFAULT_CONFIG.empresas;

  const empresa = stored.empresa && empresas.includes(stored.empresa)
    ? stored.empresa
    : empresas[0] ?? DEFAULT_CONFIG.empresa;

  const legacyNames = new Set([
    'Casa Central',
    'Sucursal Norte',
    'Sucursal Sur',
    'Sucursal Este',
    'Sucursal Oeste',
  ]);

  const hasLegacyBranches = Array.isArray(stored.sucursales)
    && stored.sucursales.length > 0
    && stored.sucursales.every(s => !s.empresa)
    && stored.sucursales.every(s => legacyNames.has(s.nombre));

  const baseBranches = hasLegacyBranches
    ? DEFAULT_CONFIG.sucursales
    : (stored.sucursales ?? DEFAULT_CONFIG.sucursales);

  const sucursales = baseBranches.map((s, idx) => ({
    ...s,
    id: s.id || `suc-${idx + 1}`,
    empresa: s.empresa || empresa,
    nombre: s.nombre || '',
    codigo: s.codigo || '',
    activa: s.activa ?? true,
  }));

  return {
    ...DEFAULT_CONFIG,
    ...stored,
    empresas,
    empresa,
    sucursales,
    rubros: stored.rubros ?? DEFAULT_CONFIG.rubros,
  };
}

export function saveConfig(cfg: AppConfig): void {
  save(KEYS.CONFIG, cfg);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboardStats(): DashboardStats {
  const audits = getAllAudits();
  const closed  = audits.filter(a => a.estado === 'cerrada');
  const avg     = closed.length
    ? Math.round(closed.reduce((s, a) => s + a.cumplimientoTotal, 0) / closed.length)
    : 0;

  // per branch
  const bMap: Record<string, number> = {};
  for (const a of audits) {
    bMap[a.sucursalNombre] = (bMap[a.sucursalNombre] || 0) + 1;
  }
  const porSucursal = Object.entries(bMap).map(([nombre, cantidad]) => ({ nombre, cantidad }));

  // per month (last 6)
  const monthMap: Record<string, number[]> = {};
  for (const a of closed) {
    const m = a.fecha.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = [];
    monthMap[m].push(a.cumplimientoTotal);
  }
  const months = Object.keys(monthMap).sort().slice(-6);
  const cumplimientoPorMes = months.map(mes => ({
    mes,
    valor: Math.round(monthMap[mes].reduce((s, v) => s + v, 0) / monthMap[mes].length),
  }));

  return {
    total: audits.length,
    borradores:  audits.filter(a => a.estado === 'borrador').length,
    abiertas:    audits.filter(a => a.estado === 'abierta' || a.estado === 'revision').length,
    cerradas:    audits.filter(a => a.estado === 'cerrada').length,
    cumplimientoPromedio: avg,
    ultimasAuditorias: audits.slice(0, 5),
    porSucursal,
    cumplimientoPorMes,
  };
}
