import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Box, Package, Settings, ChevronDown,
  PanelLeftClose, PanelLeftOpen, GitBranch, Shield, BookOpen, Database, GitFork
} from 'lucide-react';
import { useStudioStore } from '../../hooks/useStudioStore';
import { getArtifacts } from '../../data/mockService';

const NAV = [
  { id: '/admin/studio', icon: LayoutDashboard, label: 'Studio Home', shortcut: 'G H' },
  { id: '/admin/studio/artifacts', icon: Box, label: 'Artifacts', shortcut: 'G A', badgeKey: 'artifacts' },
  { id: '/admin/studio/entities', icon: Database, label: 'Entity Designer', shortcut: 'G E' },
  { id: '/admin/studio/relationships', icon: GitFork, label: 'Relationships', shortcut: 'G L' },
  { id: '/admin/studio/releases', icon: Package, label: 'Release Packages', shortcut: 'G R', badgeKey: 'releases' },
  { id: '/admin/studio/attributes', icon: BookOpen, label: 'Attribute Catalog', shortcut: 'G C' },
];

const SYS_NAV = [
  { id: '/admin/studio/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCompact, toggleSidebar, scope } = useStudioStore();
  const artifacts = getArtifacts();
  const activeArtifacts = artifacts.filter(a => a.status !== 'deprecated').length;

  const isActive = (path: string) => {
    if (path === '/admin/studio') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><span>iD</span></div>
        {!sidebarCompact && (
          <div className="ws-text">
            <div className="brand-name">iDMS</div>
            <div className="brand-sub">Admin Studio</div>
          </div>
        )}
        <button
          className="icon-btn"
          onClick={toggleSidebar}
          title={sidebarCompact ? 'Expand' : 'Collapse'}
          style={{ marginLeft: 'auto' }}
        >
          {sidebarCompact ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const badge = item.badgeKey === 'artifacts' ? activeArtifacts : undefined;
            return (
              <div
                key={item.id}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
                title={sidebarCompact ? item.label : undefined}
              >
                <Icon size={16} />
                {!sidebarCompact && <span className="nav-label">{item.label}</span>}
                {!sidebarCompact && badge != null && (
                  <span className="nav-badge">{badge}</span>
                )}
                {!sidebarCompact && !badge && item.shortcut && (
                  <span className="nav-shortcut">{item.shortcut}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="nav-section">
          {!sidebarCompact && <div className="nav-section-label">System</div>}
          {SYS_NAV.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive(item.id) ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
                title={sidebarCompact ? item.label : undefined}
              >
                <Icon size={16} />
                {!sidebarCompact && <span className="nav-label">{item.label}</span>}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-foot">
        <div className="ws-switcher">
          <div className="ws-avatar">
            {scope.tenant_name.slice(0, 2).toUpperCase()}
          </div>
          {!sidebarCompact && (
            <div className="ws-text">
              <div className="ws-name">{scope.tenant_name}</div>
              <div className="ws-plan">{scope.environment} · Enterprise</div>
            </div>
          )}
          {!sidebarCompact && <ChevronDown size={14} className="muted" />}
        </div>
      </div>
    </aside>
  );
}
