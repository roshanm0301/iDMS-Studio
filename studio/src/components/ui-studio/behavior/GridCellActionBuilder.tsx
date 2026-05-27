import type { GridCellAction, GridCellActionType, TransactionLineColumn } from '../../../types/ui-studio/index'

interface GridCellActionBuilderProps {
  action: GridCellAction
  lineColumns: TransactionLineColumn[]
  lineEntityId: string | undefined
  onChange: (a: GridCellAction) => void
}

const ACTION_TYPES: GridCellActionType[] = [
  'set_cell_value', 'recalculate_row', 'refresh_lookup', 'warn', 'confirm', 'flag_approval',
]

const TARGET_TYPES: GridCellActionType[] = ['set_cell_value', 'recalculate_row']
const FORMULA_TYPES: GridCellActionType[] = ['recalculate_row']
const THRESHOLD_TYPES: GridCellActionType[] = ['warn']
const MESSAGE_TYPES: GridCellActionType[] = ['warn', 'confirm', 'flag_approval']

export function GridCellActionBuilder({ action, lineColumns, onChange }: GridCellActionBuilderProps) {
  function patch(updates: Partial<GridCellAction>) {
    onChange({ ...action, ...updates })
  }

  const showTarget = TARGET_TYPES.includes(action.type)
  const showFormula = FORMULA_TYPES.includes(action.type)
  const showThreshold = THRESHOLD_TYPES.includes(action.type)
  const showMessage = MESSAGE_TYPES.includes(action.type)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <select
        className="form-select"
        style={{ fontSize: '12px' }}
        value={action.type}
        onChange={e => patch({ type: e.target.value as GridCellActionType })}
      >
        {ACTION_TYPES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {showTarget && (
        <select
          className="form-select"
          style={{ fontSize: '12px' }}
          value={action.targetColumnFieldId ?? ''}
          onChange={e => patch({ targetColumnFieldId: e.target.value })}
        >
          <option value="">— Target column —</option>
          {lineColumns.map(col => (
            <option key={col.fieldId} value={col.fieldId}>
              {col.label ?? col.fieldId}
            </option>
          ))}
        </select>
      )}

      {showFormula && (
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px' }}
          placeholder="Formula (e.g. qty * rate)"
          value={action.formula ?? ''}
          onChange={e => patch({ formula: e.target.value })}
        />
      )}

      {showThreshold && (
        <input
          type="number"
          className="input"
          style={{ fontSize: '12px' }}
          placeholder="Threshold"
          value={action.threshold ?? ''}
          onChange={e => patch({ threshold: e.target.value ? Number(e.target.value) : undefined })}
        />
      )}

      {showMessage && (
        <input
          type="text"
          className="input"
          style={{ fontSize: '12px' }}
          placeholder="Message…"
          value={action.message ?? ''}
          onChange={e => patch({ message: e.target.value })}
        />
      )}
    </div>
  )
}
