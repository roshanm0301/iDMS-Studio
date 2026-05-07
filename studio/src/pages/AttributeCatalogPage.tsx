import { useState } from 'react';
import {
  Lock, Repeat, ChevronDown, ChevronUp, Search, Plus, Link2, X,
} from 'lucide-react';
import { getAttributeCatalog } from '../data/mockService';
import { useStudioStore } from '../hooks/useStudioStore';
import LayerBadge from '../components/ui/LayerBadge';
import type { CatalogAttribute, FieldType, LayerCode } from '../types';

// ===== Helpers =====

const DOMAIN_CLASS: Record<string, string> = {
  platform: '',
  automotive: 'violet',
  india_tax: 'amber',
  finance: 'green',
  tenant: 'red',
  core: '',
};

const FIELD_TYPE_CLASS: Record<string, string> = {
  text: '',
  number: 'amber',
  boolean: 'green',
  date: 'violet',
  datetime: 'violet',
  select: 'accent',
  multiselect: 'accent',
  reference: 'violet',
  textarea: '',
  currency: 'amber',
  grid: 'red',
  file: '',
};

const DOMAIN_FILTERS = ['All', 'Platform', 'Automotive', 'Core'] as const;
type DomainFilter = (typeof DOMAIN_FILTERS)[number];

function domainMatchesFilter(domain: string, filter: DomainFilter): boolean {
  if (filter === 'All') return true;
  return domain.toLowerCase() === filter.toLowerCase();
}

function getFieldTypes(attrs: CatalogAttribute[]): FieldType[] {
  const types = new Set<FieldType>();
  attrs.forEach(a => types.add(a.field_type));
  return Array.from(types).sort();
}

// ===== Expanded detail panel =====

function AttributeDetail({ attr }: { attr: CatalogAttribute }) {
  return (
    <div
      style={{
        padding: '14px 18px',
        background: 'var(--bg-sunken)',
        borderTop: '1px solid var(--border)',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
      }}
    >
      {attr.description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{attr.description}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 5 }}>
            Owner Layer
          </div>
          {attr.owner_layer ? (
            <LayerBadge layer={attr.owner_layer} />
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>—</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 5 }}>
            Domain
          </div>
          <span className={`tag ${DOMAIN_CLASS[attr.domain] ?? ''}`}>
            {attr.domain}
          </span>
        </div>
      </div>

      {attr.field_type === 'select' && attr.description?.includes('option') && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Options
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Option A', 'Option B', 'Option C'].map(o => (
              <span key={o} className="tag" style={{ fontSize: 11 }}>{o}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
          Used in Entities
        </div>
        {attr.used_in && attr.used_in.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {attr.used_in.map(entity => (
              <span
                key={entity}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  padding: '2px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  background: 'var(--accent-soft)',
                }}
              >
                <Link2 size={10} />
                {entity}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Not used in any entity yet</span>
        )}
      </div>
    </div>
  );
}

// ===== Attribute Card =====

function AttributeCard({ attr }: { attr: CatalogAttribute }) {
  const [expanded, setExpanded] = useState(false);

  const usageCount = attr.used_in?.length ?? 0;
  const ftClass = FIELD_TYPE_CLASS[attr.field_type] ?? '';
  const domClass = DOMAIN_CLASS[attr.domain] ?? '';

  return (
    <div
      className="card"
      style={{
        overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Card header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '14px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Attribute code */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <code
            className="mono"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-soft)',
              padding: '2px 7px',
              borderRadius: 5,
              letterSpacing: '0.01em',
            }}
          >
            {attr.attribute_code}
          </code>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {attr.protected && (
              <span title="Protected — cannot be overridden">
                <Lock size={13} style={{ color: 'var(--amber)' }} />
              </span>
            )}
            {attr.reusable && (
              <span title="Reusable across entities">
                <Repeat size={13} style={{ color: 'var(--green)' }} />
              </span>
            )}
            {expanded ? (
              <ChevronUp size={14} style={{ color: 'var(--text-subtle)' }} />
            ) : (
              <ChevronDown size={14} style={{ color: 'var(--text-subtle)' }} />
            )}
          </div>
        </div>

        {/* Label */}
        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', marginBottom: 8 }}>
          {attr.label}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          <span className={`tag ${ftClass}`} style={{ fontSize: 10.5 }}>
            {attr.field_type}
          </span>
          <span className={`tag ${domClass}`} style={{ fontSize: 10.5 }}>
            {attr.domain}
          </span>
          {attr.protected && (
            <span className="tag amber" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Lock size={9} /> Protected
            </span>
          )}
          {attr.reusable && (
            <span className="tag green" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Repeat size={9} /> Reusable
            </span>
          )}
        </div>

        {/* Usage link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <Link2 size={11} style={{ color: 'var(--accent)' }} />
          <span style={{ color: usageCount > 0 ? 'var(--accent)' : 'var(--text-subtle)' }}>
            {usageCount > 0 ? `Used in ${usageCount} entit${usageCount === 1 ? 'y' : 'ies'}` : 'Not used in any entity'}
          </span>
        </div>
      </div>

      {/* Expandable detail */}
      {expanded && <AttributeDetail attr={attr} />}
    </div>
  );
}

// ===== Page =====

export default function AttributeCatalogPage() {
  const { showToast } = useStudioStore();
  const attributes = getAttributeCatalog();

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('All');
  const [typeFilter, setTypeFilter] = useState<FieldType | 'All'>('All');

  const allTypes = getFieldTypes(attributes);

  const filtered = attributes.filter(attr => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      attr.attribute_code.toLowerCase().includes(q) ||
      attr.label.toLowerCase().includes(q) ||
      attr.domain.toLowerCase().includes(q) ||
      attr.field_type.toLowerCase().includes(q);

    const matchesDomain = domainMatchesFilter(attr.domain, domainFilter);
    const matchesType = typeFilter === 'All' || attr.field_type === typeFilter;

    return matchesSearch && matchesDomain && matchesType;
  });

  function handleRequestNew() {
    showToast('Attribute request submitted for review', 'success');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Attribute Catalog</h1>
            <p className="page-sub">Governed reusable field definitions</p>
          </div>
          <button className="btn btn-primary" onClick={handleRequestNew}>
            <Plus size={14} />
            Request New Attribute
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div
        style={{
          padding: '12px 32px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elev)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-elev)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            maxWidth: 380,
          }}
        >
          <Search size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
          <input
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              color: 'var(--text)',
              flex: 1,
              outline: 'none',
            }}
            placeholder="Search attributes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex' }}
              onClick={() => setSearch('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Domain filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginRight: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
            Domain
          </span>
          {DOMAIN_FILTERS.map(d => (
            <button
              key={d}
              className={`filter-chip${domainFilter === d ? ' active' : ''}`}
              onClick={() => setDomainFilter(d)}
            >
              {d}
            </button>
          ))}

          <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 8, marginRight: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
            Type
          </span>
          <button
            className={`filter-chip${typeFilter === 'All' ? ' active' : ''}`}
            onClick={() => setTypeFilter('All')}
          >
            All
          </button>
          {allTypes.map(t => (
            <button
              key={t}
              className={`filter-chip${typeFilter === t ? ' active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}

          <span className="spacer" />
          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
            {filtered.length} attribute{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Attribute grid */}
      <div className="content" style={{ padding: 24 }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <Search size={36} style={{ color: 'var(--text-subtle)' }} />
            <p className="empty-title">No attributes found</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
            }}
          >
            {filtered.map(attr => (
              <AttributeCard key={attr.attribute_code} attr={attr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
