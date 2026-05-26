# References — M20

## Architecture References
- docs/execution-plan/01-architecture/runtime-renderer-contract.md — contract definition

## Type References
- studio/src/types/ui-studio/index.ts — ViewArtifact, PreviewContext, all component/binding types

## Lib References
- studio/src/lib/ui-studio/mockRuleEvaluator.ts — rule evaluation for RulePipeline
- studio/src/lib/ui-studio/validationEngine.ts — validate before rendering

## Mock References
- studio/src/mocks/ui-studio/mockViewRepository.ts — fetch published artifact for preview
- studio/src/mocks/ui-studio/mockSampleRecords.ts — mock data for renderer

## Milestone Dependencies
- All prior milestones — M20 renders everything configured in M1–M19
- M18 (PreviewContext) — renderer receives context from preview context panel
- M19 (ValidationEngine) — renderer rejects unpublished/invalid artifacts gracefully
