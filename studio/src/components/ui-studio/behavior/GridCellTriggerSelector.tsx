import type { TransactionLineColumn } from '../../../types/ui-studio/index'

interface GridCellTriggerSelectorProps {
  triggerColumnFieldId: string
  lineColumns: TransactionLineColumn[]
  lineEntityId: string | undefined
  onChange: (fieldId: string) => void
}

export function GridCellTriggerSelector({
  triggerColumnFieldId,
  lineColumns,
  onChange,
}: GridCellTriggerSelectorProps) {
  return (
    <select
      className="form-select"
      style={{ fontSize: '12px', width: '100%' }}
      value={triggerColumnFieldId}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">— Select trigger column —</option>
      {lineColumns.map(col => (
        <option key={col.fieldId} value={col.fieldId}>
          {col.label ?? col.fieldId}
        </option>
      ))}
    </select>
  )
}
