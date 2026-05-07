import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, Search, Filter, ChevronDown, ArrowRight, Calendar, Layers } from 'lucide-react';
import { getEntityDefinitions } from '../data/mockService';
import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import type { EntityCategory, EntityStatus } from '../types/entityDesigner';
import type { LayerCode } from '../types';
import { LAYER_CSS_CLASSES } from '../utils/entityDesignerConstants';

// ── Helpers ──────────────────────────────────────────────────
const CATEGORY_COLORS: Record<EntityCategory, string> = {
  transaction: 'badge-blue',
  master: 'badge-green',
  configuration: 'badge-amber',
  ledger_like: 'badge-purple',
};

const CATEGORY_LABELS: Record<EntityCategory, string> = {
  transaction: 'Transaction',
  master: 'Master Data',
  configuration: 'Configuration',
  ledger_like: 'Ledger-like',
};

// Use shared CSS class constants instead of local definition
const LAYER_COLORS = LAYER_CSS_CLASSES;

const STATUS_COLORS: Record<EntityStatus, string> = {
  active: 'tag-green',
  draft: 'tag-amber',
  deprecated: 'tag-red',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────
export default function EntityListPage() {
  const navigate = useNavigate();
  const { savedEntities } = useEntityDesignerStore();
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLayer, setFilterLayer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const domains = useMemo(() => [...new Set(allEntities.map(e => e.domain))].sort(), [allEntities]);
  const categories = useMemo(() => [...new Set(allEntities.map(e => e.category))], [allEntities]);
  const layers = useMemo(() => [...new Set(allEntities.map(e => e.owningLayer))], [allEntities]);

  const filtered = useMemo(() => {
    let list = allEntities;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.label.toLowerCase().includes(q) || e.entityType.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    if (filterDomain) list = list.filter(e => e.domain === filterDomain);
    if (filterCategory) list = list.filter(e => e.category === filterCategory);
    if (filterLayer) list = list.filter(e => e.owningLayer === filterLayer);
    if (filterStatus) list = list.filter(e => e.status === filterStatus);
    return list;
  }, [allEntities, search, filterDomain, filterCategory, filterLayer, filterStatus]);

  const hasFilters = !!(search || filterDomain || filterCategory || filterLayer || filterStatus);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Entity Designer</h1>
          <p className="page-subtitle">Governed schema contract builder — define, layer, and compile entity schemas</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/studio/entities/new')}>
            <Plus size={14} /> Create Entity
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: '32px', width: '100%' }}
            placeholder="Search entities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="search-input" style={{ width: 'auto' }} value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">All Domains</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="search-input" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as EntityCategory] ?? c}</option>)}
        </select>

        <select className="search-input" style={{ width: 'auto' }} value={filterLayer} onChange={e => setFilterLayer(e.target.value)}>
          <option value="">All Layers</option>
          {layers.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
        </select>

        <select className="search-input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="deprecated">Deprecated</option>
        </select>

        {hasFilters && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilterDomain(''); setFilterCategory(''); setFilterLayer(''); setFilterStatus(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <div style={{ marginBottom: '12px', color: 'var(--muted)', fontSize: '13px' }}>
        {filtered.length} {filtered.length === 1 ? 'entity' : 'entities'}
        {hasFilters && ` (filtered from ${allEntities.length})`}
      </div>

      {/* Entity Grid */}
      {filtered.length === 0 ? (
        <div className="empty">
          <Database size={32} className="muted" />
          <p className="empty-title">No entities found</p>
          <p className="empty-desc">
            {hasFilters ? 'Try adjusting your filters.' : 'Create your first entity to get started.'}
          </p>
          {!hasFilters && (
            <button className="btn btn-primary" onClick={() => navigate('/admin/studio/entities/new')}>
              <Plus size={14} /> Create Entity
            </button>
          )}
        </div>
      ) : (
        <div className="entity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
          {filtered.map(entity => (
            <div key={entity.entityType} className="card entity-card" style={{ padding: '16px', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{entity.label}</span>
                    <span className={`tag ${STATUS_COLORS[entity.status]}`} style={{ fontSize: '11px' }}>
                      {entity.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    entity.{entity.entityType}
                  </div>
                </div>
              </div>

              {entity.description && (
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {entity.description.length > 100 ? entity.description.slice(0, 100) + '…' : entity.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span className={`badge ${CATEGORY_COLORS[entity.category]}`}>
                  {CATEGORY_LABELS[entity.category]}
                </span>
                <span className="tag">{entity.domain}</span>
                <span className={`badge ${LAYER_COLORS[entity.owningLayer]}`}>
                  {entity.owningLayer}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={12} />
                    {entity.fields.length} fields
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {formatDate(entity.lastModified)}
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => navigate(`/admin/studio/entities/${entity.entityType}/schema`)}
                >
                  Open Schema <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
