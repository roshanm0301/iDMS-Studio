import type { ActionDefinition } from '../../../types/ui-studio/index'

interface ActionConfiguratorProps {
  action: ActionDefinition
  onChange: (a: ActionDefinition) => void
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '3px',
  display: 'block',
}

const fieldStyle: React.CSSProperties = { marginBottom: '8px' }

export function ActionConfigurator({ action, onChange }: ActionConfiguratorProps) {
  function patch(updates: Partial<ActionDefinition>) {
    onChange({ ...action, ...updates })
  }

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Label</label>
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px', width: '100%' }}
          value={action.label}
          onChange={e => patch({ label: e.target.value })}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Action Type</label>
        <select
          className="form-select"
          style={{ fontSize: '12px', width: '100%' }}
          value={action.actionType}
          onChange={e => patch({ actionType: e.target.value as ActionDefinition['actionType'] })}
        >
          <option value="navigate">navigate</option>
          <option value="save_draft">save_draft</option>
          <option value="submit">submit</option>
          <option value="open_modal">open_modal</option>
          <option value="show_confirmation">show_confirmation</option>
          <option value="mock_command">mock_command</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Placement</label>
        <select
          className="form-select"
          style={{ fontSize: '12px', width: '100%' }}
          value={action.placement}
          onChange={e => patch({ placement: e.target.value as ActionDefinition['placement'] })}
        >
          <option value="toolbar">toolbar</option>
          <option value="row">row</option>
          <option value="form_footer">form_footer</option>
          <option value="section">section</option>
          <option value="grid">grid</option>
          <option value="quick_action">quick_action</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Visibility Rule ID</label>
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px', width: '100%' }}
          placeholder="Link to a behavior rule ID…"
          value={action.visibilityRuleId ?? ''}
          onChange={e => patch({ visibilityRuleId: e.target.value || undefined })}
        />
      </div>
    </div>
  )
}
