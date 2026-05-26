import { useState } from 'react'
import { Plus, X, GripVertical, Layers, Table2, Hash } from 'lucide-react'
import { MOCK_ENTITIES } from '../../../mocks/ui-studio/mockEntityMetadata'
import type { ViewArtifact, TransactionConfig, TransactionLineColumn } from '../../../types/ui-studio/index'

interface TransactionCanvasProps {
  artifact: ViewArtifact
  onUpdate: (patch: Partial<ViewArtifact>) => void
}

function getEntity(id?: string) {
  return MOCK_ENTITIES.find(e => e.id === id)
}

function getLineEntities(headerEntityId?: string) {
  if (!headerEntityId) return MOCK_ENTITIES
  const headerEntity = getEntity(headerEntityId)
  if (!headerEntity) return []
  const lineIds = headerEntity.relationships
    .filter(r => r.type === 'has_many')
    .map(r => r.relatedEntityId)
  return MOCK_ENTITIES.filter(e => lineIds.includes(e.id))
}

function getLineRelationships(headerEntityId?: string, lineEntityId?: string) {
  if (!headerEntityId || !lineEntityId) return []
  const headerEntity = getEntity(headerEntityId)
  return (headerEntity?.relationships ?? []).filter(r => r.relatedEntityId === lineEntityId)
}

interface FieldPickerProps {
  entityId: string
  selectedIds: string[]
  onToggle: (fieldId: string) => void
  label: string
}

