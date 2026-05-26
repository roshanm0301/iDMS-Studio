# Tasks — M18

1. Create PreviewContext type (role, device, workflowState, sampleRecordId)
2. Add PreviewContext to useUIStudioEditorStore
3. Create PreviewContextPanel with all selectors
4. Create RoleSelector (Admin, Sales, Finance, Viewer options)
5. Create DeviceSelector (desktop/tablet/mobile with responsive canvas width)
6. Create WorkflowStateSelector (reads states from ViewArtifact workflowConfig)
7. Create SampleRecordSelector (reads from mockSampleRecords for primary entity)
8. Create PreviewModeToggle (builder vs runtime preview)
9. Wire PreviewContext to BehaviorRule evaluator (M12) in preview canvas
10. Wire PreviewContext to WorkflowStatusStrip (M16)
11. Wire device selector to canvas width (desktop: full, tablet: 768px, mobile: 375px)
12. Add tests for context selector state management
13. Run milestone gate checks and update HANDOFF.md
