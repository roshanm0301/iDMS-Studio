import { useState, useMemo } from 'react';
import { Clock, GitCommit, User, Tag, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { useStudioStore } from '../../hooks/useStudioStore';

interface Props { artifactKey: string }

interface VersionEntry {
  version: number;
  at: string;
  by: string;
  kind: 'edit' | 'publish' | 'compile' | 'create' | 'restore';
  note: string;
  changes: string[];
  snapshot?: Record<string, any>;
}

const MOCK_VERSIONS: VersionEntry[] = [
  {
    version: 7, at: '2 hours ago', by: 'Mira K.', kind: 'edit',
    note: 'Added GSTIN field constraint for Pune node',
    changes: ['+fields.gstin constrain max_length=15', '+overlay.node.discount_pct max_value=7'],
    snapshot: {
      schema: { field_count: 14, last_field: 'gstin', protected_count: 3 },
      rules: { count: 5, active: 5 },
      overlay_deltas: 4,
      workflow_states: 7,
    },
  },
  {
    version: 6, at: 'yesterday', by: 'Adel N.', kind: 'publish',
    note: 'Published to UAT environment',
    changes: [],
    snapshot: {
      schema: { field_count: 13, protected_count: 3 },
      rules: { count: 5, active: 5 },
      overlay_deltas: 3,
      workflow_states: 7,
    },
  },
  {
    version: 5, at: '3 days ago', by: 'Kai R.', kind: 'edit',
    note: 'Added Sales Executive field mask for cost_price and margin_pct',
    changes: ['+permission.role.SALES_EXEC cost_price:HIDDEN', '+permission.role.SALES_EXEC margin_pct:HIDDEN'],
    snapshot: {
      schema: { field_count: 13, protected_count: 3 },
      rules: { count: 5, active: 4 },
      overlay_deltas: 3,
      workflow_states: 7,
    },
  },
  {
    version: 4, at: '1 week ago', by: 'Mira K.', kind: 'edit',
    note: 'Vehicle model field added from Automotive Vertical catalog',
    changes: ['+fields.vehicle_model (extend, Vertical)', '+fields.vin (extend, Vertical)'],
    snapshot: {
      schema: { field_count: 11, protected_count: 2 },
      rules: { count: 4, active: 4 },
      overlay_deltas: 2,
      workflow_states: 7,
    },
  },
  {
    version: 3, at: '2 weeks ago', by: 'System', kind: 'compile',
    note: 'Recompiled after platform upgrade v2.4.0',
    changes: [],
    snapshot: {
      schema: { field_count: 9, protected_count: 2 },
      rules: { count: 4, active: 4 },
      overlay_deltas: 2,
      workflow_states: 6,
    },
  },
  {
    version: 2, at: '1 month ago', by: 'Adel N.', kind: 'edit',
    note: 'Added Bajaj dealer code and GSTIN fields',
    changes: ['+fields.gstin (extend, Tenant)', '+fields.bajaj_dealer_code (extend, Tenant)'],
    snapshot: {
      schema: { field_count: 7, protected_count: 1 },
      rules: { count: 3, active: 3 },
      overlay_deltas: 1,
      workflow_states: 5,
    },
  },
  {
    version: 1, at: '2 months ago', by: 'Kai R.', kind: 'create',
    note: 'Created artifact from platform baseline',
    changes: ['+Initial platform schema'],
    snapshot: {
      schema: { field_count: 5, protected_count: 1 },
      rules: { count: 1, active: 1 },
      overlay_deltas: 0,
      workflow_states: 3,
    },
  },
];

const KIND_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  edit:    { color: 'var(--accent)',  label: 'Edited',    icon: <GitCommit size={14} /> },
  publish: { color: 'var(--green)',   label: 'Published', icon: <ArrowRight size={14} /> },
  compile: { color: 'var(--blue)',    label: 'Compiled',  icon: <Tag size={14} /> },
  create:  { color: 'var(--violet)',  label: 'Created',   icon: <Clock size={14} /> },
  restore: { color: 'var(--amber)',   label: 'Restored',  icon: <ArrowRight size={14} /> },
};

// ── Version Snapshot Modal ───────────────────────────────────────────────────