function FieldPicker({ entityId, selectedIds, onToggle, label }: FieldPickerProps) {
  const entity = getEntity(entityId)
  if (!entity) return null
  const fields = entity.fields.filter(f => !f.isSystem)

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '180px', overflowY: 'auto' }}>
        {fields.map(f => (
          <label key={f.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            background: selectedIds.includes(f.id) ? 'var(--accent-soft)' : 'var(--bg-sunken)',
            fontSize: '12px',
          }}>
            <input
              type="checkbox"
              checked={selectedIds.includes(f.id)}
              onChange={() => onToggle(f.id)}
            />
            <span style={{ flex: 1, fontWeight: selectedIds.includes(f.id) ? 500 : 400 }}>{f.label}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>{f.fieldType}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function TransactionCanvas({ artifact, onUpdate }: TransactionCanvasProps) {
  const txConfig = artifact.transactionConfig
  const headerEntityId = artifact.primaryEntityId
  const headerEntity = getEntity(headerEntityId)
  const lineEntities = getLineEntities(headerEntityId)
  const lineRelationships = getLineRelationships(headerEntityId, txConfig?.lineEntityId)
  const lineEntity = getEntity(txConfig?.lineEntityId)

  function updateTxConfig(patch: Partial<TransactionConfig>) {
    const current: TransactionConfig = txConfig ?? {
      headerEntityId: headerEntityId ?? '',
      lineEntityId: '',
      lineRelationshipId: '',
      headerFieldIds: [],
      lineColumns: [],
      totalsEnabled: false,
      totalFieldIds: [],
    }
    onUpdate({ transactionConfig: { ...current, ...patch } })
  }

  function toggleHeaderField(fieldId: string) {
    const current = txConfig?.headerFieldIds ?? []
    const updated = current.includes(fieldId)
      ? current.filter(id => id !== fieldId)
      : [...current, fieldId]
    updateTxConfig({ headerFieldIds: updated })
  }

  function toggleLineColumn(fieldId: string) {
    const current = txConfig?.lineColumns ?? []
    const exists = current.find(c => c.fieldId === fieldId)
    const updated: TransactionLineColumn[] = exists
      ? current.filter(c => c.fieldId !== fieldId)
      : [...current, { fieldId, editable: true, required: false }]
    updateTxConfig({ lineColumns: updated })
  }

  function toggleTotalField(fieldId: string) {
    const current = txConfig?.totalFieldIds ?? []
    const updated = current.includes(fieldId)
      ? current.filter(id => id !== fieldId)
      : [...current, fieldId]
    updateTxConfig({ totalFieldIds: updated })
  }

  function toggleColumnEditable(fieldId: string) {
    const cols = (txConfig?.lineColumns ?? []).map(c =>
      c.fieldId === fieldId ? { ...c, editable: !c.editable } : c
    )
    updateTxConfig({ lineColumns: cols })
  }

  const numericLineFields = lineEntity?.fields.filter(f =>
    !f.isSystem && ['number', 'decimal', 'currency'].includes(f.fieldType)
  ) ?? []

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Setup warning if no header entity */}
      {!headerEntityId && (
        <div style={{ padding: '16px', background: 'var(--amber-soft)', borderRadius: 'var(--radius-md)', color: 'var(--amber)', fontSize: '13px', marginBottom: '20px' }}>
          Select a Primary (Header) Entity in the view settings to configure the transaction workspace.
        </div>
      )}

      {/* ── SECTION 1: Header ── */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', background: 'var(--bg-elev)',
          borderBottom: txConfig?.headerFieldIds?.length ? '1px solid var(--border)' : undefined,
        }}>
          <Layers size={15} style={{ color: 'var(--accent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Header Section</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {headerEntity ? headerEntity.label : 'No header entity selected'} ·{' '}
              {txConfig?.headerFieldIds?.length ?? 0} fields selected
            </div>
          </div>
        </div>

        {headerEntityId && (
          <div style={{ padding: '16px' }}>
            <FieldPicker
              entityId={headerEntityId}
              selectedIds={txConfig?.headerFieldIds ?? []}
              onToggle={toggleHeaderField}
              label="Select header fields to display"
            />

            {/* Preview of selected header fields */}
            {(txConfig?.headerFieldIds?.length ?? 0) > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {txConfig?.headerFieldIds?.map(fid => {
                  const f = headerEntity?.fields.find(f => f.id === fid)
                  return f ? (
                    <span key={fid} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 8px', borderRadius: '4px',
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      fontSize: '12px', fontWeight: 500,
                    }}>
                      {f.label}
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', lineHeight: 1 }}
                        onClick={() => toggleHeaderField(fid)}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Line Grid ── */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', background: 'var(--bg-elev)',
          borderBottom: '1px solid var(--border)',
        }}>
          <Table2 size={15} style={{ color: 'var(--accent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Line Grid</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {lineEntity ? lineEntity.label : 'No line entity selected'} ·{' '}
              {txConfig?.lineColumns?.length ?? 0} columns
            </div>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          {/* Line entity selector */}
          {headerEntityId && (
            <div className="form-field" style={{ marginBottom: '12px' }}>
              <label className="form-label">Line Entity</label>
              {lineEntities.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: 'var(--amber)', padding: '6px 0' }}>
                  No has_many relationships found on {headerEntity?.label}. Configure relationships in Entity Designer first.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={txConfig?.lineEntityId ?? ''}
                  onChange={e => updateTxConfig({ lineEntityId: e.target.value, lineRelationshipId: '', lineColumns: [], totalFieldIds: [] })}
                >
                  <option value="">— Select line entity —</option>
                  {lineEntities.map(e => (
                    <option key={e.id} value={e.id}>{e.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Relationship selector */}
          {txConfig?.lineEntityId && lineRelationships.length > 0 && (
            <div className="form-field" style={{ marginBottom: '12px' }}>
              <label className="form-label">Relationship</label>
              <select
                className="form-select"
                value={txConfig?.lineRelationshipId ?? ''}
                onChange={e => updateTxConfig({ lineRelationshipId: e.target.value })}
              >
                <option value="">— Select relationship —</option>
                {lineRelationships.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Line field picker */}
          {txConfig?.lineEntityId && (
            <FieldPicker
              entityId={txConfig.lineEntityId}
              selectedIds={(txConfig?.lineColumns ?? []).map(c => c.fieldId)}
              onToggle={toggleLineColumn}
              label="Select line grid columns"
            />
          )}

          {/* Line columns config table */}
          {(txConfig?.lineColumns?.length ?? 0) > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Column Configuration</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Editable</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {txConfig?.lineColumns?.map(col => {
                      const f = lineEntity?.fields.find(f => f.id === col.fieldId)
                      return (
                        <tr key={col.fieldId} onClick={undefined}>
                          <td style={{ width: '24px', cursor: 'grab', color: 'var(--text-subtle)' }}>
                            <GripVertical size={13} />
                          </td>
                          <td style={{ fontWeight: 500 }}>{f?.label ?? col.fieldId}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {f?.fieldType}
                            </span>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={col.editable}
                              onChange={() => toggleColumnEditable(col.fieldId)}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: 'var(--red)' }}
                              onClick={() => toggleLineColumn(col.fieldId)}
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: Totals (optional) ── */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', background: 'var(--bg-elev)',
          borderBottom: txConfig?.totalsEnabled ? '1px solid var(--border)' : undefined,
        }}>
          <Hash size={15} style={{ color: 'var(--text-muted)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Totals / Summary Section</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Optional — numeric field totals from line entity</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={txConfig?.totalsEnabled ?? false}
              onChange={e => updateTxConfig({ totalsEnabled: e.target.checked })}
            />
            Enable
          </label>
        </div>

        {txConfig?.totalsEnabled && txConfig.lineEntityId && (
          <div style={{ padding: '16px' }}>
            {numericLineFields.length === 0 ? (
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                No numeric fields found in {lineEntity?.label} for totals.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Select numeric fields to total
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {numericLineFields.map(f => (
                    <label key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '999px', cursor: 'pointer',
                      background: (txConfig.totalFieldIds ?? []).includes(f.id) ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                      color: (txConfig.totalFieldIds ?? []).includes(f.id) ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: 500,
                    }}>
                      <input
                        type="checkbox"
                        checked={(txConfig.totalFieldIds ?? []).includes(f.id)}
                        onChange={() => toggleTotalField(f.id)}
                        style={{ display: 'none' }}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>

                {/* Totals preview */}
                {(txConfig.totalFieldIds?.length ?? 0) > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {txConfig.totalFieldIds?.map(fid => {
                      const f = lineEntity?.fields.find(f => f.id === fid)
                      return (
                        <div key={fid} style={{
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-sunken)', border: '1px solid var(--border)',
                          fontSize: '12px',
                        }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Total {f?.label}</div>
                          <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>0.00</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
