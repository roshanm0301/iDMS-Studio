import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Info,
  Play, Clock, ShieldCheck, Rocket, RotateCcw, Package, Plus, User,
  Calendar, BarChart2, Send, Lock, Circle,
} from 'lucide-react';
import { getReleasePackage, getSimulationCases } from '../data/mockService';
import LayerBadge from '../components/ui/LayerBadge';
import type { ReleasePackage, ReleaseItem, SimulationCase, ValidationResult, ReleaseStatus, LayerCode } from '../types';

// ===== Helpers =====

const STATUS_META: Record<ReleaseStatus, { label: string; chipClass: string }> = {
  draft: { label: 'Draft', chipClass: 'draft' },
  validating: { label: 'Validating', chipClass: 'draft' },
  validation_failed: { label: 'Validation Failed', chipClass: 'error' },
  ready_for_approval: { label: 'Ready for Approval', chipClass: 'active' },
  approved: { label: 'Approved', chipClass: 'active' },
  promoted_uat: { label: 'Promoted to UAT', chipClass: 'active' },
  promoted_production: { label: 'In Production', chipClass: 'active' },
  active: { label: 'Active', chipClass: 'active' },
  rolled_back: { label: 'Rolled Back', chipClass: 'error' },
};

const RISK_CLASS: Record<string, string> = {
  low: 'green',
  medium: 'amber',
  high: 'red',
};

const ENV_STEPS = ['DEV', 'UAT', 'PRODUCTION'];

function EnvArrow({ current, target }: { current: string; target: string }) {
  const currentIdx = ENV_STEPS.indexOf(current);
  const targetIdx = ENV_STEPS.indexOf(target);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {ENV_STEPS.map((env, idx) => {
        const isCurrent = idx === currentIdx;
        const isNext = idx === targetIdx;
        const isPast = idx < currentIdx;
        const color = isCurrent
          ? 'var(--accent)'
          : isNext
          ? 'var(--green)'
          : isPast
          ? 'var(--text-subtle)'
          : 'var(--border-strong)';
        return (
          <span key={env} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: isCurrent || isNext ? 600 : 400,
                color,
                padding: '2px 8px',
                borderRadius: 4,
                background: isCurrent ? 'var(--accent-soft)' : isNext ? 'var(--green-soft)' : 'transparent',
                border: isCurrent || isNext ? `1px solid ${color}` : '1px solid transparent',
              }}
            >
              {env}
            </span>
            {idx < ENV_STEPS.length - 1 && (
              <ChevronRight size={11} style={{ color: 'var(--text-subtle)' }} />
            )}
          </span>
        );
      })}
    </div>
  );
}

function ValidationIcon({ result }: { result: string }) {
  if (result === 'pass') return <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />;
  if (result === 'warn' || result === 'warning') return <AlertTriangle size={16} style={{ color: 'var(--amber)' }} />;
  if (result === 'error') return <XCircle size={16} style={{ color: 'var(--red)' }} />;
  return <Info size={16} style={{ color: 'var(--blue)' }} />;
}

function getValidationClass(result: string) {
  if (result === 'pass') return 'pass';
  if (result === 'warn' || result === 'warning') return 'warn';
  if (result === 'error') return 'error';
  return '';
}

function SimStatusBadge({ status }: { status: SimulationCase['status'] }) {
  if (status === 'pass') return <span className="tag green">Pass</span>;
  if (status === 'fail') return <span className="tag red">Fail</span>;
  return <span className="tag">Not Run</span>;
}

function ReleaseStatusIcon({ status }: { status: ReleaseStatus }) {
  if (status === 'draft' || status === 'validating') return <Clock size={14} style={{ color: 'var(--amber)' }} />;
  if (status === 'validation_failed' || status === 'rolled_back') return <XCircle size={14} style={{ color: 'var(--red)' }} />;
  if (status === 'ready_for_approval') return <ShieldCheck size={14} style={{ color: 'var(--blue)' }} />;
  if (status === 'approved') return <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />;
  if (status === 'active' || status === 'promoted_uat' || status === 'promoted_production') {
    return <Rocket size={14} style={{ color: 'var(--green)' }} />;
  }
  return <Package size={14} style={{ color: 'var(--text-muted)' }} />;
}

