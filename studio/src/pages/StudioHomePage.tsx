import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  FileEdit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Plus,
  FolderOpen,
  Clock,
  Box,
  Workflow,
  ShieldCheck,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  getStudioHome,
  getArtifacts,
  getReleasePackages,
  getImpactFindings,
  getLayers,
} from '../data/mockService';
import { useStudioStore } from '../hooks/useStudioStore';
import type { ArtifactRegistryItem, ImpactFinding, ReleasePackage, Layer } from '../types';

// ── Sparkline helper ──────────────────────────────────────────────
function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.85 - 2;
    return `${x},${y}`;
  });
  const polyPoints = pts.join(' ');
  const areaPoints = `0,${h} ${polyPoints} ${w},${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="kpi-spark"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkGrad)" />
      <polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Status helpers ────────────────────────────────────────────────
function statusTag(status: ArtifactRegistryItem['status']) {
  switch (status) {
    case 'active':
      return <span className="tag green">Active</span>;
    case 'active_with_draft':
      return <span className="tag amber">Draft</span>;
    case 'draft':
      return <span className="tag amber">Draft</span>;
    case 'deprecated':
      return <span className="tag red">Deprecated</span>;
    case 'compile_error':
      return <span className="tag red">Error</span>;
    default:
      return <span className="tag">{status}</span>;
  }
}

function releaseStatusTag(status: ReleasePackage['status']) {
  switch (status) {
    case 'active':
      return <span className="tag green">Active</span>;
    case 'approved':
    case 'promoted_uat':
    case 'promoted_production':
      return <span className="tag green">{status.replace(/_/g, ' ')}</span>;
    case 'draft':
      return <span className="tag amber">Draft</span>;
    case 'validating':
      return <span className="tag amber">Validating</span>;
    case 'validation_failed':
      return <span className="tag red">Validation Failed</span>;
    case 'ready_for_approval':
      return <span className="tag violet">Ready for Approval</span>;
    case 'rolled_back':
      return <span className="tag red">Rolled Back</span>;
    default:
      return <span className="tag">{status}</span>;
  }
}

function artifactTypeIcon(type: ArtifactRegistryItem['artifact_type']) {
  switch (type) {
    case 'entity_schema':
      return <Box size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />;
    case 'workflow_definition':
      return <Workflow size={14} style={{ color: 'var(--violet)', flexShrink: 0 }} />;
    case 'permission_matrix':
      return <ShieldCheck size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />;
    default:
      return <FileEdit size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />;
  }
}

function impactIcon(severity: ImpactFinding['severity']) {
  switch (severity) {
    case 'error':
      return <XCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />;
    case 'warning':
      return <AlertTriangle size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />;
    case 'info':
    default:
      return <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />;
  }
}

function impactClass(severity: ImpactFinding['severity']): string {
  switch (severity) {
    case 'error':   return 'error';
    case 'warning': return 'warn';
    default:        return 'ok';
  }
}

// ── Layer activity bar ────────────────────────────────────────────
function LayerActivityCard({
  layers,
  artifacts,
}: {
  layers: Layer[];
  artifacts: ArtifactRegistryItem[];
}) {
  const counts = useMemo(
    () =>
      layers.map((layer) => ({
        ...layer,
        count: artifacts.filter((a) => a.layers.includes(layer.code)).length,
      })),
    [layers, artifacts],
  );
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-head">
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={15} style={{ color: 'var(--text-muted)' }} />
          Layer Activity
        </span>
        <span className="tag">5 layers</span>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {counts.map((layer) => {
          const pct = Math.round((layer.count / max) * 100);
          return (
            <div key={layer.code}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`layer-badge ${layer.code}`}>{layer.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Layer {layer.priority}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--text)',
                  }}
                >
                  {layer.count}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                    {' '}
                    artifact{layer.count !== 1 ? 's' : ''}
                  </span>
                </span>
              </div>
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: `var(--layer-${layer.code})`,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Release packages card ────────────────────────────────────────
function ReleasePackagesCard({ packages }: { packages: ReleasePackage[] }) {
  const navigate = useNavigate();

  const riskColor = (risk: string) => {
    if (risk === 'high') return 'var(--red)';
    if (risk === 'medium') return 'var(--amber)';
    return 'var(--green)';
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-head">
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={15} style={{ color: 'var(--text-muted)' }} />
          Release Packages
        </span>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => navigate('/admin/studio/releases')}
        >
          View all
          <ChevronRight size={13} />
        </button>
      </div>
      {packages.length === 0 ? (
        <div className="empty" style={{ padding: '32px 24px' }}>
          <Package size={28} className="empty-icon" />
          <p className="empty-title">No release packages</p>
          <p className="empty-desc">Create a release package to promote changes to UAT or Production.</p>
        </div>
      ) : (
        <div>
          {packages.map((pkg) => (
            <div
              key={pkg.release_id}
              className="release-card"
              onClick={() => navigate(`/admin/studio/releases/${pkg.release_id}`)}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {pkg.name}
                  </div>
                  {pkg.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {pkg.description}
                    </div>
                  )}
                </div>
                {releaseStatusTag(pkg.status)}
              </div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <span className="tag">
                  <Activity size={10} />
                  {pkg.environment} → {pkg.target_environment}
                </span>
                <span className="tag">
                  {pkg.items.length} item{pkg.items.length !== 1 ? 's' : ''}
                </span>
                <span
                  className="tag"
                  style={{
                    color: riskColor(pkg.risk),
                    background: 'var(--bg-sunken)',
                    borderColor: 'transparent',
                  }}
                >
                  {pkg.risk} risk
                </span>
                {pkg.owner && (
                  <span className="tag" style={{ fontSize: 11 }}>
                    {pkg.owner.split('@')[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function StudioHomePage() {
  const navigate = useNavigate();
  const { setSelectedArtifact, showToast, scope } = useStudioStore();

  const home = useMemo(() => getStudioHome(), []);
  const artifacts = useMemo(() => getArtifacts(), []);
  const releases = useMemo(() => getReleasePackages(), []);
  const findings = useMemo(() => getImpactFindings(), []);
  const layers = useMemo(() => getLayers(), []);

  // ── KPI derivations ────────────────────────────────────────────
  const totalArtifacts = artifacts.length;
  const activeArtifacts = artifacts.filter(
    (a) => a.status === 'active' || a.status === 'active_with_draft',
  ).length;
  const draftChanges = home?.warning_summary?.draft_changes ?? 0;
  const compileWarnings =
    artifacts.reduce((sum, a) => sum + (a.warnings ?? 0), 0) +
    (home?.warning_summary?.warnings ?? 0);

  // Seeded sparkline data (illustrative trend lines)
  const sparkArtifacts  = [4, 4, 5, 5, 6, 6, 6];
  const sparkActive     = [3, 3, 4, 4, 5, 5, 5];
  const sparkDraft      = [1, 2, 1, 3, 2, 3, 3];
  const sparkWarnings   = [2, 3, 3, 4, 4, 4, 4];

  // Recent artifacts — last 5
  const recentArtifacts = useMemo(() => artifacts.slice(0, 5), [artifacts]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleArtifactClick = (a: ArtifactRegistryItem) => {
    setSelectedArtifact(a.artifact_key);
    navigate(`/admin/studio/artifacts/${a.artifact_key}`);
  };

  const handleNewRelease = () => {
    showToast('Opening new release package form…', 'info');
    navigate('/admin/studio/releases/new');
  };

  const handleBrowseArtifacts = () => {
    navigate('/admin/studio/artifacts');
  };

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Studio Home</h1>
            <p className="page-sub">
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                {scope.tenant_name}
              </span>
              <span style={{ margin: '0 6px', color: 'var(--border-strong)' }}>·</span>
              <span
                className="tag"
                style={{ display: 'inline-flex', verticalAlign: 'middle', fontSize: 11.5 }}
              >
                {scope.environment}
              </span>
              <span style={{ margin: '0 6px', color: 'var(--border-strong)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>{scope.role_name}</span>
            </p>
          </div>
          <div className="row" style={{ gap: 8, flexShrink: 0, alignSelf: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleBrowseArtifacts}>
              <FolderOpen size={13} />
              Browse Artifacts
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleNewRelease}>
              <Plus size={13} />
              New Release Package
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────── */}
      <div className="dash-grid">
        {/* Total Artifacts */}
        <div className="kpi">
          <div className="kpi-label">Total Artifacts</div>
          <div className="kpi-value">{totalArtifacts}</div>
          <div className="kpi-delta up">
            <ArrowUpRight size={12} />
            <span>+1 this week</span>
          </div>
          <Sparkline values={sparkArtifacts} color="var(--accent)" />
        </div>

        {/* Active Artifacts */}
        <div className="kpi">
          <div className="kpi-label">Active Artifacts</div>
          <div className="kpi-value">{activeArtifacts}</div>
          <div className="kpi-delta up">
            <ArrowUpRight size={12} />
            <span>All in good shape</span>
          </div>
          <Sparkline values={sparkActive} color="var(--green)" />
        </div>

        {/* Draft Changes */}
        <div className="kpi">
          <div className="kpi-label">Draft Changes</div>
          <div className="kpi-value">{draftChanges}</div>
          <div className="kpi-delta down">
            <ArrowDownRight size={12} />
            <span>Awaiting publish</span>
          </div>
          <Sparkline values={sparkDraft} color="var(--amber)" />
        </div>

        {/* Compile Warnings */}
        <div className="kpi">
          <div className="kpi-label">Compile Warnings</div>
          <div className="kpi-value">{compileWarnings}</div>
          <div className="kpi-delta down">
            <TrendingUp size={12} />
            <span>Review recommended</span>
          </div>
          <Sparkline values={sparkWarnings} color="var(--red)" />
        </div>
      </div>

      {/* ── Main row: Recent Artifacts + Impact Warnings ─────── */}
      <div className="dash-row">
        {/* Recent Artifacts (2/3) */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} style={{ color: 'var(--text-muted)' }} />
              Recent Artifacts
            </span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleBrowseArtifacts}
            >
              View all
              <ChevronRight size={13} />
            </button>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '36%' }}>Artifact</th>
                <th style={{ width: '20%' }}>Key</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Warns</th>
                <th style={{ width: '22%' }}>Layers</th>
              </tr>
            </thead>
            <tbody>
              {recentArtifacts.map((a) => (
                <tr
                  key={a.artifact_key}
                  className="hover-row"
                  onClick={() => handleArtifactClick(a)}
                >
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      {artifactTypeIcon(a.artifact_type)}
                      <div>
                        <div className="rule-name">{a.label}</div>
                        <div className="rule-desc">{a.module}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 11.5, color: 'var(--text-muted)' }}
                    >
                      {a.artifact_key}
                    </span>
                  </td>
                  <td>{statusTag(a.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {a.warnings > 0 ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--amber)',
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                      >
                        <AlertTriangle size={12} />
                        {a.warnings}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                      {a.layers.map((l) => (
                        <span key={l} className={`layer-badge ${l}`}>
                          {l.charAt(0).toUpperCase() + l.slice(1, 3)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Impact Warnings (1/3) */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} style={{ color: 'var(--text-muted)' }} />
              Impact Warnings
            </span>
            <span className="tag">{findings.length}</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {findings.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={22} style={{ marginBottom: 8, color: 'var(--green)' }} />
                <p style={{ fontSize: 13 }}>No impact findings</p>
              </div>
            ) : (
              findings.map((f) => (
                <div
                  key={f.finding_id}
                  className={`impact-item ${impactClass(f.severity)}`}
                  style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}
                >
                  {impactIcon(f.severity)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text)',
                        lineHeight: 1.45,
                        marginBottom: f.suggested_action ? 4 : 0,
                      }}
                    >
                      {f.message}
                    </div>
                    {f.suggested_action && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        {f.suggested_action}
                      </div>
                    )}
                    {f.artifact_key && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 6, padding: '2px 0', height: 'auto', fontSize: 11, color: 'var(--accent)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (f.artifact_key) {
                            setSelectedArtifact(f.artifact_key);
                            navigate(`/admin/studio/artifacts/${f.artifact_key}`);
                          }
                        }}
                      >
                        View artifact
                        <ChevronRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Layer Activity + Release Packages ────── */}
      <div className="dash-row-3">
        {/* Layer Activity */}
        <LayerActivityCard layers={layers} artifacts={artifacts} />

        {/* Release Packages — spans 2 cols */}
        <div style={{ gridColumn: 'span 2' }}>
          <ReleasePackagesCard packages={releases} />
        </div>
      </div>
    </div>
  );
}
