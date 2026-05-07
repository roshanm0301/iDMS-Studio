import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ScopeBar from './ScopeBar';
import Toast from '../ui/Toast';
import { useStudioStore } from '../../hooks/useStudioStore';

export default function AppShell() {
  const { sidebarCompact } = useStudioStore();
  return (
    <div className="app" data-sidebar={sidebarCompact ? 'compact' : 'default'}>
      <Sidebar />
      <main className="main">
        <Topbar />
        <ScopeBar />
        <div className="content">
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  );
}
