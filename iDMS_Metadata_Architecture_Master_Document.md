# iDMS Admin Studio — Metadata Architecture Master Document

**Document Type:** Master Architecture + Implementation Alignment Guide  
**Product Area:** iDMS Admin Studio / Entity Designer / Metadata Platform  
**Audience:** Product Owner, Solution Architect, Technical Architect, AI Developer, Backend Developer, Frontend Developer, QA, DevOps  
**Status:** Authoritative Architecture Baseline for Ongoing Implementation  
**Version:** 1.0  
**Date:** 2026-05-11  
**Primary Database:** PostgreSQL  
**Related Requirement Documents:**

1. `iDMS_EntityDefinition_Requirement_Document.md`
2. `iDMS_FieldDefinition_Requirement_Document.md`
3. `iDMS_RelationshipDefinition_Requirement_Document.md`
4. `iDMS_ValidationRuleDefinition_Requirement_Document.md`
5. `iDMS_SecurityDefinition_Requirement_Document.md`
6. `iDMS_RuntimeContractDefinition_Requirement_Document.md`
7. `iDMS_Version_Dependency_Package_Model_Requirement_Document.md`

---

# 1. Purpose

This document is the **single master architecture reference** for the iDMS metadata platform.

It consolidates the separate metadata requirement documents into one coherent architecture so that the development team does not implement EntityDefinition, FieldDefinition, RelationshipDefinition, ValidationRuleDefinition, SecurityDefinition, RuntimeContractDefinition, VersionDefinition, DependencyDefinition, and PackageDefinition as isolated features.

The document is written for an **already-established project where implementation is in progress**. It is therefore not a greenfield architecture proposal. It is a target-state architecture and alignment guide that must be used to:

1. Preserve the good parts of the current implementation.
2. Identify where the current implementation is only screen-level and must evolve into platform-level metadata.
3. Prevent feature additions from creating conflicts between schema, UI, validation, security, runtime behavior, and deployment governance.
4. Give Codex and human developers one authoritative set of boundaries, resolution rules, and implementation guardrails.

---

# 2. Executive Summary

The current Entity Designer already provides a strong first foundation:

- Entity creation through template, blank, and extend patterns.
- Rich field management with multiple field types, field behavior, classification, governance, lifecycle, overlays, presets, and dependency awareness.
- Views for list, form, quick, and print use cases.
- Standard and custom actions.
- Schema builder workspace with compile readiness, diff, and layered editing.
- A multi-layer governance model.

However, the current implementation must now evolve from a **configuration UI** into a **metadata platform**.

The target architecture is:

```text
Authoring Metadata
      ↓
Governance + Validation
      ↓
Metadata Compiler
      ↓
Compiled Metadata Versions
      ↓
Runtime Metadata Resolver
      ↓
Execution Engines
```

The platform shall treat metadata as first-class product infrastructure, not as helper JSON for screens.

The central design rule is:

> **EntityDefinition defines the business object. FieldDefinition defines data meaning and storage mapping. RelationshipDefinition defines object structure. ValidationRuleDefinition decides record validity. SecurityDefinition decides access. ViewDefinition decides presentation. RuntimeContractDefinition delivers resolved metadata. Version + Dependency + Package models make deployment safe.**

---

# 3. How to Use This Document

This document shall be used in the following order:

1. Read Sections 4 to 8 to understand the target architecture and boundaries.
2. Use Section 9 as the authoritative metadata object map.
3. Use Sections 10 to 15 to implement compiler, runtime resolver, layering, versioning, dependency, package, and PostgreSQL strategy correctly.
4. Use Section 16 to map the current implementation to target architecture without breaking existing work.
5. Use Section 17 as the recommended implementation sequence.
6. Use Section 18 as the non-negotiable architecture guardrails for Codex and developers.
7. Use the child requirement documents for field-level specifications and API-level details.

If this document conflicts with a child document, the latest approved child document for that metadata object shall be updated and the master document shall be revised in the same change set. No undocumented divergence is allowed.

---

# 4. Current Implementation Baseline

The current implementation shall be considered the baseline, not discarded work.

## 4.1 Already valuable and worth preserving

