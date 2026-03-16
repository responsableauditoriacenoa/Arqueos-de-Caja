import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, CheckCircle2, Clock,
  PlusCircle, History, Settings, TrendingUp, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuditStore } from '../store';
import {
  StatCard, ComplianceBar, StatusBadge, EmptyState, PageWrapper,
} from '../components/common';
import { formatDate, clsx } from '../utils/formatters';


export default function Dashboard() {
  const navigate  = useNavigate();
  const { stats, loadStats, loadAll } = useAuditStore();

  React.useEffect(() => {
    loadStats();
    loadAll();
  }, []);

  if (!stats) return null;

  const statusData = [
    { name: 'Borrador',    value: stats.borradores,                          color: '#94a3b8' },
    { name: 'Activas',     value: stats.abiertas,                            color: '#6366f1' },
    { name: 'Cerradas',    value: stats.cerradas,                            color: '#22c55e' },
  ].filter(d => d.value > 0);

  return (
    <PageWrapper>
      {/* Quick-action banner */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">Resumen ejecutivo del sistema de auditorías internas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn" onClick={() => navigate('/historial')}>
            <History size={15} /> Historial
          </button>
          <button className="btn-primary btn" onClick={() => navigate('/nueva')}>
            <PlusCircle size={15} /> Nueva Auditoría
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Auditorías"
          value={stats.total}
          icon={<ClipboardList size={22} className="text-brand-600" />}
          color="bg-brand-50"
        />
        <StatCard
          label="Cerradas"
          value={stats.cerradas}
          icon={<CheckCircle2 size={22} className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="En Proceso"
          value={stats.abiertas + stats.borradores}
          icon={<Clock size={22} className="text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Cumplimiento Prom."
          value={`${stats.cumplimientoPromedio}%`}
          icon={<TrendingUp size={22} className="text-indigo-600" />}
          color="bg-indigo-50"
          change={stats.cerradas === 0 ? 'Sin auditorías cerradas' : `Sobre ${stats.cerradas} auditorías cerradas`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Compliance trend */}
        <div className="xl:col-span-2 card p-5">
          <h3 className="section-title mb-4">Tendencia de Cumplimiento</h3>
          {stats.cumplimientoPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.cumplimientoPorMes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [`${v}%`, 'Cumplimiento']}
                />
                <Area
                  type="monotone" dataKey="valor"
                  stroke="#6366f1" strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-surface-400 text-sm">
              Sin datos históricos suficientes
            </div>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Estado de Auditorías</h3>
          {stats.total > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-surface-400 text-sm">
              Sin auditorías registradas
            </div>
          )}
        </div>
      </div>

      {/* Branch bar + Latest audits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* By branch */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Auditorías por Sucursal</h3>
          {stats.porSucursal.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.porSucursal} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="cantidad" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-surface-400 text-sm">
              Sin datos
            </div>
          )}
        </div>

        {/* Latest audits */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Últimas Auditorías</h3>
            <button
              className="text-xs text-brand-600 font-medium hover:text-brand-700"
              onClick={() => navigate('/historial')}
            >
              Ver todas →
            </button>
          </div>

          {stats.ultimasAuditorias.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={36} />}
              title="Sin auditorías aún"
              description="Creá tu primera auditoría para comenzar"
              action={
                <button className="btn-primary btn btn-sm" onClick={() => navigate('/nueva')}>
                  <PlusCircle size={14} /> Nueva Auditoría
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {stats.ultimasAuditorias.map(audit => (
                <div
                  key={audit.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-surface-100 hover:border-brand-200 hover:bg-brand-50/30 cursor-pointer transition-all"
                  onClick={() => navigate(`/auditoria/${audit.id}`)}
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-surface-800 truncate">
                        {audit.numero}
                      </span>
                      <StatusBadge status={audit.estado} />
                    </div>
                    <p className="text-xs text-surface-500 truncate mt-0.5">
                      {audit.sucursalNombre} · {formatDate(audit.fecha)} · {audit.auditor}
                    </p>
                  </div>
                  {audit.estado === 'cerrada' && (
                    <div className="text-right flex-shrink-0 w-24">
                      <ComplianceBar value={audit.cumplimientoTotal} size="sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: <PlusCircle size={24} className="text-brand-600" />,
            bg: 'bg-brand-50',
            title: 'Nueva Auditoría',
            desc: 'Iniciar proceso de auditoría',
            action: () => navigate('/nueva'),
          },
          {
            icon: <History size={24} className="text-amber-600" />,
            bg: 'bg-amber-50',
            title: 'Ver Historial',
            desc: 'Consultar auditorías anteriores',
            action: () => navigate('/historial'),
          },
          {
            icon: <Settings size={24} className="text-slate-600" />,
            bg: 'bg-slate-50',
            title: 'Configuración',
            desc: 'Parámetros y sucursales',
            action: () => navigate('/config'),
          },
        ].map(item => (
          <button
            key={item.title}
            onClick={item.action}
            className="card p-5 flex items-center gap-4 text-left hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', item.bg)}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-800">{item.title}</p>
              <p className="text-xs text-surface-400 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </PageWrapper>
  );
}
