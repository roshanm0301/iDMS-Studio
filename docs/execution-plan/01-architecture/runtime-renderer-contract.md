# Runtime Renderer Contract — UI Studio

## Purpose

The runtime renderer converts a published ViewArtifact into an end-user page.
It is built in M20 but the contract is defined here from the start.

## Contract

```ts
interface RuntimeRendererProps {
  artifact: ViewArtifact
  context: PreviewContext
}

interface PreviewContext {
  role: string
  device: 'desktop' | 'tablet' | 'mobile'
  workflowState?: string
  sampleRecordId?: string
}
```

## Surface Renderers (M20)

- ListSurfaceRenderer
- RecordDetailSurfaceRenderer
- CreateEditSurfaceRenderer
- RelatedRecordsSurfaceRenderer
- TransactionWorkspaceSurfaceRenderer
- DashboardSummarySurfaceRenderer

## Rules

- Renderer does NOT depend on builder-only components or stores
- Renderer resolves all components from ComponentDefinition metadata
- Renderer applies BehaviorRules using mock evaluator
- Renderer uses mock data through repository/query layer
- Renderer shows graceful error on invalid metadata (no crash)