| Current Capability | Why It Is Valuable |
|---|---|
| Entity creation wizard | Reduces configuration errors and provides a guided authoring experience. |
| Template, blank, and extend patterns | Supports reuse, expert creation, and controlled inheritance. |
| Entity categories | Correctly drive business behavior such as delete policy, standard actions, and lookup eligibility. |
| Rich field builder | Provides a strong starting set of field capabilities. |
| Attribute presets | Encodes compliance and domain knowledge such as GSTIN, PAN, VIN, HSN, SAC. |
| Layer-aware editing | Important for Platform → Vertical → Tenant → Node governance. |
| Views and actions | Necessary authoring surfaces for experience and behavior. |
| Compile readiness | Correct principle: broken metadata must not become active. |
| Diff | Correct principle: metadata changes need visible comparison. |
| Dependency awareness | Correct principle: metadata changes must understand impact. |

## 4.2 Current limitations to correct

| Limitation | Required Direction |
|---|---|
| Entity Designer is still heavily screen-builder oriented | Evolve into metadata-authoring platform. |
| `Entity Type` is used for technical name | Rename to `API Name`; keep `Entity Category` for business behavior. |
| Role is treated as a full layer | Role must resolve security and experience, not own schema. |
| `Entity Reference` exists but relationship architecture is not yet complete | Add RelationshipDefinition for lookup, parent-child, junction, and polymorphic relationships. |
| Conditional requiredness is not fully wired | Use ValidationRuleDefinition for conditional business validity. |
| Visibility and masking are present but not full security | Add SecurityDefinition with backend-enforced object, field, action, view, API, and record-scope permissions. |
| Schema JSON preview exists but not full runtime contract | Add RuntimeContractDefinition and runtime resolver. |
| Package creation is only planned | Package ownership must be part of metadata architecture now, even if install UI comes later. |
| Version comparison is incomplete | Add formal VersionDefinition and DependencyDefinition with deployment safety. |

---

# 5. Product North Star

Entity Designer shall become the **metadata authority for iDMS applications**.

It shall define and govern:

1. What the business object is.
2. What data the object owns.
3. How the object relates to other objects.
4. What data is structurally valid.
5. What business validations apply.
6. What lifecycle a record follows.
7. What users can see and do.
8. How the entity appears in UI and external channels.
9. How the entity exposes API, import, export, and event contracts.
10. How metadata is versioned, packaged, deployed, rolled back, and audited.

The product shall not become merely a form builder, page builder, or CRUD schema designer.

---

# 6. Architecture Principles

## 6.1 Metadata objects shall have strict ownership boundaries

Each metadata object must own one concern and reference other concerns instead of absorbing them.

## 6.2 Authoring metadata and runtime metadata shall be separate

Authoring metadata is what admins configure. Runtime metadata is what applications consume after compilation and resolution.

## 6.3 PostgreSQL storage type shall not be the product-facing field type

The product shall separate:

1. Business type.
2. Logical data type.
3. PostgreSQL physical data type.
4. UI control type.

## 6.4 UI hiding shall never be treated as security

Frontend visibility is presentation. Security shall be resolved and enforced server-side.

## 6.5 Metadata lifecycle and record lifecycle shall remain separate

Metadata lifecycle: Draft, Active, Deprecated, Retired.  
Record lifecycle: Open, Submitted, Approved, Posted, Closed, Cancelled, and similar business states.

## 6.6 Role shall not own schema

Role may affect permissions, view availability, action availability, masking, and editability. Role shall not create or structurally modify entities, fields, relationships, or PostgreSQL storage.

## 6.7 No metadata shall become active without compiler validation

Activation and deployment must be gated by metadata compile readiness.

## 6.8 No destructive change shall be accepted without dependency and migration analysis

Disabling, deprecating, changing data type, changing cardinality, changing API contract, or removing package contents shall trigger dependency and impact checks.

## 6.9 Packageability shall be designed from day one

Even if package installation UI comes later, ownership, namespace, version, and dependency metadata must exist now.

## 6.10 Runtime APIs shall consume resolved contracts, not raw authoring metadata

Frontend, API gateway, import/export, and execution engines shall consume compiled and resolved contracts.

---