function ChangeTypeBadge({ changeType }: { changeType: string }) {
  const color =
    changeType === 'rule' ? 'violet' :
    changeType === 'permission' ? 'amber' :
    changeType === 'entity_delta' ? 'green' :
    changeType === 'overlay_delta' ? '' : '';
  return <span className={`tag${color ? ' ' + color : ''}`} style={{ fontSize: 10 }}>{changeType.replace(/_/g, ' ')}</span>;
}

const APPROVAL_CHAIN = [
  { level: 1, role: 'Functional Consultant', status: 'approved', approver: 'consultant@bajaj-demo.example' },
  { level: 2, role: 'Tenant Admin', status: 'pending', approver: 'admin@bajaj-demo.example' },
  { level: 3, role: 'OEM Admin', status: 'waiting', approver: 'oem@idms.example' },
];

const READINESS_CHECKS = [
  { label: 'Schema validation', status: 'pass' },
  { label: 'Overlay merge', status: 'pass' },
  { label: 'Protected node check', status: 'pass' },
  { label: 'Rule DSL validation', status: 'pass' },
  { label: 'Workflow path check', status: 'warn' },
  { label: 'Permission consistency', status: 'pass' },
  { label: 'Simulation coverage', status: 'warn' },
  { label: 'Approval signatures', status: 'error' },
];

function ReadinessIcon({ status }: { status: string }) {
  if (status === 'pass') return <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />;
  if (status === 'warn') return <AlertTriangle size={14} style={{ color: 'var(--amber)' }} />;
  return <XCircle size={14} style={{ color: 'var(--red)' }} />;
}

// ===== Left panel =====

