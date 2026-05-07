import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Package, ArrowRight, AlertTriangle, CheckCircle2, Clock, ShieldCheck,
  Rocket, ChevronRight, User, Calendar, BarChart2,
} from 'lucide-react';
import { getReleasePackages } from '../data/mockService';
import type { ReleasePackage, ReleaseStatus } from '../types';

// ===== Status helpers =====

interface StatusMeta {
  label: string;
  chipClass: string;
}

const STATUS_META: Record<ReleaseStatus, StatusMeta> = {
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

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'validating', label: 'Validating' },
  { key: 'ready_for_approval', label: 'Ready for Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'active', label: 'Active' },
] as const;

type FilterKey = (typeof FILTER_OPTIONS)[number]['key'];

const ENV_STEPS = ['DEV', 'UAT', 'PRODUCTION'];

function EnvArrow({ current, target }: { current: string; target: string }) {
  const currentIdx = ENV_STEPS.indexOf(current);
  const targetIdx = ENV_STEPS.indexOf(target);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {ENV_STEPS.map((env, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isNext = idx === targetIdx;
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
                padding: '2px 7px',
                borderRadius: 4,
                background: isCurrent
                  ? 'var(--accent-soft)'
                  : isNext
                  ? 'var(--green-soft)'
                  : 'transparent',
                border: isCurrent || isNext ? `1px solid ${color}` : '1px solid transparent',
              }}
            >
              {env}
            </span>
            {idx < ENV_STEPS.length - 1 && (
              <ChevronRight size={12} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
            )}
          </span>
        );
      })}
    </div>
  );
}

function ValidationProgress({ results }: { results: ReleasePackage['validation_results'] }) {
  const total = results.length;
  if (total === 0) return null;
  const passed = results.filter(r => r.result === 'pass' || (r as any).status === 'pass').length;
  const pct = Math.round((passed / total) * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress" style={{ flex: 1, height: 5 }}>
        <div
          className={`progress-fill${pct === 100 ? ' green' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 60 }}>
        {passed}/{total} checks
      </span>
    </div>
  );
}

function StatusIcon({ status }: { status: ReleaseStatus }) {
  if (status === 'draft' || status === 'validating') {
    return <Clock size={14} style={{ color: 'var(--amber)' }} />;
  }
  if (status === 'validation_failed' || status === 'rolled_back') {
    return <AlertTriangle size={14} style={{ color: 'var(--red)' }} />;
  }
  if (status === 'ready_for_approval') {
    return <ShieldCheck size={14} style={{ color: 'var(--blue)' }} />;
  }
  if (status === 'approved') {
    return <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />;
  }
  if (status === 'active' || status === 'promoted_uat' || status === 'promoted_production') {
    return <Rocket size={14} style={{ color: 'var(--green)' }} />;
  }
  return <Package size={14} style={{ color: 'var(--text-muted)' }} />;
}

function ReleaseCard({ pkg, onClick }: { pkg: ReleasePackage; onClick: () => void }) {
  const meta = STATUS_META[pkg.status] ?? { label: pkg.status, chipClass: 'draft' };

  return (
    <div className="release-card" onClick={onClick} role="button" tabIndex={0}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <StatusIcon status={pkg.status} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pkg.name}
            </div>
            {pkg.description && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pkg.description}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span className={`chip ${meta.chipClass}`}>{meta.label}</span>
          <span className={`tag ${RISK_CLASS[pkg.risk] ?? ''}`} style={{ fontSize: 11 }}>
            {pkg.risk} risk
          </span>
        </div>
      </div>

      {/* Environment pipeline */}
      <div style={{ marginBottom: 10 }}>
        <EnvArrow current={pkg.environment} target={pkg.target_environment} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
          <BarChart2 size={12} />
          {pkg.items?.length ?? 0} items
        </div>
        {pkg.owner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <User size={12} />
            {pkg.owner.split('@')[0]}
          </div>
        )}
        {pkg.created_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <Calendar size={12} />
            {new Date(pkg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Validation progress */}
      {pkg.validation_results?.length > 0 && (
        <ValidationProgress results={pkg.validation_results} />
      )}
    </div>
  );
}

function matchesFilter(pkg: ReleasePackage, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'draft') return pkg.status === 'draft';
  if (filter === 'validating') return pkg.status === 'validating';
  if (filter === 'ready_for_approval') return pkg.status === 'ready_for_approval';
  if (filter === 'approved') return pkg.status === 'approved';
  if (filter === 'active') return pkg.status === 'active' || pkg.status === 'promoted_uat' || pkg.status === 'promoted_production';
  return true;
}

export default function ReleasesPage() {
  const navigate = useNavigate();
  const packages = getReleasePackages();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered = packages.filter(pkg => matchesFilter(pkg, activeFilter));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Release Packages</h1>
            <p className="page-sub">{packages.length} package{packages.length !== 1 ? 's' : ''} — governed configuration releases</p>
          </div>
          <button className="btn btn-primary" onClick={() => {}}>
            <Plus size={14} />
            New Release Package
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="list-toolbar">
        {FILTER_OPTIONS.map(opt => {
          const count = opt.key === 'all'
            ? packages.length
            : packages.filter(p => matchesFilter(p, opt.key)).length;
          return (
            <button
              key={opt.key}
              className={`filter-chip${activeFilter === opt.key ? ' active' : ''}`}
              onClick={() => setActiveFilter(opt.key)}
            >
              {opt.label}
              {count > 0 && (
                <span
                  style={{
                    fontSize: 10.5,
                    background: activeFilter === opt.key ? 'var(--accent)' : 'var(--bg-sunken)',
                    color: activeFilter === opt.key ? 'white' : 'var(--text-muted)',
                    borderRadius: 999,
                    padding: '1px 6px',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <span className="spacer" />
        <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div className="content">
        {filtered.length === 0 ? (
          <div className="empty">
            <Package size={40} className="empty-icon" />
            <p className="empty-title">No release packages</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {activeFilter === 'all'
                ? 'Create your first release package to bundle and promote configuration changes.'
                : `No packages match the "${FILTER_OPTIONS.find(o => o.key === activeFilter)?.label}" filter.`}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map(pkg => (
              <ReleaseCard
                key={pkg.release_id}
                pkg={pkg}
                onClick={() => navigate(`/admin/studio/releases/${pkg.release_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
