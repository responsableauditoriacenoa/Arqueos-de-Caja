import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useUIStore, useConfigStore } from '../../store';
import { clsx } from '../../utils/formatters';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/nueva':     'Nueva Auditoría',
  '/historial': 'Historial de Auditorías',
  '/config':    'Configuración',
};

export default function Header() {
  const { sidebarOpen } = useUIStore();
  const { config } = useConfigStore();
  const location = useLocation();

  // Determine page title (handle dynamic routes)
  let title = 'Panel';
  for (const [path, label] of Object.entries(PAGE_TITLES)) {
    if (location.pathname === path || location.pathname.startsWith(path + '/')) {
      title = label;
      break;
    }
  }
  if (location.pathname.startsWith('/auditoria/')) {
    title = 'Detalle de Auditoría';
  }

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 h-[68px] bg-white border-b border-surface-100 z-30 flex items-center justify-between px-6 transition-all duration-300',
        sidebarOpen ? 'left-60' : 'left-16'
      )}
    >
      <div>
        <h1 className="text-lg font-semibold text-surface-900">{title}</h1>
        <p className="text-xs text-surface-400">{config.empresa}</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-colors">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
            <User size={14} className="text-brand-600" />
          </div>
          <span className="text-sm font-medium text-surface-700">Auditor</span>
        </div>
      </div>
    </header>
  );
}
