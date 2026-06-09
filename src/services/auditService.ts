import type {
  Audit, RubricDetail, RubricKey, AppConfig, DashboardStats,
} from '../types';
import type { RubricFormData } from '../types';
import { DEFAULT_CONFIG, getBilleteoComplianceByDifference, getComplianceResult } from '../constants';
import { readLegacySnapshot } from './localStorageMigration';
import { supabase } from './supabaseClient';

export interface StorageInfo {
  client: string;
  sqlitePath: string | null;
}

interface AuditRow {
  id: string;
  numero: string;
  fecha: string;
  sucursal_id: string;
  sucursal_nombre: string;
  auditor: string;
  responsable: string;
  tipo: Audit['tipo'];
  estado: Audit['estado'];
  observacion_general: string;
  rubros: RubricDetail[];
  hallazgos: Audit['hallazgos'];
  recomendaciones: Audit['recomendaciones'];
  firmas: Audit['firmas'];
  cumplimiento_total: number;
  resultado_final: string;
  creado_en: string;
  actualizado_en: string;
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSupabaseMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

function mapAudit(row: AuditRow): Audit {
  return {
    id: row.id,
    numero: row.numero,
    fecha: row.fecha,
    sucursalId: row.sucursal_id,
    sucursalNombre: row.sucursal_nombre,
    auditor: row.auditor,
    responsable: row.responsable,
    tipo: row.tipo,
    estado: row.estado,
    observacionGeneral: row.observacion_general,
    rubros: row.rubros || [],
    hallazgos: row.hallazgos || [],
    recomendaciones: row.recomendaciones || [],
    firmas: row.firmas || [],
    cumplimientoTotal: row.cumplimiento_total,
    resultadoFinal: row.resultado_final,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}

function serializeAudit(audit: Audit): AuditRow {
  return {
    id: audit.id,
    numero: audit.numero,
    fecha: audit.fecha,
    sucursal_id: audit.sucursalId,
    sucursal_nombre: audit.sucursalNombre,
    auditor: audit.auditor,
    responsable: audit.responsable,
    tipo: audit.tipo,
    estado: audit.estado,
    observacion_general: audit.observacionGeneral || '',
    rubros: audit.rubros || [],
    hallazgos: audit.hallazgos || [],
    recomendaciones: audit.recomendaciones || [],
    firmas: audit.firmas || [],
    cumplimiento_total: audit.cumplimientoTotal || 0,
    resultado_final: audit.resultadoFinal || '',
    creado_en: audit.creadoEn,
    actualizado_en: audit.actualizadoEn,
  };
}

export function calcRubric(data: RubricFormData, key: RubricKey, auditoriaId: string): RubricDetail {
  const esperado = Number(data.valorEsperado) || 0;
  const observado = Number(data.valorObservado) || 0;
  const diferencia = observado - esperado;
  const isCountRubric = key === 'cupones' || key === 'depositos' || key === 'vales' || key === 'transferencias';
  let cumplimiento = 100;
  if (key === 'billeteo') {
    cumplimiento = getBilleteoComplianceByDifference(diferencia);
  } else if (isCountRubric) {
    if (esperado > 0) {
      cumplimiento = Math.max(0, Math.min(100, Math.round((1 - observado / esperado) * 100)));
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
    items: (data.items || []).map((item) => ({ ...item, id: nextId() })),
  };
}

export function calcWeightedCompliance(rubros: RubricDetail[], config: AppConfig): number {
  if (!rubros.length) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const rubro of rubros) {
    const cfg = config.rubros.find((item) => item.key === rubro.rubrica);
    if (!cfg) continue;
    weighted += rubro.cumplimiento * cfg.peso;
    totalWeight += cfg.peso;
  }
  if (totalWeight === 0) return 0;
  return Math.round(weighted / totalWeight);
}

function recalcRubric(detail: RubricDetail): RubricDetail {
  return calcRubric(
    {
      valorEsperado: detail.valorEsperado,
      valorObservado: detail.valorObservado,
      observaciones: detail.observaciones,
      items: detail.items || [],
    },
    detail.rubrica,
    detail.auditoriaId,
  );
}

function normalizeAuditForPersistence(audit: Audit, config: AppConfig): Audit {
  const rubros = Array.isArray(audit.rubros) ? audit.rubros.map((rubro) => ({
    ...recalcRubric(rubro),
    id: rubro.id || nextId(),
    auditoriaId: audit.id,
  })) : [];
  const cumplimientoTotal = calcWeightedCompliance(rubros, config);
  const resultadoFinal = rubros.length > 0 ? getComplianceResult(cumplimientoTotal) : '';

  return {
    ...audit,
    rubros,
    hallazgos: audit.hallazgos || [],
    recomendaciones: audit.recomendaciones || [],
    firmas: audit.firmas || [],
    observacionGeneral: audit.observacionGeneral || '',
    cumplimientoTotal,
    resultadoFinal,
  };
}

async function nextAuditNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_audit_number');
  if (error) {
    throw new Error(getSupabaseMessage(error, 'No se pudo generar el numero de auditoria.'));
  }
  return String(data);
}

export async function getAllAudits(): Promise<Audit[]> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .order('actualizado_en', { ascending: false });

