import { Printer, AlertCircle, Flag, Lightbulb } from 'lucide-react';
import { useAuditStore, useConfigStore } from '../store';
import { Alert, ComplianceBar } from '../components/common';
import {
  formatDate, formatDateLong, formatCurrency, formatPercent, clsx,
} from '../utils/formatters';
import {
  TYPE_LABEL, STATUS_LABEL, SEVERITY_LABEL,
  getComplianceColor, getComplianceBarColor,
} from '../constants';

const COUNT_RUBRICS = new Set(['cupones', 'depositos', 'vales', 'transferencias']);

function rubricValueLabel(key: string): { expected: string; observed: string } {
  if (key === 'cupones') {
    return { expected: 'Cant. Cupones Esperada', observed: 'Cant. Cupones con Observación' };
  }
  if (key === 'depositos') {
    return { expected: 'Cant. Valores Esperada', observed: 'Cant. Valores Observados' };
  }
  if (key === 'vales') {
    return { expected: 'Cant. Vales Esperada', observed: 'Cant. Vales Físicos' };
  }
  if (key === 'transferencias') {
    return { expected: 'Cant. Transferencias Esperada', observed: 'Cant. Transferencias Pendientes' };
  }
  return { expected: 'Valor Esperado', observed: 'Valor Observado' };
}

