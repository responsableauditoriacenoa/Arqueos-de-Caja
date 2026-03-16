import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Flag, Lightbulb, Plus, Trash2, Save,
  AlertTriangle, CheckCircle, Info,
} from 'lucide-react';
import { useAuditStore, useConfigStore } from '../store';
import { useToast } from '../components/common/Toast';
import { Card, Alert } from '../components/common';
import { clsx } from '../utils/formatters';
import type { Finding, Recommendation, RubricKey } from '../types';
import { SEVERITY_LABEL } from '../constants';

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const SEVERITY_ICONS = {
  baja:  <CheckCircle size={14} className="text-emerald-500" />,
  media: <Info size={14} className="text-amber-500" />,
  alta:  <AlertTriangle size={14} className="text-red-500" />,
};

const SEVERITY_CLASS = {
  baja:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  alta:  'bg-red-50 text-red-700 border-red-200',
};

// ─── Finding Form ─────────────────────────────────────────────────────────────

const findingSchema = z.object({
  descripcion:      z.string().min(5, 'Ingresá una descripción'),
  gravedad:         z.enum(['baja', 'media', 'alta']),
  rubricaAsociada:  z.string().optional(),
});

type FindingFormData = z.infer<typeof findingSchema>;

// ─── Recommendation Form ──────────────────────────────────────────────────────

const recSchema = z.object({
  descripcion:  z.string().min(5, 'Ingresá una recomendación'),
  hallazgoId:   z.string().optional(),
});

type RecFormData = z.infer<typeof recSchema>;

// ─── Comments / final section ─────────────────────────────────────────────────

