import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { getMockEntityById } from '../../../mocks/ui-studio/mockEntityMetadata'
import { BehaviorRuleEditor } from './BehaviorRuleEditor'
import type { ViewArtifact, BehaviorRuleDefinition } from '../../../types/ui-studio/index'

interface BehaviorRuleListPanelProps {
  artifact: ViewArtifact
  onChange: (patch: Partial<ViewArtifact>) => void
}

export function BehaviorRuleListPanel({ artifact, onChange }: BehaviorRuleListPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const rules = artifact.behaviorRules ?? []

  const entity = artifact.primaryEntityId ? getMockEntityById(artifact.primaryEntityId) : undefined
  const allTargets = [
    ...(entity?.fields.filter(f => !f.isSystem).map(f => ({ id: f.id, label: f.label, type: 'field' })) ?? []),
    ...(artifact.actions?.map(a => ({ id: a.id, label: a.label, type: 'action' })) ?? []),
  ]

  function addRule() {
    const newRule: BehaviorRuleDefinition = {
      id: `rule-${Date.now()}`,
      label: 'New Rule',
      conditions: [{ type: 'role', value: '' }],
      effect: { type: 'show' },
      targetIds: [],
    }
    onChange({ behaviorRules: [...rules, newRule] })
  }

  function updateRule(updated: BehaviorRuleDefinition) {
    onChange({ behaviorRules: rules.map(r => r.id === updated.id ? updated : r) })
  }

  function removeRule(id: string) {
    onChange({ behaviorRules: rules.filter(r => r.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="panel-title">Behavior Rules</div>
        <button className="btn btn-xs btn-primary" onClick={addRule} type="button">
          <Plus size={11} /> Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
          No behavior rules defined
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {rules.map(rule => {
            const isExpanded = expandedId === rule.id
            const condition = rule.conditions[0]

            return (
              <div key={rule.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 8px', background: 'var(--bg-sunken)', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rule.label}
                  </span>
                  {condition && (
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {condition.type}
                    </span>
                  )}
                  <span style={{
                    fontSize: '10.5px', fontWeight: 600,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    padding: '1px 5px', borderRadius: '4px',
                  }}>
                    {rule.effect.type}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={e => { e.stopPropagation(); removeRule(rule.id) }}
                    type="button"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {isExpanded && (
                  <BehaviorRuleEditor
                    rule={rule}
                    allTargets={allTargets}
                    entityId={artifact.primaryEntityId}
                    onChange={updateRule}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
