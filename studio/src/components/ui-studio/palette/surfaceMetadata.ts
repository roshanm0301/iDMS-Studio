import type { ViewSurfaceType } from '../../../types/ui-studio/index'

export interface SurfaceMeta {
  label: string
  description: string
  contextFields: string[]
  supportsSmartCRUD: boolean
}

export const SURFACE_META: Record<ViewSurfaceType, SurfaceMeta> = {
  list: {
    label: 'List',
    description: 'A grid or table listing of records from a primary entity. Supports search, sort, filter, and row actions.',
    contextFields: ['routeKey', 'primaryEntityId'],
    supportsSmartCRUD: true,
  },
  record_detail: {
    label: 'Record Detail',
    description: 'Read-focused detail view for a single record. Shows field sections, highlights, actions, and related panels.',
    contextFields: ['routeKey', 'primaryEntityId', 'recordIdSource'],
    supportsSmartCRUD: false,
  },
  create_edit: {
    label: 'Create / Edit Form',
    description: 'Editable form for creating or editing a record. Supports field configuration, validation, and save actions.',
    contextFields: ['routeKey', 'primaryEntityId', 'recordIdSource'],
    supportsSmartCRUD: true,
  },
  related_records: {
    label: 'Related Records',
    description: 'A panel showing records from a related entity under a parent record context.',
    contextFields: ['routeKey', 'primaryEntityId', 'parentEntityId', 'parentRecordIdSource', 'relationshipName'],
    supportsSmartCRUD: false,
  },
  transaction_workspace: {
    label: 'Transaction Workspace',
    description: 'Header-line transaction view for documents like sales orders, invoices, or purchase orders. Requires header entity and line entity relationship.',
    contextFields: ['routeKey', 'primaryEntityId', 'lineEntityId', 'lineRelationshipId'],
    supportsSmartCRUD: false,
  },
  dashboard_summary: {
    label: 'Dashboard Summary',
    description: 'Summary and analytics view. May include KPIs, charts, and activity feeds. Full dashboard authoring is P2.',
    contextFields: ['routeKey', 'primaryEntityId'],
    supportsSmartCRUD: false,
  },
}

export const CONTEXT_FIELD_LABELS: Record<string, string> = {
  routeKey: 'Route Key',
  primaryEntityId: 'Primary Entity',
  recordIdSource: 'Record ID Source',
  parentEntityId: 'Parent Entity',
  parentRecordIdSource: 'Parent Record ID Source',
  relationshipName: 'Relationship Name',
  lineEntityId: 'Line Entity',
  lineRelationshipId: 'Line Relationship',
  dateRangeContext: 'Date Range Context',
}
