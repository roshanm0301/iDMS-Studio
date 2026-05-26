// ============================================================
// ValidationRulesPanel — "Validation" sub-tab in SchemaBuilderPage
// Split-pane: rule list (left) + ValidationRuleInspector (right)
// ============================================================
import React, { useMemo, useState } from 'react';
import { Plus, Search, Shield, X } from 'lucide-react';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { getValidationRulesForEntity } from '../../data/mockService';
import {
  VALIDATION_FAMILY_CONFIG,
  FAMILY_GROUP_LABELS,
} from '../../types/validationDesigner';
import type {
  ValidationRuleDefinition,
  ValidationFamily,
  ValidationSeverity,
  ValidationFamilyGroup,
} from '../../types/validationDesigner';
import type { EntityDefinition } from '../../types/entityDesigner';
import ValidationRuleInspector, { SEVERITY_COLORS } from './ValidationRuleInspector';

interface ValidationRulesPanelProps {
  entity: EntityDefinition;
}

// ── Status colors (same palette as RelationshipsPanel) ────────
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:       { bg: '#f1f5f9', color: '#64748b' },
  active:      { bg: '#dcfce7', color: '#166534' },
  deprecated:  { bg: '#fef3c7', color: '#92400e' },
  disabled:    { bg: '#fee2e2', color: '#991b1b' },
};

const SEVERITY_LABELS: Record<ValidationSeverity, string> = {
  error_blocking:      'Error',
  warning_acknowledge: 'Warn (ack)',
  warning_nonblocking: 'Warning',
  info:                'Info',
  advisory_async:      'Advisory',
};

