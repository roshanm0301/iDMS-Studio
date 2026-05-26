// ============================================================
// RelationshipCard — compact card for the relationship list view
// ============================================================
import React from 'react';
import { ArrowRight, ArrowLeftRight, ExternalLink } from 'lucide-react';
import type { RelationshipDefinition } from '../../types/relationshipDesigner';
import { ARCHETYPE_CONFIG } from '../../types/relationshipDesigner';

interface RelationshipCardProps {
  relationship: RelationshipDefinition;
  onOpen: (id: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:      { bg: '#f1f5f9', color: '#64748b' },
  active:     { bg: '#dcfce7', color: '#166534' },
  deprecated: { bg: '#fef3c7', color: '#92400e' },
  disabled:   { bg: '#fee2e2', color: '#991b1b' },
};

function cardinalityArrow(cardinality: string): React.ReactNode {
  if (cardinality === 'many_to_many') return <ArrowLeftRight size={13} />;
  return <ArrowRight size={13} />;
}

function cardinalityLabel(cardinality: string): string {
  const map: Record<string, string> = {
    one_to_one:  '1:1',
    one_to_many: '1:N',
    many_to_one: 'N:1',
    many_to_many: 'M:N',
  };
  return map[cardinality] ?? cardinality;
}

export function RelationshipCard({ relationship: rel, onOpen }: RelationshipCardProps) {
  const cfg = ARCHETYPE_CONFIG[rel.relationshipArchetype];
  const statusStyle = STATUS_COLORS[rel.lifecycle.metadataStatus] ?? STATUS_COLORS.draft;

  const sourceLabel = rel.source.roleLabel ?? rel.source.entityId ?? '—';
  const targetLabel = rel.target.roleLabel
    ?? (rel.target.entityId
      ? rel.target.entityId
      : rel.target.allowedEntityIds?.join(', ') ?? 'multi-target');

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 18px',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Top row: archetype badge + label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 8,
              background: cfg.bgColor,
              color: cfg.color,
              whiteSpace: 'nowrap',
            }}>
              {cfg.label}
            </span>
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 8,
              background: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {rel.lifecycle.metadataStatus}
            </span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>
            {rel.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
            {rel.apiName}
          </span>
        </div>
      </div>

      {/* Endpoint visualization */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--bg-secondary)',
        borderRadius: 7,
        fontSize: 12,
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>
          {rel.source.entityId ?? '?'}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>({sourceLabel})</span>
        <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
          {cardinalityArrow(rel.cardinality)}
          <span style={{ fontSize: 10, fontWeight: 600 }}>{cardinalityLabel(rel.cardinality)}</span>
          {cardinalityArrow(rel.cardinality)}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>
          {rel.target.entityId ?? (rel.target.allowedEntityIds ? 'multi-target' : '?')}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>({targetLabel})</span>
      </div>

      {/* Footer: integrity + open button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {rel.integrity.mode?.replace(/_/g, ' ') ?? 'no integrity mode'}
        </span>
        <button
          onClick={() => onOpen(rel.relationshipId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          Open <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
