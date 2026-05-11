// ============================================================
// FieldTypeConfigurator — renders config controls for all 26 field types
// ============================================================
import { useState, useMemo } from 'react';
import { AlertTriangle, Info, Plus, Trash2, X } from 'lucide-react';
import type { FieldTypeCode, FilterConditionGroup } from '../../types/entityDesigner';
import { useEntityDesignerStore } from '../../hooks/useEntityDesignerStore';
import { getEntityDefinitions, getDocumentCodeSettings, getMasterCodeSettings } from '../../data/mockService';
import { toSlug } from '../../utils/entityDesignerUtils';
import { ConditionBuilder } from './ConditionBuilder';

interface Props {
  fieldType: FieldTypeCode;
  typeConfig: Record<string, any>;
  onChange: (typeConfig: Record<string, any>) => void;
  disabled?: boolean;
  currentEntityType?: string; // for condition builder (entity_ref) and rollup source filtering
}

// ─── Helper Components ────────────────────────────────────────

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label className="form-label" style={{ marginBottom: '4px' }}>{label}</label>
      {desc && <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 4px' }}>{desc}</p>}
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, placeholder, disabled }: { value?: number; onChange: (v: number | undefined) => void; min?: number; max?: number; placeholder?: string; disabled?: boolean }) {
  return (
    <input
      type="number" className="search-input" style={{ width: '100%' }} disabled={disabled}
      placeholder={placeholder ?? ''} value={value ?? ''} min={min} max={max}
      onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: value ? 'var(--accent)' : 'var(--border)', position: 'relative', opacity: disabled ? 0.5 : 1, flexShrink: 0 }}
    >
      <div style={{ position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s', left: value ? '18px' : '2px' }} />
    </button>
  );
}

function ToggleRow({ label, configKey, cfg, update }: { label: string; configKey: string; cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px' }}>{label}</span>
      <Toggle value={!!cfg[configKey]} onChange={v => update(configKey, v)} />
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '8px', marginBottom: '12px' }}>
      <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '8px', marginBottom: '12px' }}>
      <Info size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  );
}

// ─── Type-specific configurators ─────────────────────────────

function TextConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Min Length"><NumberInput value={cfg.minLength} onChange={v => update('minLength', v)} min={0} /></Row>
    <Row label="Max Length"><NumberInput value={cfg.maxLength} onChange={v => update('maxLength', v)} min={1} /></Row>
    <Row label="Pattern (Regex)" desc="Leave empty for no pattern validation">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. ^[A-Z0-9]+$" value={cfg.pattern ?? ''} onChange={e => update('pattern', e.target.value || undefined)} />
    </Row>
    <ToggleRow label="Uppercase transform on save" configKey="uppercaseTransform" cfg={cfg} update={update} />
    <ToggleRow label="Trim whitespace" configKey="trim" cfg={cfg} update={update} />
  </>;
}

function TextareaConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Max Length"><NumberInput value={cfg.maxLength} onChange={v => update('maxLength', v)} min={1} /></Row>
    <Row label="Line Count Hint" desc="Suggested visible rows in the editor"><NumberInput value={cfg.lineCountHint} onChange={v => update('lineCountHint', v)} min={2} max={20} /></Row>
    <InfoBox>Rich text formatting is disabled for textarea fields. Use Rich Text type for formatted content.</InfoBox>
  </>;
}

function NumberConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Min Value"><NumberInput value={cfg.min} onChange={v => update('min', v)} /></Row>
    <Row label="Max Value"><NumberInput value={cfg.max} onChange={v => update('max', v)} /></Row>
    <ToggleRow label="Integer Only" configKey="integerOnly" cfg={cfg} update={update} />
    <ToggleRow label="Allow Negative" configKey="allowNegative" cfg={cfg} update={update} />
  </>;
}

function DecimalConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Precision (total digits)"><NumberInput value={cfg.precision} onChange={v => update('precision', v)} min={1} max={20} /></Row>
    <Row label="Scale (decimal places)"><NumberInput value={cfg.scale} onChange={v => update('scale', v)} min={0} max={10} /></Row>
    <Row label="Min Value"><NumberInput value={cfg.min} onChange={v => update('min', v)} /></Row>
    <Row label="Max Value"><NumberInput value={cfg.max} onChange={v => update('max', v)} /></Row>
    <Row label="Rounding Mode">
      <select className="search-input" style={{ width: '100%' }} value={cfg.roundingMode ?? 'half_up'} onChange={e => update('roundingMode', e.target.value)}>
        <option value="half_up">Half Up (display)</option>
        <option value="half_even">Half Even / Banker's</option>
        <option value="truncate">Truncate</option>
      </select>
    </Row>
  </>;
}

function CurrencyConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Currency Source">
      <select className="search-input" style={{ width: '100%' }} value={cfg.currencySource ?? 'tenant_default'} onChange={e => update('currencySource', e.target.value)}>
        <option value="tenant_default">Tenant Default Currency</option>
        <option value="fixed">Fixed Currency</option>
        <option value="lookup">Lookup from another field</option>
      </select>
    </Row>
    {cfg.currencySource === 'fixed' && (
      <Row label="Fixed Currency Code"><input className="search-input" style={{ width: '100%' }} placeholder="e.g. INR" value={cfg.fixedCurrency ?? ''} onChange={e => update('fixedCurrency', e.target.value)} maxLength={3} /></Row>
    )}
    <Row label="Precision"><NumberInput value={cfg.precision} onChange={v => update('precision', v)} min={0} max={4} /></Row>
    <Row label="Scale (decimal places)"><NumberInput value={cfg.scale} onChange={v => update('scale', v)} min={0} max={4} /></Row>
    <Row label="Min Value"><NumberInput value={cfg.min} onChange={v => update('min', v)} /></Row>
    <Row label="Max Value"><NumberInput value={cfg.max} onChange={v => update('max', v)} /></Row>
    <ToggleRow label="Allow Negative" configKey="allowNegative" cfg={cfg} update={update} />
  </>;
}

function PercentageConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Min (%)"><NumberInput value={cfg.min ?? 0} onChange={v => update('min', v)} min={0} max={100} /></Row>
    <Row label="Max (%)"><NumberInput value={cfg.max ?? 100} onChange={v => update('max', v)} min={0} max={100} /></Row>
    <Row label="Scale (decimal places)"><NumberInput value={cfg.scale} onChange={v => update('scale', v)} min={0} max={4} /></Row>
    <ToggleRow label="Show % symbol in display" configKey="showPercentSymbol" cfg={cfg} update={update} />
  </>;
}

function DateConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Min Date"><input type="date" className="search-input" style={{ width: '100%' }} value={cfg.minDate ?? ''} onChange={e => update('minDate', e.target.value || undefined)} /></Row>
    <Row label="Max Date"><input type="date" className="search-input" style={{ width: '100%' }} value={cfg.maxDate ?? ''} onChange={e => update('maxDate', e.target.value || undefined)} /></Row>
    <ToggleRow label="Allow Past Dates" configKey="allowPast" cfg={cfg} update={update} />
    <ToggleRow label="Allow Future Dates" configKey="allowFuture" cfg={cfg} update={update} />
  </>;
}

function DatetimeConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Timezone Display Mode">
      <select className="search-input" style={{ width: '100%' }} value={cfg.timezoneMode ?? 'user_tz'} onChange={e => update('timezoneMode', e.target.value)}>
        <option value="user_tz">User's Timezone</option>
        <option value="utc">Always UTC</option>
        <option value="tenant_tz">Tenant Timezone</option>
      </select>
    </Row>
    <ToggleRow label="System-set only (auto-timestamp)" configKey="systemSet" cfg={cfg} update={update} />
  </>;
}

function TimeConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Step Interval" desc="Selectable time increments in the picker">
      <select className="search-input" style={{ width: '100%' }}
        value={cfg.stepMinutes ?? 15}
        onChange={e => update('stepMinutes', Number(e.target.value))}>
        <option value={5}>5 minutes</option>
        <option value={10}>10 minutes</option>
        <option value={15}>15 minutes (default)</option>
        <option value={30}>30 minutes</option>
        <option value={60}>1 hour</option>
      </select>
    </Row>
    <Row label="Default Time" desc="Pre-filled value (24-hour HH:MM)">
      <input className="search-input" type="time" style={{ width: '100%' }}
        value={cfg.defaultTime ?? ''}
        onChange={e => update('defaultTime', e.target.value || undefined)} />
    </Row>
    <ToggleRow label="Allow Past Times" configKey="allowPast" cfg={{ ...cfg, allowPast: cfg.allowPast ?? true }} update={update} />
    <ToggleRow label="Use 12-Hour Format (AM/PM)" configKey="use12Hour" cfg={cfg} update={update} />
  </>;
}

function BooleanConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Default Value">
      <select className="search-input" style={{ width: '100%' }} value={cfg.defaultValue === true ? 'true' : cfg.defaultValue === false ? 'false' : 'null'} onChange={e => update('defaultValue', e.target.value === 'null' ? null : e.target.value === 'true')}>
        <option value="null">No default</option>
        <option value="true">True (checked/on)</option>
        <option value="false">False (unchecked/off)</option>
      </select>
    </Row>
    <Row label="Display Style">
      <select className="search-input" style={{ width: '100%' }} value={cfg.displayStyle ?? 'switch'} onChange={e => update('displayStyle', e.target.value)}>
        <option value="switch">Toggle Switch</option>
        <option value="checkbox">Checkbox</option>
      </select>
    </Row>
  </>;
}

// ── Select option shape: label shown in UI, value stored in DB ─
interface SelectOption { label: string; value: string }

