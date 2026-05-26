# Validations — M11

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Product field default shows all mock products
- [ ] Vehicle Booking override shows only vehicle-type products in preview
- [ ] Branch context filter restricts products by branch in preview
- [ ] Data source configuration stored in ViewArtifact.dataSources
- [ ] Field-level lookup override stored per component
- [ ] Mock filter evaluator handles simple field=value expressions
- [ ] DataSourcePreview updates on config change

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
