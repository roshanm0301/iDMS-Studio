// ============================================================
// ConditionBuilder — standalone component extracted from EntityRefConfig
// Reused by: EntityRefConfig (FieldTypeConfigurator) + ViewsBuilder
// ============================================================
import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  FilterCondition, FilterConditionGroup,
  ConditionOperator, ConditionValueSource, SessionContextKey,
} from '../../types/entityDesigner';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { getEntityDefinitions } from '../../data/mockService';

interface Props {
  /** The current condition group (AND/OR + conditions array) */
  conditions: FilterConditionGroup;
  /** The entity whose fields are the "current record" field source */
  currentEntityType: string;
  /**
   * The entity whose fields are the "target entity" field list.
   * Used in entity_ref context (filtering which records appear in the picker).
   * Omit when using for a view's default filter (entity's own fields are the target).
   */
  targetEntityType?: string;
  onChange: (group: FilterConditionGroup) => void;
  disabled?: boolean;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals',       label: 'equals'       },
  { value: 'not_equals',   label: 'not equals'   },
  { value: 'in',           label: 'in'           },
  { value: 'not_in',       label: 'not in'       },
  { value: 'is_null',      label: 'is empty'     },
  { value: 'is_not_null',  label: 'is not empty' },
];

const VALUE_SOURCES: { value: ConditionValueSource; label: string }[] = [
  { value: 'static',               label: 'Static Value'        },
  { value: 'current_record_field', label: 'Current Record Field'},
  { value: 'session',              label: 'Session Context'     },
];