// ── Dependent Options: options in this select depend on another select field's value ─
function DependentOptionsSection({ cfg, update, optionItems, currentEntityType }: {
  cfg: Record<string, any>;
  update: (k: string, v: any) => void;
  optionItems: SelectOption[];
  currentEntityType: string;
}) {
  const { savedEntities } = useEntityDesignerStore();
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);
  const currentEnt = allEntities.find(e => e.entityType === currentEntityType);
  const selectSiblings = (currentEnt?.fields ?? []).filter(f => f.fieldType === 'select');

  const [showDependent, setShowDependent] = useState(!!cfg.dependsOnFieldId);
  const dependentOptions: Record<string, SelectOption[]> = cfg.dependentOptions ?? {};

  const [newDepLabel, setNewDepLabel] = useState('');
  const [newDepValue, setNewDepValue] = useState('');

  const setDepOptionsForParent = (parentValue: string, opts: SelectOption[]) => {
    update('dependentOptions', { ...dependentOptions, [parentValue]: opts });
  };

  if (selectSiblings.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="form-label" style={{ margin: 0 }}>Dependent Options</label>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }}
          onClick={() => { setShowDependent(v => !v); if (!showDependent) { update('dependsOnFieldId', ''); update('dependentOptions', {}); } }}>
          {showDependent ? 'Disable' : 'Enable'}
        </button>
      </div>
      {!showDependent && (
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
          Make this field's available options depend on the value of another select field on the same record.
        </p>
      )}
      {showDependent && (
        <>
          <Row label="Depends on Field" desc="The select field whose value controls this field's available options">
            <select className="search-input" style={{ width: '100%' }}
              value={cfg.dependsOnFieldId ?? ''}
              onChange={e => { update('dependsOnFieldId', e.target.value); update('dependentOptions', {}); }}>
              <option value="">— Select a field —</option>
              {selectSiblings.map(f => <option key={f.fieldId} value={f.fieldId}>{f.label} ({f.fieldId})</option>)}
            </select>
          </Row>
          {cfg.dependsOnFieldId && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
                Define which options appear in this field for each value of <strong>{cfg.dependsOnFieldId}</strong>:
              </p>
              {optionItems.map(parentOpt => {
                const depOpts: SelectOption[] = dependentOptions[parentOpt.value] ?? [];
                return (
                  <div key={parentOpt.value} style={{ marginBottom: '12px', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 6px' }}>
                      When <code style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 3 }}>{parentOpt.label}</code> is selected:
                    </p>
                    {depOpts.length > 0 && (
                      <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {depOpts.map((o, i) => (
                          <span key={o.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            {o.label}
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              onClick={() => setDepOptionsForParent(parentOpt.value, depOpts.filter((_, j) => j !== i))}>
                              <X size={9} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {depOpts.length === 0 && <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 6px' }}>No options — add below (or leave empty to hide this field)</p>}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input className="search-input" style={{ flex: 1, fontSize: '11px' }} placeholder="Label"
                        value={newDepLabel}
                        onChange={e => { setNewDepLabel(e.target.value); setNewDepValue(toSlug(e.target.value)); }} />
                      <input className="search-input" style={{ width: '90px', fontSize: '11px', fontFamily: 'monospace' }} placeholder="value"
                        value={newDepValue}
                        onChange={e => setNewDepValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} />
                      <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => {
                          if (!newDepLabel.trim()) return;
                          setDepOptionsForParent(parentOpt.value, [...depOpts, { label: newDepLabel.trim(), value: newDepValue || toSlug(newDepLabel) }]);
                          setNewDepLabel(''); setNewDepValue('');
                        }}>
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SelectConfig({ cfg, update, multi, currentEntityType }: { cfg: Record<string, any>; update: (k: string, v: any) => void; multi?: boolean; currentEntityType?: string }) {
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [dupeError, setDupeError] = useState(false);

  // Migrate old `values: string[]` format to `optionItems: SelectOption[]` transparently
  const optionItems: SelectOption[] = cfg.optionItems
    ?? (cfg.values ?? []).map((v: string) => ({ label: v, value: toSlug(v) || v }));

  const addOption = () => {
    if (!newLabel.trim()) return;
    const effectiveValue = newValue.trim() || toSlug(newLabel) || newLabel.toLowerCase();
    if (optionItems.some(o => o.value === effectiveValue)) { setDupeError(true); return; }
    setDupeError(false);
    update('optionItems', [...optionItems, { label: newLabel.trim(), value: effectiveValue }]);
    update('values', undefined); // clear legacy format
    setNewLabel(''); setNewValue('');
  };

  const updateOption = (i: number, patch: Partial<SelectOption>) => {
    const updated = optionItems.map((o, j) => j === i ? { ...o, ...patch } : o);
    update('optionItems', updated);
    update('values', undefined);
  };

  const removeOption = (i: number) => {
    update('optionItems', optionItems.filter((_, j) => j !== i));
    update('values', undefined);
  };

  return <>
    <Row label="Value Source">
      <select className="search-input" style={{ width: '100%' }} value={cfg.valueSource ?? 'inline'} onChange={e => update('valueSource', e.target.value)}>
        <option value="inline">Inline (defined here)</option>
        <option value="master">Master data lookup</option>
        <option value="enum">System Enum</option>
        {cfg.valueSource === 'workflow' && <option value="workflow">Workflow States (locked)</option>}
      </select>
    </Row>

    {(cfg.valueSource ?? 'inline') === 'inline' && (
      <Row label="Options">
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
          {/* Column header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', padding: '5px 8px', background: 'var(--bg-secondary)', fontSize: '10px', fontWeight: 600, color: 'var(--muted)', gap: '4px' }}>
            <span>Display Label</span>
            <span>Stored Value</span>
            <span />
          </div>
          {/* Option rows */}
          {optionItems.map((opt, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: '4px', padding: '4px 8px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <input
                className="search-input" style={{ fontSize: '12px', padding: '3px 6px' }}
                value={opt.label}
                onChange={e => updateOption(i, { label: e.target.value })}
              />
              <input
                className="search-input" style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 6px' }}
                value={opt.value}
                onChange={e => updateOption(i, { value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              />
              <button className="btn btn-ghost" style={{ padding: '2px 4px' }} onClick={() => removeOption(i)}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {optionItems.length === 0 && (
            <p style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--muted)', margin: 0 }}>No options yet — add below</p>
          )}
        </div>
        {/* Add row */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            className="search-input" style={{ flex: 1 }}
            placeholder="Label (e.g. Active)"
            value={newLabel}
            onChange={e => { setNewLabel(e.target.value); setDupeError(false); if (!newValue) setNewValue(toSlug(e.target.value)); }}
            onKeyDown={e => e.key === 'Enter' && addOption()}
          />
          <input
            className="search-input" style={{ width: '110px', fontFamily: 'monospace', fontSize: '12px' }}
            placeholder="value"
            value={newValue}
            onChange={e => { setNewValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')); setDupeError(false); }}
            onKeyDown={e => e.key === 'Enter' && addOption()}
          />
          <button className="btn btn-secondary" onClick={addOption}><Plus size={13} /></button>
        </div>
        {dupeError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px' }}>⚠ Stored value already exists</p>}
      </Row>
    )}

    <Row label="Default Value">
      {optionItems.length > 0 ? (
        <select className="search-input" style={{ width: '100%' }} value={cfg.defaultValue ?? ''} onChange={e => update('defaultValue', e.target.value)}>
          <option value="">— No default —</option>
          {optionItems.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input className="search-input" style={{ width: '100%' }} placeholder="Add options first" disabled />
      )}
    </Row>

    {multi && <>
      <Row label="Min Selected"><NumberInput value={cfg.minSelected} onChange={v => update('minSelected', v)} min={0} /></Row>
      <Row label="Max Selected"><NumberInput value={cfg.maxSelected} onChange={v => update('maxSelected', v)} min={1} /></Row>
    </>}
    <ToggleRow label="Show inactive/disabled options" configKey="showInactive" cfg={cfg} update={update} />

    {/* Dependent Options — only for inline value source */}
    {(cfg.valueSource ?? 'inline') === 'inline' && !multi && optionItems.length > 0 && currentEntityType && (
      <DependentOptionsSection cfg={cfg} update={update} optionItems={optionItems} currentEntityType={currentEntityType} />
    )}
  </>;
}

function EntityRefConfig({ cfg, update, currentEntityType }: { cfg: Record<string, any>; update: (k: string, v: any) => void; currentEntityType?: string }) {
  const { savedEntities } = useEntityDesignerStore();
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);
  const targetEnt = allEntities.find(e => e.entityType === cfg.targetEntity);

  const fieldOpts = useMemo(
    () => (targetEnt?.fields ?? []).map(f => ({ value: f.fieldId, label: `${f.label} (${f.fieldId})` })),
    [targetEnt],
  );
  // filterConditions is managed by the standalone <ConditionBuilder> component

  const FieldSelect = ({ label, desc, configKey }: { label: string; desc?: string; configKey: string }) => (
    <Row label={label} desc={desc}>
      {fieldOpts.length > 0 ? (
        <select className="search-input" style={{ width: '100%' }}
          value={cfg[configKey] ?? ''} onChange={e => update(configKey, e.target.value)}>
          <option value="">— Select field —</option>
          {fieldOpts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      ) : (
        <input className="search-input" style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
          placeholder={cfg.targetEntity ? 'No fields found on target entity' : 'Select a target entity first'}
          value={cfg[configKey] ?? ''} readOnly />
      )}
    </Row>
  );

  return <>
    <Row label="Target Entity" desc="The entity this field references">
      <select className="search-input" style={{ width: '100%' }}
        value={cfg.targetEntity ?? ''}
        onChange={e => {
          update('targetEntity', e.target.value);
          update('keyField', '');
          update('displayField', '');
          update('searchFields', []);
          update('filterConditions', { logic: 'AND', conditions: [] });
        }}>
        <option value="">— Select entity —</option>
        {allEntities.map(e => (
          <option key={e.entityType} value={e.entityType}>{e.label} ({e.entityType})</option>
        ))}
      </select>
    </Row>
    <FieldSelect label="Key Field" desc="Field used as the reference key (usually record_id)" configKey="keyField" />
    <FieldSelect label="Display Field" desc="Field shown in the UI dropdown/selector" configKey="displayField" />
    <Row label="Search Fields (comma-separated)">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. model_name,model_code"
        value={(cfg.searchFields ?? []).join(',')}
        onChange={e => update('searchFields', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} />
    </Row>
    <ToggleRow label="Filter by is_active" configKey="activeFilter" cfg={cfg} update={update} />
    <Row label="Cardinality">
      <select className="search-input" style={{ width: '100%' }} value={cfg.cardinality ?? 'single'} onChange={e => update('cardinality', e.target.value)}>
        <option value="single">Single</option>
        <option value="multiple">Multiple (Next Scope)</option>
      </select>
    </Row>
    <Row label="On Delete">
      <select className="search-input" style={{ width: '100%' }} value={cfg.onDelete ?? 'restrict'} onChange={e => update('onDelete', e.target.value)}>
        <option value="restrict">Restrict (default)</option>
        <option value="cascade">Cascade</option>
        <option value="set_null">Set Null</option>
        <option value="archive">Archive Reference</option>
      </select>
    </Row>

    <ConditionBuilder
      conditions={cfg.filterConditions ?? { logic: 'AND', conditions: [] }}
      currentEntityType={currentEntityType ?? ''}
      targetEntityType={cfg.targetEntity}
      onChange={(group: FilterConditionGroup) => update('filterConditions', group)}
    />
  </>;
}

function FileConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Allowed Extensions (comma-separated)" desc="Leave empty to allow all">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. pdf,jpg,png,docx" value={(cfg.allowedExtensions ?? []).join(',')} onChange={e => update('allowedExtensions', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} />
    </Row>
    <Row label="Max File Size (MB)"><NumberInput value={cfg.maxFileSizeMb} onChange={v => update('maxFileSizeMb', v)} min={1} max={500} /></Row>
    <Row label="Max File Count"><NumberInput value={cfg.maxCount} onChange={v => update('maxCount', v)} min={1} max={100} /></Row>
    <ToggleRow label="Required before submit" configKey="requiredBeforeSubmit" cfg={cfg} update={update} />
    <InfoBox>Virus scanning is enforced at the platform level for all file uploads.</InfoBox>
  </>;
}

const ITEM_FIELD_TYPES = ['text', 'number', 'decimal', 'boolean', 'select', 'date', 'currency', 'percentage'] as const;
type ItemFieldType = typeof ITEM_FIELD_TYPES[number];

function CollectionConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  const [addingRow, setAddingRow] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemType, setNewItemType] = useState<ItemFieldType>('text');
  const [newItemRequired, setNewItemRequired] = useState(false);

  const itemFields: Array<{ fieldId: string; label: string; fieldType: string; required: boolean }> = cfg.itemFields ?? [];

  const addItemField = () => {
    if (!newItemLabel.trim()) return;
    const fieldId = toSlug(newItemLabel) || `field_${itemFields.length + 1}`;
    const newField = { fieldId, label: newItemLabel.trim(), fieldType: newItemType, required: newItemRequired };
    update('itemFields', [...itemFields, newField]);
    setNewItemLabel(''); setNewItemType('text'); setNewItemRequired(false); setAddingRow(false);
  };

  const removeItemField = (idx: number) => {
    update('itemFields', itemFields.filter((_, i) => i !== idx));
  };

  return <>
    <Row label="Collection Label" desc="Plural label shown above the grid (e.g. 'Line Items')">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. Line Items" value={cfg.collectionLabel ?? ''} onChange={e => update('collectionLabel', e.target.value)} />
    </Row>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
      <div><label className="form-label">Min Items</label><NumberInput value={cfg.minItems} onChange={v => update('minItems', v)} min={0} /></div>
      <div><label className="form-label">Max Items</label><NumberInput value={cfg.maxItems} onChange={v => update('maxItems', v)} min={1} /></div>
    </div>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
      <ToggleRow label="Allow Add Row" configKey="addRowEnabled" cfg={cfg} update={update} />
      <ToggleRow label="Allow Delete Row" configKey="deleteRowEnabled" cfg={cfg} update={update} />
      <ToggleRow label="Row Numbers" configKey="rowNumbering" cfg={cfg} update={update} />
    </div>

    {/* Item Fields mini-grid */}
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="form-label" style={{ margin: 0 }}>Item Fields ({itemFields.length})</label>
        {!addingRow && (
          <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}
            onClick={() => setAddingRow(true)}>
            <Plus size={11} style={{ marginRight: 3 }} />Add Item Field
          </button>
        )}
      </div>

      {itemFields.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 28px', padding: '5px 8px', background: 'var(--bg-secondary)', fontSize: '10px', fontWeight: 600, color: 'var(--muted)', gap: '6px' }}>
            <span>Label</span><span>Type</span><span>Required</span><span />
          </div>
          {itemFields.map((f, i) => (
            <div key={f.fieldId} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 28px', gap: '6px', padding: '6px 8px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ fontSize: '12px' }}>{f.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{f.fieldType}</span>
              <span style={{ fontSize: '11px', color: f.required ? 'var(--accent)' : 'var(--muted)' }}>{f.required ? '✓ Yes' : 'No'}</span>
              <button className="btn btn-ghost" style={{ padding: '2px 4px' }} onClick={() => removeItemField(i)}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {itemFields.length === 0 && !addingRow && (
        <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '12px 0', margin: 0 }}>
          No item fields defined — click "Add Item Field" to define the columns for each row
        </p>
      )}

      {addingRow && (
        <div style={{ border: '1px solid var(--accent)', borderRadius: '6px', padding: '10px', background: 'hsl(22 100% 51% / 0.04)', marginBottom: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: '6px', marginBottom: '8px' }}>
            <input className="search-input" style={{ fontSize: '12px' }} placeholder="Label (e.g. Labour Code)"
              value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItemField()} autoFocus />
            <select className="search-input" style={{ fontSize: '12px' }}
              value={newItemType} onChange={e => setNewItemType(e.target.value as ItemFieldType)}>
              {ITEM_FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={newItemRequired} onChange={e => setNewItemRequired(e.target.checked)} />
              Required
            </label>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={addItemField}>Add</button>
            <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => { setAddingRow(false); setNewItemLabel(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  </>;
}

// ── Next Scope 12 types ──────────────────────────────────────

function EmailConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Max Length"><NumberInput value={cfg.maxLength ?? 254} onChange={v => update('maxLength', v)} min={10} max={254} /></Row>
    <ToggleRow label="Lowercase Normalization on Save" configKey="lowercaseNormalization" cfg={cfg} update={update} />
    <Row label="Validation Error Message">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. Please enter a valid email address" value={cfg.validationMessage ?? ''} onChange={e => update('validationMessage', e.target.value)} />
    </Row>
  </>;
}

function PhoneConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Country Code Mode">
      <select className="search-input" style={{ width: '100%' }} value={cfg.countryCodeMode ?? 'fixed'} onChange={e => update('countryCodeMode', e.target.value)}>
        <option value="fixed">Fixed Country</option>
        <option value="user_select">User selects country</option>
        <option value="tenant_default">Tenant Default</option>
      </select>
    </Row>
    <Row label="Default Country">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. IN" value={cfg.defaultCountry ?? 'IN'} onChange={e => update('defaultCountry', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
    </Row>
    <Row label="Min Length"><NumberInput value={cfg.minLength} onChange={v => update('minLength', v)} min={5} /></Row>
    <Row label="Max Length"><NumberInput value={cfg.maxLength} onChange={v => update('maxLength', v)} max={20} /></Row>
    <ToggleRow label="Allow Extension (e.g. ext 123)" configKey="allowExtension" cfg={cfg} update={update} />
    <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)' }}>
      Normalization preview: +91 9876543210
    </div>
  </>;
}

function UrlConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Allowed Schemes">
      <div style={{ display: 'flex', gap: '8px' }}>
        {['https', 'http', 'ftp'].map(scheme => (
          <label key={scheme} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
            <input type="checkbox" checked={(cfg.allowedSchemes ?? ['https']).includes(scheme)}
              onChange={e => {
                const current: string[] = cfg.allowedSchemes ?? ['https'];
                update('allowedSchemes', e.target.checked ? [...current, scheme] : current.filter((s: string) => s !== scheme));
              }} />
            {scheme}
          </label>
        ))}
      </div>
      {!(cfg.allowedSchemes ?? ['https']).includes('https') && (
        <Warning>HTTPS is recommended for all external URLs to ensure security.</Warning>
      )}
    </Row>
    <Row label="Max Length"><NumberInput value={cfg.maxLength} onChange={v => update('maxLength', v)} min={20} max={2000} /></Row>
    <ToggleRow label="Open in new tab" configKey="openNewTab" cfg={cfg} update={update} />
  </>;
}

// address type removed — use entity_ref to Area master instead

function AutoNumberConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  const docSettings = getDocumentCodeSettings();
  const masterSettings = getMasterCodeSettings();
  const codeType: 'document' | 'master' = cfg.codeSettingType ?? 'document';
  const options = codeType === 'document' ? docSettings : masterSettings;
  const selected = options.find(s => s.id === cfg.codeSettingId) ?? null;

  return <>
    <Row label="Code Setting Type" desc="Which master governs this field's code generation">
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['document', 'master'] as const).map(t => (
          <button key={t}
            style={{
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
              border: `1px solid ${codeType === t ? 'var(--accent)' : 'var(--border)'}`,
              background: codeType === t ? 'hsl(22 100% 51% / 0.08)' : 'transparent',
              color: codeType === t ? 'var(--accent)' : 'var(--text)',
              fontWeight: codeType === t ? 600 : 400,
            }}
            onClick={() => { update('codeSettingType', t); update('codeSettingId', ''); }}>
            {t === 'document' ? 'Document Code Setting' : 'Master Code Setting'}
          </button>
        ))}
      </div>
    </Row>
    <Row label={codeType === 'document' ? 'Document Code Setting' : 'Master Code Setting'}
         desc="Format, sequence, and override rules are configured in the Code Settings master — not here">
      <select className="search-input" style={{ width: '100%' }}
        value={cfg.codeSettingId ?? ''}
        onChange={e => update('codeSettingId', e.target.value)}>
        <option value="">— Select code setting —</option>
        {options.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </Row>
    {selected && (
      <>
        <Row label="Preview">
          <code style={{ fontSize: '13px', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '4px', display: 'inline-block', fontWeight: 700 }}>
            {selected.previewExample}
          </code>
        </Row>
        <Row label="Manual Override">
          <span style={{ fontSize: '12px', color: selected.manualOverrideAllowed ? 'var(--accent)' : 'var(--muted)' }}>
            {selected.manualOverrideAllowed
              ? '✓ Allowed — user can override the generated code (configured in Code Settings)'
              : '✗ Not allowed — always system-generated'}
          </span>
        </Row>
      </>
    )}
    <InfoBox>Format, sequence scope, padding, and reset policy are configured in the Code Settings master — not here.</InfoBox>
  </>;
}

function ComputedConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <InfoBox>Computed fields are always read-only and cannot be set as required. The presence and editability settings are locked to readonly/system-only.</InfoBox>
    <Row label="Compute Mode">
      <select className="search-input" style={{ width: '100%' }} value={cfg.mode ?? 'display_only'} onChange={e => update('mode', e.target.value)}>
        <option value="display_only">Display Only (not persisted)</option>
        <option value="persisted_later">Persist (Planned — Next Scope)</option>
      </select>
    </Row>
    <Row label="Expression" desc="Field references use fieldId. e.g. ex_showroom_price * tax_rate / 100">
      <textarea className="search-input" style={{ width: '100%', minHeight: '72px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
        placeholder="expression…" value={cfg.expression ?? ''} onChange={e => update('expression', e.target.value)} />
    </Row>
    <Row label="Referenced Fields (comma-separated fieldIds)">
      <input className="search-input" style={{ width: '100%' }} placeholder="e.g. ex_showroom_price,tax_rate" value={(cfg.referencedFields ?? []).join(',')}
        onChange={e => update('referencedFields', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} />
    </Row>
    <Row label="Recalculation Trigger">
      <select className="search-input" style={{ width: '100%' }} value={cfg.recalculationTrigger ?? 'on_field_change'} onChange={e => update('recalculationTrigger', e.target.value)}>
        <option value="on_field_change">On Field Change</option>
        <option value="on_save">On Save</option>
        <option value="on_submit">On Submit</option>
      </select>
    </Row>
  </>;
}

function RollupConfig({ cfg, update, currentEntityType }: { cfg: Record<string, any>; update: (k: string, v: any) => void; currentEntityType?: string }) {
  const { savedEntities } = useEntityDesignerStore();
  const allEntities = useMemo(() => getEntityDefinitions(savedEntities), [savedEntities]);

  // Child entities: entities that have an entity_ref field pointing to currentEntityType
  const childEntities = useMemo(() => {
    if (!currentEntityType) return allEntities;
    return allEntities.filter(e =>
      e.fields.some(f => f.fieldType === 'entity_ref' && f.typeConfig?.targetEntity === currentEntityType)
    );
  }, [allEntities, currentEntityType]);

  const sourceEnt = allEntities.find(e => e.entityType === cfg.sourceEntity);
  const numericFields = useMemo(() => {
    if (!sourceEnt) return [];
    return sourceEnt.fields.filter(f =>
      ['number', 'decimal', 'currency', 'percentage'].includes(f.fieldType)
    );
  }, [sourceEnt]);

  return <>
    <InfoBox>Rollup fields aggregate values from related child records. The field is always read-only and recalculates when child records change.</InfoBox>
    <Row label="Source Entity" desc="Child entity to aggregate values from">
      <select className="search-input" style={{ width: '100%' }}
        value={cfg.sourceEntity ?? ''}
        onChange={e => { update('sourceEntity', e.target.value); update('sourceField', ''); }}>
        <option value="">— Select child entity —</option>
        {childEntities.map(e => <option key={e.entityType} value={e.entityType}>{e.label} ({e.entityType})</option>)}
      </select>
      {currentEntityType && childEntities.length === 0 && (
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>No entities found with a reference back to this entity.</p>
      )}
    </Row>
    <Row label="Aggregate Function">
      <select className="search-input" style={{ width: '100%' }}
        value={cfg.aggregateFunction ?? 'COUNT'}
        onChange={e => { update('aggregateFunction', e.target.value); update('sourceField', ''); }}>
        <option value="COUNT">COUNT — number of matching records</option>
        <option value="SUM">SUM — total of a numeric field</option>
        <option value="MIN">MIN — smallest value</option>
        <option value="MAX">MAX — largest value</option>
        <option value="AVG">AVG — average value</option>
      </select>
    </Row>
    {cfg.aggregateFunction && cfg.aggregateFunction !== 'COUNT' && (
      <Row label="Source Field" desc="Numeric field on the child entity to aggregate">
        {numericFields.length > 0 ? (
          <select className="search-input" style={{ width: '100%' }}
            value={cfg.sourceField ?? ''}
            onChange={e => update('sourceField', e.target.value)}>
            <option value="">— Select field —</option>
            {numericFields.map(f => <option key={f.fieldId} value={f.fieldId}>{f.label} ({f.fieldId})</option>)}
          </select>
        ) : (
          <input className="search-input" style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }}
            placeholder={cfg.sourceEntity ? 'No numeric fields on source entity' : 'Select a source entity first'}
            readOnly />
        )}
      </Row>
    )}
  </>;
}

function JsonConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Warning>JSON fields store unstructured data and bypass schema validation. Use only when no structured alternative exists.</Warning>
    <Row label="Max Size (KB)"><NumberInput value={cfg.maxSizeKb} onChange={v => update('maxSizeKb', v)} min={1} max={1024} /></Row>
    <Row label="JSON Schema (optional validation)" desc="Paste a JSON Schema to validate the stored value">
      <textarea className="search-input" style={{ width: '100%', minHeight: '80px', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical' }}
        placeholder='{ "type": "object", "properties": { ... } }' value={cfg.jsonSchema ?? ''} onChange={e => update('jsonSchema', e.target.value)} />
    </Row>
    <ToggleRow label="Expert-only field (hidden by default in UI builder)" configKey="expertOnly" cfg={cfg} update={update} />
  </>;
}

function RichTextConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Max Length (characters)"><NumberInput value={cfg.maxLength} onChange={v => update('maxLength', v)} min={100} /></Row>
    <Row label="Allowed Formatting" desc="Select allowed formatting options">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {['Bold', 'Italic', 'Underline', 'Bullet List', 'Numbered List', 'Headings', 'Links'].map(fmt => (
          <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={(cfg.allowedFormatting ?? ['Bold', 'Italic', 'Bullet List']).includes(fmt)}
              onChange={e => {
                const current: string[] = cfg.allowedFormatting ?? ['Bold', 'Italic', 'Bullet List'];
                update('allowedFormatting', e.target.checked ? [...current, fmt] : current.filter((f: string) => f !== fmt));
              }} />
            {fmt}
          </label>
        ))}
      </div>
    </Row>
    <InfoBox>Sanitization is always enforced — script injection and unsafe HTML are blocked at the platform level. File embeds are disabled for security.</InfoBox>
  </>;
}

function GeoPointConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <InfoBox>Geo-point fields store latitude and longitude. Displayed as a map pin in compatible UI layouts.</InfoBox>
    <Row label="Precision (decimal places in coordinates)"><NumberInput value={cfg.precision ?? 6} onChange={v => update('precision', v)} min={2} max={8} /></Row>
    <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
      🗺 Map preview placeholder — interactive map available in record UI
    </div>
  </>;
}

function SignatureConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <InfoBox>Digital signature capture is available on mobile and tablet browsers. Desktop shows a drawing canvas.</InfoBox>
    <Row label="Capture Mode">
      <select className="search-input" style={{ width: '100%' }} value={cfg.captureMode ?? 'draw'} onChange={e => update('captureMode', e.target.value)}>
        <option value="draw">Draw on canvas</option>
        <option value="upload">Upload image</option>
        <option value="both">Both options</option>
      </select>
    </Row>
    <ToggleRow label="Require Signer Name" configKey="signerNameRequired" cfg={cfg} update={update} />
    <ToggleRow label="Include Timestamp in Signature" configKey="timestampRequired" cfg={cfg} update={update} />
  </>;
}

function BarcodeConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Barcode Format">
      <select className="search-input" style={{ width: '100%' }} value={cfg.format ?? 'QR'} onChange={e => update('format', e.target.value)}>
        <option value="QR">QR Code</option>
        <option value="Code128">Code 128</option>
        <option value="EAN13">EAN-13</option>
        <option value="EAN8">EAN-8</option>
        <option value="DataMatrix">Data Matrix</option>
      </select>
    </Row>
    <ToggleRow label="Enable Camera Scan Input" configKey="scanInput" cfg={cfg} update={update} />
    <ToggleRow label="Allow Manual Text Input as Fallback" configKey="manualInputFallback" cfg={cfg} update={update} />
  </>;
}

function RatingConfig({ cfg, update }: { cfg: Record<string, any>; update: (k: string, v: any) => void }) {
  return <>
    <Row label="Min Value"><NumberInput value={cfg.min ?? 1} onChange={v => update('min', v)} min={0} max={9} /></Row>
    <Row label="Max Value"><NumberInput value={cfg.max ?? 5} onChange={v => update('max', v)} min={2} max={10} /></Row>
    <Row label="Step"><NumberInput value={cfg.step ?? 1} onChange={v => update('step', v)} min={0.5} max={1} /></Row>
    <Row label="Display Style">
      <select className="search-input" style={{ width: '100%' }} value={cfg.displayStyle ?? 'stars'} onChange={e => update('displayStyle', e.target.value)}>
        <option value="stars">Stars (★)</option>
        <option value="numbers">Numbers</option>
        <option value="emoji">Emoji</option>
        <option value="thumbs">Thumbs Up/Down (min/max 2)</option>
      </select>
    </Row>
    <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', fontSize: '20px' }}>
      {'★'.repeat(Math.round((cfg.max ?? 5) / 2))}{'☆'.repeat((cfg.max ?? 5) - Math.round((cfg.max ?? 5) / 2))}
    </div>
  </>;
}

// ─── Main Component ───────────────────────────────────────────

export default function FieldTypeConfigurator({ fieldType, typeConfig, onChange, disabled, currentEntityType }: Props) {
  const update = (k: string, v: any) => onChange({ ...typeConfig, [k]: v });

  return (
    <div style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {fieldType === 'text' && <TextConfig cfg={typeConfig} update={update} />}
      {fieldType === 'textarea' && <TextareaConfig cfg={typeConfig} update={update} />}
      {fieldType === 'number' && <NumberConfig cfg={typeConfig} update={update} />}
      {fieldType === 'decimal' && <DecimalConfig cfg={typeConfig} update={update} />}
      {fieldType === 'currency' && <CurrencyConfig cfg={typeConfig} update={update} />}
      {fieldType === 'percentage' && <PercentageConfig cfg={typeConfig} update={update} />}
      {fieldType === 'date' && <DateConfig cfg={typeConfig} update={update} />}
      {fieldType === 'datetime' && <DatetimeConfig cfg={typeConfig} update={update} />}
      {fieldType === 'time' && <TimeConfig cfg={typeConfig} update={update} />}
      {fieldType === 'boolean' && <BooleanConfig cfg={typeConfig} update={update} />}
      {fieldType === 'select' && <SelectConfig cfg={typeConfig} update={update} currentEntityType={currentEntityType} />}
      {fieldType === 'multi_select' && <SelectConfig cfg={typeConfig} update={update} multi currentEntityType={currentEntityType} />}
      {fieldType === 'entity_ref' && <EntityRefConfig cfg={typeConfig} update={update} currentEntityType={currentEntityType} />}
      {fieldType === 'file' && <FileConfig cfg={typeConfig} update={update} />}
      {fieldType === 'collection' && <CollectionConfig cfg={typeConfig} update={update} />}
      {fieldType === 'email' && <EmailConfig cfg={typeConfig} update={update} />}
      {fieldType === 'phone' && <PhoneConfig cfg={typeConfig} update={update} />}
      {fieldType === 'url' && <UrlConfig cfg={typeConfig} update={update} />}
      {/* address type removed — use entity_ref to Area master */}
      {fieldType === 'auto_number' && <AutoNumberConfig cfg={typeConfig} update={update} />}
      {fieldType === 'computed' && <ComputedConfig cfg={typeConfig} update={update} />}
      {fieldType === 'rollup' && <RollupConfig cfg={typeConfig} update={update} currentEntityType={currentEntityType} />}
      {fieldType === 'json' && <JsonConfig cfg={typeConfig} update={update} />}
      {fieldType === 'rich_text' && <RichTextConfig cfg={typeConfig} update={update} />}
      {fieldType === 'geo_point' && <GeoPointConfig cfg={typeConfig} update={update} />}
      {fieldType === 'signature' && <SignatureConfig cfg={typeConfig} update={update} />}
      {fieldType === 'barcode' && <BarcodeConfig cfg={typeConfig} update={update} />}
      {fieldType === 'rating' && <RatingConfig cfg={typeConfig} update={update} />}
    </div>
  );
}
