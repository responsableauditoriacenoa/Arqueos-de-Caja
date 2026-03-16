import type { AppConfig, RubricKey } from '../types';

// ─── Default rubric configuration ────────────────────────────────────────────

export const DEFAULT_RUBRICS: AppConfig['rubros'] = [
  { key: 'billeteo',       nombre: 'Billeteo / Efectivo',         peso: 30, orden: 1 },
  { key: 'cupones',        nombre: 'Cupones de Tarjeta',           peso: 15, orden: 2 },
  { key: 'depositos',      nombre: 'Valores a Depositar',          peso: 15, orden: 3 },
  { key: 'vales',          nombre: 'Vales a Rendir',               peso: 25, orden: 4 },
  { key: 'transferencias', nombre: 'Transferencias Pendientes',    peso: 15, orden: 5 },
];

export const RUBRIC_COLORS: Record<RubricKey, string> = {
  billeteo:        '#6366f1',
  cupones:         '#8b5cf6',
  depositos:       '#06b6d4',
  vales:           '#f59e0b',
  transferencias:  '#10b981',
};

export const RUBRIC_ICONS: Record<RubricKey, string> = {
  billeteo:        '💵',
  cupones:         '💳',
  depositos:       '🏦',
  vales:           '📄',
  transferencias:  '🔄',
};

export const DEFAULT_BRANCHES: AppConfig['sucursales'] = [
  { id: 'suc-ax-jujuy', empresa: 'Autolux', nombre: 'Ax Jujuy', codigo: 'AXJ', activa: true },
  { id: 'suc-ax-salta', empresa: 'Autolux', nombre: 'Ax Salta', codigo: 'AXS', activa: true },
  { id: 'suc-ax-tartagal', empresa: 'Autolux', nombre: 'Ax Tartagal', codigo: 'AXT', activa: true },
  { id: 'suc-ax-lajitas', empresa: 'Autolux', nombre: 'Ax Lajitas', codigo: 'AXL', activa: true },

  { id: 'suc-as-jujuy', empresa: 'Autosol', nombre: 'As Jujuy', codigo: 'ASJ', activa: true },
  { id: 'suc-as-salta', empresa: 'Autosol', nombre: 'As Salta', codigo: 'ASS', activa: true },
  { id: 'suc-as-tartagal', empresa: 'Autosol', nombre: 'As Tartagal', codigo: 'AST', activa: true },
  { id: 'suc-as-taller-express', empresa: 'Autosol', nombre: 'As Taller Express', codigo: 'ATE', activa: true },

  { id: 'suc-ciel-jujuy', empresa: 'Ciel', nombre: 'Ac Jujuy', codigo: 'ACJ', activa: true },

  { id: 'suc-kompas-carbian', empresa: 'Kompas', nombre: 'Carbian', codigo: 'CAR', activa: true },

  { id: 'suc-neu-las-lomas', empresa: 'Neumaticos Alte Brown', nombre: 'Las Lomas', codigo: 'LL', activa: true },
  { id: 'suc-neu-brown', empresa: 'Neumaticos Alte Brown', nombre: 'Brown', codigo: 'BR', activa: true },

  { id: 'suc-voge-salta', empresa: 'VOGE', nombre: 'VOGE Salta', codigo: 'VOS', activa: true },

  { id: 'suc-chango-car', empresa: 'Chango Truck', nombre: 'Chango Car', codigo: 'CHC', activa: true },
];

// ─── Default app config ───────────────────────────────────────────────────────

export const DEFAULT_CONFIG: AppConfig = {
  empresas: [
    'Autolux',
    'Autosol',
    'Ciel',
    'Chango Truck',
    'Kompas',
    'VOGE',
    'Neumaticos Alte Brown',
  ],
  empresa: 'Autolux',
  rubros: DEFAULT_RUBRICS,
  pieDeInforme: 'El presente informe es confidencial y de uso interno exclusivo.',
  sucursales: DEFAULT_BRANCHES,
};

// ─── Audit status labels ──────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  borrador:  'Borrador',
  abierta:   'Abierta',
  revision:  'En Revisión',
  cerrada:   'Cerrada',
};

export const TYPE_LABEL: Record<string, string> = {
  rutinaria:    'Rutinaria',
  sorpresa:     'Sorpresa',
  especial:     'Especial',
  seguimiento:  'Seguimiento',
};

export const SEVERITY_LABEL: Record<string, string> = {
  baja:  'Baja',
  media: 'Media',
  alta:  'Alta',
};

export const BILLETEO_COMPLIANCE_SCALE = [
  { from: 0, compliance: 100 },
  { from: 10000, compliance: 95 },
  { from: 20000, compliance: 90 },
  { from: 40000, compliance: 75 },
  { from: 50000, compliance: 60 },
  { from: 60000, compliance: 45 },
  { from: 70000, compliance: 30 },
  { from: 80000, compliance: 15 },
  { from: 100000, compliance: 0 },
] as const;

export function getBilleteoComplianceByDifference(difference: number): number {
  const absDiff = Math.abs(difference);
  let compliance = 100;

  for (const item of BILLETEO_COMPLIANCE_SCALE) {
    if (absDiff >= item.from) {
      compliance = item.compliance;
    }
  }

  return compliance;
}

// ─── Compliance thresholds ────────────────────────────────────────────────────

export function getComplianceResult(score: number): string {
  if (score >= 90) return 'Conforme';
  if (score >= 70) return 'Observado';
  return 'No Conforme';
}

export function getComplianceColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

export function getComplianceBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getComplianceBadgeClass(score: number): string {
  if (score >= 90) return 'badge-closed';
  if (score >= 70) return 'badge-review';
  return 'badge-draft';
}
