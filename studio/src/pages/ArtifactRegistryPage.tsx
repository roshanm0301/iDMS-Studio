import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';
import { getArtifacts } from '../data/mockService';
import { useStudioStore } from '../hooks/useStudioStore';
import type { ArtifactType, ArtifactStatus, LayerCode } from '../types';
import LayerBadge from '../components/ui/LayerBadge';
import StatusTag from '../components/ui/StatusTag';

const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  entity_schema:       'Entity Schema',
  workflow_definition: 'Workflow',
  rule_definition:     'Rule',
  permission_matrix:   'Permissions',
  ui_form_schema:      'Form Schema',
  ui_list_schema:      'List Schema',
};

const ARTIFACT_TYPE_FILTERS: { value: ArtifactType | 'all'; label: string }[] = [
  { value: 'all',                label: 'All Types' },
  { value: 'entity_schema',      label: 'Entity Schema' },
  { value: 'workflow_definition', label: 'Workflow' },
  { value: 'rule_definition',    label: 'Rule' },
  { value: 'permission_matrix',  label: 'Permissions' },
];

const STATUS_FILTERS: { value: ArtifactStatus | 'all'; label: string }[] = [
  { value: 'all',           label: 'All Status' },
  { value: 'active',        label: 'Active' },
  { value: 'draft',         label: 'Draft' },
  { value: 'compile_error', label: 'Compile Error' },
];

const MODULE_FILTERS: { value: string }[] = [
  { value: 'all' },
  { value: 'Sales' },
  { value: 'Service' },
  { value: 'Parts' },
];

export default function ArtifactRegistryPage() {
  const navigate = useNavigate();
  const setSelectedArtifact = useStudioStore(s => s.setSelectedArtifact);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ArtifactType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ArtifactStatus | 'all'>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const all = useMemo(() => getArtifacts(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(a => {
      if (typeFilter !== 'all' && a.artifact_type !== typeFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (moduleFilter !== 'all' && a.module !== moduleFilter) return false;
      if (q && !a.label.toLowerCase().includes(q) && !a.artifact_key.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, search, typeFilter, statusFilter, moduleFilter]);

  function handleCardClick(artifactKey: string) {
    setSelectedArtifact(artifactKey);
    navigate(`/admin/studio/artifacts/${artifactKey}`);
  }

  const statusChipClass = (status: ArtifactStatus | 'all') => {
    if (status === 'active') return 'chip active';
    if (status === 'draft') return 'chip draft';
    if (status === 'compile_error') return 'chip error';
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Artifacts</h1>
          <p className="page-sub">{filtered.length} of {all.length} artifacts</p>
        </div>
        <button className="btn btn-primary" onClick={() => {}}>
          <Plus size={15} />
          New Artifact
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="list-toolbar" style={{ flexWrap: 'wrap', gap: '8px' }}>
        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input nav-search"
            placeholder="Search artifacts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 30, width: 220 }}
          />
        </div>

        {/* Type filters */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ARTIFACT_TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-chip${typeFilter === f.value ? ' active' : ''}`}
              onClick={() => setTypeFilter(f.value as ArtifactType | 'all')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <span style={{ width: 1, height: 20, background: 'var(--color-border)', alignSelf: 'center' }} />

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-chip${statusFilter === f.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(f.value as ArtifactStatus | 'all')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <span style={{ width: 1, height: 20, background: 'var(--color-border)', alignSelf: 'center' }} />

        {/* Module filters */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {MODULE_FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-chip${moduleFilter === f.value ? ' active' : ''}`}
              onClick={() => setModuleFilter(f.value)}
            >
              {f.value === 'all' ? 'All Modules' : f.value}
            </button>
          ))}
        </div>
      </div>

      {/* Artifact Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <Package size={36} style={{ color: 'var(--color-muted)', marginBottom: 12 }} />
            <p className="empty-title">No artifacts found</p>
            <p className="empty-desc">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
            }}
          >
            {filtered.map(artifact => (
              <div
                key={artifact.artifact_key}
                className="artifact-card"
                onClick={() => handleCardClick(artifact.artifact_key)}
                style={{ cursor: 'pointer' }}
              >
                {/* Card top row: type badge + status chip + warning badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="artifact-card-meta" style={{ fontSize: 11 }}>
                    {ARTIFACT_TYPE_LABELS[artifact.artifact_type] ?? artifact.artifact_type}
                  </span>
                  <div style={{ flex: 1 }} />
                  {artifact.warnings > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        color: 'var(--color-warn)',
                        fontWeight: 600,
                      }}
                    >
                      <AlertTriangle size={12} />
                      {artifact.warnings}
                    </span>
                  )}
                  <StatusTag status={artifact.status} />
                </div>

                {/* Label */}
                <div className="artifact-card-label">{artifact.label}</div>

                {/* Artifact key in monospace */}
                <div className="artifact-card-key mono">{artifact.artifact_key}</div>

                {/* Bottom row: module + layer badges */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    className="artifact-card-meta"
                    style={{ fontSize: 11, marginRight: 4 }}
                  >
                    {artifact.module}
                  </span>
                  <div style={{ flex: 1 }} />
                  {(artifact.layers as LayerCode[]).map(layer => (
                    <LayerBadge key={layer} layer={layer} small />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
