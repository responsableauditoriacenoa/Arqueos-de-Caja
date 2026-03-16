import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronRight, ChevronLeft, Save, FileText,
  Calendar, Building2, User, Users, Tag, StickyNote,
} from 'lucide-react';
import { useAuditStore, useConfigStore } from '../store';
import { useToast } from '../components/common/Toast';
import { PageWrapper, Card, Alert } from '../components/common';
import { clsx } from '../utils/formatters';
import type { AuditType } from '../types';
import { TYPE_LABEL } from '../constants';

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = z.object({
  fecha:               z.string().min(1, 'La fecha es requerida'),
  sucursalId:          z.string().min(1, 'La sucursal es requerida'),
  auditor:             z.string().min(2, 'El nombre del auditor es requerido'),
  responsable:         z.string().min(2, 'El nombre del responsable es requerido'),
  tipo:                z.enum(['rutinaria', 'sorpresa', 'especial', 'seguimiento']),
  observacionGeneral:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Datos Generales',     description: 'Información básica de la auditoría'      },
  { label: 'Auditor y Sector',    description: 'Responsables del proceso'                },
  { label: 'Tipo y Observación',  description: 'Clasificación y notas iniciales'         },
];

const AUDITOR_OPTIONS = [
  'Auditor Externo',
  'Luis Palacios',
  'Gustazo Zambrano',
  'Nancy Fernandez',
  'Diego Guantay',
];

export default function NewAudit() {
  const navigate  = useNavigate();
  const { create } = useAuditStore();
  const { config } = useConfigStore();
  const { addToast } = useToast();
  const [step, setStep] = React.useState(0);

  const {
    register, handleSubmit, trigger, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha:  new Date().toISOString().slice(0, 10),
      tipo:   'rutinaria',
    },
  });

  const activeBranches = config.sucursales.filter(s => s.activa && s.empresa === config.empresa);

  // Step 0 fields
  const step0Fields: (keyof FormData)[] = ['fecha', 'sucursalId'];
  const step1Fields: (keyof FormData)[] = ['auditor', 'responsable'];
  const step2Fields: (keyof FormData)[] = ['tipo'];

  const goNext = async () => {
    const fields = [step0Fields, step1Fields, step2Fields][step];
    const ok = await trigger(fields);
    if (ok) setStep(s => s + 1);
  };

  const goPrev = () => setStep(s => s - 1);

  const onSubmit = (data: FormData, status: 'borrador' | 'abierta') => {
    const branch = activeBranches.find(b => b.id === data.sucursalId);
    const audit = create({
      ...data,
      sucursalNombre: branch?.nombre ?? '',
      estado: status,
    });
    addToast(`Auditoría ${audit.numero} creada correctamente`, 'success');
    navigate(`/auditoria/${audit.id}`);
  };

  return (
    <PageWrapper className="max-w-2xl">
      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2">
              <div className={clsx(
                'step-dot',
                i < step ? 'step-dot-done' : i === step ? 'step-dot-active' : 'step-dot-pending'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <div className={clsx('hidden sm:block', i === step ? 'text-surface-800' : 'text-surface-400')}>
                <p className="text-xs font-semibold">{s.label}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx(
                'flex-1 h-px mx-3 transition-colors',
                i < step ? 'bg-emerald-400' : 'bg-surface-200'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-surface-900">{STEPS[step].label}</h2>
          <p className="text-sm text-surface-500 mt-0.5">{STEPS[step].description}</p>
        </div>

        <form onSubmit={handleSubmit(d => onSubmit(d, 'abierta'))} noValidate>
          {/* ── Step 0: Datos Generales ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  <Calendar size={13} className="inline mr-1 text-surface-400" />
                  Fecha de Auditoría *
                </label>
                <input
                  type="date"
                  className="form-input"
                  {...register('fecha')}
                />
                {errors.fecha && <p className="form-error">{errors.fecha.message}</p>}
              </div>

              <div>
                <label className="form-label">
                  <Building2 size={13} className="inline mr-1 text-surface-400" />
                  Sucursal / Unidad Auditada *
                </label>
                <select className="form-select" {...register('sucursalId')}>
                  <option value="">Seleccioná una sucursal…</option>
                  {activeBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
                  ))}
                </select>
                {errors.sucursalId && <p className="form-error">{errors.sucursalId.message}</p>}
              </div>
            </div>
          )}

          {/* ── Step 1: Auditor y Responsable ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  <User size={13} className="inline mr-1 text-surface-400" />
                  Auditor Responsable *
                </label>
                <select className="form-select" {...register('auditor')}>
                  <option value="">Seleccioná un auditor…</option>
                  {AUDITOR_OPTIONS.map(auditor => (
                    <option key={auditor} value={auditor}>{auditor}</option>
                  ))}
                </select>
                {errors.auditor && <p className="form-error">{errors.auditor.message}</p>}
              </div>

              <div>
                <label className="form-label">
                  <Users size={13} className="inline mr-1 text-surface-400" />
                  Responsable del Sector Auditado *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre y apellido del responsable"
                  {...register('responsable')}
                />
                {errors.responsable && <p className="form-error">{errors.responsable.message}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Tipo y Observaciones ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  <Tag size={13} className="inline mr-1 text-surface-400" />
                  Tipo de Auditoría *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TYPE_LABEL) as [AuditType, string][]).map(([key, label]) => {
                    const checked = watch('tipo') === key;
                    return (
                      <label
                        key={key}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm',
                          checked
                            ? 'border-brand-400 bg-brand-50 text-brand-700 font-medium'
                            : 'border-surface-200 hover:border-surface-300 text-surface-600'
                        )}
                      >
                        <input
                          type="radio"
                          value={key}
                          className="sr-only"
                          {...register('tipo')}
                        />
                        <div className={clsx(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                          checked ? 'border-brand-500' : 'border-surface-300'
                        )}>
                          {checked && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                        </div>
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label">
                  <StickyNote size={13} className="inline mr-1 text-surface-400" />
                  Observación General Inicial
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Contexto inicial, motivo de la auditoría o notas previas…"
                  {...register('observacionGeneral')}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-surface-100">
            <div>
              {step > 0 && (
                <button type="button" className="btn-secondary btn" onClick={goPrev}>
                  <ChevronLeft size={15} /> Anterior
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {step < STEPS.length - 1 && (
                <button type="button" className="btn-primary btn" onClick={goNext}>
                  Siguiente <ChevronRight size={15} />
                </button>
              )}
              {step === STEPS.length - 1 && (
                <>
                  <button
                    type="button"
                    className="btn-secondary btn"
                    onClick={handleSubmit(d => onSubmit(d, 'borrador'))}
                  >
                    <Save size={15} /> Guardar Borrador
                  </button>
                  <button type="submit" className="btn-primary btn">
                    <FileText size={15} /> Iniciar Auditoría
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Info */}
      <Alert variant="info" className="mt-4">
        <div className="text-xs">
          <strong>Guardado como borrador:</strong> Permite continuar más tarde sin iniciar el proceso formal.
          <br />
          <strong>Iniciar Auditoría:</strong> Pasa al estado Abierta y comienza la evaluación por rubros.
        </div>
      </Alert>
    </PageWrapper>
  );
}
