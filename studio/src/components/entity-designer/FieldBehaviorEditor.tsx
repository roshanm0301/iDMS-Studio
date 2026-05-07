import type { FieldBehaviors, PresenceBehavior, EditabilityBehavior, VisibilityBehavior, AuditBehavior, DefaultSource } from '../../types/entityDesigner';

interface Props {
  behaviors: FieldBehaviors;
  onChange: (behaviors: FieldBehaviors) => void;
  isProtected?: boolean;
  fieldType?: string;
}

const PRESENCE_OPTIONS: { value: PresenceBehavior; label: string; desc: string; disabled?: boolean }[] = [
  { value: 'optional', label: 'Optional', desc: 'Field can be left empty' },
  { value: 'on_create', label: 'Required on Create', desc: 'Must be filled when creating a new record' },
  { value: 'on_update', label: 'Required on Update', desc: 'Must be filled when updating' },
  { value: 'before_submit', label: 'Required Before Submit', desc: 'Must be filled before submitting for approval' },
  { value: 'before_approve', label: 'Required Before Approve', desc: 'Must be filled before the record can be approved' },
  { value: 'conditional', label: 'Conditional (coming soon)', desc: 'Required based on field condition — configure in Rule Builder', disabled: true },
];

const EDITABILITY_OPTIONS: { value: EditabilityBehavior; label: string }[] = [
  { value: 'always', label: 'Editable Always' },
  { value: 'create_only', label: 'Editable on Create Only' },
  { value: 'until_submit', label: 'Editable Until Submit' },
  { value: 'readonly', label: 'Read-only' },
  { value: 'system_only', label: 'System Only' },
  { value: 'integration_only', label: 'Integration Only — populated by external system' },
];

const VISIBILITY_OPTIONS: { value: VisibilityBehavior; label: string }[] = [
  { value: 'default', label: 'Visible by Default' },
  { value: 'hidden', label: 'Hidden by Default' },
  { value: 'masked', label: 'Masked (shows •••)' },
];

const DEFAULT_SOURCE_OPTIONS: { value: DefaultSource; label: string }[] = [
  { value: 'none', label: 'No Default' },
  { value: 'static', label: 'Static Value' },
  { value: 'today', label: 'Today (date fields)' },
  { value: 'now', label: 'Now (datetime fields)' },
  { value: 'session_tenant', label: 'Session Tenant' },
  { value: 'session_node', label: 'Session Node' },
  { value: 'session_user', label: 'Session User' },
  { value: 'tenant_default_currency', label: 'Tenant Default Currency' },
];

const AUDIT_OPTIONS: { value: AuditBehavior; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'audit_change', label: 'Audit Changes' },
  { value: 'audit_masked', label: 'Audit & Mask Values' },
];

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: value ? 'var(--accent)' : 'var(--border)', position: 'relative', opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s', left: value ? '18px' : '2px' }} />
    </button>
  );
}

export default function FieldBehaviorEditor({ behaviors, onChange, isProtected, fieldType }: Props) {
  const update = (patch: Partial<FieldBehaviors>) => onChange({ ...behaviors, ...patch });
  const readonly = isProtected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Presence */}
      <div>
        <label className="form-label">Presence / Requiredness</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {PRESENCE_OPTIONS.map(opt => {
            const isSelected = behaviors.presence === opt.value;
            return (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: opt.disabled || readonly ? 'not-allowed' : 'pointer',
                  opacity: opt.disabled ? 0.45 : 1,
                  padding: '5px 8px', borderRadius: '5px',
                  background: isSelected ? 'hsl(22 100% 51% / 0.08)' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="presence"
                  value={opt.value}
                  checked={isSelected}
                  disabled={opt.disabled || readonly}
                  onChange={() => update({ presence: opt.value })}
                />
                <span style={{ fontWeight: isSelected ? 600 : 400, fontSize: '13px', color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
        {/* Description for selected option only */}
        {(() => {
          const sel = PRESENCE_OPTIONS.find(o => o.value === behaviors.presence);
          return sel ? (
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 0', paddingLeft: '8px' }}>{sel.desc}</p>
          ) : null;
        })()}
      </div>

      {/* Editability */}
      <div>
        <label className="form-label">Editability</label>
        <select className="search-input" style={{ width: '100%' }} value={behaviors.editability} disabled={readonly}
          onChange={e => update({ editability: e.target.value as EditabilityBehavior })}>
          {EDITABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Visibility */}
      <div>
        <label className="form-label">Visibility</label>
        <select className="search-input" style={{ width: '100%' }} value={behaviors.visibility} disabled={readonly}
          onChange={e => update({ visibility: e.target.value as VisibilityBehavior })}>
          {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Default Source */}
      <div>
        <label className="form-label">Default Value Source</label>
        <select className="search-input" style={{ width: '100%' }} value={behaviors.defaultSource}
          onChange={e => update({ defaultSource: e.target.value as DefaultSource })}>
          {DEFAULT_SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {behaviors.defaultSource === 'static' && (
          <input className="search-input" style={{ width: '100%', marginTop: '6px' }} placeholder="Static default value…"
            value={String(behaviors.defaultValue ?? '')} onChange={e => update({ defaultValue: e.target.value })} />
        )}
      </div>

      {/* Search / List toggles */}
      <div>
        <label className="form-label">Search &amp; List</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {([
            { key: 'searchable', label: 'Searchable' },
            { key: 'filterable', label: 'Filterable' },
            { key: 'sortable', label: 'Sortable' },
            { key: 'includeInDefaultList', label: 'Include in Default List View' },
            { key: 'includeInLookupDisplay', label: 'Include in Lookup Display' },
          ] as const).map(t => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px' }}>{t.label}</span>
              <Toggle value={behaviors[t.key] as boolean} onChange={v => update({ [t.key]: v })} disabled={readonly} />
            </div>
          ))}
        </div>
      </div>

      {/* Audit */}
      <div>
        <label className="form-label">Audit Behavior</label>
        <select className="search-input" style={{ width: '100%' }} value={behaviors.auditBehavior}
          onChange={e => update({ auditBehavior: e.target.value as AuditBehavior })}>
          {AUDIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