function VersionSnapshotModal({ version, onClose }: { version: VersionEntry; onClose: () => void }) {
  const cfg = KIND_CONFIG[version.kind] ?? KIND_CONFIG.edit;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--panel)', borderRadius: 'var(--radius-lg)',
        width: 560, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>v{version.version}</span>
              <span className="tag" style={{ background: cfg.color, color: '#fff', borderColor: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {version.note}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Meta */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-sunken)', display: 'flex', gap: 20 }}>
          <div className="row gap-6"><User size={13} className="muted" /><span className="muted text-xs">Author:</span><span style={{ fontSize: 13 }}>{version.by}</span></div>
          <div className="row gap-6"><Clock size={13} className="muted" /><span className="muted text-xs">Saved:</span><span style={{ fontSize: 13 }}>{version.at}</span></div>
        </div>

        {/* Snapshot stats */}
        {version.snapshot && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>State at this version</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Fields', value: version.snapshot.schema?.field_count ?? '—' },
                { label: 'Rules', value: version.snapshot.rules?.count ?? '—' },
                { label: 'Overlay deltas', value: version.snapshot.overlay_deltas ?? '—' },
                { label: 'Workflow states', value: version.snapshot.workflow_states ?? '—' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-sunken)', borderRadius: 'var(--radius)', padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{stat.value}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Changes */}
        {version.changes.length > 0 && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Changes in this version</div>
            {version.changes.map((c, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: c.startsWith('+') ? 'var(--green)' : 'var(--red)',
                padding: '3px 0', borderBottom: '1px solid var(--border)',
              }}>
                {c}
              </div>
            ))}
          </div>
        )}

        {version.changes.length === 0 && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>No field-level changes recorded for this version.</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Restore Confirm Modal ────────────────────────────────────────────────────

function RestoreConfirmModal({ version, onConfirm, onClose }: {
  version: VersionEntry;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--panel)', borderRadius: 'var(--radius-lg)',
        width: 460, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} style={{ color: 'var(--amber)' }} />
            <div style={{ fontWeight: 600, fontSize: 15 }}>Restore to v{version.version}?</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>
            This will create a <strong>new draft version</strong> with the state from{' '}
            <strong>v{version.version}</strong> ({version.note}).
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6 }} className="muted">
            Your current unsaved changes will not be affected. The restore will appear as a new version entry in the history above the current version.
          </p>

          {version.snapshot && (
            <div style={{
              marginTop: 16, padding: '12px 14px',
              background: 'var(--bg-sunken)', borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)',
            }}>
              <div>Will restore: {version.snapshot.schema?.field_count} fields · {version.snapshot.rules?.count} rules · {version.snapshot.overlay_deltas} overlay deltas</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onConfirm}
            style={{ background: 'var(--amber)', borderColor: 'var(--amber)' }}>
            Restore to v{version.version}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main VersionsTab ─────────────────────────────────────────────────────────

export default function VersionsTab({ artifactKey }: Props) {
  const { versionHistory, addVersionEntry, showToast } = useStudioStore();
  const [viewingVersion, setViewingVersion] = useState<VersionEntry | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<VersionEntry | null>(null);

  // Merge store restore entries with mock versions
  const allVersions = useMemo<VersionEntry[]>(() => {
    const stored = (versionHistory[artifactKey] ?? []) as VersionEntry[];
    if (stored.length === 0) return MOCK_VERSIONS;
    // Store entries appear at the top; give them version numbers above current max
    const maxV = Math.max(...MOCK_VERSIONS.map(v => v.version));
    const numbered = stored.map((e, i) => ({ ...e, version: maxV + stored.length - i }));
    return [...numbered, ...MOCK_VERSIONS];
  }, [versionHistory, artifactKey]);

  function handleRestore(v: VersionEntry) {
    const newEntry: VersionEntry = {
      version: 0, // will be recalculated on render
      at: 'just now',
      by: 'You',
      kind: 'restore',
      note: `Restored from v${v.version}: ${v.note}`,
      changes: [`~restore from v${v.version}`],
      snapshot: v.snapshot,
    };
    addVersionEntry(artifactKey, newEntry);
    showToast(`Restored to v${v.version} — new draft created`, 'success');
    setRestoringVersion(null);
  }

  const currentVersion = allVersions[0];

  return (
    <>
      <div style={{ padding: '20px 32px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Version History</h3>
            <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              {allVersions.length} versions · Current: v{currentVersion?.version}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => showToast('Version comparison coming soon', 'info')}>
            Compare versions
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />

          {allVersions.map((v, i) => {
            const cfg = KIND_CONFIG[v.kind] ?? KIND_CONFIG.edit;
            const isCurrent = i === 0;
            return (
              <div key={`${v.version}-${i}`} style={{ display: 'flex', gap: 20, marginBottom: 20, position: 'relative' }}>
                {/* Timeline dot */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: isCurrent ? cfg.color : 'var(--bg-elev)',
                  border: `2px solid ${isCurrent ? cfg.color : 'var(--border-strong)'}`,
                  display: 'grid', placeItems: 'center',
                  color: isCurrent ? 'white' : cfg.color,
                  flexShrink: 0, zIndex: 1,
                }}>
                  {cfg.icon}
                </div>

                {/* Card */}
                <div className="card" style={{ flex: 1 }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>v{v.version}</span>
                        <span className="tag" style={{
                          background: isCurrent ? cfg.color : undefined,
                          color: isCurrent ? '#fff' : undefined,
                          borderColor: isCurrent ? cfg.color : undefined,
                        }}>{cfg.label}</span>
                        {isCurrent && <span className="chip active">Current</span>}
                        {v.kind === 'restore' && !isCurrent && <span className="chip draft">restore</span>}
                      </div>
                      <div style={{ fontSize: 13, marginBottom: 6 }}>{v.note}</div>
                      <div className="row" style={{ gap: 10 }}>
                        <span className="muted text-xs row gap-4"><User size={11} />{v.by}</span>
                        <span className="muted text-xs row gap-4"><Clock size={11} />{v.at}</span>
                      </div>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewingVersion(v)}>View</button>
                      {!isCurrent && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setRestoringVersion(v)}>
                          Restore
                        </button>
                      )}
                    </div>
                  </div>

                  {v.changes.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px' }}>
                      {v.changes.map((c, ci) => (
                        <div key={ci} style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 3 }}>
                          <span style={{ color: c.startsWith('+') ? 'var(--green)' : c.startsWith('~') ? 'var(--amber)' : 'var(--red)' }}>
                            {c[0]}
                          </span>
                          {c.slice(1)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewingVersion && (
        <VersionSnapshotModal
          version={viewingVersion}
          onClose={() => setViewingVersion(null)}
        />
      )}

      {restoringVersion && (
        <RestoreConfirmModal
          version={restoringVersion}
          onConfirm={() => handleRestore(restoringVersion)}
          onClose={() => setRestoringVersion(null)}
        />
      )}
    </>
  );
}
