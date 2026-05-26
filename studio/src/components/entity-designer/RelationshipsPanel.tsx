// ============================================================
// RelationshipsPanel — "Relations" sub-tab in SchemaBuilderPage
// Shows all relationships where this entity is source or target
// ============================================================
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Plus, ArrowRight, ArrowLeft, ArrowLeftRight, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { getRelationshipsForEntity, getEntityDefinitions } from '../../data/mockService';
import { detectRelationshipConflicts } from '../../utils/conflictDetection';
import { ARCHETYPE_CONFIG } from '../../types/relationshipDesigner';
import type { EntityDefinition } from '../../types/entityDesigner';
import type { RelationshipDefinition } from '../../types/relationshipDesigner';

interface RelationshipsPanelProps {
  entity: EntityDefinition;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:      { bg: '#f1f5f9', color: '#64748b' },
  active:     { bg: '#dcfce7', color: '#166534' },
  deprecated: { bg: '#fef3c7', color: '#92400e' },
  disabled:   { bg: '#fee2e2', color: '#991b1b' },
};

function cardinalityLabel(cardinality: string): string {
  const map: Record<string, string> = {
    one_to_one:   '1:1',
    one_to_many:  '1:N',
    many_to_one:  'N:1',
    many_to_many: 'M:N',
  };
  return map[cardinality] ?? cardinality;
}

interface RelRowProps {
  rel: RelationshipDefinition;
  direction: 'source' | 'target';
  currentEntityType: string;
  onOpen: (id: string) => void;
}

function RelationshipRow({ rel, direction, currentEntityType, onOpen }: RelRowProps) {
  const cfg = ARCHETYPE_CONFIG[rel.relationshipArchetype];
  const statusStyle = STATUS_COLORS[rel.lifecycle.metadataStatus] ?? STATUS_COLORS.draft;

  const sourceLabel = rel.source.roleLabel ?? rel.source.entityId ?? '—';
  const targetLabel = rel.target.roleLabel
    ?? (rel.target.entityId ?? rel.target.allowedEntityIds?.join(', ') ?? 'multi-target');

  const cardLabel = cardinalityLabel(rel.cardinality);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      {/* Direction arrow */}
      <div style={{ color: direction === 'source' ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}>
        {direction === 'source' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
      </div>

      {/* Archetype badge */}
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 8,
        background: cfg.bgColor,
        color: cfg.color,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {cfg.label}
      </span>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{rel.label}</span>
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 6,
            background: statusStyle.bg,
            color: statusStyle.color,
            fontWeight: 600,
          }}>
            {rel.lifecycle.metadataStatus}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>
          {rel.apiName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{rel.source.entityId ?? '?'}</span>
          <span>({sourceLabel})</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent)', fontWeight: 600 }}>
            {rel.cardinality === 'many_to_many' ? <ArrowLeftRight size={11} /> : <ArrowRight size={11} />}
            {cardLabel}
          </span>
          <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>
            {rel.target.entityId ?? (rel.target.allowedEntityIds ? 'multi-target' : '?')}
          </span>
          <span>({targetLabel})</span>
        </div>
      </div>

      {/* Open button */}
      <button
        onClick={() => onOpen(rel.relationshipId)}
        title="Open relationship"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 6,
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--accent)',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Open <ExternalLink size={11} />
      </button>
    </div>
  );
}

export default function RelationshipsPanel({ entity }: RelationshipsPanelProps) {
  const navigate = useNavigate();
  const { savedRelationships, savedEntities } = useEntityDesignerStore();
  const [compileExpanded, setCompileExpanded] = useState(false);

  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  const relationships = useMemo(
    () => getRelationshipsForEntity(entity.entityType, savedRelationships),
    [entity.entityType, savedRelationships]
  );

  const asSource = useMemo(
    () => relationships.filter(r => r.source.entityId === entity.entityType),
    [relationships, entity.entityType]
  );

  const asTarget = useMemo(
    () => relationships.filter(r =>
      r.target.entityId === entity.entityType ||
      (r.target.allowedEntityIds ?? []).includes(entity.entityType)
    ),
    [relationships, entity.entityType]
  );

  const { compileErrors, governanceConflicts } = useMemo(
    () => detectRelationshipConflicts(relationships, allEntities),
    [relationships, allEntities]
  );

  const errorCount   = compileErrors.filter(c => c.severity === 'error').length;
  const warningCount = compileErrors.filter(c => c.severity === 'warning').length;
  const govCount     = governanceConflicts.length;

  const handleOpen = (id: string) => navigate(`/admin/studio/relationships/${id}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Relationships
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
            {relationships.length} total
          </span>
        </div>
        <button
          onClick={() => navigate(`/admin/studio/relationships/new?sourceEntity=${entity.entityType}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 7,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Define New Relationship
        </button>
      </div>

      {/* Compile strip */}
      {(errorCount > 0 || warningCount > 0 || govCount > 0) && (
        <div style={{
          borderBottom: '1px solid var(--border)',
          background: errorCount > 0 ? 'hsl(0 80% 97%)' : 'hsl(38 100% 97%)',
          flexShrink: 0,
        }}>
          <div
            onClick={() => setCompileExpanded(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            {errorCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#991b1b' }}>
                <XCircle size={13} /> {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#92400e' }}>
                <AlertTriangle size={13} /> {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {govCount > 0 && (
              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
                + {govCount} governance note{govCount !== 1 ? 's' : ''}
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
              {compileExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          </div>

          {compileExpanded && (
            <div style={{ padding: '0 16px 10px' }}>
              {[...compileErrors, ...governanceConflicts].map((c, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '4px 0',
                  borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                  fontSize: 11,
                }}>
                  {c.severity === 'error'
                    ? <XCircle size={12} style={{ color: '#991b1b', marginTop: 1, flexShrink: 0 }} />
                    : <AlertTriangle size={12} style={{ color: '#92400e', marginTop: 1, flexShrink: 0 }} />}
                  <span style={{ color: 'var(--text)' }}>{c.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto' }}>

        {relationships.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            color: 'var(--muted)',
            padding: 24,
          }}>
            <ArrowLeftRight size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No relationships defined</p>
            <p style={{ fontSize: 12, margin: 0, textAlign: 'center' }}>
              No relationships found for <strong>{entity.label}</strong>.
              Define a relationship to connect this entity to others.
            </p>
            <button
              onClick={() => navigate(`/admin/studio/relationships/new?sourceEntity=${entity.entityType}`)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Define First Relationship
            </button>
          </div>
        ) : (
          <>
            {/* AS SOURCE section */}
            {asSource.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 16px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  As Source ({asSource.length})
                </div>
                {asSource.map(rel => (
                  <RelationshipRow
                    key={rel.relationshipId}
                    rel={rel}
                    direction="source"
                    currentEntityType={entity.entityType}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            )}

            {/* AS TARGET section */}
            {asTarget.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 16px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border)',
                  borderTop: asSource.length > 0 ? '1px solid var(--border)' : 'none',
                }}>
                  As Target ({asTarget.length})
                </div>
                {asTarget.map(rel => (
                  <RelationshipRow
                    key={rel.relationshipId}
                    rel={rel}
                    direction="target"
                    currentEntityType={entity.entityType}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
