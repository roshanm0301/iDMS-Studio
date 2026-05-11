# iDMS Admin Studio — Codex Implementation Strategy and Documentation Plan

## 1. Purpose

This document defines how the iDMS Metadata Architecture should be prepared for implementation through Codex.

The goal is not to give Codex high-level product notes. The goal is to provide Codex with a controlled, repo-ready, task-sliced documentation pack so it can implement metadata capabilities safely, incrementally, and testably.

## 2. Current Context

The current Entity Designer implementation already supports entity creation, field management, views, actions, schema builder workspace, compile readiness, schema diff, and a multi-layer governance model.

The next architecture layer has been documented separately as requirement documents for:

1. EntityDefinition
2. FieldDefinition
3. RelationshipDefinition
4. ValidationRuleDefinition
5. SecurityDefinition
6. RuntimeContractDefinition
7. Version, Dependency, and Package Model

These documents should now be consolidated into an implementation blueprint that Codex can consume in smaller tasks.

## 3. Core Opinion

Do not ask Codex to “build Entity Designer.” That is too broad and will produce inconsistent code.

Ask Codex to implement one bounded metadata capability at a time, with:

- exact input contracts,
- exact output contracts,
- schema definitions,
- validation rules,
- migration requirements,
- tests,
- non-goals,
- examples,
- rollback expectations.

The right implementation path is:

```text
Metadata repository
    ↓
Metadata object models
    ↓
PostgreSQL persistence
    ↓
Admin metadata APIs
    ↓
Metadata compiler
    ↓
Runtime metadata resolver
    ↓
Vertical slice using Service Job Card
    ↓
Authoring UI screens
```

The UI should come after the metadata contracts and compiler are stable.

## 4. Codex Documentation Principles

### 4.1 Documentation must be executable by a coding agent

Each document should tell Codex:

- what to build,
- where to build it,
- what not to build,
- how to test it,
- how to know it is done.

Avoid vague instructions such as:

> Build enterprise-grade metadata management.

Use precise instructions such as:

> Create a TypeScript interface and Zod schema for EntityDefinition under `src/metadata/entity-definition`. Add unit tests for required fields, invalid apiName, invalid lifecycle status, and invalid ownership layer.

### 4.2 Every task should be small enough for one pull request

Each Codex task should be scoped so that the output can be reviewed in one PR.

Good task size:

- create one model,
- create one validator,
- create one migration,
- create one API endpoint group,
- create one compiler check group,
- create one runtime resolver function.

Bad task size:

- build full metadata platform,
- build complete Entity Designer UI,
- build all schemas and all APIs together.

### 4.3 Each task must have a Definition of Done

Every task file must include:

- code location,
- files expected,
- acceptance criteria,
- negative scenarios,
- tests required,
- commands to run,
- out-of-scope items.

### 4.4 Use guardrails aggressively

Codex should be told not to make architectural decisions that are already frozen.

Examples:

- Do not merge FieldDefinition and ViewFieldDefinition.
- Do not treat UI visibility as security.
- Do not store business dropdowns as PostgreSQL ENUM.
- Do not allow active metadata to be changed destructively without versioning and migration checks.
- Do not create UI screens before backend metadata contracts are implemented.
- Do not bypass backend security checks because a field is hidden in the UI.

## 5. Recommended Repository Documentation Structure

Create the following documentation structure inside the repository.

```text
docs/
  00-product-context/
    00-idms-admin-studio-context.md
    01-current-entity-designer-baseline.md
    02-non-negotiable-architecture-rules.md

  01-metadata-architecture/
    00-metadata-architecture-master.md
    01-entity-definition.md
    02-field-definition.md
    03-relationship-definition.md
    04-validation-rule-definition.md
    05-security-definition.md
    06-runtime-contract-definition.md
    07-version-dependency-package-model.md
    08-view-and-relation-view-definition.md

  02-data-model/
    00-postgresql-storage-strategy.md
    01-metadata-repository-er-model.md
    02-metadata-table-specifications.md
    03-jsonb-usage-rules.md
    04-migration-and-versioning-rules.md

  03-api-contracts/
    00-admin-metadata-api-overview.md
    01-entity-definition-admin-api.md
    02-field-definition-admin-api.md
    03-relationship-definition-admin-api.md
    04-validation-rule-admin-api.md
    05-security-definition-admin-api.md
    06-compiler-api.md
    07-runtime-contract-api.md

  04-json-schemas/
    entity-definition.schema.json
    field-definition.schema.json
    relationship-definition.schema.json
    validation-rule-definition.schema.json
    security-definition.schema.json
    runtime-contract.schema.json
    package-definition.schema.json

  05-implementation-tasks/
    phase-00-repo-setup/
    phase-01-metadata-models/
    phase-02-postgresql-persistence/
    phase-03-admin-apis/
    phase-04-metadata-compiler/
    phase-05-runtime-resolver/
    phase-06-service-job-card-vertical-slice/
    phase-07-authoring-ui/

  06-testing/
    00-testing-strategy.md
    01-unit-test-requirements.md
    02-integration-test-requirements.md
    03-compiler-test-cases.md
    04-runtime-resolver-test-cases.md
    05-service-job-card-test-scenarios.md

  07-codex-prompts/
    00-codex-working-rules.md
    01-repo-bootstrap-prompt.md
    02-entity-definition-model-prompt.md
    03-field-definition-model-prompt.md
    04-compiler-prompt.md
    05-runtime-resolver-prompt.md
```