export default function AuditReport() {

  const { current } = useAuditStore();
  const { config }  = useConfigStore();

  if (!current) return null;

  const isClosed = current.estado === 'cerrada';

  const handlePrint = () => {
    window.print();
  };

  const sigAuditor    = current.firmas.find(f => f.tipo === 'auditor');
  const sigResponsable = current.firmas.find(f => f.tipo === 'responsable');

  return (
    <div>
      {!isClosed && (
        <Alert variant="warning" className="mb-5 no-print">
          <AlertCircle size={15} />
          <span className="text-xs">
            El informe estará disponible una vez que la auditoría sea cerrada con ambas firmas.
          </span>
        </Alert>
      )}

      {/* Print button */}
      <div className="flex justify-end mb-4 no-print">
        <button
          className="btn-primary btn"
          onClick={handlePrint}
          disabled={!isClosed}
        >
          <Printer size={15} /> Imprimir / Exportar PDF
        </button>
      </div>

      {/* REPORT DOCUMENT */}
      <div
        id="audit-report"
        className="bg-white rounded-2xl border border-surface-200 shadow-card-md overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Report Header */}
        <div className="bg-surface-900 text-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-300 uppercase tracking-widest font-medium mb-1">
                Informe de Auditoría Operativa Interna
              </p>
              <h1 className="text-2xl font-bold text-white">{current.numero}</h1>
              <p className="text-sm text-surface-300 mt-1">{config.empresa}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-400">Fecha del Informe</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatDateLong(current.fecha)}
              </p>
              <div className="mt-2">
                <span className={clsx(
                  'inline-block px-3 py-1 rounded-full text-xs font-bold',
                  isClosed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                )}>
                  {STATUS_LABEL[current.estado]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Section 1: General Data */}
          <section>
            <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest mb-3 border-b border-surface-100 pb-2">
              1. Datos Generales
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Número de Auditoría',    value: current.numero },
                { label: 'Fecha',                  value: formatDateLong(current.fecha) },
                { label: 'Tipo de Auditoría',      value: TYPE_LABEL[current.tipo] },
                { label: 'Sucursal / Unidad',      value: current.sucursalNombre },
                { label: 'Auditor Responsable',    value: current.auditor },
                { label: 'Responsable del Sector', value: current.responsable },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-surface-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="font-semibold text-surface-800">{value}</p>
                </div>
              ))}
            </div>

            {current.observacionGeneral && (
              <div className="mt-4 p-3 bg-surface-50 rounded-xl border border-surface-200">
                <p className="text-xs text-surface-500 font-medium mb-0.5">Observación General</p>
                <p className="text-sm text-surface-700">{current.observacionGeneral}</p>
              </div>
            )}
          </section>

          {/* Section 2: Rubric Results */}
          <section>
            <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest mb-3 border-b border-surface-100 pb-2">
              2. Evaluación por Rubros
            </h2>

            {current.rubros.length === 0 ? (
              <p className="text-sm text-surface-400">Sin rubros evaluados</p>
            ) : (
              <div className="space-y-3">
                {[...current.rubros]
                  .sort((a, b) => {
                    const ao = config.rubros.find(r => r.key === a.rubrica)?.orden ?? 99;
                    const bo = config.rubros.find(r => r.key === b.rubrica)?.orden ?? 99;
                    return ao - bo;
                  })
                  .map(rubro => {
                    const cfg = config.rubros.find(c => c.key === rubro.rubrica);
                    const isCountRubric = COUNT_RUBRICS.has(rubro.rubrica);
                    const labels = rubricValueLabel(rubro.rubrica);
                    return (
                      <div key={rubro.id} className="border border-surface-100 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-surface-800">{cfg?.nombre ?? rubro.rubrica}</h3>
                            <span className="text-xs text-surface-400">Ponderación: {cfg?.peso}%</span>
                          </div>
                          <span className={clsx('text-lg font-bold', getComplianceColor(rubro.cumplimiento))}>
                            {formatPercent(rubro.cumplimiento)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div className="text-center p-2 bg-surface-50 rounded-lg">
                            <p className="text-xs text-surface-400 mb-0.5">{labels.expected}</p>
                            <p className="font-bold text-surface-700">{isCountRubric ? Math.round(rubro.valorEsperado) : formatCurrency(rubro.valorEsperado)}</p>
                          </div>
                          <div className="text-center p-2 bg-surface-50 rounded-lg">
                            <p className="text-xs text-surface-400 mb-0.5">{labels.observed}</p>
                            <p className="font-bold text-surface-700">{isCountRubric ? Math.round(rubro.valorObservado) : formatCurrency(rubro.valorObservado)}</p>
                          </div>
                          <div className={clsx(
                            'text-center p-2 rounded-lg',
                            isCountRubric
                              ? 'bg-surface-50'
                              : rubro.diferencia === 0
                                ? 'bg-surface-50'
                                : rubro.diferencia > 0
                                  ? 'bg-emerald-50'
                                  : 'bg-red-50'
                          )}>
                            <p className="text-xs text-surface-400 mb-0.5">Diferencia</p>
                            <p className={clsx(
                              'font-bold',
                              isCountRubric
                                ? 'text-surface-400'
                                : rubro.diferencia === 0
                                  ? 'text-surface-700'
                                  : rubro.diferencia > 0
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                            )}>
                              {isCountRubric ? '—' : `${rubro.diferencia >= 0 ? '+' : ''}${formatCurrency(rubro.diferencia)}`}
                            </p>
                          </div>
                        </div>

                        <ComplianceBar value={rubro.cumplimiento} size="sm" />

                        {rubro.items.length > 0 && (
                          <div className="mt-3 overflow-x-auto rounded-xl border border-surface-100">
                            <table className="min-w-full text-xs divide-y divide-surface-100">
                              <thead className="bg-surface-50">
                                {rubro.rubrica === 'cupones' && (
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Nro Cupon</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Fecha</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Detalle</th>
                                    <th className="px-3 py-2 text-right font-semibold text-surface-500">Importe</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Hallazgo</th>
                                  </tr>
                                )}
                                {rubro.rubrica === 'depositos' && (
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Nro cheque</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Fecha</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Detalle</th>
                                    <th className="px-3 py-2 text-right font-semibold text-surface-500">Importe</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Hallazgo</th>
                                  </tr>
                                )}
                                {rubro.rubrica === 'vales' && (
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Detalle</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Codigo del vale</th>
                                    <th className="px-3 py-2 text-right font-semibold text-surface-500">Importe</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Fecha</th>
                                    <th className="px-3 py-2 text-right font-semibold text-surface-500">Cantidad Dias Vencidos</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Hallazgo</th>
                                  </tr>
                                )}
                                {rubro.rubrica === 'transferencias' && (
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Destino</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Fecha</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Detalle</th>
                                    <th className="px-3 py-2 text-right font-semibold text-surface-500">Importe</th>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Hallazgo</th>
                                  </tr>
                                )}
                                {!COUNT_RUBRICS.has(rubro.rubrica) && (
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-surface-500">Descripción</th>
                                    <th className="px-3 py-2 text-right font-semibold text-surface-500">Monto</th>
                                  </tr>
                                )}
                              </thead>
                              <tbody className="divide-y divide-surface-50">
                                {rubro.items.map(item => (
                                  <tr key={item.id}>
                                    {rubro.rubrica === 'cupones' && (
                                      <>
                                        <td className="px-3 py-2">{item.nroCupon}</td>
                                        <td className="px-3 py-2">{item.fecha}</td>
                                        <td className="px-3 py-2">{item.detalle}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(item.monto ?? 0)}</td>
                                        <td className="px-3 py-2">{item.hallazgo}</td>
                                      </>
                                    )}
                                    {rubro.rubrica === 'depositos' && (
                                      <>
                                        <td className="px-3 py-2">{item.nroCheque}</td>
                                        <td className="px-3 py-2">{item.fecha}</td>
                                        <td className="px-3 py-2">{item.detalle}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(item.monto ?? 0)}</td>
                                        <td className="px-3 py-2">{item.hallazgo}</td>
                                      </>
                                    )}
                                    {rubro.rubrica === 'vales' && (
                                      <>
                                        <td className="px-3 py-2">{item.detalle}</td>
                                        <td className="px-3 py-2">{item.codigoVale}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(item.monto ?? 0)}</td>
                                        <td className="px-3 py-2">{item.fecha}</td>
                                        <td className="px-3 py-2 text-right">{item.cantidadDiasVencidos ?? 0}</td>
                                        <td className="px-3 py-2">{item.hallazgo}</td>
                                      </>
                                    )}
                                    {rubro.rubrica === 'transferencias' && (
                                      <>
                                        <td className="px-3 py-2">{item.destino}</td>
                                        <td className="px-3 py-2">{item.fecha}</td>
                                        <td className="px-3 py-2">{item.detalle}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(item.monto ?? 0)}</td>
                                        <td className="px-3 py-2">{item.hallazgo}</td>
                                      </>
                                    )}
                                    {!COUNT_RUBRICS.has(rubro.rubrica) && (
                                      <>
                                        <td className="px-3 py-2">{item.descripcion}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(item.monto ?? 0)}</td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {rubro.observaciones && (
                          <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-700">
                              <strong>Observaciones:</strong> {rubro.observaciones}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Section 3: Compliance Summary */}
          {isClosed && (
            <section>
              <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest mb-3 border-b border-surface-100 pb-2">
                3. Resultado Final
              </h2>
              <div className="bg-surface-50 rounded-xl p-5 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Cumplimiento Total</p>
                  <p className={clsx('text-5xl font-black', getComplianceColor(current.cumplimientoTotal))}>
                    {current.cumplimientoTotal}%
                  </p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-surface-200 rounded-full h-3 mb-2">
                    <div
                      className={clsx('h-3 rounded-full transition-all', getComplianceBarColor(current.cumplimientoTotal))}
                      style={{ width: `${current.cumplimientoTotal}%` }}
                    />
                  </div>
                  <p className={clsx('text-lg font-bold', getComplianceColor(current.cumplimientoTotal))}>
                    {current.resultadoFinal}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Resultado ponderado según los rubros evaluados
                  </p>
                </div>
              </div>

              {/* Rubric weights table */}
              <div className="mt-3 overflow-x-auto rounded-xl border border-surface-100">
                <table className="min-w-full text-xs divide-y divide-surface-100">
                  <thead className="bg-surface-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-surface-500 uppercase tracking-wider">Rubro</th>
                      <th className="px-4 py-2 text-center font-semibold text-surface-500 uppercase tracking-wider">Peso</th>
                      <th className="px-4 py-2 text-center font-semibold text-surface-500 uppercase tracking-wider">Cumplimiento</th>
                      <th className="px-4 py-2 text-center font-semibold text-surface-500 uppercase tracking-wider">Aporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {[...current.rubros]
                      .sort((a, b) => (config.rubros.find(r => r.key === a.rubrica)?.orden ?? 99) - (config.rubros.find(r => r.key === b.rubrica)?.orden ?? 99))
                      .map(r => {
                        const cfg = config.rubros.find(c => c.key === r.rubrica);
                        const aporte = cfg ? Math.round((r.cumplimiento * cfg.peso) / 100) : 0;
                        return (
                          <tr key={r.id}>
                            <td className="px-4 py-2 font-medium text-surface-700">{cfg?.nombre}</td>
                            <td className="px-4 py-2 text-center text-surface-500">{cfg?.peso}%</td>
                            <td className={clsx('px-4 py-2 text-center font-bold', getComplianceColor(r.cumplimiento))}>
                              {formatPercent(r.cumplimiento)}
                            </td>
                            <td className="px-4 py-2 text-center text-surface-600 font-medium">{aporte}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 4: Findings */}
          {current.hallazgos.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest mb-3 border-b border-surface-100 pb-2">
                4. Hallazgos
              </h2>
              <div className="space-y-2">
                {current.hallazgos.map((f, i) => (
                  <div key={f.id} className="flex gap-3 p-3 rounded-xl border border-surface-100 text-sm">
                    <Flag size={14} className={clsx(
                      'mt-0.5 flex-shrink-0',
                      f.gravedad === 'alta' ? 'text-red-500' : f.gravedad === 'media' ? 'text-amber-500' : 'text-emerald-500'
                    )} />
                    <div>
                      <p className="font-semibold text-surface-700 text-xs mb-0.5">
                        Hallazgo {i + 1} · Gravedad {SEVERITY_LABEL[f.gravedad]}
                        {f.rubricaAsociada && ` · ${config.rubros.find(r => r.key === f.rubricaAsociada)?.nombre}`}
                      </p>
                      <p className="text-surface-600">{f.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Recommendations */}
          {current.recomendaciones.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest mb-3 border-b border-surface-100 pb-2">
                5. Recomendaciones
              </h2>
              <div className="space-y-2">
                {current.recomendaciones.map((r, i) => (
                  <div key={r.id} className="flex gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm">
                    <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-700 text-xs mb-0.5">Recomendación {i + 1}</p>
                      <p className="text-amber-900/80">{r.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 6: Signatures */}
          <section>
            <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest mb-3 border-b border-surface-100 pb-2">
              {current.hallazgos.length > 0 || current.recomendaciones.length > 0 ? '6.' : '4.'} Firmas y Conformidad
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {[sigAuditor, sigResponsable].map((sig, i) => (
                <div key={i} className="border border-surface-200 rounded-xl p-4 text-center">
                  {sig ? (
                    <>
                      <img src={sig.imagen} alt="Firma" className="max-h-20 object-contain mx-auto mb-2" />
                      <div className="border-t border-surface-200 pt-2">
                        <p className="text-sm font-bold text-surface-800">{sig.nombreAclaratorio}</p>
                        <p className="text-xs text-surface-500">{sig.cargo}</p>
                        <p className="text-xs text-surface-400 mt-0.5">{formatDate(sig.fecha)}</p>
                        <p className="text-xs font-semibold text-surface-600 mt-1">
                          {sig.tipo === 'auditor' ? 'Auditor Responsable' : 'Responsable del Sector'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-surface-300 text-xs">
                      {i === 0 ? 'Firma del Auditor' : 'Firma del Responsable'}<br/>pendiente
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-surface-100 pt-4 text-center">
            <p className="text-xs text-surface-400">{config.pieDeInforme}</p>
            <p className="text-xs text-surface-300 mt-1">
              Generado por Sistema de Auditorías Internas · {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
