import { useState, useMemo } from 'react';
import { Plus, Edit, AlertTriangle, XCircle, CheckCircle, MinusCircle } from 'lucide-react';
import { getSchemaDiff, getEntityDefinition } from '../../data/mockService';
import type { DiffSeverity, DiffEntry, EntityDefinition, SchemaDiff } from '../../types/entityDesigner';

interface Props {
  entityType: string;
  /** Full entity definition for Resolved Scope mode */
  entity?: EntityDefinition;
}

const SEVERITY_CONFIG: Record<DiffSeverity, { label: string; color: string; bg: string }> = {
  safe:     { label: 'Safe',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  stricter: { label: 'Stricter', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  risky:    { label: 'Risky',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  breaking: { label: 'Breaking', color: '#dc2626', bg: 'rgba(220,38,38,0.15)' },
};

type DiffMode = 'draft_vs_active' | 'resolved_scope';

const MODE_DESCRIPTIONS: Record<DiffMode, string> = {
  draft_vs_active: 'All pending changes vs last compiled schema',
  resolved_scope:  'Full merge diff: draft state vs base resolved schema',
};

function DiffSection({ title, entries, icon: Icon, color }: {
  title: string; entries: DiffEntry[]; icon: React.ElementType; color: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ color }}>{title}</span>
        <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>({entries.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {entries.map(entry => {
          const sev = SEVERITY_CONFIG[entry.severity];
          return (
            <div key={entry.fieldId} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', borderLeftWidth: '3px', borderLeftColor: sev.color }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, fontSize: '13px' }}>{entry.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)' }}>{entry.fieldId}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: sev.color, background: sev.bg, padding: '1px 6px', borderRadius: '10px', marginLeft: 'auto' }}>
                  {sev.label}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{entry.description}</p>
              {(entry.before || entry.after) && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
                  {entry.before && <span style={{ color: '#ef4444' }}>- {entry.before}</span>}
                  {entry.after && <span style={{ color: '#10b981' }}>+ {entry.after}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SchemaDiffViewer({ entityType, entity }: Props) {
  const [mode, setMode] = useState<DiffMode>('draft_vs_active');

  const rawDiff = getSchemaDiff(entityType);

  // Compute the effective diff based on the selected mode
  const diff = useMemo<SchemaDiff | undefined>(() => {
    if (!rawDiff) return undefined;

    if (mode === 'draft_vs_active') {
      // Show all pending changes vs the active/compiled schema
      return rawDiff;
    }

    if (mode === 'resolved_scope') {
      // Simulate a resolved diff by identifying draft-lifecycle fields as "pending additions"
      // and fields with recent overlayChanges as "pending changes".
      if (!entity) return rawDiff;

      const draftFields = entity.fields.filter(f => f.lifecycle === 'draft');
      const resolvedAdded: DiffEntry[] = draftFields.map(f => ({
        fieldId: f.fieldId,
        label: f.label,
        severity: 'safe' as DiffSeverity,
        description: `Draft field pending activation at ${f.sourceLayer} layer`,
        after: f.fieldType,
      }));

      const deprecatedFields = entity.fields.filter(f => f.lifecycle === 'deprecated');
      const resolvedDeprecated: DiffEntry[] = deprecatedFields.map(f => ({
        fieldId: f.fieldId,
        label: f.label,
        severity: 'stricter' as DiffSeverity,
        description: `Field is deprecated — consumers should migrate to replacement`,
        before: 'active',
        after: 'deprecated',
      }));

      return {
        mode: 'resolved_scope',
        added: [...resolvedAdded, ...rawDiff.added],
        changed: rawDiff.changed,
        deprecated: [...resolvedDeprecated, ...rawDiff.deprecated],
        disabled: rawDiff.disabled,
        validationChanges: rawDiff.validationChanges,
        overlayChanges: rawDiff.overlayChanges,
      };
    }

    return rawDiff;
  }, [rawDiff, mode, entity]);

  if (!rawDiff) {
    return (
      <div className="empty" style={{ padding: '32px' }}>
        <CheckCircle size={24} style={{ color: '#10b981' }} />
        <p className="empty-title">No schema differences found</p>
        <p className="empty-desc">No tracked changes for <code style={{ fontFamily: 'monospace' }}>{entityType}</code>.</p>
      </div>
    );
  }

  const hasChanges = diff
    ? diff.added.length + diff.changed.length + diff.deprecated.length + diff.disabled.length + diff.validationChanges.length + diff.overlayChanges.length > 0
    : false;

  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
      {/* Mode switcher */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>Schema Diff</h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{MODE_DESCRIPTIONS[mode]}</p>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { value: 'draft_vs_active', label: 'Draft vs Active' },
            { value: 'resolved_scope',  label: 'Resolved Scope' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              className={`btn ${mode === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => setMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!hasChanges ? (
        <div className="empty" style={{ padding: '24px' }}>
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <p className="empty-title" style={{ marginTop: '8px' }}>No differences found</p>
          <p className="empty-desc">No schema changes for the selected scope.</p>
        </div>
      ) : diff ? (
        <>
          <DiffSection title="Added Fields"        entries={diff.added}             icon={Plus}         color="#10b981" />
          <DiffSection title="Changed Fields"       entries={diff.changed}           icon={Edit}         color="#f59e0b" />
          <DiffSection title="Deprecated Fields"    entries={diff.deprecated}        icon={AlertTriangle} color="#f59e0b" />
          <DiffSection title="Disabled Fields"      entries={diff.disabled}          icon={MinusCircle}  color="#6b7280" />
          <DiffSection title="Validation Changes"   entries={diff.validationChanges} icon={AlertTriangle} color="#ef4444" />
          <DiffSection title="Overlay Changes"      entries={diff.overlayChanges}    icon={Edit}         color="#7c3aed" />
        </>
      ) : null}
    </div>
  );
}
