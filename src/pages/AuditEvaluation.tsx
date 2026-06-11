import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { useAuditStore, useConfigStore } from '../store';
import { useToast } from '../components/common/Toast';
import { ComplianceBar, Alert } from '../components/common';
import { calcRubric, calcWeightedCompliance } from '../services/auditService';
import { formatCurrency, formatPercent, clsx } from '../utils/formatters';
import {
  getComplianceColor,
  getBilleteoComplianceByDifference,
  RUBRIC_COLORS, RUBRIC_ICONS,
} from '../constants';
import type { RubricKey, RubricDetail } from '../types';

interface RubricItemForm {
  descripcion?: string;
  detalle?: string;
  monto?: string;
  fecha?: string;
  hallazgo?: string;
  nroCupon?: string;
  nroCheque?: string;
  codigoVale?: string;
  destino?: string;
  cantidadDiasVencidos?: string;
}

interface RubricFormData {
  valorEsperado: string;
  valorObservado: string;
  observaciones: string;
  items: RubricItemForm[];
}

const COUNT_RUBRICS = new Set<RubricKey>(['cupones', 'depositos', 'vales', 'transferencias']);

const RUBRIC_META: Record<RubricKey, {
  expectedLabel: string;
  observedLabel: string;
}> = {
  billeteo: {
    expectedLabel: 'Valor Esperado / Arqueo *',
    observedLabel: 'Valor Observado *',
  },
  cupones: {
    expectedLabel: 'Cantidad de Cupones Esperada *',
    observedLabel: 'Cantidad de Cupones con Observación *',
  },
  depositos: {
    expectedLabel: 'Cantidad de Valores Esperada *',
    observedLabel: 'Cantidad de Valores Observados *',
  },
  vales: {
    expectedLabel: 'Cantidad de Vales Esperada *',
    observedLabel: 'Cantidad de Vales Físicos *',
  },
  transferencias: {
    expectedLabel: 'Cantidad Esperada de Transferencias *',
    observedLabel: 'Cantidad de Transferencias Pendientes de Recepción o Entrega *',
  },
};

const createEmptyItem = (rubricKey: RubricKey): RubricItemForm => {
  if (rubricKey === 'cupones') {
    return { nroCupon: '', fecha: '', detalle: '', monto: '', hallazgo: '' };
  }
  if (rubricKey === 'depositos') {
    return { nroCheque: '', fecha: '', detalle: '', monto: '', hallazgo: '' };
  }
  if (rubricKey === 'vales') {
    return { detalle: '', codigoVale: '', monto: '', fecha: '', cantidadDiasVencidos: '', hallazgo: '' };
  }
  if (rubricKey === 'transferencias') {
    return { destino: '', fecha: '', detalle: '', monto: '', hallazgo: '' };
  }
  return { descripcion: '', monto: '' };
};

const emptyForm = (): RubricFormData => ({
  valorEsperado: '',
  valorObservado: '',
  observaciones: '',
  items: [],
});

