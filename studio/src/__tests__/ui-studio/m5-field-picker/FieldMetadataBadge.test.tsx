import { render, screen } from '@testing-library/react'
import { FieldMetadataBadge } from '../../../components/ui-studio/common/FieldMetadataBadge'
import type { MockEntityField } from '../../../types/ui-studio/index'

const textField: MockEntityField = { id: 'f1', fieldCode: 'name', label: 'Name', fieldType: 'text', isRequired: true, isReadOnly: false, isSystem: false, isComputed: false }
const sysField: MockEntityField = { id: 'f2', fieldCode: 'id', label: 'ID', fieldType: 'text', isRequired: true, isReadOnly: true, isSystem: true, isComputed: false }
const computedField: MockEntityField = { id: 'f3', fieldCode: 'total', label: 'Total', fieldType: 'currency', isRequired: false, isReadOnly: true, isSystem: false, isComputed: true }

describe('FieldMetadataBadge (M5)', () => {
  it('shows field type pill', () => { render(<FieldMetadataBadge field={textField} />); expect(screen.getByText('text')).toBeInTheDocument() })
  it('shows REQ for required non-system fields', () => { render(<FieldMetadataBadge field={textField} />); expect(screen.getByText('REQ')).toBeInTheDocument() })
  it('shows SYS for system fields', () => { render(<FieldMetadataBadge field={sysField} />); expect(screen.getByText('SYS')).toBeInTheDocument() })
  it('shows COMP for computed fields', () => { render(<FieldMetadataBadge field={computedField} />); expect(screen.getByText('COMP')).toBeInTheDocument() })
  it('compact mode hides REQ/SYS/COMP', () => { render(<FieldMetadataBadge field={textField} compact />); expect(screen.queryByText('REQ')).not.toBeInTheDocument() })
})
