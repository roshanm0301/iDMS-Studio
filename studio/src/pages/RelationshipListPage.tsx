// ============================================================
// RelationshipListPage — browse all relationships
// Route: /admin/studio/relationships
// ============================================================
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, Plus, Search, Filter, X } from 'lucide-react';
import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import { getRelationships, getEntityDefinitions } from '../data/mockService';
import { RelationshipCard } from '../components/relationship-designer/RelationshipCard';
import { ARCHETYPE_CONFIG } from '../types/relationshipDesigner';
import type { RelationshipArchetype } from '../types/relationshipDesigner';

const ALL_STATUSES = ['draft', 'active', 'deprecated', 'disabled'] as const;

export default function RelationshipListPage() {
  const navigate = useNavigate();
  const { savedRelationships, savedEntities } = useEntityDesignerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchetypes, setSelectedArchetypes] = useState<RelationshipArchetype[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  const allRelationships = useMemo(
    () => getRelationships(savedRelationships),
    [savedRelationships]
  );

  const allEntities = useMemo(
    () => getEntityDefinitions(savedEntities),
    [savedEntities]
  );

  const allArchetypes = useMemo(
    () => [...new Set(allRelationships.map(r => r.relationshipArchetype))].sort() as RelationshipArchetype[],
    [allRelationships]
  );

  const filtered = useMemo(() => {
    return allRelationships.filter(rel => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !rel.label.toLowerCase().includes(q) &&
          !rel.apiName.toLowerCase().includes(q) &&
          !(rel.source.entityId ?? '').toLowerCase().includes(q) &&
          !(rel.target.entityId ?? '').toLowerCase().includes(q)
        ) return false;
      }
      if (selectedArchetypes.length > 0 && !selectedArchetypes.includes(rel.relationshipArchetype)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(rel.lifecycle.metadataStatus)) return false;
      if (selectedEntity) {
        const matches =
          rel.source.entityId === selectedEntity ||
          rel.target.entityId === selectedEntity ||
          (rel.target.allowedEntityIds ?? []).includes(selectedEntity);
        if (!matches) return false;
      }
      return true;
    });
  }, [allRelationships, searchQuery, selectedArchetypes, selectedStatuses, selectedEntity]);

  function toggleArchetype(a: RelationshipArchetype) {
    setSelectedArchetypes(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  function toggleStatus(s: string) {
    setSelectedStatuses(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  const hasFilters = searchQuery || selectedArchetypes.length > 0 || selectedStatuses.length > 0 || selectedEntity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'hsl(22 100% 51% / 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <GitFork size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Relationships</h1>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              {allRelationships.length} relationship{allRelationships.length !== 1 ? 's' : ''} defined
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/studio/relationships/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Define Relationship
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', pointerEvents: 'none',
          }} />
          <input
            className="search-input"
            placeholder="Search relationships…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 30, width: '100%' }}
          />
        </div>

        {/* Archetype multi-select chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {allArchetypes.map(a => {
            const cfg = ARCHETYPE_CONFIG[a];
            const active = selectedArchetypes.includes(a);
            return (
              <button
                key={a}
                onClick={() => toggleArchetype(a)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${active ? cfg.color : 'var(--border)'}`,
                  background: active ? cfg.bgColor : 'var(--bg)',
                  color: active ? cfg.color : 'var(--muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {ALL_STATUSES.map(s => {
            const active = selectedStatuses.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'hsl(22 100% 51% / 0.08)' : 'var(--bg)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Entity filter */}
        <select
          className="search-input"
          value={selectedEntity}
          onChange={e => setSelectedEntity(e.target.value)}
          style={{ fontSize: 12, flex: '0 0 auto' }}
        >
          <option value="">All entities</option>
          {allEntities.map(e => (
            <option key={e.entityType} value={e.entityType}>{e.label}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedArchetypes([]);
              setSelectedStatuses([]);
              setSelectedEntity('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            color: 'var(--muted)',
          }}>
            <Filter size={36} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {hasFilters ? 'No relationships match your filters' : 'No relationships defined yet'}
            </p>
            {!hasFilters && (
              <button
                onClick={() => navigate('/admin/studio/relationships/new')}
                style={{
                  marginTop: 8,
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Define First Relationship
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              {filtered.length} relationship{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 14,
            }}>
              {filtered.map(rel => (
                <RelationshipCard
                  key={rel.relationshipId}
                  relationship={rel}
                  onOpen={id => navigate(`/admin/studio/relationships/${id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