# 7. Target Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│ 1. AUTHORING LAYER                                                  │
│ EntityDefinition · FieldDefinition · RelationshipDefinition         │
│ ValidationRuleDefinition · SecurityDefinition · ViewDefinition      │
│ ActionDefinition · IntegrationContractDefinition · PackageDefinition│
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│ 2. GOVERNANCE + VALIDATION LAYER                                    │
│ Layer ownership · Override policy · Lifecycle · Dependency checks   │
│ Security consistency · Package dependency checks · Migration checks │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│ 3. METADATA COMPILER                                                │
│ Validate · Merge · Detect conflicts · Produce compiled versions     │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│ 4. COMPILED METADATA STORE                                          │
│ Immutable active versions · Resolved layer deltas · Publish history │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│ 5. RUNTIME METADATA RESOLVER                                        │
│ Tenant · Node · Role · User · Locale · Channel · Record state        │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│ 6. EXECUTION ENGINES                                                │
│ UI Renderer · API Engine · Validation Engine · Security Engine      │
│ Workflow Engine · Import/Export Engine · Audit Engine · Event Engine│
└────────────────────────────────────────────────────────────────────┘
```

---

# 8. Metadata Families

| Metadata Family | Primary Responsibility |
|---|---|
| EntityDefinition | Defines the business object root. |
| FieldDefinition | Defines data meaning, logical type, storage mapping, and field governance. |
| RelationshipDefinition | Defines entity-to-entity structure and lifecycle behavior. |
| ConstraintDefinition | Defines structural integrity such as uniqueness and immutable constraints. |
| ValidationRuleDefinition | Defines when a record is valid or invalid for an operation. |
| LifecycleModelDefinition | Defines business record states and transitions. |
| ViewDefinition | Defines screen-level presentation for an entity. |
| RelationViewDefinition | Defines how related records are presented within another entity experience. |
| ActionDefinition | Defines user or system actions available on an entity. |
| SecurityDefinition | Defines object, field, action, view, API, and record-scope permissions. |
| IntegrationContractDefinition | Defines API, import, export, event, and external ID behavior. |
| AnalyticsContractDefinition | Defines reporting and analytics participation. |
| RuntimeContractDefinition | Defines the resolved contract consumed by runtime systems. |
| VersionDefinition | Defines metadata version identity and lifecycle. |
| DependencyDefinition | Defines metadata relationships and impact analysis. |
| PackageDefinition | Defines deployable, upgradeable metadata bundles. |

---

# 9. Canonical Metadata Object Map

```text
PackageDefinition
 ├── VersionDefinition
 └── EntityDefinition
      ├── FieldDefinition
      ├── RelationshipDefinition
      ├── ConstraintDefinition
      ├── ValidationRuleDefinition
      ├── LifecycleModelDefinition
      ├── ViewDefinition
      │    └── ViewFieldDefinition
      ├── RelationViewDefinition
      ├── ActionDefinition
      ├── SecurityDefinition
      │    ├── EntityPermissionDefinition
      │    ├── FieldPermissionDefinition
      │    ├── ActionPermissionDefinition
      │    ├── ViewPermissionDefinition
      │    └── ApiPermissionDefinition
      ├── IntegrationContractDefinition
      ├── AnalyticsContractDefinition
      ├── DependencyDefinition
      └── RuntimeContractDefinition [generated/compiled]
