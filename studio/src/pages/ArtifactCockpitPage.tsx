import { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, Layers, GitBranch, ShieldCheck,
  AlertCircle, CheckCircle2, Info, Clock, Package,
  MoreHorizontal, CheckCircle,
} from 'lucide-react';
import { getArtifacts, getArtifact, getImpactFindings, getLayerStack } from '../data/mockService';
import { useStudioStore } from '../hooks/useStudioStore';
import type { ArtifactRegistryItem, ImpactFinding, LayerCode } from '../types';
import LayerBadge from '../components/ui/LayerBadge';
import StatusTag from '../components/ui/StatusTag';

// ─── Lazy sub-components ────────────────────────────────────────────────────
const EntityDesigner    = lazy(() => import('../components/cockpit/EntityDesigner'));
const RuleBuilder       = lazy(() => import('../components/cockpit/RuleBuilder'));
const WorkflowDesigner  = lazy(() => import('../components/cockpit/WorkflowDesigner'));
const PermissionMatrix  = lazy(() => import('../components/cockpit/PermissionMatrix'));
const OverlayStudio     = lazy(() => import('../components/cockpit/OverlayStudio'));
const SimulationTab     = lazy(() => import('../components/cockpit/SimulationTab'));
const VersionsTab       = lazy(() => import('../components/cockpit/VersionsTab'));

// ─── Tab definitions ────────────────────────────────────────────────────────
const PRIMARY_TABS = [
  { id: 'schema',      label: 'Schema' },
  { id: 'rules',       label: 'Rules' },
  { id: 'workflow',    label: 'Workflow' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'overlay',     label: 'Overlay' },
];

const UTILITY_TABS = [
  { id: 'simulation', label: 'Simulation' },
  { id: 'versions',   label: 'Versions' },
];

const ALL_TAB_IDS = [...PRIMARY_TABS, ...UTILITY_TABS].map(t => t.id);

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  entity_schema:        'Entity Schema',
  workflow_definition:  'Workflow',
  rule_definition:      'Rule',
  permission_matrix:    'Permissions',
  ui_form_schema:       'Form Schema',
  ui_list_schema:       'List Schema',
};

// ─── Artifact Status Strip (replaces Overview tab) ──────────────────────────
function ArtifactStatusStrip({ artifact, artifactKey }: { artifact: ArtifactRegistryItem; artifactKey: string }) {
  const findings = getImpactFindings(artifactKey);
  const errors   = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warning');
  const compileOk = errors.length === 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '8px 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-elev)',
      flexShrink: 0,
      flexWrap: 'wrap',
      minHeight: 40,
    }}>
      {/* Name + type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {artifact.label}
        </span>
        <span className="muted" style={{ fontSize: 11 }}>{ARTIFACT_TYPE_LABELS[artifact.artifact_type] ?? artifact.artifact_type}</span>
      </div>

      <span style={{ color: 'var(--border)', fontSize: 16, fontWeight: 300 }}>|</span>

      {/* Status */}
      <StatusTag status={artifact.status} />

      {/* Layers */}
      <div style={{ display: 'flex', gap: 3 }}>
        {(artifact.layers as LayerCode[]).map(l => (
          <LayerBadge key={l} layer={l} small />
        ))}
      </div>

      <span style={{ color: 'var(--border)', fontSize: 16, fontWeight: 300 }}>|</span>

      {/* Compile status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
        {compileOk
          ? <CheckCircle size={13} style={{ color: 'var(--green)' }} />
          : <AlertCircle size={13} style={{ color: 'var(--red)' }} />}
        <span style={{ color: compileOk ? 'var(--green)' : 'var(--red)' }}>
          {compileOk ? 'Compile OK' : `${errors.length} error${errors.length !== 1 ? 's' : ''}`}
        </span>
        {warnings.length > 0 && (
          <span style={{ color: 'var(--amber)', marginLeft: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
            <AlertCircle size={12} />
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Last modified */}
      {artifact.last_modified && (
        <>
          <span style={{ color: 'var(--border)', fontSize: 16, fontWeight: 300 }}>|</span>
          <span className="muted" style={{ fontSize: 11 }}>
            <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
            {artifact.last_modified}
          </span>
        </>
      )}
    </div>
  );
}