const SESSION_KEYS: { value: SessionContextKey; label: string }[] = [
  { value: 'current_user_id',   label: 'Current User ID'       },
  { value: 'current_tenant_id', label: 'Current Tenant ID'     },
  { value: 'current_node_id',   label: 'Current Node/Branch ID'},
  { value: 'current_role_code', label: 'Current Role Code'     },
];

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cond_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ConditionBuilder({ conditions, currentEntityType, targetEntityType, onChange, disabled }: Props) {
  const { savedEntities } = useEntityDesignerStore();
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  // Fields on the target entity (for entity_ref filter context)
  const fieldOpts = useMemo(
    () => {
      const targetEnt = allEntities.find(e => e.entityType === (targetEntityType ?? currentEntityType));
      return (targetEnt?.fields ?? []).map(f => ({ value: f.fieldId, label: `${f.label} (${f.fieldId})` }));
    },
    [allEntities, targetEntityType, currentEntityType],
  );

  // Fields on the current entity (for "current record field" value source)
  const currentFieldOpts = useMemo(
    () => {
      const currentEnt = allEntities.find(e => e.entityType === currentEntityType);
      return (currentEnt?.fields ?? []).map(f => ({ value: f.fieldId, label: `${f.label} (${f.fieldId})` }));
    },
    [allEntities, currentEntityType],
  );

  const conds = conditions.conditions;
  const logic = conditions.logic;
  const [showBuilder, setShowBuilder] = useState(conds.length > 0);

  const updateAll = (newConds: FilterCondition[], newLogic?: 'AND' | 'OR') =>
    onChange({ logic: newLogic ?? logic, conditions: newConds });

  const addCondition = () => {
    const nc: FilterCondition = {
      id: makeId(),
      targetField: '',
      operator: 'equals',
      valueSource: 'static',
      staticValue: '',
    };
    updateAll([...conds, nc]);
    if (!showBuilder) setShowBuilder(true);
  };

  const updateCondition = (id: string, patch: Partial<FilterCondition>) =>
    updateAll(conds.map(c => c.id === id ? { ...c, ...patch } : c));

  const removeCondition = (id: string) =>
    updateAll(conds.filter(c => c.id !== id));

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="form-label" style={{ margin: 0 }}>
          Filter Conditions{' '}
          {conds.length > 0 && (
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>({conds.length})</span>
          )}
        </label>
        {!disabled && (
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }}
            onClick={() => setShowBuilder(v => !v)}>
            {showBuilder ? 'Hide' : 'Show / Add'}
          </button>
        )}
      </div>

      {conds.length > 0 && !showBuilder && (
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 8px' }}>
          {conds.length} filter condition{conds.length > 1 ? 's' : ''} active — records shown only when conditions match
        </p>
      )}

      {showBuilder && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', background: 'var(--bg-secondary)' }}>
          {/* Logic toggle — only meaningful when 2+ conditions exist */}
          {conds.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Combine with:</span>
              {(['AND', 'OR'] as const).map(l => (
                <button key={l} disabled={disabled}
                  style={{
                    padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: `1px solid ${logic === l ? 'var(--accent)' : 'var(--border)'}`,
                    background: logic === l ? 'hsl(22 100% 51% / 0.1)' : 'transparent',
                    color: logic === l ? 'var(--accent)' : 'var(--muted)',
                  }}
                  onClick={() => updateAll(conds, l)}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Condition rows */}
          {conds.map(cond => (
            <div key={cond.id}
              style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap' }}>

              {/* Target field on referenced entity */}
              <select className="search-input"
                style={{ flex: 1, minWidth: '120px', fontSize: '12px' }}
                disabled={disabled}
                value={cond.targetField}
                onChange={e => updateCondition(cond.id, { targetField: e.target.value })}>
                <option value="">Entity field…</option>
                {fieldOpts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>

              {/* Operator */}
              <select className="search-input"
                style={{ width: '110px', fontSize: '12px' }}
                disabled={disabled}
                value={cond.operator}
                onChange={e => updateCondition(cond.id, { operator: e.target.value as ConditionOperator })}>
                {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Value source — hidden when operator is null-check */}
              {!['is_null', 'is_not_null'].includes(cond.operator) && (
                <select className="search-input"
                  style={{ width: '140px', fontSize: '12px' }}
                  disabled={disabled}
                  value={cond.valueSource}
                  onChange={e => updateCondition(cond.id, {
                    valueSource: e.target.value as ConditionValueSource,
                    staticValue: '',
                    recordFieldRef: '',
                    sessionKey: undefined,
                  })}>
                  {VALUE_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}

              {/* Static value input */}
              {cond.valueSource === 'static' && !['is_null', 'is_not_null'].includes(cond.operator) && (
                <input className="search-input"
                  style={{ flex: 1, minWidth: '80px', fontSize: '12px' }}
                  placeholder="value…"
                  disabled={disabled}
                  value={cond.staticValue ?? ''}
                  onChange={e => updateCondition(cond.id, { staticValue: e.target.value })} />
              )}

              {/* Current record field picker */}
              {cond.valueSource === 'current_record_field' && !['is_null', 'is_not_null'].includes(cond.operator) && (
                <select className="search-input"
                  style={{ flex: 1, minWidth: '100px', fontSize: '12px' }}
                  disabled={disabled}
                  value={cond.recordFieldRef ?? ''}
                  onChange={e => updateCondition(cond.id, { recordFieldRef: e.target.value })}>
                  <option value="">Current record field…</option>
                  {currentFieldOpts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              )}

              {/* Session context key picker */}
              {cond.valueSource === 'session' && !['is_null', 'is_not_null'].includes(cond.operator) && (
                <select className="search-input"
                  style={{ flex: 1, minWidth: '120px', fontSize: '12px' }}
                  disabled={disabled}
                  value={cond.sessionKey ?? ''}
                  onChange={e => updateCondition(cond.id, { sessionKey: e.target.value as SessionContextKey })}>
                  <option value="">Session key…</option>
                  {SESSION_KEYS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              )}

              {!disabled && (
                <button className="btn btn-ghost" style={{ padding: '4px 5px', flexShrink: 0 }}
                  onClick={() => removeCondition(cond.id)}>
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {!disabled && (
            <button className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', width: '100%', marginTop: '4px' }}
              onClick={addCondition}>
              <Plus size={11} style={{ marginRight: 4 }} />Add Condition
            </button>
          )}
        </div>
      )}
    </div>
  );
}