```

## 9.1 Boundary matrix

| Concern | Owner | Must Not Be Owned By |
|---|---|---|
| Business object identity | EntityDefinition | ViewDefinition, FieldDefinition |
| Business field meaning | FieldDefinition | ViewDefinition |
| PostgreSQL physical type | FieldDefinition.storage | ViewDefinition, SecurityDefinition |
| UI placement | ViewDefinition | FieldDefinition |
| Related child grid presentation | RelationViewDefinition | RelationshipDefinition |
| Relationship cardinality and delete behavior | RelationshipDefinition | ViewDefinition |
| Cross-field validity | ValidationRuleDefinition | FieldDefinition |
| Conditional UI show/hide/lock/default | UIReactionRuleDefinition | ValidationRuleDefinition |
| User access decision | SecurityDefinition | ViewDefinition |
| Runtime merged contract | RuntimeContractDefinition | Raw authoring metadata |
| Deployment version | VersionDefinition | EntityDefinition alone |
| Impact analysis | DependencyDefinition | Manual notes |
| Deployable bundle | PackageDefinition | Template |

---

# 10. Layering and Ownership Model

## 10.1 Supported structural layers

| Layer | Can Own Schema | Typical Scope |
|---|---:|---|
| Platform | Yes | Core iDMS entities, common fields, protected contracts. |
| Vertical | Yes | Automobile-specific or other industry-specific extensions. |
| Tenant | Yes, within policy | Dealer/OEM-specific additions and configuration. |
| Node | Limited, policy-controlled | Branch-level constraints or limited extensions. |
| Role | No | Permissions, masking, action availability, view access. |

## 10.2 Overlay operations

| Operation | Meaning | Typical Use |
|---|---|---|
| Extend | Add new metadata without changing parent. | Tenant adds local field. |
| Constrain | Tighten behavior without relaxing parent. | Node lowers allowed discount cap. |
| Decorate | Cosmetic rename or presentation adaptation. | Tenant renames label. |
| Replace | Replace allowed metadata component only where policy allows. | Vertical changes allowed code list. |
| Disable | Remove from current layer experience where allowed. | Hide obsolete optional field. |

## 10.3 Required rule

Lower layers may only apply operations explicitly permitted by the upstream governance policy. Runtime resolution must preserve protected artifacts and calculate the final resolved contract deterministically.

---

# 11. Lifecycle Model

## 11.1 Metadata lifecycle

| State | Meaning |
|---|---|
| Draft | Editable metadata not available in runtime. |
| Active | Published metadata available in runtime. |
| Deprecated | Still exists, but replacement or retirement is expected. |
| Retired | Not available for new authoring/runtime use; preserved for history. |
| Removed | Physically deleted only through governed migration, never by casual UI action. |

## 11.2 Record lifecycle

Record lifecycle belongs to business objects, not to metadata publication state.

Examples:

| Entity | Record Lifecycle Example |
|---|---|
| Service Job Card | Open → In Progress → Completed → Closed |
| Sales Invoice | Draft → Submitted → Approved → Posted |
| Customer Master | Draft → Active → Inactive |

## 11.3 Required rule

The compiler, runtime resolver, view renderer, action engine, and validation engine shall always distinguish metadata lifecycle from record lifecycle.

---

# 12. Authoring → Compile → Runtime Flow

## 12.1 Authoring flow

1. Admin creates or modifies draft metadata.
2. Draft metadata is stored with owner, version, layer, and package context.
3. Draft metadata may reference other draft or active metadata according to compiler rules.
4. Authoring UI shows raw configured metadata and draft issues.

## 12.2 Compile flow

1. Validate individual metadata object shape.
2. Validate cross-object references.
3. Resolve layer deltas.
4. Evaluate governance rules.
5. Evaluate security consistency.
6. Evaluate package dependencies.
7. Evaluate migration and destructive-change impact.
8. Generate compiled metadata version.
9. Produce readiness result: pass, warning, error, blocking error.
10. Publish only if no blocking error exists.

## 12.3 Runtime flow

1. Request contains entity, tenant, node, role, user, locale, channel, view, operation, and optional record state.
2. Runtime resolver loads active compiled metadata version.
3. Resolver merges layer-specific deltas.
4. Resolver applies security.
5. Resolver applies record lifecycle state.
6. Resolver applies locale and channel adaptations.
7. Resolver returns runtime contract.
8. UI/API engines consume the runtime contract.

---

# 13. Metadata Compiler Architecture

The metadata compiler is not optional. It is the safety gate of the platform.

## 13.1 Compiler responsibilities

| Check Area | Examples |
|---|---|
| Entity validity | API name uniqueness, category compatibility, required defaults. |
| Field validity | Type configuration, storage mapping, active status. |
| Relationship validity | Target entity exists, cardinality valid, delete behavior valid. |
| Validation validity | Referenced fields exist and are active; trigger point valid. |
| Security validity | At least one administrative permission path exists; no impossible policy. |
| View validity | Fields and actions referenced in view are valid and active. |
| Action validity | Handler exists; required inputs defined; permissions available. |
| Runtime validity | Contract can be resolved for expected contexts. |
| Version validity | Version transition legal. |
| Dependency validity | Breaking changes identified and dispositioned. |
| Package validity | Required dependencies present; no unresolved namespace conflicts. |
| Migration validity | Destructive changes carry migration strategy. |

## 13.2 Compiler output

```json
{
  "compileStatus": "error",
  "summary": {
    "errors": 3,
    "warnings": 2,
    "breakingChanges": 1,
    "migrationRequired": true
  },
  "issues": [
    {
      "severity": "blocking_error",
      "code": "REL_TARGET_INACTIVE",
      "message": "Relationship 'job_card_customer' references inactive target entity 'customer'."
    }
  ],
  "publishable": false
}
```

## 13.3 Compiler guardrail

The compiler must not silently “fix” invalid metadata. It shall report, classify, and block or warn. Automated correction may be provided only as an explicit guided action in future scope.

---

# 14. Runtime Metadata Resolver Architecture

## 14.1 Runtime resolution inputs

| Input | Example |
|---|---|
| Entity | `service_job_card` |
| Tenant | `tenant_bajaj_dealer_group` |
| Node | `node_pune_workshop` |
| Role | `service_advisor` |
| User | `usr_123` |
| Locale | `en-IN` |
| Channel | `web` |
| View | `job_card_form` |
| Operation | `read`, `create`, `update`, `submit` |
| Record state | `in_progress` |

## 14.2 Runtime resolution order

1. Load active compiled base metadata.
2. Apply package state and active version.
3. Resolve structural layers: Platform → Vertical → Tenant → Node.
4. Apply security for role/user/context.
5. Apply record lifecycle state.
6. Apply view-level presentation.
7. Apply locale and channel formatting.
8. Return runtime contract.

## 14.3 Runtime contract outputs

| Contract Area | Contents |
|---|---|
| Entity | Identity, category, active version, display defaults. |
| Fields | Resolved fields, allowed operations, masking, default controls, validation hints. |
| Relationships | Resolved lookup/child/junction/polymorphic relationships. |
| Views | Resolved available views and view field configuration. |
| Actions | Visible, enabled, allowed actions with execution metadata. |
| Validation | Applicable validation rules for operation and state. |
| Security | Object, field, action, view, and API permissions. |
| Explain | Optional reasoning trail for support/debugging. |

## 14.4 Required rule

Runtime contract may help frontend render correctly, but it does not replace server-side validation and security enforcement. Backend engines shall independently enforce security, validation, and action permission.

---

# 15. PostgreSQL Architecture Principles

## 15.1 Storage model

The recommended implementation is hybrid:

| Metadata Need | Recommended Storage |
|---|---|
| Core identity, ownership, lifecycle, version | Relational columns |
| Flexible type-specific configuration | `jsonb` |
| Dependency links | Relational edges/table |
| Compiled runtime payload | Versioned `jsonb` snapshot plus indexed relational keys |
| Core transactional fields | Physical typed columns |
| Tenant extension fields | Structured extension strategy, not unbounded JSON dumping |

## 15.2 Field type separation

```text
Business Type → Logical Data Type → PostgreSQL Physical Type → UI Control Type
```

Examples:

| Business Meaning | Logical Type | PostgreSQL Type | UI Control |
|---|---|---|---|
| GSTIN | `text_identifier` | `varchar(15)` | Uppercase text input |
| Customer | `entity_reference` | `uuid` | Autocomplete lookup |
| Invoice Amount | `currency` | `numeric(18,2)` | Currency input |
| Status | `enum` | code / FK | Dropdown or status chip |

## 15.3 Non-negotiable storage rules

1. Use `numeric`, not floating-point, for money.
2. Use `uuid` for internal identity where appropriate.
3. Use `timestamptz` for system timestamps.
4. Use `date` for business dates where time is not required.
5. Do not use PostgreSQL `ENUM` for configurable business picklists.
6. Use `jsonb` for flexible extension configuration only where appropriate; do not make it a dumping ground for core governed fields.
7. Multi-select business values shall not be stored as comma-separated text.
8. Document number shall not be the primary key.

---

# 16. Version, Dependency, and Package Safety Model

## 16.1 Versioning

Every major metadata object shall be versioned. Active runtime metadata shall always be tied to an immutable published version.

## 16.2 Dependency tracking

Dependency graph shall answer:

- What uses this metadata object?
- What breaks if it changes?
- What must be migrated?
- Which package owns it?
- Which tenant/node overrides it?
- Can the change be deployed?
- Can the change be rolled back?

## 16.3 Package model

PackageDefinition shall represent a deployable metadata bundle, not a mere creation template.

Package contents may include:

- Entities
- Fields
- Relationships
- Views
- Actions
- Validation rules
- Security definitions
- Lifecycle definitions
- Integration contracts
- Seed data
- Translations
- Upgrade scripts
- Dependency declarations

## 16.4 Deployment safety states

| State | Meaning |
|---|---|
| Safe | No breaking impact detected. |
| Warning | Review recommended, but deployable. |
| Breaking | Change breaks active dependency; resolution required. |
| Migration Required | Data or contract migration required before activation. |
| Blocked | Cannot activate/deploy. |

---

# 17. Existing Implementation Alignment Guide

Because implementation is already in progress, the team shall not rebuild blindly. The correct next activity after adopting this master architecture is to map existing code against target architecture.

## 17.1 Preserve as-is where conceptually correct

| Existing Area | Preserve Direction |
|---|---|
| Creation wizard | Keep, refactor terminology where required. |
| Current categories | Keep, extend only if needed. |
| Field presets | Keep, evolve into formal reusable metadata definitions. |
| Field behavior model | Keep simple behavior; move complex conditions to ValidationRule/UIReaction metadata. |
| View builder | Keep, later split out ViewDefinition and RelationViewDefinition explicitly. |
| Action builder | Keep, later formalize enablement, permission, and execution contracts. |
| Compile readiness | Keep, expand from schema-only to full metadata compiler. |
| Diff | Keep, connect to formal VersionDefinition. |
| Dependency tracking | Keep, evolve into full DependencyDefinition graph. |

## 17.2 Refactor where architecture would otherwise drift

| Existing Area | Refactor Need |
|---|---|
| `Entity Type` terminology | Rename to `API Name`. |
| Role as layer | Remove from structural schema resolution; retain for security and experience. |
| Conditional field presence | Move to ValidationRuleDefinition. |
| Field copy rules inside reference field config | Keep link, but relationship ownership and copy semantics must be governed by RelationshipDefinition. |
| View-level readonly | Ensure it does not bypass SecurityDefinition. |
| Action visibility condition | Split visible, enabled, and allowed; backend permission remains authoritative. |
| Schema JSON preview | Treat as preview only; runtime contract must be compiled and resolved output. |

## 17.3 Alignment questions for code review

1. Are fields stored inline inside entity records, or as separate metadata records?
2. Is role currently used to modify schema, or only behavior/visibility?
3. Are relationship semantics represented separately from lookup fields?
4. Are validation conditions mixed inside field metadata?
5. Is UI visibility being mistaken for permission?
6. Does active metadata have an immutable version snapshot?
7. Can runtime resolve metadata by tenant, node, role, and record state?
8. Can a deployment determine breaking impact before activation?
9. Does package ownership exist in metadata tables today?
10. Are compiler failures blocking activation consistently?

---

# 18. Recommended Implementation Sequence

The implementation shall proceed in a sequence that minimizes rework.

## Phase 1 — Freeze foundational metadata contracts

1. EntityDefinition
2. FieldDefinition
3. RelationshipDefinition
4. ValidationRuleDefinition
5. SecurityDefinition
6. RuntimeContractDefinition
7. VersionDefinition
8. DependencyDefinition
9. PackageDefinition

## Phase 2 — Build platform services

1. Metadata repository
2. Metadata compiler
3. Runtime metadata resolver
4. Dependency impact engine
5. Version publish and rollback service
6. Package dependency validator

## Phase 3 — Align existing authoring UI

1. Refactor current Entity Designer terminology.
2. Wire existing UI to formal metadata APIs.
3. Replace ad hoc checks with compiler checks.
4. Add runtime preview using resolved contract, not raw draft JSON.

## Phase 4 — Expand experience metadata

1. ViewDefinition
2. RelationViewDefinition
3. LookupViewDefinition
4. UIReactionRuleDefinition
5. ActionDefinition refinement

## Phase 5 — Prove through vertical slice

Recommended first vertical slice: **Service Job Card**.

It should exercise:

- EntityDefinition
- Fields
- Customer and Vehicle lookup relationships
- Parent-child lines
- Validation rules
- Lifecycle states
- Security permissions
- Views and relation views
- Runtime contract
- Actions
- Dependency impact

---

# 19. Non-Negotiable Architecture Guardrails

These are the rules Codex and human developers must not violate.

1. EntityDefinition shall not inline full field definitions.
2. FieldDefinition shall not own screen layout.
3. RelationshipDefinition shall not own child-grid UI layout.
4. ValidationRuleDefinition shall not become a discount, tax, approval, or accounting engine.
5. UIReaction rules shall not replace backend validations.
6. Hidden field is not a secure field.
7. Role is not a structural schema layer.
8. Runtime contract shall not bypass backend security or validation enforcement.
9. PostgreSQL `ENUM` shall not be used for configurable business picklists.
10. Money shall not be stored in floating-point types.
11. Destructive metadata changes shall not publish without dependency and migration analysis.
12. Package ownership shall be captured from the start.
13. Published metadata versions shall be immutable.
14. Compiler must fail loudly; it must not silently patch invalid metadata.
15. Raw authoring metadata shall not be sent directly to runtime consumers.

---

# 20. Anti-Patterns to Avoid

| Anti-Pattern | Why It Is Dangerous |
|---|---|
| One giant `entity_config_json` owning everything | Prevents governance, versioning, targeted diff, and safe impact analysis. |
| `type = currency` deciding DB, UI, validation, and analytics in one place | Mixes concerns and creates exceptions later. |
| Role-based schema changes | Makes resolved metadata impossible to reason about. |
| UI hide as security | Leaks through API/export/report channels. |
| Ad hoc validation in frontend only | Allows invalid data through other channels. |
| JSONB for all custom fields | Hurts queryability, indexing, analytics, and governance. |
| Package as simple import template | Prevents upgrade, dependency, and rollback safety. |
| Direct activation without compile | Allows production-breaking metadata. |
| No immutable published version | Makes rollback and support investigation unreliable. |

---

# 21. Required Cross-Object Resolution Rules

## 21.1 Field + Validation

- Simple type and format constraints belong to FieldDefinition.
- Conditional or cross-field business validity belongs to ValidationRuleDefinition.

## 21.2 Field + View

- FieldDefinition defines data meaning and default control guidance.
- ViewDefinition defines placement, section, per-view control, width, order, and display choices.

## 21.3 Field + Security

- FieldDefinition may declare classification and default masking policy.
- SecurityDefinition decides whether a user can read, edit, or receive the field at runtime.

## 21.4 Relationship + View

- RelationshipDefinition defines structure, cardinality, and lifecycle behavior.
- RelationViewDefinition defines how related records appear to users.

## 21.5 Action + Security + Validation

- ActionDefinition defines what the action does.
- SecurityDefinition decides whether the user is allowed to perform it.
- ValidationRuleDefinition decides whether the record is eligible for it.

## 21.6 Runtime contract + engines

- Runtime contract guides renderer and clients.
- Engines still perform backend enforcement.

---

# 22. API Surface Categories

## 22.1 Authoring APIs

| API Category | Examples |
|---|---|
| Entity authoring | Create/update/list EntityDefinition drafts. |
| Field authoring | Create/update/list fields. |
| Relationship authoring | Create/update/list relationships. |
| Validation authoring | Create/update/list validation rules. |
| Security authoring | Create/update/list permission definitions. |
| Version authoring | Create draft, compare, publish, deprecate. |
| Package authoring | Define package, dependencies, contents. |

## 22.2 Compiler APIs

| API | Purpose |
|---|---|
| Compile draft | Validate and compile draft metadata. |
| Explain compile issue | Return reason and affected objects. |
| Publish version | Publish compiled version if eligible. |
| Compare versions | Return diff and impact. |

## 22.3 Runtime APIs

| API | Purpose |
|---|---|
| Resolve entity runtime contract | Return resolved metadata for current context. |
| Resolve view contract | Return view-specific metadata. |
| Resolve action contract | Return visible/enabled/allowed actions. |
| Explain runtime resolution | Return reasoning trail for support/debugging. |

---

# 23. Minimum Acceptance Criteria for the Architecture

The architecture shall be considered correctly implemented only when all conditions below are met:

1. A developer can define an entity without embedding all child metadata inline.
2. A field can have independent business type, logical type, PostgreSQL type, and UI default control.
3. A lookup field and its relationship behavior are modeled separately.
4. Conditional mandatory logic is modeled as a validation rule, not hidden field configuration.
5. A user denied field access does not receive the field through UI runtime contract, API response, export, or report channel.
6. A draft metadata change with broken dependency cannot become active.
7. A runtime contract can be generated for tenant, node, role, user, locale, channel, view, and record state.
8. A published metadata version is immutable and traceable.
9. A package can declare contents, version, ownership, and dependencies.
10. Existing Entity Designer features continue to work after alignment refactor.

---

# 24. Immediate Recommended Next Activities

Since implementation is already underway, the next steps should be:

## 24.1 First: perform codebase alignment review

Review the current codebase against this master architecture and classify every area as:

- Already aligned
- Partially aligned
- Misaligned but salvageable
- Must be redesigned

The output should be a concise gap document, not a rewrite proposal.

## 24.2 Second: freeze the next missing architecture objects

The next product design documents should be:

1. `ViewDefinition_Requirement_Document.md`
2. `RelationViewDefinition_Requirement_Document.md`
3. `ActionDefinition_Requirement_Document.md` refinement, if current actions need stronger execution/permission separation.
4. `UIReactionRuleDefinition_Requirement_Document.md`

## 24.3 Third: implement a vertical slice

Use Service Job Card or another real transaction entity to validate the full chain end to end.

---

# 25. Recommendation for Codex Usage in an Ongoing Project

Because the project is already established, Codex should not be asked to “rebuild the architecture.” Instead, use it in focused work packets:

| Codex Task Type | Example |
|---|---|
| Architecture alignment review | Compare current metadata models with this document and report drift. |
| Targeted refactor | Rename `entityType` to `apiName` while preserving compatibility. |
| Unit of implementation | Add RelationshipDefinition model, validator, repository, tests. |
| Safety enhancement | Expand compiler to reject invalid relationship target. |
| Runtime enhancement | Add security-aware field filtering to runtime contract resolver. |

Each Codex task should have:

1. One objective.
2. In-scope files or modules.
3. Explicit out-of-scope behavior.
4. Acceptance criteria.
5. Tests to add or update.
6. Architecture rules from Section 19.

---

# 26. Final Product Judgment

The current Entity Designer is already a credible foundation. The product mistake would be to continue adding more screens and toggles without formalizing the metadata platform beneath them.

The correct next move is not “more features.” It is **architectural consolidation**:

1. Make the metadata objects explicit.
2. Make their boundaries strict.
3. Make the compiler authoritative.
4. Make runtime consume resolved contracts.
5. Make deployment versioned, package-aware, and dependency-safe.

If these are done now, the later UI work, rule work, workflow work, package work, and AI assistance will compound cleanly. If these are delayed, every future feature will become more expensive to retrofit.

---

# 27. Appendix A — Authoritative Child Documents

| Document | Purpose |
|---|---|
| `iDMS_EntityDefinition_Requirement_Document.md` | Root entity metadata model. |
| `iDMS_FieldDefinition_Requirement_Document.md` | Field metadata model, type architecture, PostgreSQL mapping. |
| `iDMS_RelationshipDefinition_Requirement_Document.md` | Lookup, parent-child, junction, polymorphic relationships. |
| `iDMS_ValidationRuleDefinition_Requirement_Document.md` | Record validity rules and boundary from business rules/UI reactions. |
| `iDMS_SecurityDefinition_Requirement_Document.md` | Permissions, masking, record scope, API security. |
| `iDMS_RuntimeContractDefinition_Requirement_Document.md` | Runtime resolution input/output and consumer contract. |
| `iDMS_Version_Dependency_Package_Model_Requirement_Document.md` | Publish safety, dependency impact, packages, rollback. |

---

# 28. Appendix B — Master Review Checklist

Before approving any new metadata feature, ask:

1. Which metadata object owns this concern?
2. Does it violate an existing ownership boundary?
3. Is this authoring metadata or runtime metadata?
4. Does it affect security, validation, dependency, or package safety?
5. Does it require compiler validation?
6. Does it require runtime resolution?
7. Does it require versioning?
8. Does it create migration impact?
9. Does it affect tenant/node overlays?
10. Can it be explained to support teams through an explain API or diff?

If these questions cannot be answered clearly, the feature is not ready for implementation.
