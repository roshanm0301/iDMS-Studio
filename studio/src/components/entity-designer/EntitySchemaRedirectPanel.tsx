import { useNavigate } from 'react-router-dom';
import { Database, ArrowRight, Layers, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getEntityDefinition, getCompileReadiness } from '../../data/mockService';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { LAYER_COLORS } from '../../utils/entityDesignerConstants';

interface Props {
  artifactKey: string;
  entityType: string;
}

export default function EntitySchemaRedirectPanel({ artifactKey, entityType }: Props) {
  const navigate = useNavigate();
  const { savedEntities } = useEntityDesignerStore();
  const entity = getEntityDefinition(entityType, savedEntities);
  const readiness = getCompileReadiness(entityType);

  if (!entity) {
    return (
      <div className="empty" style={{ padding: '40px' }}>
        <Database size={28} style={{ color: 'var(--muted)' }} />
        <p className="empty-title">Entity not found</p>
        <p className="empty-desc">No entity definition found for <code style={{ fontFamily: 'monospace' }}>{entityType}</code>.</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/studio/entities')}>
          Open Entity Designer
        </button>
      </div>
    );
  }

  const activeFields = entity.fields.filter(f => f.lifecycle === 'active').length;
  const draftFields = entity.fields.filter(f => f.lifecycle === 'draft').length;
  const disabledFields = entity.fields.filter(f => f.lifecycle === 'disabled').length;
  const layerBreakdown = entity.fields.reduce<Record<string, number>>((acc, f) => {
    acc[f.sourceLayer] = (acc[f.sourceLayer] ?? 0) + 1;
    return acc;
  }, {});


  return (
    <div style={{ padding: '24px', maxWidth: '680px' }}>
      {/* Banner */}
      <div style={{ padding: '20px 24px', border: '2px solid var(--accent)', borderRadius: '10px', marginBottom: '24px', background: 'hsl(22 100% 51% / 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Database size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{entity.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>entity.{entity.entityType}</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => navigate(`/admin/studio/entities/${entityType}/schema`)}
          >
            Open in Entity Designer <ArrowRight size={14} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          The Schema tab has been replaced by the <strong>Entity Designer</strong> — a full governed schema contract builder with overlay support, field lifecycle management, and compile readiness checks.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Fields', value: entity.fields.length, color: 'var(--text)', icon: Database },
          { label: 'Active Fields', value: activeFields, color: '#10b981', icon: CheckCircle },
          { label: 'Draft Fields', value: draftFields, color: '#f59e0b', icon: Clock },
          { label: 'Disabled Fields', value: disabledFields, color: '#ef4444', icon: AlertTriangle },
          { label: 'Domain', value: entity.domain, color: 'var(--muted)', icon: Layers },
          { label: 'Status', value: entity.status, color: entity.status === 'active' ? '#10b981' : entity.status === 'draft' ? '#f59e0b' : '#ef4444', icon: CheckCircle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '22px', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Icon size={11} /> {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer breakdown */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>Layer Composition</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(layerBreakdown).map(([layer, count]) => (
            <div key={layer} style={{ padding: '6px 12px', borderRadius: '20px', background: (LAYER_COLORS[layer] ?? '#6b7280') + '20', border: `1px solid ${LAYER_COLORS[layer] ?? '#6b7280'}40`, fontSize: '12px', fontWeight: 600, color: LAYER_COLORS[layer] ?? '#6b7280' }}>
              {layer}: {count} field{count > 1 ? 's' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Compile readiness */}
      {readiness && (
        <div style={{ padding: '14px 16px', border: `1px solid ${readiness.status === 'pass' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: '8px', background: readiness.status === 'pass' ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: readiness.warnings.length > 0 ? '10px' : '0' }}>
            {readiness.status === 'pass'
              ? <CheckCircle size={14} style={{ color: '#10b981' }} />
              : <AlertTriangle size={14} style={{ color: '#f59e0b' }} />}
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              {readiness.status === 'pass' ? 'Schema is ready to compile' : `${readiness.warnings.length} compile warning${readiness.warnings.length > 1 ? 's' : ''}`}
            </span>
          </div>
          {readiness.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#f59e0b', paddingLeft: '22px' }}>• {w.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
