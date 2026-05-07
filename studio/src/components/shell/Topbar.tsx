import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Bell, ChevronRight, Plus } from 'lucide-react';
import { useStudioStore } from '../../hooks/useStudioStore';
import { getArtifact } from '../../data/mockService';

const CRUMB_MAP: Record<string, string[]> = {
  '/admin/studio': ['Studio', 'Home'],
  '/admin/studio/artifacts': ['Studio', 'Artifacts'],
  '/admin/studio/releases': ['Studio', 'Release Packages'],
  '/admin/studio/attributes': ['Studio', 'Attribute Catalog'],
  '/admin/studio/settings': ['Studio', 'Settings'],
};

export default function Topbar() {
  const { theme, toggleTheme, selectedArtifactKey } = useStudioStore();
  const location = useLocation();
  const navigate = useNavigate();

  const artifact = selectedArtifactKey ? getArtifact(selectedArtifactKey) : null;
  let crumbs = CRUMB_MAP[location.pathname] ?? ['Studio', 'Workspace'];
  if (artifact && location.pathname.includes('/artifacts/')) {
    crumbs = ['Studio', 'Artifacts', artifact.label];
  }

  const showNew = location.pathname.startsWith('/admin/studio/artifacts');

  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={12} className="sep" />}
            <span className={i === crumbs.length - 1 ? 'current' : ''}>{c}</span>
          </span>
        ))}
      </div>

      <div className="topbar-search" role="button" tabIndex={0}>
        <Search size={14} />
        <span>Search artifacts, rules, fields…</span>
        <kbd>⌘K</kbd>
      </div>

      <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button className="icon-btn" title="Notifications">
        <Bell size={16} />
      </button>

      {showNew && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/admin/studio/artifacts')}
        >
          <Plus size={14} /> New artifact
        </button>
      )}

      <div className="avatar" title="OEM Admin">OA</div>
    </header>
  );
}
