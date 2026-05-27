import { useState } from 'react'
import { evaluateRules, type SimulationContext } from '../../../lib/ui-studio/mockRuleEvaluator'
import type { ViewArtifact } from '../../../types/ui-studio/index'

interface BehaviorSimulationPanelProps {
  artifact: ViewArtifact
}

const ROLES = ['Admin', 'Sales', 'Finance', 'Viewer']
const DEVICES = ['desktop', 'tablet', 'mobile']
const RECORD_MODES = ['create', 'edit', 'view']

export function BehaviorSimulationPanel({ artifact }: BehaviorSimulationPanelProps) {
  const [context, setContext] = useState<SimulationContext>({
    role: 'Admin',
    fieldValues: {},
    workflowState: 'Draft',
    device: 'desktop',
    recordMode: 'edit',
  })
  const [fieldKey, setFieldKey] = useState('')
  const [fieldVal, setFieldVal] = useState('')

  const rules = artifact.behaviorRules ?? []
  const results = evaluateRules(rules, context)

  function patch(updates: Partial<SimulationContext>) {
    setContext(prev => ({ ...prev, ...updates }))
  }

  function addFieldValue() {
    if (!fieldKey.trim()) return
    patch({ fieldValues: { ...context.fieldValues, [fieldKey]: fieldVal } })
    setFieldKey('')
    setFieldVal('')
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '3px',
    display: 'block',
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="panel-title">Behavior Simulation</div>

      <div>
        <label style={labelStyle}>Role</label>
        <select className="form-select" style={{ fontSize: '12px', width: '100%' }}
          value={context.role} onChange={e => patch({ role: e.target.value })}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Workflow State</label>
        <input type="text" className="input" style={{ fontSize: '12px', width: '100%' }}
          value={context.workflowState} onChange={e => patch({ workflowState: e.target.value })} />
      </div>

      <div>
        <label style={labelStyle}>Device</label>
        <select className="form-select" style={{ fontSize: '12px', width: '100%' }}
          value={context.device} onChange={e => patch({ device: e.target.value })}>
          {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Record Mode</label>
        <select className="form-select" style={{ fontSize: '12px', width: '100%' }}
          value={context.recordMode} onChange={e => patch({ recordMode: e.target.value })}>
          {RECORD_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Field Values</label>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          <input type="text" className="input" style={{ flex: 2, fontSize: '11.5px', height: '26px' }}
            placeholder="field code" value={fieldKey} onChange={e => setFieldKey(e.target.value)} />
          <input type="text" className="input" style={{ flex: 2, fontSize: '11.5px', height: '26px' }}
            placeholder="value" value={fieldVal} onChange={e => setFieldVal(e.target.value)} />
          <button className="btn btn-xs btn-ghost" onClick={addFieldValue} type="button">Set</button>
        </div>
        {Object.keys(context.fieldValues).length > 0 && (
          <div style={{ fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {Object.entries(context.fieldValues).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>{k}</span>
                <span>=</span>
                <span>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
          {results.size} rule{results.size !== 1 ? 's' : ''} fired
        </div>
        {results.size === 0 ? (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>No rules matched this context</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Array.from(results.entries()).map(([targetId, effect]) => (
              <div key={targetId} style={{
                display: 'flex', gap: '8px', alignItems: 'center',
                fontSize: '11.5px', padding: '3px 6px',
                background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)',
              }}>
                <span style={{ fontFamily: 'monospace', flex: 1 }}>{targetId}</span>
                <span style={{
                  fontWeight: 600,
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  padding: '1px 5px', borderRadius: '4px',
                }}>
                  {effect.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
