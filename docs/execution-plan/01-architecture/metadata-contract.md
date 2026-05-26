# Metadata Contract — UI Studio

## ViewArtifact

The ViewArtifact is the single source of truth for a view's configuration. All builder
panels read and write to ViewArtifact. The runtime renderer renders from ViewArtifact.

Key fields:
- id, viewKey, label, description
- surfaceType (ViewSurfaceType union)
- status (draft | published | needs_attention)
- version (integer)
- primaryEntityId (links to MockEntityDefinition)
- layout (LayoutDefinition — contains LayoutContainers)
- components (ComponentDefinition[])
- dataSources (DataSourceDefinition[])
- bindings (BindingDefinition[])
- actions (ActionDefinition[])
- behaviorRules (BehaviorRuleDefinition[])
- validationState (ViewValidationSummary — set by validation engine)

Source: src/types/ui-studio/index.ts

## Rules

- UI components NEVER become the metadata model
- UI components READ and WRITE metadata, but metadata types are framework-neutral
- The runtime renderer must work from ViewArtifact alone (no builder-only state)
- All IDs in metadata are stable string identifiers