// ── Make a blank ValidationRuleDefinition ─────────────────────
function makeBlankRule(entityType: string): ValidationRuleDefinition {
  const id = `vr_${entityType}_${Date.now()}`;
  return {
    validationRuleId: id,
    entityId: entityType,
    apiName: '',
    label: '',
    description: '',
    validationFamily: 'conditional_presence',
    evaluationScope: 'record',
    triggerContexts: [],
    enforcementLayer: 'application_sync',
    severity: 'error_blocking',
    priority: 100,
    truthSource: 'current_record',
    evaluationPhase: 'pre_persistence',
    determinismType: 'pure_deterministic',
    applicability: {
      applicabilityScope: 'entity_wide',
    },
    assertion: {
      expressionLanguage: 'idms_expression_v2',
      expression: '',
    },
    dependencyProfile: {
      fieldIds: [],
      relationshipIds: [],
      derivedFieldIds: [],
      queryBindingIds: [],
      providerBindingIds: [],
    },
    affectedTargets: {
      fieldIds: [],
      relationshipIds: [],
      childRelationIds: [],
    },
    message: {
      code: '',
      localizationKey: '',
      text: '',
    },
    bypassPolicy: {
      allowed: false,
      reasonRequired: false,
    },
    lifecycle: {
      metadataStatus: 'draft',
      version: '1.0.0',
    },
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
}

// ── Rule list card ─────────────────────────────────────────────
function RuleCard({
  rule,
  selected,
  onSelect,
}: {
  rule: ValidationRuleDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const familyCfg = VALIDATION_FAMILY_CONFIG[rule.validationFamily];
  const statusStyle = STATUS_COLORS[rule.lifecycle.metadataStatus] ?? STATUS_COLORS.draft;
  const sevStyle = SEVERITY_COLORS[rule.severity];

  const shownTriggers = rule.triggerContexts.slice(0, 2);
  const extraCount = rule.triggerContexts.length - 2;

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: selected ? 'rgba(var(--accent-rgb, 99,102,241), 0.08)' : 'var(--bg)',
        borderLeft: selected ? '3px solid var(--accent)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    >
      {/* Row 1: Family badge + label + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{
          fontSize: 9, fontWeight: 700,
          padding: '1px 6px', borderRadius: 6,
          background: familyCfg.bgColor, color: familyCfg.color,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {familyCfg.label}
        </span>
        <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rule.label || rule.validationRuleId}
        </span>
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
          background: statusStyle.bg, color: statusStyle.color, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {rule.lifecycle.metadataStatus}
        </span>
      </div>

      {/* Row 2: API name */}
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {rule.apiName || <span style={{ fontStyle: 'italic' }}>(api name not set)</span>}
      </div>

      {/* Row 3: Severity + Triggers + Enforcement */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
          background: sevStyle.bg, color: sevStyle.color,
        }}>
          {SEVERITY_LABELS[rule.severity]}
        </span>
        {shownTriggers.map(t => (
          <span key={t} style={{
            fontSize: 9, padding: '1px 5px', borderRadius: 4,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'var(--muted)', whiteSpace: 'nowrap',
          }}>
            {t.replace(/_/g, ' ')}
          </span>
        ))}
        {extraCount > 0 && (
          <span style={{ fontSize: 9, color: 'var(--muted)' }}>+{extraCount} more</span>
        )}
        <span style={{
          fontSize: 9, padding: '1px 5px', borderRadius: 4,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 'auto',
        }}>
          {rule.enforcementLayer.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ValidationRulesPanel({ entity }: ValidationRulesPanelProps) {
  const { savedValidationRules, saveValidationRule, deleteValidationRule } = useEntityDesignerStore();

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<ValidationRuleDefinition | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filters
  const [familyGroupFilter, setFamilyGroupFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const allRules = useMemo(
    () => getValidationRulesForEntity(entity.entityType, savedValidationRules),
    [entity.entityType, savedValidationRules],
  );

  const filteredRules = useMemo(() => {
    return allRules.filter(r => {
      if (familyGroupFilter !== 'all') {
        if (VALIDATION_FAMILY_CONFIG[r.validationFamily].group !== familyGroupFilter) return false;
      }
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && r.lifecycle.metadataStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!r.label?.toLowerCase().includes(q) && !r.apiName?.toLowerCase().includes(q) && !r.validationRuleId.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allRules, familyGroupFilter, severityFilter, statusFilter, search]);

  const activeRule = useMemo(() => {
    if (isCreatingNew) return newRule;
    if (!selectedRuleId) return null;
    return allRules.find(r => r.validationRuleId === selectedRuleId) ?? null;
  }, [isCreatingNew, newRule, selectedRuleId, allRules]);

  const handleNewRule = () => {
    const blank = makeBlankRule(entity.entityType);
    setNewRule(blank);
    setSelectedRuleId(null);
    setIsCreatingNew(true);
  };

  const handleSelectRule = (id: string) => {
    setSelectedRuleId(id);
    setIsCreatingNew(false);
    setNewRule(null);
  };

  const handleSave = (rule: ValidationRuleDefinition) => {
    saveValidationRule(rule);
    setSelectedRuleId(rule.validationRuleId);
    setIsCreatingNew(false);
    setNewRule(null);
  };

  const handleDelete = (ruleId: string) => {
    deleteValidationRule(ruleId);
    setSelectedRuleId(null);
    setIsCreatingNew(false);
    setNewRule(null);
  };

  const handleClose = () => {
    setSelectedRuleId(null);
    setIsCreatingNew(false);
    setNewRule(null);
  };

  const clearFilters = () => {
    setFamilyGroupFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
    setSearch('');
  };

  const hasFilters = familyGroupFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || search.trim() !== '';

  const groupOptions = (Object.keys(FAMILY_GROUP_LABELS) as ValidationFamilyGroup[]);
  const severityOptions: ValidationSeverity[] = ['error_blocking', 'warning_acknowledge', 'warning_nonblocking', 'info', 'advisory_async'];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left pane: Rule list ───────────────────────────────── */}
      <div style={{
        width: activeRule ? '38%' : '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: activeRule ? '1px solid var(--border)' : 'none',
        overflow: 'hidden',
        transition: 'width 0.2s',
      }}>

        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <Shield size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Validation Rules</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
              {filteredRules.length}{allRules.length !== filteredRules.length ? ` / ${allRules.length}` : ''} rule{allRules.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleNewRule}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7,
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={12} /> New Rule
          </button>
        </div>

        {/* Filter bar */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rules..."
              style={{
                flex: 1,
                paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                border: '1px solid var(--border)', borderRadius: 5,
                background: 'var(--bg)', color: 'var(--text)', fontSize: 11, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={11} />
              </button>
            )}
          </div>
          {/* Dropdowns */}
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={familyGroupFilter}
              onChange={e => setFamilyGroupFilter(e.target.value)}
              style={{ flex: 1, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}
            >
              <option value="all">All families</option>
              {groupOptions.map(g => <option key={g} value={g}>{FAMILY_GROUP_LABELS[g]}</option>)}
            </select>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              style={{ flex: 1, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}
            >
              <option value="all">All severities</option>
              {severityOptions.map(s => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ flex: 1, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="deprecated">Deprecated</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 5,
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: 10, cursor: 'pointer', width: 'fit-content',
              }}
            >
              <X size={9} /> Clear filters
            </button>
          )}
        </div>

        {/* Rule list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredRules.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)', padding: 24,
            }}>
              <Shield size={32} style={{ opacity: 0.25 }} />
              {allRules.length === 0 ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No validation rules defined</p>
                  <p style={{ fontSize: 12, margin: 0, textAlign: 'center' }}>
                    Validation rules define deterministic operation-time validity checks for <strong>{entity.label}</strong>.
                  </p>
                  <button
                    onClick={handleNewRule}
                    style={{
                      padding: '8px 18px', borderRadius: 8,
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 8,
                    }}
                  >
                    Define First Rule
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No rules match filters</p>
                  <button onClick={clearFilters} style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Group rules by family group */}
              {groupOptions.map(group => {
                const groupRules = filteredRules.filter(
                  r => VALIDATION_FAMILY_CONFIG[r.validationFamily].group === group
                );
                if (groupRules.length === 0) return null;
                return (
                  <div key={group}>
                    <div style={{
                      padding: '6px 14px',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                      color: 'var(--muted)', background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)',
                      borderTop: '1px solid var(--border)',
                    }}>
                      {FAMILY_GROUP_LABELS[group]} ({groupRules.length})
                    </div>
                    {groupRules.map(r => (
                      <RuleCard
                        key={r.validationRuleId}
                        rule={r}
                        selected={
                          isCreatingNew
                            ? false
                            : r.validationRuleId === selectedRuleId
                        }
                        onSelect={() => handleSelectRule(r.validationRuleId)}
                      />
                    ))}
                  </div>
                );
              })}
              {/* New rule being created shows in list */}
              {isCreatingNew && newRule && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <div style={{
                    padding: '6px 14px',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: 'var(--accent)', background: 'rgba(99,102,241,0.05)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    New Rule (unsaved)
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(var(--accent-rgb, 99,102,241), 0.08)',
                    borderLeft: '3px solid var(--accent)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontStyle: 'italic' }}>
                      New validation rule
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Fill in the form to define the rule</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right pane: Inspector ──────────────────────────────── */}
      {activeRule !== null && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ValidationRuleInspector
            rule={activeRule}
            entityType={entity.entityType}
            isNew={isCreatingNew}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={handleClose}
          />
        </div>
      )}

      {/* Empty inspector state when list is wide */}
      {activeRule === null && allRules.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 10, color: 'var(--muted)',
          padding: 32, flex: 1,
        }}>
          <Shield size={28} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Select a rule to inspect</p>
          <p style={{ fontSize: 12, margin: 0, textAlign: 'center' }}>
            Click any rule on the left to view and edit its definition.
          </p>
        </div>
      )}
    </div>
  );
}
