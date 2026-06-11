import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, Trash2, RotateCcw,
  ClipboardList, Calendar, Building2, User,
} from 'lucide-react';
import { useAuditStore, useConfigStore } from '../store';
import {
  PageWrapper, SectionHeader, StatusBadge, ComplianceBar, EmptyState,
} from '../components/common';
import { useToast } from '../components/common/Toast';
import { formatDate } from '../utils/formatters';
import type { AuditStatus, AuditType } from '../types';
import { STATUS_LABEL, TYPE_LABEL } from '../constants';

export default function History() {
  const navigate  = useNavigate();
  const { audits, loadAll, remove, update } = useAuditStore();
  const { config } = useConfigStore();
  const { addToast } = useToast();

  const [search,      setSearch]      = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<AuditStatus | ''>('');
  const [filterBranch, setFilterBranch] = React.useState('');
  const [filterType,   setFilterType]   = React.useState<AuditType | ''>('');
  const [dateFrom,     setDateFrom]     = React.useState('');
  const [dateTo,       setDateTo]       = React.useState('');

  const companyBranches = config.sucursales.filter(b => b.empresa === config.empresa);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filtered = audits.filter(a => {
    if (search && !`${a.numero} ${a.sucursalNombre} ${a.auditor} ${a.responsable}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && a.estado !== filterStatus) return false;
    if (filterBranch && a.sucursalId !== filterBranch) return false;
    if (filterType   && a.tipo !== filterType) return false;
    if (dateFrom && a.fecha < dateFrom) return false;
    if (dateTo   && a.fecha > dateTo)   return false;
    return true;
  });

  const handleDelete = async (id: string, numero: string) => {
    if (!confirm(`¿Eliminar la auditoría ${numero}? Esta acción no se puede deshacer.`)) return;
    try {
      await remove(id);
      addToast(`Auditoría ${numero} eliminada`, 'warning');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo eliminar la auditoría.', 'error');
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await update(id, { estado: 'abierta' });
      addToast('Auditoría reabierta', 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'No se pudo reabrir la auditoría.', 'error');
    }
  };

  const clearFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterBranch('');
    setFilterType(''); setDateFrom(''); setDateTo('');
  };

  const hasFilters = search || filterStatus || filterBranch || filterType || dateFrom || dateTo;

  return (
    <PageWrapper>
      <SectionHeader
        title="Historial de Auditorías"
        subtitle={`${audits.length} auditorías registradas${filtered.length !== audits.length ? ` · ${filtered.length} filtradas` : ''}`}
      />

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="xl:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              className="form-input pl-8"
              placeholder="Buscar auditoría…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as AuditStatus | '')}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {companyBranches.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>

          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="Desde"
          />
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="Hasta"
          />
        </div>

        {hasFilters && (
          <div className="mt-2 flex justify-end">
            <button className="btn-ghost btn btn-sm text-surface-400" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ClipboardList size={40} />}
            title={hasFilters ? 'Sin resultados para este filtro' : 'Sin auditorías registradas'}
            description={hasFilters ? 'Intentá con otros criterios de búsqueda' : 'Creá tu primera auditoría para comenzar'}
            action={
              !hasFilters ? (
                <button className="btn-primary btn btn-sm" onClick={() => navigate('/nueva')}>
                  Nueva Auditoría
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">Número</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Sucursal</th>
                <th className="table-th">Auditor</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Cumplimiento</th>
                <th className="table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 bg-white">
              {filtered.map(audit => (
                <tr key={audit.id} className="table-row">
                  <td className="table-td">
                    <span className="font-semibold text-brand-700">{audit.numero}</span>
                  </td>
                  <td className="table-td whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-surface-400" />
                      {formatDate(audit.fecha)}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={12} className="text-surface-400" />
                      {audit.sucursalNombre}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-surface-400" />
                      {audit.auditor}
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">
                      {TYPE_LABEL[audit.tipo]}
                    </span>
                  </td>
                  <td className="table-td">
                    <StatusBadge status={audit.estado} />
                  </td>
                  <td className="table-td w-36">
                    {audit.estado === 'cerrada' ? (
                      <ComplianceBar value={audit.cumplimientoTotal} size="sm" />
                    ) : (
                      <span className="text-xs text-surface-400">—</span>
                    )}
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 rounded-lg hover:bg-brand-50 text-surface-400 hover:text-brand-600 transition-colors"
                        title="Ver detalle"
                        onClick={() => navigate(`/auditoria/${audit.id}/evaluacion`)}
                      >
                        <Eye size={14} />
                      </button>
                      {audit.estado === 'cerrada' && (
                        <button
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-surface-400 hover:text-amber-600 transition-colors"
                          title="Reabrir auditoría"
                          onClick={() => handleReopen(audit.id)}
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                        onClick={() => handleDelete(audit.id, audit.numero)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-surface-400 mt-3 text-right">
          Mostrando {filtered.length} de {audits.length} auditorías
        </p>
      )}
    </PageWrapper>
  );
}
