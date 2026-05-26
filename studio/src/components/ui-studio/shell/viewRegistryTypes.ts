import type { ViewSurfaceType } from '../../../types/ui-studio/index'

export type SortField = 'label' | 'surfaceType' | 'primaryEntityId' | 'status' | 'updatedAt'
export type SortDir = 'asc' | 'desc'

export const SURFACE_LABELS: Record<ViewSurfaceType, string> = {
  list: 'List',
  record_detail: 'Record Detail',
  create_edit: 'Create / Edit',
  related_records: 'Related Records',
  transaction_workspace: 'Transaction',
  dashboard_summary: 'Dashboard',
}