function LeftPanel({
  pkg,
  selectedItemId,
  onSelectItem,
}: {
  pkg: ReleasePackage;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  const meta = STATUS_META[pkg.status] ?? { label: pkg.status, chipClass: 'draft' };

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-elev)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Package info */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ReleaseStatusIcon status={pkg.status} />
          <span style={{ fontWeight: 600, fontSize: 13.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pkg.name}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <span className={`chip ${meta.chipClass}`}>{meta.label}</span>
          <span className={`tag ${RISK_CLASS[pkg.risk] ?? ''}`} style={{ fontSize: 10 }}>{pkg.risk} risk</span>
        </div>

        <EnvArrow current={pkg.environment} target={pkg.target_environment} />

        {pkg.owner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 10 }}>
            <User size={11} />
            {pkg.owner.split('@')[0]}
          </div>
        )}
        {pkg.created_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            <Calendar size={11} />
            {new Date(pkg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Items header */}
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <span className="panel-title">Release Items</span>
        <span className="tag" style={{ fontSize: 10 }}>{pkg.items?.length ?? 0}</span>
      </div>

      {/* Items list */}
      <div className="panel-body">
        {(pkg.items ?? []).map((item: ReleaseItem) => (
          <div
            key={item.item_id}
            onClick={() => onSelectItem(item.item_id)}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              background: selectedItemId === item.item_id ? 'var(--selected)' : 'transparent',
              borderLeft: selectedItemId === item.item_id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'background 0.1s',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', marginBottom: 3 }}>
              {item.artifact_key}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <ChangeTypeBadge changeType={item.change_type} />
              <LayerBadge layer={item.layer as LayerCode} small />
              <span className={`tag ${RISK_CLASS[item.risk] ?? ''}`} style={{ fontSize: 10 }}>
                {item.risk}
              </span>
            </div>
            {item.status && (
              <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-subtle)' }}>
                {item.status.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Center panel =====

function CenterPanel({ pkg }: { pkg: ReleasePackage }) {
  const [simCaseStatuses, setSimCaseStatuses] = useState<Record<string, SimulationCase['status']>>({});

  const allSimCases = getSimulationCases();
  const caseIds: string[] = (pkg as any).simulation_case_ids ?? [];
  const simCases = caseIds.length > 0
    ? allSimCases.filter(c => caseIds.includes(c.case_id))
    : (pkg.simulation_cases ?? []);

  const isDraft = pkg.status === 'draft' || pkg.status === 'validating';
  const canPromote = pkg.status === 'approved';
  const canRollback = pkg.status === 'promoted_uat' || pkg.status === 'promoted_production' || pkg.status === 'active';

  function runSimCase(caseId: string) {
    setSimCaseStatuses(prev => ({ ...prev, [caseId]: 'pass' }));
    setTimeout(() => {}, 0);
  }

  const validationResults: ValidationResult[] = pkg.validation_results ?? [];

  const passCount = validationResults.filter(
    v => v.result === 'pass' || (v as any).status === 'pass',
  ).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Action bar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elev)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Package size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{pkg.name}</span>
        <button
          className="btn btn-sm btn-primary"
          disabled={!isDraft}
          title={!isDraft ? 'Already submitted or beyond draft' : undefined}
        >
          <Send size={13} />
          Submit for Approval
        </button>
        <button
          className="btn btn-sm"
          style={{ background: 'var(--bg-elev)', border: '1px solid var(--border-strong)' }}
          disabled={!canPromote}
          title={!canPromote ? 'Release must be approved first' : undefined}
        >
          <Rocket size={13} />
          Promote to UAT
        </button>
        <button
          className="btn btn-sm btn-danger"
          disabled={!canRollback}
          title={!canRollback ? 'Nothing to roll back' : undefined}
        >
          <RotateCcw size={13} />
          Rollback
        </button>
      </div>

      <div className="panel-body">
        {/* Validation Results */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="panel-title">Validation Results</span>
              <span className="tag" style={{ fontSize: 10 }}>{passCount}/{validationResults.length} passed</span>
            </div>
            <div className="progress" style={{ width: 80, height: 5 }}>
              <div
                className={`progress-fill${passCount === validationResults.length ? ' green' : ''}`}
                style={{ width: `${validationResults.length ? Math.round((passCount / validationResults.length) * 100) : 0}%` }}
              />
            </div>
          </div>

          {validationResults.length === 0 ? (
            <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              No validation results yet. Submit the package to trigger validation.
            </div>
          ) : (
            validationResults.map((v, i) => {
              const result = v.result ?? (v as any).status ?? 'info';
              return (
                <div key={i} className={`validation-item ${getValidationClass(result)}`}>
                  <ValidationIcon result={result} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                      {(v as any).check?.replace(/_/g, ' ') ?? v.step}
                    </div>
                    {v.message && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {v.message}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Simulation Cases */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="panel-header">
            <span className="panel-title">Simulation Cases</span>
            <span className="tag" style={{ fontSize: 10 }}>{simCases.length} cases</span>
          </div>

          {simCases.length === 0 ? (
            <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              No simulation cases linked to this release.
            </div>
          ) : (
            simCases.map(c => {
              const currentStatus = simCaseStatuses[c.case_id] ?? c.status;
              return (
                <div
                  key={c.case_id}
                  className="sim-step"
                >
                  <div
                    className={`sim-step-icon${currentStatus === 'pass' ? ' pass' : currentStatus === 'fail' ? ' fail' : ' info'}`}
                  >
                    {currentStatus === 'pass' ? '✓' : currentStatus === 'fail' ? '✗' : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sim-step-label">{c.label}</div>
                    <div className="sim-step-detail">
                      {c.entity_type} · {c.trigger ?? (c as any).command}
                      {c.session?.role && ` · ${c.session.role}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SimStatusBadge status={currentStatus} />
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => runSimCase(c.case_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Play size={11} />
                      Run
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Approval chain */}
        <div>
          <div className="panel-header">
            <span className="panel-title">Approval Chain</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {APPROVAL_CHAIN.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: step.status === 'approved' ? 'var(--green-soft)' : 'var(--bg-elev)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background:
                      step.status === 'approved'
                        ? 'var(--green)'
                        : step.status === 'pending'
                        ? 'var(--accent-soft)'
                        : 'var(--bg-sunken)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color:
                      step.status === 'approved'
                        ? 'white'
                        : step.status === 'pending'
                        ? 'var(--accent)'
                        : 'var(--text-subtle)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {step.status === 'approved' ? '✓' : step.level}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{step.role}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{step.approver}</div>
                </div>
                <span
                  className={`chip${step.status === 'approved' ? ' active' : step.status === 'pending' ? ' draft' : ''}`}
                  style={{ fontSize: 10 }}
                >
                  {step.status === 'approved' ? 'Approved' : step.status === 'pending' ? 'Pending' : 'Waiting'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Right panel =====

function RightPanel({ pkg }: { pkg: ReleasePackage }) {
  const passCount = READINESS_CHECKS.filter(c => c.status === 'pass').length;
  const isReady = passCount === READINESS_CHECKS.length;

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-elev)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Readiness checklist */}
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <span className="panel-title">Release Readiness</span>
        <span className={`tag ${isReady ? 'green' : 'amber'}`} style={{ fontSize: 10 }}>
          {passCount}/{READINESS_CHECKS.length}
        </span>
      </div>

      <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
        {READINESS_CHECKS.map((check, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 16px',
              fontSize: 12.5,
            }}
          >
            <ReadinessIcon status={check.status} />
            <span style={{ flex: 1, color: check.status === 'error' ? 'var(--red)' : check.status === 'warn' ? 'var(--amber)' : 'var(--text)' }}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {/* Compile preview status */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: 10,
          }}
        >
          Compile Preview
        </div>
        <div
          style={{
            background: 'var(--bg-sunken)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CheckCircle2 size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Compile ready</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {pkg.items?.length ?? 0} artifact{(pkg.items?.length ?? 0) !== 1 ? 's' : ''} staged for compile
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="progress" style={{ height: 5 }}>
              <div className="progress-fill green" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Add items */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: 10,
          }}
        >
          Package Contents
        </div>
        <button
          className="btn btn-sm"
          style={{
            width: '100%',
            justifyContent: 'center',
            background: 'var(--bg-elev)',
            border: '1px dashed var(--border-strong)',
            color: 'var(--text-muted)',
          }}
          onClick={() => {}}
        >
          <Plus size={13} />
          Add Artifact to Package
        </button>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          {pkg.items?.length ?? 0} artifact change{(pkg.items?.length ?? 0) !== 1 ? 's' : ''} included in this release.
        </div>
      </div>
    </div>
  );
}

// ===== Page =====

export default function ReleaseDetailPage() {
  const { releaseId } = useParams<{ releaseId: string }>();
  const navigate = useNavigate();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const pkg = releaseId ? getReleasePackage(releaseId) : undefined;

  if (!pkg) {
    return (
      <div className="empty" style={{ height: '100%' }}>
        <Package size={40} className="empty-icon" />
        <p className="empty-title">Release not found</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          The release package "{releaseId}" does not exist.
        </p>
        <button className="btn btn-sm btn-ghost" onClick={() => navigate('/admin/studio/releases')} style={{ marginTop: 8 }}>
          <ArrowLeft size={13} />
          Back to Releases
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Breadcrumb bar */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elev)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => navigate('/admin/studio/releases')}
          style={{ padding: '3px 8px' }}
        >
          <ArrowLeft size={13} />
          Releases
        </button>
        <ChevronRight size={13} style={{ color: 'var(--text-subtle)' }} />
        <span style={{ fontWeight: 500 }}>{pkg.name}</span>
      </div>

      {/* 3-panel layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel pkg={pkg} selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} />
        <CenterPanel pkg={pkg} />
        <RightPanel pkg={pkg} />
      </div>
    </div>
  );
}
