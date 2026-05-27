import type { ViewArtifact, PreviewContext } from '../../../types/ui-studio/index'

export interface RenderContext {
  artifact: ViewArtifact
  previewContext: PreviewContext
  mockRecords: Record<string, unknown>[]
}
