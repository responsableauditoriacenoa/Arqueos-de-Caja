// ─── Enums ────────────────────────────────────────────────────────────────────

export type AuditStatus = 'borrador' | 'abierta' | 'revision' | 'cerrada';
export type AuditType   = 'rutinaria' | 'sorpresa' | 'especial' | 'seguimiento';
export type RubricKey   = 'billeteo' | 'cupones' | 'depositos' | 'vales' | 'transferencias';
export type SignatureType = 'auditor' | 'responsable';

// ─── Configuration ────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  empresa: string;
  nombre: string;
  codigo: string;
  activa: boolean;
}

export interface RubricConfig {
  key: RubricKey;
  nombre: string;
  peso: number; // 0-100 percentage
  orden: number;
}

export interface AppConfig {
  empresas: string[];
  sucursales: Branch[];
  rubros: RubricConfig[];
  empresa: string;
  logotipo?: string;
  pieDeInforme: string;
}

// ─── Rubric Detail ────────────────────────────────────────────────────────────

export interface RubricDetail {
  id: string;
  auditoriaId: string;
  rubrica: RubricKey;
  valorEsperado: number;
  valorObservado: number;
  diferencia: number; // calculated
  cumplimiento: number; // 0-100 calculated
  observaciones: string;
  items: RubricItem[];
}

export interface RubricItem {
  id: string;
  descripcion?: string;
  detalle?: string;
  monto?: number;
  fecha?: string;
  hallazgo?: string;
  nroCupon?: string;
  nroCheque?: string;
  codigoVale?: string;
  destino?: string;
  cantidadDiasVencidos?: number;
}

// ─── Findings & Recommendations ───────────────────────────────────────────────

export interface Finding {
  id: string;
  auditoriaId: string;
  descripcion: string;
  gravedad: 'baja' | 'media' | 'alta';
  rubricaAsociada?: RubricKey;
}

export interface Recommendation {
  id: string;
  auditoriaId: string;
  descripcion: string;
  hallazgoId?: string;
}

// ─── Signatures ───────────────────────────────────────────────────────────────

export interface Signature {
  id: string;
  auditoriaId: string;
  tipo: SignatureType;
  imagen: string; // base64 data URL
  nombreAclaratorio: string;
  cargo: string;
  fecha: string; // ISO date
}

// ─── Main Audit Entity ────────────────────────────────────────────────────────

export interface Audit {
  id: string;
  numero: string;        // correlative number e.g. "AUD-2026-001"
  fecha: string;         // ISO date
  sucursalId: string;
  sucursalNombre: string;
  auditor: string;
  responsable: string;
  tipo: AuditType;
  estado: AuditStatus;
  observacionGeneral: string;
  rubros: RubricDetail[];
  hallazgos: Finding[];
  recomendaciones: Recommendation[];
  firmas: Signature[];
  cumplimientoTotal: number; // 0-100 weighted
  resultadoFinal: string;    // 'Conforme' | 'Observado' | 'No Conforme'
  creadoEn: string;
  actualizadoEn: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  borradores: number;
  abiertas: number;
  cerradas: number;
  cumplimientoPromedio: number;
  ultimasAuditorias: Audit[];
  porSucursal: { nombre: string; cantidad: number }[];
  cumplimientoPorMes: { mes: string; valor: number }[];
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface AuditFormData {
  fecha: string;
  sucursalId: string;
  auditor: string;
  responsable: string;
  tipo: AuditType;
  observacionGeneral: string;
}

export interface RubricFormData {
  valorEsperado: number;
  valorObservado: number;
  observaciones: string;
  items: {
    descripcion?: string;
    detalle?: string;
    monto?: number;
    fecha?: string;
    hallazgo?: string;
    nroCupon?: string;
    nroCheque?: string;
    codigoVale?: string;
    destino?: string;
    cantidadDiasVencidos?: number;
  }[];
}
