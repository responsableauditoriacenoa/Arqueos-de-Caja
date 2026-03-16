import React from 'react';
import { useNavigate, useParams, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ClipboardCheck, ListChecks, Flag,
  PenLine, FileText,
} from 'lucide-react';
import { useAuditStore } from '../store';
import { StatusBadge, ComplianceBar, PageWrapper } from '../components/common';
import { formatDate, clsx } from '../utils/formatters';
import { TYPE_LABEL } from '../constants';

const AUDIT_TABS = [
  { path: 'evaluacion',    label: 'Evaluación',       icon: ListChecks    },
  { path: 'hallazgos',     label: 'Hallazgos',        icon: Flag          },
  { path: 'firmas',        label: 'Firmas',            icon: PenLine       },
  { path: 'informe',       label: 'Informe',           icon: FileText      },
];

export default function AuditDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { current, loadById } = useAuditStore();

  React.useEffect(() => {
    if (id) loadById(id);
  }, [id]);

  if (!current || current.id !== id) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-24 text-surface-400">
          Cargando auditoría…
        </div>
      </PageWrapper>
    );
  }

  const baseUrl = `/auditoria/${id}`;
  const isActive = (tab: string) => location.pathname.includes(`/${tab}`);

  return (
    <PageWrapper>
      {/* Back */}
      <button
        className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 mb-5 transition-colors"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={15} /> Volver
      </button>

      {/* Audit header card */}
      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck size={22} className="text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-surface-900">{current.numero}</span>
                <StatusBadge status={current.estado} />
              </div>
              <p className="text-sm text-surface-500 mt-0.5">
                {current.sucursalNombre} · {formatDate(current.fecha)} · {TYPE_LABEL[current.tipo]}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Auditor: <strong className="text-surface-600">{current.auditor}</strong>
                {' '}· Responsable: <strong className="text-surface-600">{current.responsable}</strong>
              </p>
            </div>
          </div>

          {current.estado === 'cerrada' && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-surface-400 uppercase font-medium tracking-wide">Cumplimiento Total</span>
              <span className="text-3xl font-bold text-surface-900">{current.cumplimientoTotal}%</span>
              <ComplianceBar value={current.cumplimientoTotal} size="sm" />
              <span className="text-xs font-semibold text-surface-500">{current.resultadoFinal}</span>
            </div>
          )}
        </div>

        {current.observacionGeneral && (
          <div className="mt-4 p-3 bg-surface-50 rounded-xl text-sm text-surface-600 border border-surface-100">
            <span className="font-medium text-surface-700">Obs. general:</span>{' '}
            {current.observacionGeneral}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-100 p-1 rounded-xl overflow-x-auto">
        {AUDIT_TABS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`${baseUrl}/${path}`}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center',
              isActive(path)
                ? 'bg-white text-brand-700 shadow-sm font-semibold'
                : 'text-surface-500 hover:text-surface-700'
            )}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Tab content */}
      <Outlet />
    </PageWrapper>
  );
}