  if (error) throw new Error(getSupabaseMessage(error, 'No se pudieron cargar las auditorias.'));
  return ((data || []) as AuditRow[]).map(mapAudit);
}

export async function getAuditById(id: string): Promise<Audit | undefined> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(getSupabaseMessage(error, 'No se pudo cargar la auditoria.'));
  return data ? mapAudit(data as AuditRow) : undefined;
}

export async function createAudit(data: Partial<Audit>): Promise<Audit> {
  const config = await getConfig();
  const now = new Date().toISOString();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const audit = normalizeAuditForPersistence({
      id: nextId(),
      numero: await nextAuditNumber(),
      fecha: data.fecha || now.slice(0, 10),
      sucursalId: data.sucursalId || '',
      sucursalNombre: data.sucursalNombre || '',
      auditor: data.auditor || '',
      responsable: data.responsable || '',
      tipo: data.tipo || 'rutinaria',
      estado: data.estado || 'borrador',
      observacionGeneral: data.observacionGeneral || '',
      rubros: [],
      hallazgos: [],
      recomendaciones: [],
      firmas: [],
      cumplimientoTotal: 0,
      resultadoFinal: '',
      creadoEn: now,
      actualizadoEn: now,
    }, config);

    const { data: inserted, error } = await supabase
      .from('audits')
      .insert(serializeAudit(audit))
      .select()
      .single();

    if (!error) return mapAudit(inserted as AuditRow);
    lastError = error;
    if (!getSupabaseMessage(error, '').includes('duplicate')) break;
  }

  throw new Error(getSupabaseMessage(lastError, 'No se pudo crear la auditoria.'));
}

export async function updateAudit(id: string, changes: Partial<Audit>): Promise<Audit | null> {
  const existing = await getAuditById(id);
  if (!existing) return null;

  const config = await getConfig();
  const updated = normalizeAuditForPersistence({
    ...existing,
    ...changes,
    id: existing.id,
    numero: existing.numero,
    creadoEn: existing.creadoEn,
    actualizadoEn: new Date().toISOString(),
  }, config);

  const { data, error } = await supabase
    .from('audits')
    .update(serializeAudit(updated))
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(getSupabaseMessage(error, 'No se pudo actualizar la auditoria.'));
  return mapAudit(data as AuditRow);
}

export async function deleteAudit(id: string): Promise<void> {
  const { error } = await supabase
    .from('audits')
    .delete()
    .eq('id', id);

  if (error) throw new Error(getSupabaseMessage(error, 'No se pudo eliminar la auditoria.'));
}

export async function getConfig(): Promise<AppConfig> {
  const { data, error } = await supabase
    .from('app_config')
    .select('data')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw new Error(getSupabaseMessage(error, 'No se pudo cargar la configuracion.'));
  if (data?.data) return data.data as AppConfig;

  return saveConfig(DEFAULT_CONFIG);
}