Also add at repository root:

```text
AGENTS.md
README.md
.github/
  pull_request_template.md
  codex-review-guidelines.md
  workflows/
    ci.yml
```

## 6. AGENTS.md Recommendation

Create an `AGENTS.md` file at the root of the repository.

This should tell Codex and other AI coding agents how to behave inside the repo.

Recommended sections:

```text
# AGENTS.md

## Project Context
- iDMS Admin Studio is a metadata-driven no-code platform for enterprise DMS application configuration.
- The current focus is metadata architecture, not final UI polish.

## Tech Stack
- Frontend: React, TypeScript, Material UI
- Backend: Node.js, Express.js, TypeScript
- Metadata persistence: PostgreSQL
- Master/config storage may use MongoDB where already decided by platform architecture
- Runtime transaction persistence should follow PostgreSQL rules defined in docs

## Non-Negotiable Architecture Rules
1. EntityDefinition does not own raw field definitions inline.
2. FieldDefinition owns data meaning and storage mapping, not view layout.
3. ViewDefinition owns presentation.
4. SecurityDefinition owns access decisions.
5. Runtime resolver must enforce security server-side.
6. PostgreSQL ENUM must not be used for business dropdowns.
7. No active metadata destructive change without dependency and migration checks.
8. Role is not a schema-owning layer.
9. Compiler validation is mandatory before activation.
10. Runtime contracts are generated from compiled metadata, not manually authored.

## Coding Rules
- Use TypeScript strict mode.
- Add schema validation for every metadata object.
- Add unit tests for all validators.
- Add integration tests for APIs.
- Do not introduce new libraries without documenting why.
- Keep tasks small and PR-sized.

## Test Commands
- npm test
- npm run lint
- npm run typecheck
- npm run test:integration

## PR Expectations
- Include tests.
- Update docs when contracts change.
- Mention migration impact.
- Mention backward compatibility impact.
```

## 7. Implementation Sequencing for Codex

### Phase 0 — Repository Readiness

Purpose: make the repository safe for AI-driven implementation.

Tasks:

1. Add `AGENTS.md`.
2. Add documentation folders.
3. Add PR template.
4. Add CI workflow.
5. Add lint, typecheck, test commands.
6. Add architecture rules document.

Definition of Done:

- Codex can read project rules from repo root.
- PR template forces migration, tests, and architecture impact to be documented.
- CI blocks broken code.

### Phase 1 — Metadata Object Models

Purpose: implement TypeScript models and validators.

Tasks:

1. EntityDefinition model and validator.
2. FieldDefinition model and validator.
3. RelationshipDefinition model and validator.
4. ValidationRuleDefinition model and validator.
5. SecurityDefinition model and validator.
6. RuntimeContractDefinition model and validator.
7. Version, Dependency, Package model and validator.

Definition of Done:

- All models have TypeScript types.
- All models have runtime validation.
- All models have sample fixtures.
- All models have positive and negative tests.

### Phase 2 — PostgreSQL Metadata Repository

Purpose: persist metadata safely.

Tasks:

1. Create metadata tables.
2. Create version tables.
3. Create dependency tables.
4. Create package tables.
5. Create audit tables.
6. Create migration scripts.
7. Add repository services.

Definition of Done:

- Metadata can be created, updated, versioned, and queried.
- Active metadata is immutable unless new draft version is created.
- All destructive changes are blocked unless migration path exists.

### Phase 3 — Admin Metadata APIs

Purpose: enable authoring through APIs.

Tasks:

1. Entity admin APIs.
2. Field admin APIs.
3. Relationship admin APIs.
4. Validation rule admin APIs.
5. Security admin APIs.
6. Package/version APIs.

Definition of Done:

- APIs validate payloads.
- APIs enforce lifecycle rules.
- APIs enforce ownership/layer rules.
- APIs return clear validation messages.
- APIs have integration tests.

### Phase 4 — Metadata Compiler

Purpose: prevent broken metadata from going live.

Tasks:

1. Compile EntityDefinition.
2. Compile FieldDefinition.
3. Compile RelationshipDefinition.
4. Compile ValidationRuleDefinition.
5. Compile SecurityDefinition.
6. Compile ViewDefinition when added.
7. Generate compile report.
8. Block activation on errors.

Definition of Done:

- Compiler returns Pass, Warning, Error, Blocking Error.
- Compiler detects invalid references.
- Compiler detects missing required metadata.
- Compiler detects destructive changes.
- Compiler creates dependency impact report.

### Phase 5 — Runtime Metadata Resolver

Purpose: return resolved metadata to UI and APIs.

Tasks:

1. Resolve active entity metadata.
2. Merge layers: Platform, Vertical, Tenant, Node.
3. Apply role/user security.
4. Apply record state.
5. Apply channel context.
6. Return runtime contract.

