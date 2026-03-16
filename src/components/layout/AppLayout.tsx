import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { useUIStore } from '../../store';
import { clsx } from '../../utils/formatters';

export default function AppLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-surface-50 flex">
      <Sidebar />
      <div
        className={clsx(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-16'
        )}
      >
        <Header />
        <main className="flex-1 pt-[68px] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
