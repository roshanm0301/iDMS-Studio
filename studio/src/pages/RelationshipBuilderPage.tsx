// ============================================================
// RelationshipBuilderPage — View/Edit a single relationship
// Route: /admin/studio/relationships/:relationshipId
// ============================================================
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitFork, ArrowRight, ArrowLeftRight, AlertTriangle, XCircle, ChevronDown, Edit, ExternalLink } from 'lucide-react';
import { useEntityDesignerStore } from '../hooks/useEntityDesignerStore';
import { getRelationship, getEntityDefinitions } from '../data/mockService';
import { detectRelationshipConflicts } from '../utils/conflictDetection';
import { ARCHETYPE_CONFIG } from '../types/relationshipDesigner';
import { RelationshipInspector } from '../components/relationship-designer/RelationshipInspector';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:      { bg: '#f1f5f9', color: '#64748b' },
  active:     { bg: '#dcfce7', color: '#166534' },
  deprecated: { bg: '#fef3c7', color: '#92400e' },
  disabled:   { bg: '#fee2e2', color: '#991b1b' },
};

function cardinalityLabel(c: string) {
  const m: Record<string, string> = {
    one_to_one: '1:1', one_to_many: '1:N',
    many_to_one: 'N:1', many_to_many: 'M:N',
  };
  return m[c] ?? c;
}

export default function RelationshipBuilderPage() {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const navigate = useNavigate();
  const { savedRelationships, savedEntities } = useEntityDesignerStore();
  const [compileOpen, setCompileOpen] = useState(false);

  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  const rel = useMemo(
    () => (relationshipId ? getRelationship(relationshipId, savedRelationships) : undefined),
    [relationshipId, savedRelationships]
  );

  const { compileErrors, governanceConflicts } = useMemo(() => {
    if (!rel) return { compileErrors: [], governanceConflicts: [] };
    return detectRelationshipConflicts([rel], allEntities);
  }, [rel, allEntities]);

  const errorCount   = compileErrors.filter(c => c.severity === 'error').length;
  const warningCount = compileErrors.filter(c => c.severity === 'warning').length;

  if (!rel) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        color: 'var(--muted)',
      }}>
        <GitFork size={36} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Relationship not found</p>
        <button
          onClick={() => navigate('/admin/studio/relationships')}
          style={{
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
          Back to Relationships
        </button>
      </div>
    );
  }

  const cfg = ARCHETYPE_CONFIG[rel.relationshipArchetype];
  const statusStyle = STATUS_COLORS[rel.lifecycle.metadataStatus] ?? STATUS_COLORS.draft;

  const sourceEntity = allEntities.find(e => e.entityType === rel.source.entityId);
  const targetEntity = allEntities.find(e => e.entityType === rel.target.entityId);

  const sourceLabel = rel.source.roleLabel ?? rel.source.entityId ?? '—';
  const targetLabel = rel.target.roleLabel
    ?? (rel.target.entityId ?? (rel.target.allowedEntityIds ? 'multi-target' : '—'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Context bar ─────────────────────────────────────────── */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={() => navigate('/admin/studio/relationships')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: 'var(--muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 6,
          }}
        >
          ← Relationships
        </button>

        <span style={{ color: 'var(--border)', fontSize: 16 }}>/</span>

        {/* Archetype badge */}
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 8,
          background: cfg.bgColor,
          color: cfg.color,
          whiteSpace: 'nowrap',
        }}>
          {cfg.label}
        </span>

        {/* Label + API name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{rel.label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{rel.apiName}</div>
        </div>

        {/* Status chip */}
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 8,
          background: statusStyle.bg,
          color: statusStyle.color,
          whiteSpace: 'nowrap',
        }}>
          {rel.lifecycle.metadataStatus}
        </span>

        {/* Edit button */}
        <button
          onClick={() => navigate(`/admin/studio/relationships/new?edit=${rel.relationshipId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 14px',
            borderRadius: 7,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Edit size={13} /> Edit
        </button>
      </div>

      {/* ── 2-panel body ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left panel ───────────────────────────────────────── */}
        <div style={{
          width: 380,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>

            {/* Endpoint diagram */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 10,
              }}>
                Endpoint Diagram
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}>
                {/* Source */}
                <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--text)',
                    marginBottom: 4,
                  }}>
                    {rel.source.entityId ?? '?'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{sourceLabel}</div>
                  {sourceEntity && (
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                      {sourceEntity.category}
                    </div>
                  )}
                </div>

                {/* Arrow + cardinality */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  color: 'var(--muted)',
                  flexShrink: 0,
                }}>
                  {rel.cardinality === 'many_to_many'
                    ? <ArrowLeftRight size={16} style={{ color: 'var(--accent)' }} />
                    : <ArrowRight size={16} style={{ color: 'var(--accent)' }} />}
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                    {cardinalityLabel(rel.cardinality)}
                  </span>
                </div>

                {/* Target */}
                <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--text)',
                    marginBottom: 4,
                  }}>
                    {rel.target.entityId ?? (rel.target.allowedEntityIds ? 'multi-target' : '?')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{targetLabel}</div>
                  {targetEntity && (
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                      {targetEntity.category}
                    </div>
                  )}
                </div>
              </div>

              {/* Polymorphic allowed entities */}
              {rel.target.allowedEntityIds && rel.target.allowedEntityIds.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Allowed target entities:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {rel.target.allowedEntityIds.map(id => (
                      <span key={id} style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        fontFamily: 'monospace',
                        color: 'var(--text)',
                      }}>{id}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Compile check strip */}
            <div style={{
              borderRadius: 8,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              <div
                onClick={() => setCompileOpen(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: errorCount > 0 ? 'hsl(0 80% 97%)' : warningCount > 0 ? 'hsl(38 100% 97%)' : 'hsl(142 60% 97%)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {errorCount === 0 && warningCount === 0 ? (
                  <span style={{ color: '#166534', fontWeight: 600 }}>✓ No compile issues</span>
                ) : (
                  <>
                    {errorCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#991b1b', fontWeight: 600 }}>
                        <XCircle size={13} /> {errorCount} error{errorCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#92400e', fontWeight: 600 }}>
                        <AlertTriangle size={13} /> {warningCount} warning{warningCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </>
                )}
                <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                  <ChevronDown size={13} style={{ transform: compileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </span>
              </div>

              {compileOpen && (errorCount > 0 || warningCount > 0 || governanceConflicts.length > 0) && (
                <div style={{ padding: '6px 12px 10px', background: 'var(--bg)' }}>
                  {[...compileErrors, ...governanceConflicts].map((c, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      padding: '4px 0',
                      fontSize: 11,
                      borderTop: i === 0 ? '1px solid var(--border)' : 'none',
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

            {/* View in Entity Context link */}
            {rel.source.entityId && (
              <button
                onClick={() => navigate(`/admin/studio/entities/${rel.source.entityId}/schema?tab=relations`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <ExternalLink size={13} />
                View in Entity Context →
              </button>
            )}
          </div>
        </div>

        {/* ── Right panel: Inspector ───────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <RelationshipInspector relationship={rel} entities={allEntities} />
        </div>
      </div>
    </div>
  );
}
