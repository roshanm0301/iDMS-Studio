import { buildRuleMap } from './rulePipeline'
import { ListSurfaceRenderer } from './ListSurfaceRenderer'
import { CreateEditSurfaceRenderer } from './CreateEditSurfaceRenderer'
import { RecordDetailSurfaceRenderer } from './RecordDetailSurfaceRenderer'
import { TransactionWorkspaceSurfaceRenderer } from './TransactionWorkspaceSurfaceRenderer'
import { DashboardSummarySurfaceRenderer } from './DashboardSummarySurfaceRenderer'
import { RelatedRecordsSurfaceRenderer } from './RelatedRecordsSurfaceRenderer'
import type { ViewArtifact, PreviewContext } from '../../../types/ui-studio/index'

interface RuntimeRendererProps {
  artifact: ViewArtifact
  previewContext: PreviewContext
}

export function RuntimeRenderer({ artifact, previewContext }: RuntimeRendererProps) {
  const ruleMap = buildRuleMap(artifact.behaviorRules ?? [], previewContext)

  const commonProps = { artifact, previewContext, ruleMap }

  switch (artifact.surfaceType) {
    case 'list':
      return <ListSurfaceRenderer {...commonProps} />
    case 'create_edit':
      return <CreateEditSurfaceRenderer {...commonProps} />
    case 'record_detail':
      return <RecordDetailSurfaceRenderer {...commonProps} />
    case 'transaction_workspace':
      return <TransactionWorkspaceSurfaceRenderer {...commonProps} />
    case 'dashboard_summary':
      return <DashboardSummarySurfaceRenderer {...commonProps} />
    case 'related_records':
      return <RelatedRecordsSurfaceRenderer {...commonProps} />
    default:
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '16px' }}>
          Surface type "{artifact.surfaceType}" not supported in runtime renderer.
        </div>
      )
  }
}
