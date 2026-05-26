# Summary

## Architecture Impact
- Metadata objects affected:
- Compiler/runtime impact:
- Migration or dependency impact:

## Validation
- [ ] `npm.cmd run typecheck`
- [ ] `npm.cmd test`
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd run build`

## Guardrail Checklist
- [ ] No role-owned structural schema changes.
- [ ] No field definitions embedded inside EntityDefinition.
- [ ] Runtime behavior uses compiled/resolved metadata.
- [ ] Security is not implemented as UI hiding only.
- [ ] Destructive changes include dependency and migration analysis.