Definition of Done:

- Runtime contract does not expose fields/actions that user cannot access.
- Runtime contract includes only active compiled metadata.
- Backend APIs still enforce security even if UI hides a field.

### Phase 6 — Service Job Card Vertical Slice

Purpose: prove the architecture with a real DMS document.

Build metadata for:

- Service Job Card entity
- Customer relationship
- Vehicle relationship
- Service type field
- Job card number
- Status lifecycle
- Complaint lines relation view
- Parts/labour child relation placeholders
- Submit/Close actions
- Basic validation rules
- Role-based access
- Runtime contract

Definition of Done:

- Service Job Card can be described entirely through metadata.
- Compiler validates it.
- Runtime resolver returns correct form/list/action contract.
- Tests cover at least Service Advisor and Service Manager roles.

### Phase 7 — Authoring UI

Purpose: build the visual Entity Designer only after metadata engine is stable.

Tasks:

1. EntityDefinition authoring UI.
2. FieldDefinition authoring UI.
3. RelationshipDefinition authoring UI.
4. Validation rule authoring UI.
5. Security matrix UI.
6. Runtime preview UI.
7. Compile report UI.

Definition of Done:

- UI only calls admin metadata APIs.
- UI does not invent metadata behavior locally.
- UI can preview resolved runtime contract.

## 8. Suggested Codex Task Template

Use this template for every task.

```markdown
# Codex Task: <Task Name>

## Objective
Explain the exact task.

## Context
Mention relevant documents and architecture rules.

## Files to Create or Modify
- path/to/file.ts
- path/to/test.spec.ts

## Requirements
1. Requirement one.
2. Requirement two.
3. Requirement three.

## Validation Rules
- Rule one.
- Rule two.

## Negative Scenarios
- Scenario one must fail with message X.
- Scenario two must fail with message Y.

## Tests Required
- Unit tests
- Integration tests if applicable

## Out of Scope
- Do not build UI.
- Do not change unrelated modules.
- Do not introduce package/version logic unless this task asks for it.

## Definition of Done
- npm run typecheck passes.
- npm test passes.
- New tests added.
- Documentation updated if contract changed.
```

## 9. Example First Codex Task

```markdown
# Codex Task: Implement EntityDefinition Type and Validator

## Objective
Create the TypeScript model, runtime validator, fixtures, and tests for EntityDefinition.

## Context
EntityDefinition is the root metadata object. It owns entity identity, classification, ownership, storage strategy, lifecycle reference, and runtime policy references. It must not store raw field definitions inline.

## Files to Create
- src/metadata/entity-definition/entity-definition.types.ts
- src/metadata/entity-definition/entity-definition.schema.ts
- src/metadata/entity-definition/entity-definition.fixtures.ts
- src/metadata/entity-definition/entity-definition.validator.spec.ts

## Requirements
1. Define EntityDefinition TypeScript type.
2. Define runtime validator using the repository's selected validation library.
3. Validate apiName using snake_case.
4. Validate entityCategory using allowed enum values.
5. Validate owningLayer using Platform, Vertical, Tenant, Node.
6. Reject Role as owningLayer.
7. Validate metadataStatus using Draft, Active, Deprecated, Retired.
8. Ensure entityId is immutable in update operations.
9. Do not include FieldDefinition array inside EntityDefinition.

## Negative Scenarios
1. apiName contains spaces. Must fail.
2. owningLayer is Role. Must fail.
3. entityCategory is unknown. Must fail.
4. metadataStatus is unknown. Must fail.
5. fields array is included inline. Must fail.

## Out of Scope
- Do not create database tables.
- Do not create API endpoints.
- Do not create UI.

## Definition of Done
- TypeScript compiles.
- Unit tests pass.
- Positive and negative fixtures are included.
```

## 10. Pull Request Review Rules

Every Codex-generated PR should be reviewed against these questions:

1. Did it follow the architecture boundary?
2. Did it modify unrelated files?
3. Did it add tests?
4. Did it introduce hidden assumptions?
5. Did it hardcode tenant/OEM-specific logic?
6. Did it use PostgreSQL ENUM for business dropdowns?
7. Did it treat UI hiding as security?
8. Did it bypass compiler activation rules?
9. Did it document migration impact?
10. Did it break existing metadata contracts?

## 11. Immediate Next Documents to Generate

The next documentation pack should be Codex-focused and should include:

1. Metadata Architecture Master Document
2. Metadata Object Model and PostgreSQL Storage Design
3. Metadata Compiler Requirement Document
4. Runtime Resolver API Specification
5. ViewDefinition and RelationViewDefinition Requirement Document
6. Service Job Card Vertical Slice Blueprint
7. Codex Task Backlog for Phase 0 to Phase 6

## 12. Recommended Immediate Action

Start with the Metadata Architecture Master Document and Codex Task Backlog.

Do not start coding until the following are in the repo:

- AGENTS.md
- Metadata architecture master
- Non-negotiable architecture rules
- PostgreSQL storage strategy
- First 10 Codex tasks
- CI/test command expectations

This will make Codex much more useful and much less chaotic.
