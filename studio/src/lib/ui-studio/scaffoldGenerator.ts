import type {
  MockEntityDefinition,
  LayoutDefinition,
  ComponentDefinition,
  ActionDefinition,
  FieldTypeCode,
  ViewSurfaceType,
} from '../../types/ui-studio/index'

const FORM_WIDGET: Record<FieldTypeCode, string> = {
  text: 'text_input',
  number: 'number_input',
  decimal: 'decimal_input',
  currency: 'currency_input',
  boolean: 'checkbox',
  date: 'date_picker',
  datetime: 'datetime_picker',
  select: 'select_input',
  multi_select: 'multi_select_input',
  entity_ref: 'lookup_widget',
  computed: 'display_text',
  status: 'status_badge',
}

const LIST_COLUMN: Record<FieldTypeCode, string> = {
  text: 'text_column',
  number: 'number_column',
  decimal: 'number_column',
  currency: 'currency_column',
  boolean: 'boolean_column',
  date: 'date_column',
  datetime: 'date_column',
  select: 'tag_column',
  multi_select: 'tags_column',
  entity_ref: 'reference_column',
  computed: 'computed_column',
  status: 'status_column',
}

export interface ScaffoldResult {
  layout: LayoutDefinition
  components: ComponentDefinition[]
  actions: ActionDefinition[]
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function generateListScaffold(entity: MockEntityDefinition): ScaffoldResult {
  const fields = entity.fields
    .filter(f => !f.isSystem && !f.isComputed)
    .slice(0, 8)

  const containerId = uid('sec')
  const components: ComponentDefinition[] = fields.map(f => ({
    id: uid('col'),
    componentType: LIST_COLUMN[f.fieldType] ?? 'text_column',
    fieldId: f.id,
    label: f.label,
    config: { sortable: true, width: 140 },
  }))

  const layout: LayoutDefinition = {
    containers: [{
      id: containerId,
      type: 'section',
      label: 'Columns',
      fieldIds: fields.map(f => f.id),
      children: [],
    }],
  }

  const actions: ActionDefinition[] = [{
    id: uid('act'),
    label: `New ${entity.label}`,
    placement: 'toolbar',
    actionType: 'navigate',
    config: { target: 'create_edit' },
  }]

  return { layout, components, actions }
}

export function generateFormScaffold(entity: MockEntityDefinition): ScaffoldResult {
  const requiredFields = entity.fields.filter(f => !f.isSystem && !f.isComputed && f.isRequired)
  const optionalFields = entity.fields.filter(f => !f.isSystem && !f.isComputed && !f.isRequired)

  const reqContainerId = uid('sec')
  const optContainerId = uid('sec')

  const components: ComponentDefinition[] = [
    ...requiredFields.map(f => ({
      id: uid('fld'),
      componentType: FORM_WIDGET[f.fieldType] ?? 'text_input',
      fieldId: f.id,
      label: f.label,
      config: { required: true, readOnly: f.isReadOnly },
    })),
    ...optionalFields.map(f => ({
      id: uid('fld'),
      componentType: FORM_WIDGET[f.fieldType] ?? 'text_input',
      fieldId: f.id,
      label: f.label,
      config: { required: false, readOnly: f.isReadOnly },
    })),
  ]

  const layout: LayoutDefinition = {
    containers: [
      {
        id: reqContainerId,
        type: 'section',
        label: 'Required Information',
        fieldIds: requiredFields.map(f => f.id),
        children: [],
      },
      ...(optionalFields.length > 0 ? [{
        id: optContainerId,
        type: 'section' as const,
        label: 'Additional Details',
        fieldIds: optionalFields.map(f => f.id),
        children: [],
      }] : []),
    ],
  }

  const actions: ActionDefinition[] = [
    { id: uid('act'), label: 'Save', placement: 'form_footer', actionType: 'save_draft', config: { primary: true } },
    { id: uid('act'), label: 'Cancel', placement: 'form_footer', actionType: 'navigate', config: { target: 'list' } },
  ]

  return { layout, components, actions }
}

export function generateScaffold(entity: MockEntityDefinition, surfaceType: ViewSurfaceType): ScaffoldResult | null {
  if (surfaceType === 'list') return generateListScaffold(entity)
  if (surfaceType === 'create_edit') return generateFormScaffold(entity)
  return null
}