function RubricSection({
  rubricKey,
  nombre,
  peso,
  saved,
  onSave,
}: {
  rubricKey: RubricKey;
  nombre: string;
  peso: number;
  saved?: RubricDetail;
  onSave: (key: RubricKey, data: RubricFormData) => void;
}) {
  const [open, setOpen] = React.useState(!saved);
  const isCountRubric = COUNT_RUBRICS.has(rubricKey);
  const { register, handleSubmit, control, watch } = useForm<RubricFormData>({
    defaultValues: saved
      ? {
          valorEsperado: String(saved.valorEsperado),
          valorObservado: String(saved.valorObservado),
          observaciones: saved.observaciones,
          items: saved.items.map(i => ({
            descripcion: i.descripcion ?? '',
            detalle: i.detalle ?? '',
            monto: i.monto !== undefined ? String(i.monto) : '',
            fecha: i.fecha ?? '',
            hallazgo: i.hallazgo ?? '',
            nroCupon: i.nroCupon ?? '',
            nroCheque: i.nroCheque ?? '',
            codigoVale: i.codigoVale ?? '',
            destino: i.destino ?? '',
            cantidadDiasVencidos: i.cantidadDiasVencidos !== undefined ? String(i.cantidadDiasVencidos) : '',
          })),
        }
      : emptyForm(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const esperado = isCountRubric
    ? parseInt(watch('valorEsperado')) || 0
    : parseFloat(watch('valorEsperado')) || 0;
  const observado = isCountRubric
    ? parseInt(watch('valorObservado')) || 0
    : parseFloat(watch('valorObservado')) || 0;
  const diff = observado - esperado;

  let cumpl = 100;
  if (rubricKey === 'billeteo') {
    cumpl = getBilleteoComplianceByDifference(diff);
  } else if (isCountRubric) {
    cumpl = esperado > 0
      ? Math.max(0, Math.min(100, Math.round((1 - (observado / esperado)) * 100)))
      : (observado === 0 ? 100 : 0);
  } else if (esperado > 0) {
    cumpl = Math.max(0, Math.min(100, Math.round((observado / esperado) * 100)));
  }

  const submit = (data: RubricFormData) => {
    onSave(rubricKey, data);
  };

  const showDetailTable = isCountRubric ? observado > 0 : fields.length > 0;

  const renderDetailHeaders = () => {
    if (rubricKey === 'cupones') {
      return (
        <>
          <th className="table-th">Nro Cupon</th>
          <th className="table-th">Fecha</th>
          <th className="table-th">Detalle</th>
          <th className="table-th">Importe</th>
          <th className="table-th">Hallazgo</th>
          <th className="table-th text-center">Acción</th>
        </>
      );
    }
    if (rubricKey === 'depositos') {
      return (
        <>
          <th className="table-th">Nro cheque</th>
          <th className="table-th">Fecha</th>
          <th className="table-th">Detalle</th>
          <th className="table-th">Importe</th>
          <th className="table-th">Hallazgo</th>
          <th className="table-th text-center">Acción</th>
        </>
      );
    }
    if (rubricKey === 'vales') {
      return (
        <>
          <th className="table-th">Detalle</th>
          <th className="table-th">Codigo del vale</th>
          <th className="table-th">Importe</th>
          <th className="table-th">Fecha</th>
          <th className="table-th">Cantidad Dias Vencidos</th>
          <th className="table-th">Hallazgo</th>
          <th className="table-th text-center">Acción</th>
        </>
      );
    }
    if (rubricKey === 'transferencias') {
      return (
        <>
          <th className="table-th">Destino</th>
          <th className="table-th">Fecha</th>
          <th className="table-th">Detalle</th>
          <th className="table-th">Importe</th>
          <th className="table-th">Hallazgo</th>
          <th className="table-th text-center">Acción</th>
        </>
      );
    }
    return (
      <>
        <th className="table-th">Descripción</th>
        <th className="table-th">Monto</th>
        <th className="table-th text-center">Acción</th>
      </>
    );
  };

  const renderDetailRow = (index: number, fieldId: string) => {
    if (rubricKey === 'cupones') {
      return (
        <tr key={fieldId} className="table-row">
          <td className="table-td"><input className="form-input" {...register(`items.${index}.nroCupon` as const)} /></td>
          <td className="table-td"><input type="date" className="form-input" {...register(`items.${index}.fecha` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.detalle` as const)} /></td>
          <td className="table-td"><input type="number" step="0.01" className="form-input" {...register(`items.${index}.monto` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.hallazgo` as const)} /></td>
          <td className="table-td text-center">
            <button type="button" onClick={() => remove(index)} className="btn-ghost btn p-2"><Trash2 size={14} className="text-red-400" /></button>
          </td>
        </tr>
      );
    }

    if (rubricKey === 'depositos') {
      return (
        <tr key={fieldId} className="table-row">
          <td className="table-td"><input className="form-input" {...register(`items.${index}.nroCheque` as const)} /></td>
          <td className="table-td"><input type="date" className="form-input" {...register(`items.${index}.fecha` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.detalle` as const)} /></td>
          <td className="table-td"><input type="number" step="0.01" className="form-input" {...register(`items.${index}.monto` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.hallazgo` as const)} /></td>
          <td className="table-td text-center">
            <button type="button" onClick={() => remove(index)} className="btn-ghost btn p-2"><Trash2 size={14} className="text-red-400" /></button>
          </td>
        </tr>
      );
    }

    if (rubricKey === 'vales') {
      return (
        <tr key={fieldId} className="table-row">
          <td className="table-td"><input className="form-input" {...register(`items.${index}.detalle` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.codigoVale` as const)} /></td>
          <td className="table-td"><input type="number" step="0.01" className="form-input" {...register(`items.${index}.monto` as const)} /></td>
          <td className="table-td"><input type="date" className="form-input" {...register(`items.${index}.fecha` as const)} /></td>
          <td className="table-td"><input type="number" step="1" min={0} className="form-input" {...register(`items.${index}.cantidadDiasVencidos` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.hallazgo` as const)} /></td>
          <td className="table-td text-center">
            <button type="button" onClick={() => remove(index)} className="btn-ghost btn p-2"><Trash2 size={14} className="text-red-400" /></button>
          </td>
        </tr>
      );
    }

    if (rubricKey === 'transferencias') {
      return (
        <tr key={fieldId} className="table-row">
          <td className="table-td"><input className="form-input" {...register(`items.${index}.destino` as const)} /></td>
          <td className="table-td"><input type="date" className="form-input" {...register(`items.${index}.fecha` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.detalle` as const)} /></td>
          <td className="table-td"><input type="number" step="0.01" className="form-input" {...register(`items.${index}.monto` as const)} /></td>
          <td className="table-td"><input className="form-input" {...register(`items.${index}.hallazgo` as const)} /></td>
          <td className="table-td text-center">
            <button type="button" onClick={() => remove(index)} className="btn-ghost btn p-2"><Trash2 size={14} className="text-red-400" /></button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={fieldId} className="table-row">
        <td className="table-td"><input className="form-input" {...register(`items.${index}.descripcion` as const)} /></td>
        <td className="table-td"><input type="number" step="0.01" className="form-input" {...register(`items.${index}.monto` as const)} /></td>
        <td className="table-td text-center">
          <button type="button" onClick={() => remove(index)} className="btn-ghost btn p-2"><Trash2 size={14} className="text-red-400" /></button>
        </td>
      </tr>
    );
  };

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: RUBRIC_COLORS[rubricKey] + '20' }}
          >
            {RUBRIC_ICONS[rubricKey]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-surface-800 text-sm">{nombre}</span>
              <span className="text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                Peso: {peso}%
              </span>
              {saved && (
                <span className={clsx('text-xs font-semibold', getComplianceColor(saved.cumplimiento))}>
                  {formatPercent(saved.cumplimiento)}
                </span>
              )}
            </div>
            {saved && (
              <div className="mt-1 w-40">
                <ComplianceBar value={saved.cumplimiento} size="sm" showLabel={false} />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              Guardado
            </span>
          )}
          {open ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
        </div>
      </button>

      {open && (
        <form onSubmit={handleSubmit(submit)} className="border-t border-surface-100 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{RUBRIC_META[rubricKey].expectedLabel}</label>
              <input
                type="number"
                step={isCountRubric ? '1' : '0.01'}
                min={0}
                className="form-input"
                placeholder={isCountRubric ? '0' : '0.00'}
                {...register('valorEsperado')}
              />
            </div>
            <div>
              <label className="form-label">{RUBRIC_META[rubricKey].observedLabel}</label>
              <input
                type="number"
                step={isCountRubric ? '1' : '0.01'}
                min={0}
                className="form-input"
                placeholder={isCountRubric ? '0' : '0.00'}
                {...register('valorObservado')}
              />
            </div>
          </div>

          {(esperado > 0 || observado > 0) && (
            rubricKey === 'billeteo' ? (
              <div className="bg-surface-50 rounded-xl p-3 grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Esperado</p>
                  <p className="text-sm font-bold text-surface-700">{formatCurrency(esperado)}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Observado</p>
                  <p className="text-sm font-bold text-surface-700">{formatCurrency(observado)}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Diferencia</p>
                  <p className={clsx('text-sm font-bold', diff === 0 ? 'text-surface-700' : diff > 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Cumplimiento (Escala)</p>
                  <p className={clsx('text-sm font-bold mb-1', getComplianceColor(cumpl))}>
                    {formatPercent(cumpl)}
                  </p>
                  <div className="flex justify-center">
                    <div className="w-24">
                      <ComplianceBar value={cumpl} size="sm" showLabel={false} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-50 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Esperado</p>
                  <p className="text-sm font-bold text-surface-700">
                    {isCountRubric ? Math.round(esperado) : formatCurrency(esperado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Observado</p>
                  <p className="text-sm font-bold text-surface-700">
                    {isCountRubric ? Math.round(observado) : formatCurrency(observado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">Cumplimiento</p>
                  <p className={clsx('text-sm font-bold mb-1', getComplianceColor(cumpl))}>
                    {formatPercent(cumpl)}
                  </p>
                  <div className="flex justify-center">
                    <div className="w-24">
                      <ComplianceBar value={cumpl} size="sm" showLabel={false} />
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {showDetailTable && (
            <div>
              <label className="form-label">Detalle de observaciones</label>
              <div className="table-wrapper">
                <table className="table-base">
                  <thead className="table-head">
                    <tr>{renderDetailHeaders()}</tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50 bg-white">
                    {fields.map((f, i) => renderDetailRow(i, f.id))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!isCountRubric || observado > 0) && (
            <button
              type="button"
              className="btn-ghost btn btn-sm text-surface-500"
              onClick={() => append(createEmptyItem(rubricKey))}
            >
              <Plus size={13} /> Agregar registro de detalle
            </button>
          )}

          <div>
            <label className="form-label">Observaciones del Rubro</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Notas, aclaraciones o irregularidades encontradas en este rubro…"
              {...register('observaciones')}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary btn">
              <Save size={14} /> Guardar Rubro
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AuditEvaluation() {
  const { current, update } = useAuditStore();
  const { config } = useConfigStore();
  const { addToast } = useToast();

  if (!current) return null;

  const handleSaveRubric = async (key: RubricKey, data: RubricFormData) => {
    const isCountRubric = COUNT_RUBRICS.has(key);

    const items = (data.items || [])
      .map(i => ({
        descripcion: i.descripcion?.trim() || undefined,
        detalle: i.detalle?.trim() || undefined,
        monto: i.monto ? (parseFloat(i.monto) || 0) : undefined,
        fecha: i.fecha?.trim() || undefined,
        hallazgo: i.hallazgo?.trim() || undefined,
        nroCupon: i.nroCupon?.trim() || undefined,
        nroCheque: i.nroCheque?.trim() || undefined,
        codigoVale: i.codigoVale?.trim() || undefined,
        destino: i.destino?.trim() || undefined,
        cantidadDiasVencidos: i.cantidadDiasVencidos ? (parseInt(i.cantidadDiasVencidos) || 0) : undefined,
      }))
      .filter(i => Object.values(i).some(v => v !== undefined && v !== ''));

    const detail = calcRubric(
      {
        valorEsperado: isCountRubric ? (parseInt(data.valorEsperado) || 0) : (parseFloat(data.valorEsperado) || 0),
        valorObservado: isCountRubric ? (parseInt(data.valorObservado) || 0) : (parseFloat(data.valorObservado) || 0),
        observaciones: data.observaciones,
        items,
      },
      key,
      current.id,
    );

    const existing = current.rubros.filter(r => r.rubrica !== key);
    const newRubros = [...existing, detail];
    try {
      await update(current.id, { rubros: newRubros });
      addToast(`Rubro "${config.rubros.find(r => r.key === key)?.nombre}" guardado`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo guardar el rubro.', 'error');
    }
  };

  const totalCumpl = calcWeightedCompliance(current.rubros, config);
  const rubricsOrdered = [...config.rubros].sort((a, b) => a.orden - b.orden);
  const completedCount = current.rubros.length;
  const total = config.rubros.length;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-surface-700 flex items-center gap-1.5">
            <TrendingUp size={15} className="text-brand-500" />
            Progreso de Evaluación
          </span>
          <span className="text-xs text-surface-400">{completedCount}/{total} rubros completados</span>
        </div>
        <ComplianceBar value={(completedCount / total) * 100} size="sm" showLabel={false} />

        {completedCount === total && (
          <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
            <span className="text-sm font-medium text-surface-600">Cumplimiento Total Ponderado</span>
            <div className="flex items-center gap-3">
              <div className="w-32">
                <ComplianceBar value={totalCumpl} size="sm" />
              </div>
              <span className={clsx('text-sm font-bold', totalCumpl >= 90 ? 'text-emerald-600' : totalCumpl >= 70 ? 'text-amber-600' : 'text-red-600')}>
                {formatPercent(totalCumpl)}
              </span>
            </div>
          </div>
        )}
      </div>

      {current.estado === 'cerrada' && (
        <Alert variant="warning">
          Esta auditoría está cerrada. Los datos son de solo lectura.
        </Alert>
      )}

      {rubricsOrdered.map(r => (
        <RubricSection
          key={r.key}
          rubricKey={r.key}
          nombre={r.nombre}
          peso={r.peso}
          saved={current.rubros.find(rd => rd.rubrica === r.key)}
          onSave={handleSaveRubric}
        />
      ))}

      {current.rubros.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Resumen por Rubro</h3>
          <div className="table-wrapper">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Rubro</th>
                  <th className="table-th text-right">Esperado</th>
                  <th className="table-th text-right">Observado</th>
                  <th className="table-th text-right">Diferencia</th>
                  <th className="table-th">Cumplimiento</th>
                  <th className="table-th text-center">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {current.rubros
                  .sort((a, b) => {
                    const ao = config.rubros.find(r => r.key === a.rubrica)?.orden ?? 99;
                    const bo = config.rubros.find(r => r.key === b.rubrica)?.orden ?? 99;
                    return ao - bo;
                  })
                  .map(r => {
                    const cfg = config.rubros.find(c => c.key === r.rubrica);
                    const isCountRubric = COUNT_RUBRICS.has(r.rubrica);
                    return (
                      <tr key={r.id} className="table-row">
                        <td className="table-td font-medium">{cfg?.nombre ?? r.rubrica}</td>
                        <td className="table-td text-right">{isCountRubric ? Math.round(r.valorEsperado) : formatCurrency(r.valorEsperado)}</td>
                        <td className="table-td text-right">{isCountRubric ? Math.round(r.valorObservado) : formatCurrency(r.valorObservado)}</td>
                        <td className={clsx('table-td text-right font-semibold', isCountRubric ? 'text-surface-400' : r.diferencia === 0 ? '' : r.diferencia > 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {isCountRubric ? '—' : `${r.diferencia >= 0 ? '+' : ''}${formatCurrency(r.diferencia)}`}
                        </td>
                        <td className="table-td w-32">
                          <ComplianceBar value={r.cumplimiento} size="sm" />
                        </td>
                        <td className="table-td text-center">
                          <span className="text-xs bg-surface-100 px-2 py-0.5 rounded-full text-surface-600">
                            {cfg?.peso}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
