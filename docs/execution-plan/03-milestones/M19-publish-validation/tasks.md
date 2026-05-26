# Tasks — M19

1. Create ValidationEngine in lib/ui-studio/validationEngine.ts (pure function)
2. Implement all 11 required validation checks
3. Create ViewValidationSummary type (errors[], warnings[], suggestions[])
4. Create ValidationResultItem type (id, category, severity, message, navigateTo)
5. Create ValidationPanel component (collapsible, groups by severity)
6. Create ValidationResultItem component (icon, message, click handler)
7. Wire click-to-navigate (navigateTo references panel/section in editor)
8. Create PublishGuard (checks for blocking errors before allowing publish)
9. Integrate ValidationPanel into UIStudioEditorPage
10. Integrate PublishGuard into PublishAction (M17)
11. Add tests for all 11 ValidationEngine checks
12. Run milestone gate checks and update HANDOFF.md