export async function saveConfig(cfg: AppConfig): Promise<AppConfig> {
  const { data, error } = await supabase
    .from('app_config')
    .upsert({
      id: 1,
      data: cfg,
      updated_at: new Date().toISOString(),
    })
    .select('data')
    .single();

  if (error) throw new Error(getSupabaseMessage(error, 'No se pudo guardar la configuracion.'));
  return data.data as AppConfig;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const audits = await getAllAudits();
  const closed = audits.filter((audit) => audit.estado === 'cerrada');
  const avg = closed.length
    ? Math.round(closed.reduce((sum, audit) => sum + audit.cumplimientoTotal, 0) / closed.length)
    : 0;

  const branchMap: Record<string, number> = {};
  for (const audit of audits) {
    branchMap[audit.sucursalNombre] = (branchMap[audit.sucursalNombre] || 0) + 1;
  }

  const monthMap: Record<string, number[]> = {};
  for (const audit of closed) {
    const month = audit.fecha.slice(0, 7);
    if (!monthMap[month]) monthMap[month] = [];
    monthMap[month].push(audit.cumplimientoTotal);
  }

  const months = Object.keys(monthMap).sort().slice(-6);

  return {
    total: audits.length,
    borradores: audits.filter((audit) => audit.estado === 'borrador').length,
    abiertas: audits.filter((audit) => audit.estado === 'abierta' || audit.estado === 'revision').length,
    cerradas: audits.filter((audit) => audit.estado === 'cerrada').length,
    cumplimientoPromedio: avg,
    ultimasAuditorias: audits.slice(0, 5),
    porSucursal: Object.entries(branchMap).map(([nombre, cantidad]) => ({ nombre, cantidad })),
    cumplimientoPorMes: months.map((mes) => ({
      mes,
      valor: Math.round(monthMap[mes].reduce((sum, value) => sum + value, 0) / monthMap[mes].length),
    })),
  };
}

export async function getStorageInfo(): Promise<StorageInfo> {
  return {
    client: 'supabase',
    sqlitePath: null,
  };
}

export async function migrateLegacyLocalStorage(): Promise<{ created: number; updated: number; importedConfig: boolean }> {
  const snapshot = readLegacySnapshot();
  const config = snapshot.config || await getConfig();
  const incomingAudits = Array.isArray(snapshot.audits) ? snapshot.audits : [];
  let created = 0;
  let updated = 0;

  for (const audit of incomingAudits) {
    const existingById = await getAuditById(audit.id);
    let existing = existingById;

    if (!existing && audit.numero) {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('numero', audit.numero)
        .maybeSingle();

      if (error) throw new Error(getSupabaseMessage(error, 'No se pudo consultar una auditoria existente.'));
      existing = data ? mapAudit(data as AuditRow) : undefined;
    }

    const normalized = normalizeAuditForPersistence({
      ...audit,
      creadoEn: audit.creadoEn || new Date().toISOString(),
      actualizadoEn: audit.actualizadoEn || new Date().toISOString(),
    }, config);

    if (!existing) {
      const { error } = await supabase.from('audits').insert(serializeAudit(normalized));
      if (error) throw new Error(getSupabaseMessage(error, 'No se pudo importar una auditoria.'));
      created += 1;
      continue;
    }

    if (new Date(normalized.actualizadoEn).getTime() > new Date(existing.actualizadoEn).getTime()) {
      const merged = {
        ...normalized,
        id: existing.id,
        numero: existing.numero,
        creadoEn: existing.creadoEn || normalized.creadoEn,
      };
      const { error } = await supabase
        .from('audits')
        .update(serializeAudit(merged))
        .eq('id', existing.id);
      if (error) throw new Error(getSupabaseMessage(error, 'No se pudo actualizar una auditoria importada.'));
      updated += 1;
    }
  }

  if (snapshot.config) {
    await saveConfig(snapshot.config);
  }

  return { created, updated, importedConfig: Boolean(snapshot.config) };
}
