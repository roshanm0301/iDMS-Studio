import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Send, CheckCircle2, XCircle, Archive,
  Clock, FileEdit, Eye, Shield, Calendar, GitBranch, Layers,
  ChevronRight, AlertTriangle, Copy,
} from 'lucide-react';
import {
  getRuleFamilyById,
  getRuleVersions,
  createDraftVersion,
  transitionLifecycleState,
} from '../../data/ruleEngineService';
import {
  validateLifecycleTransition,
  validatePublishReadiness,
  VALID_LIFECYCLE_TRANSITIONS,
} from '../../metadata/rule-platform-definition';
import type { RuleLifecycleState, RuleVersion } from '../../metadata/rule-platform-definition';

// ── Helpers ──────────────────────────────────────────────────
const LIFECYCLE_LABELS: Record<RuleLifecycleState, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  retired: 'Retired',
  rejected: 'Rejected',
  archived: 'Archived',
};

const LIFECYCLE_COLORS: Record<RuleLifecycleState, { bg: string; color: string }> = {
  draft: { bg: '#FEF3C7', color: '#92400E' },
  in_review: { bg: '#DBEAFE', color: '#1E40AF' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  published: { bg: '#D1FAE5', color: '#065F46' },
  retired: { bg: '#F3F4F6', color: '#6B7280' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
  archived: { bg: '#F3F4F6', color: '#9CA3AF' },
};

const TRANSITION_ACTIONS: Record<RuleLifecycleState, { label: string; icon: typeof Send; variant: string }> = {
  in_review: { label: 'Submit for Review', icon: Send, variant: 'btn-primary' },
  draft: { label: 'Send Back', icon: FileEdit, variant: 'btn-secondary' },
  approved: { label: 'Approve', icon: CheckCircle2, variant: 'btn-primary' },
  published: { label: 'Publish', icon: CheckCircle2, variant: 'btn-primary' },
  retired: { label: 'Retire', icon: Archive, variant: 'btn-secondary' },
  rejected: { label: 'Reject', icon: XCircle, variant: 'btn-secondary' },
  archived: { label: 'Archive', icon: Archive, variant: 'btn-ghost' },
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────
export default function RuleDetailPage() {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const family = useMemo(() => getRuleFamilyById(familyId ?? ''), [familyId, refreshKey]);
  const allVersions = useMemo(() => getRuleVersions(familyId ?? ''), [familyId, refreshKey]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const selectedVersion = useMemo(() => {
    if (selectedVersionId) return allVersions.find(v => v.versionId === selectedVersionId);
    return allVersions[0]; // most recent
  }, [allVersions, selectedVersionId]);

  if (!family) {
    return (
      <div className="content" style={{ padding: 40 }}>
        <p>Rule family not found.</p>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/studio/rule-engine')}>
          <ArrowLeft size={14} /> Back to Registry
        </button>
      </div>
    );
  }

  const handleTransition = (toState: RuleLifecycleState) => {
    if (!selectedVersion) return;
    setError(null);
    setSuccess(null);

    const validationResult = validateLifecycleTransition(selectedVersion.lifecycleState, toState);
    if (!validationResult.valid) {
      setError(validationResult.issues[0]?.message ?? 'Invalid transition');
      return;
    }

    // For publish, run publish validation
    if (toState === 'published') {
      const publishResult = validatePublishReadiness(selectedVersion);
      if (!publishResult.canPublish) {
        setError(publishResult.blockingIssues.map(i => i.message).join('; '));
        return;
      }
    }

    // RULE-UI-010: Require confirmation for publish/retire/rollback
    const requiresConfirmation = toState === 'published' || toState === 'retired' ||
      selectedVersion.lifecycleState === 'retired';
    if (requiresConfirmation) {
      const actionLabel = toState === 'retired' ? 'retire' : 'publish';
      const confirmed = window.confirm(
        `Are you sure you want to ${actionLabel} this rule version? This action requires governance approval.`,
      );
      if (!confirmed) return;
    }

    // RULE-RBK-006: Require reason for retire and rollback
    let reason: string | undefined;
    const needsReason = toState === 'retired' || (selectedVersion.lifecycleState === 'retired' && toState === 'published');
    if (needsReason) {
      const input = window.prompt('Please provide a reason for this action:');
      if (!input || !input.trim()) {
        setError('Reason is required for retire/rollback actions.');
        return;
      }
      reason = input.trim();
    }

    try {
      transitionLifecycleState(selectedVersion.versionId, toState, 'current_user', reason);
      setSuccess(`Version transitioned to "${LIFECYCLE_LABELS[toState]}" successfully.`);
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreateDraft = () => {
    setError(null);
    try {
      const newVersion = createDraftVersion(family.familyId, {
        displayName: family.displayName,
        description: family.description,
      });
      setSelectedVersionId(newVersion.versionId);
      setSuccess(`New draft version ${newVersion.versionLabel} created.`);
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const allowedTransitions = selectedVersion
    ? VALID_LIFECYCLE_TRANSITIONS[selectedVersion.lifecycleState]
    : [];

  const isReadOnly = selectedVersion?.lifecycleState !== 'draft';

  return (
    <div className="content">
      {/* Breadcrumb + title */}
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/studio/rule-engine')}>
            <ArrowLeft size={14} /> Rule Engine
          </button>
          <ChevronRight size={12} className="muted" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{family.displayName}</span>
        </div>

        <div className="page-head-row">
          <div>
            <h1 className="page-title">{family.displayName}</h1>
            <div className="page-sub" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
              <code style={{ fontSize: 12, background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>
                {family.ruleCode}
              </code>
              <span>·</span>
              <span>{allVersions.length} version{allVersions.length !== 1 ? 's' : ''}</span>
              {family.description && (
                <>
                  <span>·</span>
                  <span>{family.description}</span>
                </>
              )}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCreateDraft}>
              <Plus size={14} /> New Draft Version
            </button>
          </div>
        </div>
      </div>

      {/* Alert messages */}
      {error && (
        <div style={{ margin: '0 24px 12px', padding: '10px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 6, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={14} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>×</button>
        </div>
      )}
      {success && (
        <div style={{ margin: '0 24px 12px', padding: '10px 16px', background: '#D1FAE5', color: '#065F46', borderRadius: 6, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle2 size={14} />
          {success}
          <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, padding: '0 24px 40px' }}>
        {/* Version sidebar */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 8 }}>
            Versions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allVersions.map(v => {
              const active = v.versionId === selectedVersion?.versionId;
              const stateColor = LIFECYCLE_COLORS[v.lifecycleState];
              return (
                <div
                  key={v.versionId}
                  onClick={() => setSelectedVersionId(v.versionId)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: active ? 'var(--bg-hover)' : 'transparent',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>v{v.versionLabel}</span>
                    <span
                      className="tag"
                      style={{ background: stateColor.bg, color: stateColor.color, fontSize: 10 }}
                    >
                      {LIFECYCLE_LABELS[v.lifecycleState]}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {formatDateTime(v.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Version detail */}
        {selectedVersion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Actions bar */}
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="tag"
                style={{
                  background: LIFECYCLE_COLORS[selectedVersion.lifecycleState].bg,
                  color: LIFECYCLE_COLORS[selectedVersion.lifecycleState].color,
                  fontSize: 12,
                }}
              >
                {LIFECYCLE_LABELS[selectedVersion.lifecycleState]}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>v{selectedVersion.versionLabel}</span>
              {isReadOnly && (
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={11} /> Read-only
                </span>
              )}
              <div style={{ flex: 1 }} />
              {allowedTransitions.map(toState => {
                const action = TRANSITION_ACTIONS[toState];
                if (!action) return null;
                const Icon = action.icon;
                return (
                  <button
                    key={toState}
                    className={`btn ${action.variant} btn-sm`}
                    onClick={() => handleTransition(toState)}
                  >
                    <Icon size={13} /> {action.label}
                  </button>
                );
              })}
            </div>

            {/* Metadata card */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Version Metadata</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <MetaField label="Display Name" value={selectedVersion.displayName} />
                <MetaField label="Rule Type" value={selectedVersion.ruleType} />
                <MetaField label="Domain" value={selectedVersion.domain ?? '—'} />
                <MetaField label="Entity Type" value={selectedVersion.entityType ?? '—'} />
                <MetaField label="Document Type" value={selectedVersion.documentType ?? '—'} />
                <MetaField label="Priority Order" value={String(selectedVersion.priorityOrder)} />
                <MetaField label="Non-Overridable" value={selectedVersion.nonOverridable ? 'Yes' : 'No'} />
                <MetaField label="Used in Runtime" value={selectedVersion.usedInRuntime ? 'Yes' : 'No'} />
              </div>
            </div>

            {/* Scope card */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Scope</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <MetaField label="Tenant" value={selectedVersion.scope.tenantId === '*' ? 'All Tenants' : selectedVersion.scope.tenantId} />
                <MetaField label="Organization" value={selectedVersion.scope.organizationId ?? 'All'} />
                <MetaField label="Business Unit" value={selectedVersion.scope.businessUnitId ?? 'All'} />
                <MetaField label="Branch" value={selectedVersion.scope.branchId ?? 'All'} />
                <MetaField label="Role" value={selectedVersion.scope.roleId ?? 'All'} />
                <MetaField label="Entity" value={selectedVersion.scope.entityType ?? 'All'} />
              </div>
            </div>

            {/* Effective Date card */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Effective Date</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <MetaField label="Effective From" value={formatDateTime(selectedVersion.effectiveDate.effectiveFrom)} />
                <MetaField label="Effective To" value={selectedVersion.effectiveDate.effectiveTo ? formatDateTime(selectedVersion.effectiveDate.effectiveTo) : 'No end date'} />
              </div>
            </div>

            {/* Audit trail card */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Audit Trail</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AuditRow label="Created" by={selectedVersion.createdBy} at={selectedVersion.createdAt} />
                {selectedVersion.submittedBy && (
                  <AuditRow label="Submitted" by={selectedVersion.submittedBy} at={selectedVersion.submittedAt} />
                )}
                {selectedVersion.reviewedBy && (
                  <AuditRow label="Reviewed" by={selectedVersion.reviewedBy} at={selectedVersion.reviewedAt} />
                )}
                {selectedVersion.approvedBy && (
                  <AuditRow label="Approved" by={selectedVersion.approvedBy} at={selectedVersion.approvedAt} />
                )}
                {selectedVersion.publishedBy && (
                  <AuditRow label="Published" by={selectedVersion.publishedBy} at={selectedVersion.publishedAt} />
                )}
                {selectedVersion.retiredBy && (
                  <AuditRow label="Retired" by={selectedVersion.retiredBy} at={selectedVersion.retiredAt} />
                )}
              </div>
            </div>

            {/* Configuration references */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Configuration References</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <MetaField label="Expression" value={selectedVersion.expressionRef ?? '—'} mono />
                <MetaField label="Condition" value={selectedVersion.conditionRef ?? '—'} mono />
                <MetaField label="Action" value={selectedVersion.actionRef ?? '—'} mono />
                <MetaField label="Output" value={selectedVersion.outputRef ?? '—'} mono />
                <MetaField label="Domain Config" value={selectedVersion.domainConfigRef ?? '—'} mono />
                <MetaField label="Dependencies" value={selectedVersion.dependsOn?.join(', ') ?? 'None'} mono />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono ? 'var(--font-mono, monospace)' : undefined }}>
        {value}
      </div>
    </div>
  );
}

function AuditRow({ label, by, at }: { label: string; by: string; at?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
      <span style={{ width: 80, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      <span>{by}</span>
      <span style={{ color: 'var(--muted)' }}>{at ? formatDateTime(at) : ''}</span>
    </div>
  );
}
