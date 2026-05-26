# AGENTS.md

## Project Context
- iDMS Admin Studio is evolving from a screen-level configuration UI into a metadata platform.
- Current work must be contract-first: metadata models, validators, compiler, resolver, and version safety before new authoring UI behavior.
- Preserve existing useful UI patterns where they align, but this implementation may replace existing metadata assumptions.

## Architecture Guardrails
1. EntityDefinition does not own raw FieldDefinition arrays inline.
2. FieldDefinition owns data meaning, logical type, storage mapping, and default UI guidance; it does not own screen layout.
3. RelationshipDefinition owns relationship semantics; RelationView/ViewDefinition own presentation.
4. ValidationRuleDefinition owns conditional and cross-field validity.
5. SecurityDefinition is authoritative for access, masking, API, view, action, and record-scope decisions.
6. Role is not a structural schema layer. Structural layers are Platform, Vertical, Tenant, and Node.
7. Runtime contracts are generated from active compiled metadata, not hand-authored screen JSON.
8. Backend validation and security must remain authoritative even when UI runtime contracts hide or disable data.
9. Published metadata versions are immutable.
10. Destructive metadata changes require dependency and migration analysis before activation.
11. PostgreSQL ENUM must not be used for configurable business dropdowns.
12. Money must not be stored in floating-point types.

## Coding Rules
- Keep TypeScript strict-compatible and avoid new libraries unless the reason is documented.
- Add runtime validation for every metadata object.
- Add positive and negative tests for validators, compiler checks, and runtime resolver behavior.
- Keep implementation slices small and separated by metadata ownership boundary.
- Do not wire UI screens directly to raw authoring metadata once a runtime contract exists.

## Commands
- From `studio/`: `npm.cmd run typecheck`
- From `studio/`: `npm.cmd test`
- From `studio/`: `npm.cmd run lint`
- From `studio/`: `npm.cmd run build`