// ─── Impact Panel ────────────────────────────────────────────────────────────
function ImpactPanel({ artifactKey }: { artifactKey: string }) {
  const findings = getImpactFindings(artifactKey);
  const layerStack = getLayerStack(artifactKey);
  const artifact = getArtifact(artifactKey);

  const errors   = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warning');
  const infos    = findings.filter(f => f.severity === 'info');

  const impactItemClass = (severity: ImpactFinding['severity']) => {
    if (severity === 'error')   return 'impact-item error';
    if (severity === 'warning') return 'impact-item warn';
    return 'impact-item info';
  };

  const compileOk = errors.length === 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Layer Trace */}
      <div className="impact-section">
        <div className="impact-section-title">
          <Layers size={13} />
          Layer Trace
        </div>
        {layerStack.map(layer => (
          <div
            key={layer.layer}
            className={`impact-item ${layer.delta_count > 0 ? 'ok' : 'info'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <LayerBadge layer={layer.layer as LayerCode} small />
            <span style={{ flex: 1, fontSize: 12 }}>{layer.label}</span>
            <span className="muted" style={{ fontSize: 11 }}>
              {layer.delta_count > 0 ? `${layer.delta_count}Δ` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Dependencies */}
      {artifact && (
        <div className="impact-section">
          <div className="impact-section-title">
            <GitBranch size={13} />
            Dependencies
          </div>
          <div className="impact-item info" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12 }}>Type</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {ARTIFACT_TYPE_LABELS[artifact.artifact_type] ?? artifact.artifact_type}
            </span>
          </div>
          <div className="impact-item info" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12 }}>Module</span>
            <span className="muted" style={{ fontSize: 12 }}>{artifact.module}</span>
          </div>
          <div className="impact-item info" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12 }}>Layers</span>
            <span className="muted" style={{ fontSize: 12 }}>{artifact.layers.length}</span>
          </div>
        </div>
      )}

      {/* Compile Status */}
      <div className="impact-section">
        <div className="impact-section-title">
          <ShieldCheck size={13} />
          Compile Status
        </div>
        <div className={`impact-item ${compileOk ? 'ok' : 'error'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {compileOk
              ? <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
              : <AlertCircle size={13} style={{ color: 'var(--color-error)' }} />}
            <span style={{ fontSize: 12 }}>{compileOk ? 'Compile passed' : `${errors.length} error${errors.length !== 1 ? 's' : ''}`}</span>
          </div>
        </div>
        {warnings.length > 0 && (
          <div className="impact-item warn">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={13} style={{ color: 'var(--color-warn)' }} />
              <span style={{ fontSize: 12 }}>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
        {infos.length > 0 && (
          <div className="impact-item info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={13} style={{ color: 'var(--color-info)' }} />
              <span style={{ fontSize: 12 }}>{infos.length} info notice{infos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div className="impact-section">
          <div className="impact-section-title">
            <AlertCircle size={13} />
            Findings
          </div>
          {findings.map(f => (
            <div key={f.finding_id} className={impactItemClass(f.severity)}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{f.category}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>{f.message}</div>
              {f.suggested_action && (
                <div style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 3 }}>
                  {f.suggested_action}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Release Readiness */}
      <div className="impact-section">
        <div className="impact-section-title">
          <Clock size={13} />
          Release Readiness
        </div>
        <div className={`impact-item ${compileOk && warnings.length === 0 ? 'ok' : warnings.length > 0 && errors.length === 0 ? 'warn' : 'error'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {compileOk && warnings.length === 0
              ? <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
              : <AlertCircle size={13} style={{ color: errors.length > 0 ? 'var(--color-error)' : 'var(--color-warn)' }} />}
            <span style={{ fontSize: 12 }}>
              {compileOk && warnings.length === 0
                ? 'Ready for release'
                : errors.length > 0
                  ? 'Not ready — resolve errors'
                  : 'Ready with warnings'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Artifact Navigator (left panel) ────────────────────────────────────────
function ArtifactNavigator({
  currentKey,
  onSelect,
}: {
  currentKey: string;
  onSelect: (key: string) => void;
}) {
  const [navSearch, setNavSearch] = useState('');
  const all = getArtifacts();

  const visible = navSearch.trim()
    ? all.filter(
        a =>
          a.label.toLowerCase().includes(navSearch.toLowerCase()) ||
          a.artifact_key.toLowerCase().includes(navSearch.toLowerCase()),
      )
    : all;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">Artifacts</span>
      </div>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input nav-search"
            placeholder="Search…"
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            style={{ paddingLeft: 26, width: '100%', fontSize: 12 }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {visible.length === 0 && (
          <div style={{ padding: '20px 12px', textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: 12 }}>No artifacts match</p>
          </div>
        )}
        {visible.map(a => {
          const isActive = a.artifact_key === currentKey;
          return (
            <div
              key={a.artifact_key}
              onClick={() => onSelect(a.artifact_key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                cursor: 'pointer',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.label}
                </div>
                <div className="mono muted" style={{ fontSize: 10 }}>{a.artifact_key}</div>
              </div>
              {isActive && <ChevronRight size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fallback spinner ────────────────────────────────────────────────────────
function TabFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span className="muted" style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );
}

// ─── Utility Drawer (⋯ More) ─────────────────────────────────────────────────
function UtilityDrawer({
  artifactKey,
  onClose,
  initialTab,
}: {
  artifactKey: string;
  onClose: () => void;
  initialTab: string;
}) {
  const [drawerTab, setDrawerTab] = useState(initialTab);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      display: 'flex',
      alignItems: 'flex-end',
      background: 'rgba(0,0,0,0.35)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%',
        height: '65vh',
        background: 'var(--panel)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        overflow: 'hidden',
      }}>
        {/* Drawer header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          borderBottom: '1px solid var(--border)',
          padding: '0 8px',
          flexShrink: 0,
        }}>
          {UTILITY_TABS.map(tab => (
            <button
              key={tab.id}
              className={`cockpit-tab${drawerTab === tab.id ? ' active' : ''}`}
              onClick={() => setDrawerTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Suspense fallback={<TabFallback />}>
            {drawerTab === 'simulation' && <SimulationTab artifactKey={artifactKey} />}
            {drawerTab === 'versions'   && <VersionsTab   artifactKey={artifactKey} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ─── More button with dropdown ───────────────────────────────────────────────
function MoreMenu({
  onOpen,
}: {
  onOpen: (tab: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ position: 'relative', alignSelf: 'center', marginLeft: 4 }} ref={ref}>
      <button
        className={`cockpit-tab${open ? ' active' : ''}`}
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <MoreHorizontal size={14} />
        More
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-md)',
          minWidth: 160,
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {UTILITY_TABS.map(tab => (
            <button
              key={tab.id}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 14px',
                fontSize: 13,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => { setOpen(false); onOpen(tab.id); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ArtifactCockpitPage() {
  const { artifactKey = '' } = useParams<{ artifactKey: string }>();
  const navigate = useNavigate();
  const setSelectedArtifact = useStudioStore(s => s.setSelectedArtifact);
  const activeTab = useStudioStore(s => s.activeTab);
  const setActiveTab = useStudioStore(s => s.setActiveTab);
  const impactVisible = useStudioStore(s => s.impactVisible);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('simulation');

  const artifact = getArtifact(artifactKey);

  useEffect(() => {
    if (artifactKey) setSelectedArtifact(artifactKey);
  }, [artifactKey, setSelectedArtifact]);

  function handleNavSelect(key: string) {
    setSelectedArtifact(key);
    navigate(`/admin/studio/artifacts/${key}`);
  }

  function openDrawer(tab: string) {
    setDrawerTab(tab);
    setDrawerOpen(true);
  }

  // Clamp active tab to valid primary tabs
  const safeTab = ALL_TAB_IDS.includes(activeTab) ? activeTab : 'schema';
  const isPrimaryTab = PRIMARY_TABS.some(t => t.id === safeTab);

  function renderTabContent() {
    if (!artifact) return null;
    switch (safeTab) {
      case 'schema':
        return (
          <Suspense fallback={<TabFallback />}>
            <EntityDesigner artifactKey={artifactKey} entityType={artifactKey.replace('entity.', '')} />
          </Suspense>
        );
      case 'rules':
        return (
          <Suspense fallback={<TabFallback />}>
            <RuleBuilder artifactKey={artifactKey} />
          </Suspense>
        );
      case 'workflow':
        return (
          <Suspense fallback={<TabFallback />}>
            <WorkflowDesigner artifactKey={artifactKey} />
          </Suspense>
        );
      case 'permissions':
        return (
          <Suspense fallback={<TabFallback />}>
            <PermissionMatrix artifactKey={artifactKey} />
          </Suspense>
        );
      case 'overlay':
        return (
          <Suspense fallback={<TabFallback />}>
            <OverlayStudio artifactKey={artifactKey} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<TabFallback />}>
            <EntityDesigner artifactKey={artifactKey} />
          </Suspense>
        );
    }
  }

  if (!artifact) {
    return (
      <div className="empty">
        <Package size={36} style={{ color: 'var(--color-muted)', marginBottom: 12 }} />
        <p className="empty-title">Artifact not found</p>
        <p className="empty-desc">The artifact key "{artifactKey}" does not exist in this environment.</p>
      </div>
    );
  }

  return (
    <div className="studio-layout">
      {/* ── Left: Navigator ─────────────────────────────────────────────── */}
      <aside className="studio-navigator">
        <ArtifactNavigator currentKey={artifactKey} onSelect={handleNavSelect} />
      </aside>

      {/* ── Center: Workspace ────────────────────────────────────────────── */}
      <main className="studio-workspace" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Always-visible status strip */}
        <ArtifactStatusStrip artifact={artifact} artifactKey={artifactKey} />

        {/* Cockpit tabs (5 primary + ⋯ More) */}
        <div className="cockpit-tabs" style={{ flexShrink: 0 }}>
          {PRIMARY_TABS.map(tab => (
            <button
              key={tab.id}
              className={`cockpit-tab${safeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'overlay' && (
                <span className="tab-badge" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {getLayerStack(artifactKey).filter(l => l.delta_count > 0).length}
                </span>
              )}
            </button>
          ))}
          <MoreMenu onOpen={openDrawer} />
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {isPrimaryTab && renderTabContent()}
        </div>
      </main>

      {/* ── Right: Impact Panel ──────────────────────────────────────────── */}
      {impactVisible && (
        <aside className="studio-impact">
          <div className="panel-header">
            <span className="panel-title">Impact</span>
          </div>
          <div className="panel-body" style={{ padding: 0, flex: 1, overflow: 'hidden' }}>
            <ImpactPanel artifactKey={artifactKey} />
          </div>
        </aside>
      )}

      {/* ── Utility Drawer ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <UtilityDrawer
          artifactKey={artifactKey}
          onClose={() => setDrawerOpen(false)}
          initialTab={drawerTab}
        />
      )}
    </div>
  );
}
