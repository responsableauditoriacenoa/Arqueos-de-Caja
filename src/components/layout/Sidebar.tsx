import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useUIStore, useConfigStore } from '../../store';
import { clsx } from '../../utils/formatters';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/nueva',     label: 'Nueva Auditoría', icon: PlusCircle     },
  { to: '/historial', label: 'Historial',       icon: History        },
  { to: '/config',    label: 'Configuración',   icon: Settings       },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { config } = useConfigStore();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-surface-900 text-white z-40 flex flex-col transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-700 min-h-[68px]">
        <div className="flex-shrink-0 w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
          <ShieldCheck size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white truncate leading-tight">Auditorías</div>
            <div className="text-xs text-surface-400 truncate">{config.empresa}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-white'
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Version */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-surface-700">
          <p className="text-xs text-surface-500">Sistema de Auditoría v1.0</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-300 hover:bg-surface-600 transition-colors shadow-md"
        title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  );
}