export default function AuditFindings() {
  const { current, update } = useAuditStore();
  const { config } = useConfigStore();
  const { addToast } = useToast();

  const [addingFinding, setAddingFinding]     = React.useState(false);
  const [addingRec,     setAddingRec]         = React.useState(false);

  const findingForm = useForm<FindingFormData>({
    resolver: zodResolver(findingSchema),
    defaultValues: { gravedad: 'media' },
  });

  const recForm = useForm<RecFormData>({
    resolver: zodResolver(recSchema),
  });

  if (!current) return null;

  // ── Handlers ──

  const saveFinding = (data: FindingFormData) => {
    const finding: Finding = {
      id: nextId(),
      auditoriaId: current.id,
      descripcion: data.descripcion,
      gravedad: data.gravedad,
      rubricaAsociada: data.rubricaAsociada as RubricKey | undefined,
    };
    update(current.id, { hallazgos: [...current.hallazgos, finding] });
    addToast('Hallazgo registrado', 'success');
    findingForm.reset({ gravedad: 'media' });
    setAddingFinding(false);
  };

  const deleteFinding = (fid: string) => {
    update(current.id, { hallazgos: current.hallazgos.filter(f => f.id !== fid) });
  };

  const saveRec = (data: RecFormData) => {
    const rec: Recommendation = {
      id: nextId(),
      auditoriaId: current.id,
      descripcion: data.descripcion,
      hallazgoId: data.hallazgoId,
    };
    update(current.id, { recomendaciones: [...current.recomendaciones, rec] });
    addToast('Recomendación registrada', 'success');
    recForm.reset();
    setAddingRec(false);
  };

  const deleteRec = (rid: string) => {
    update(current.id, { recomendaciones: current.recomendaciones.filter(r => r.id !== rid) });
  };

  return (
    <div className="space-y-5">
      {/* Hallazgos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-red-500" />
            <h3 className="section-title">Hallazgos</h3>
            {current.hallazgos.length > 0 && (
              <span className="badge bg-red-50 text-red-600">{current.hallazgos.length}</span>
            )}
          </div>
          {!addingFinding && (
            <button className="btn-primary btn btn-sm" onClick={() => setAddingFinding(true)}>
              <Plus size={13} /> Agregar Hallazgo
            </button>
          )}
        </div>

        {/* Finding form */}
        {addingFinding && (
          <form onSubmit={findingForm.handleSubmit(saveFinding)} className="mb-4 p-4 bg-surface-50 rounded-xl border border-surface-200 space-y-3">
            <h4 className="text-sm font-semibold text-surface-700">Nuevo Hallazgo</h4>
            <div>
              <label className="form-label">Descripción *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describa el hallazgo encontrado durante la auditoría…"
                {...findingForm.register('descripcion')}
              />
              {findingForm.formState.errors.descripcion && (
                <p className="form-error">{findingForm.formState.errors.descripcion.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Gravedad *</label>
                <div className="flex gap-2">
                  {(['baja', 'media', 'alta'] as const).map(g => {
                    const checked = findingForm.watch('gravedad') === g;
                    return (
                      <label
                        key={g}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all',
                          checked ? SEVERITY_CLASS[g] : 'border-surface-200 text-surface-500 hover:border-surface-300'
                        )}
                      >
                        <input type="radio" value={g} className="sr-only" {...findingForm.register('gravedad')} />
                        {SEVERITY_ICONS[g]}
                        {SEVERITY_LABEL[g]}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="form-label">Rubro Asociado</label>
                <select className="form-select" {...findingForm.register('rubricaAsociada')}>
                  <option value="">General</option>
                  {config.rubros.map(r => (
                    <option key={r.key} value={r.key}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary btn btn-sm" onClick={() => setAddingFinding(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary btn btn-sm">
                <Save size={13} /> Guardar
              </button>
            </div>
          </form>
        )}

        {/* Findings list */}
        {current.hallazgos.length === 0 && !addingFinding ? (
          <p className="text-sm text-surface-400 py-4 text-center">No hay hallazgos registrados</p>
        ) : (
          <div className="space-y-2">
            {current.hallazgos.map((f, i) => (
              <div
                key={f.id}
                className={clsx(
                  'flex gap-3 p-3 rounded-xl border text-sm',
                  SEVERITY_CLASS[f.gravedad]
                )}
              >
                <div className="mt-0.5">{SEVERITY_ICONS[f.gravedad]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-xs">
                      Hallazgo {i + 1}
                      {f.rubricaAsociada && ` · ${config.rubros.find(r => r.key === f.rubricaAsociada)?.nombre}`}
                    </span>
                    <span className={clsx('badge text-[10px]', SEVERITY_CLASS[f.gravedad])}>
                      {SEVERITY_LABEL[f.gravedad]}
                    </span>
                  </div>
                  <p className="text-xs opacity-90">{f.descripcion}</p>
                </div>
                <button
                  onClick={() => deleteFinding(f.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recomendaciones */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" />
            <h3 className="section-title">Recomendaciones</h3>
            {current.recomendaciones.length > 0 && (
              <span className="badge bg-amber-50 text-amber-600">{current.recomendaciones.length}</span>
            )}
          </div>
          {!addingRec && (
            <button className="btn-secondary btn btn-sm" onClick={() => setAddingRec(true)}>
              <Plus size={13} /> Agregar Recomendación
            </button>
          )}
        </div>

        {addingRec && (
          <form onSubmit={recForm.handleSubmit(saveRec)} className="mb-4 p-4 bg-surface-50 rounded-xl border border-surface-200 space-y-3">
            <h4 className="text-sm font-semibold text-surface-700">Nueva Recomendación</h4>
            <div>
              <label className="form-label">Descripción *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describa la acción correctiva o mejora recomendada…"
                {...recForm.register('descripcion')}
              />
              {recForm.formState.errors.descripcion && (
                <p className="form-error">{recForm.formState.errors.descripcion.message}</p>
              )}
            </div>
            {current.hallazgos.length > 0 && (
              <div>
                <label className="form-label">Hallazgo Asociado (opcional)</label>
                <select className="form-select" {...recForm.register('hallazgoId')}>
                  <option value="">Sin hallazgo específico</option>
                  {current.hallazgos.map((f, i) => (
                    <option key={f.id} value={f.id}>
                      Hallazgo {i + 1}: {f.descripcion.slice(0, 50)}…
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary btn btn-sm" onClick={() => setAddingRec(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary btn btn-sm">
                <Save size={13} /> Guardar
              </button>
            </div>
          </form>
        )}

        {current.recomendaciones.length === 0 && !addingRec ? (
          <p className="text-sm text-surface-400 py-4 text-center">No hay recomendaciones registradas</p>
        ) : (
          <div className="space-y-2">
            {current.recomendaciones.map((r, i) => {
              const linked = current.hallazgos.find(f => f.id === r.hallazgoId);
              return (
                <div key={r.id} className="flex gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm">
                  <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-700 text-xs mb-0.5">
                      Recomendación {i + 1}
                      {linked && ` · Ref. Hallazgo "${linked.descripcion.slice(0, 30)}…"`}
                    </p>
                    <p className="text-xs text-amber-900/80">{r.descripcion}</p>
                  </div>
                  <button
                    onClick={() => deleteRec(r.id)}
                    className="text-amber-400 hover:text-amber-600 transition-colors mt-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {current.hallazgos.length === 0 && current.recomendaciones.length === 0 && (
        <Alert variant="info">
          <Info size={15} />
          <span className="text-xs">
            Esta sección es opcional. Si no hay hallazgos ni recomendaciones relevantes, podés continuar directamente a las Firmas.
          </span>
        </Alert>
      )}
    </div>
  );
}
