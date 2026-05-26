# iDMS Admin Studio — ValidationRuleDefinition and Validation Authoring Requirement Document v2
## Supersedes the earlier ValidationRuleDefinition requirement document
### Audience: Product, Architecture, Engineering, QA, AI Coding Agents
### Status: Revised Target Requirements
### Purpose: Define a complete enterprise-grade validation metadata model for iDMS Admin Studio, aligned with revised EntityDefinition v2, FieldDefinition v2, and RelationshipDefinition v2.

---

## 0. Supersession Note

This document **supersedes the earlier `iDMS_ValidationRuleDefinition_Requirement_Document.md`**.

The earlier version established the correct basic boundary that validation rules are separate from fields, UI reactions, permissions, workflows, and domain calculations. However, after revising `EntityDefinition`, `FieldDefinition`, and `RelationshipDefinition`, the earlier validation model is no longer sufficient because it did not fully account for:

- Native, virtual, external, materialized, append-only, and projection-backed entities
- Stored, derived, snapshot, provider-backed, projection, and compound fields
- Owned-child collections, temporal relationships, external relationships, and provider-capability-driven links
- The difference between structural constraints, validation rules, action eligibility, business rules, UI reactions, and database enforcement
- Child collection validations, aggregate validations, cross-record validations, batch/import validations, and provider/external validations
- Snapshot-aware versus live-master validation
- Validation execution order, derivation readiness, and dirty-field incremental evaluation
- Data freshness, external-provider unavailability, and failure policy
- Layer governance, effective dating, and rule conflict resolution
- Warning acknowledgment, dynamic messages, masking-safe messages, and localization
- Performance budgets for synchronous cross-record validation
- Testability and activation gates for critical validations

The revised model below must be treated as the target truth for future implementation.

---

# 1. Design Objective

`ValidationRuleDefinition` shall define **deterministic, side-effect-free, operation-time validity checks** that decide whether a requested operation may proceed, whether a warning must be surfaced, or whether additional correction is required before the operation can complete.

It must support enterprise validation needs across:
- Header/document data
- Line/child collections
- Cross-field conditions
- Cross-record and relationship conditions
- Lifecycle transition gates
- Action eligibility
- Import and batch validation
- API payload validation
- External/provider-backed checks
- Temporal/effective-dated checks
- Snapshot-aware legal/compliance validations

It must **not** become:
- A generic business rule engine
- A UI behavior engine
- A permission system
- A workflow engine
- A calculation engine
- A duplicate-detection/fuzzy-matching engine
- A database schema constraint layer

The product question answered by `ValidationRuleDefinition` is:

> **Given this operation, this entity state, this payload, this related data, and this runtime context, is the record valid enough to continue?**

---

# 2. Why the Earlier Validation Model Was Not Enough

## 2.1 It was too record-centric

The earlier model mainly covered:
- field presence,
- cross-field rules,
- relationship rules,
- lifecycle gates,
- import/API checks,
- warning rules,
- compliance rules,
- simple uniqueness.

That is useful, but iDMS transactions frequently need:
- line-item validation,
- child-count validation,
- header-to-line consistency,
- line-to-line duplicate checks,
- aggregate quantity/amount checks,
- relation-history checks,
- temporal overlap checks,
- batch-level import checks,
- provider-backed validations,
- action-specific validations.

For example, a Purchase Requisition can require:
- at least one valid line,
- active product only,
- duplicate line prevention,
- attachment count limits,
- cancellation quantity not exceeding pending quantity,
- manual close remarks before close,
- no conversion when expired,
- no edit after ordering begins.

Those are not all simple same-record field checks.

## 2.2 It did not separate validation from structural constraints strongly enough

A platform needs both:
- **structural invariants** such as `NOT NULL`, `UNIQUE`, `CHECK`, and foreign keys, and
- **operation-time business validation** such as “GSTIN is mandatory before posting a GST invoice.”

These are different responsibilities:
- Structural constraints belong to `FieldDefinition`, `RelationshipDefinition`, and future `ConstraintDefinition`.
- Operation-time business validity belongs to `ValidationRuleDefinition`.

A field may be nullable in storage but still mandatory before submit.  
A child relation may structurally allow zero children but still require at least one valid line before create.  
A foreign key may be valid structurally while the selected target is business-ineligible because it is inactive or out of effective date.

## 2.3 It did not account for revised field archetypes

The revised field model now distinguishes:
- stored business fields,
- system fields,
- relationship fields,
- computed virtual fields,
- persisted computed fields,
- rollups,
- snapshots,
- provider-mapped fields,
- projection fields,
- compound fields.

Validation rules must understand which fields:
- are user writable,
- are system derived,
- are frozen snapshots,
- are provider-owned,
- are query-projected,
- are available only after derivation.

A rule must not require manual input on a computed or provider-owned read-only field unless the system guarantees derivation or provider availability.

## 2.4 It did not account for revised entity archetypes

After the corrected entity model, ordinary CRUD validation cannot be assumed for all entities:

| Entity Archetype | Validation Implication |
|---|---|
| `native_persistent` | Full create/update/action validation possible |
| `virtual_computed` | Usually no save/update validation; may need query-parameter or refresh validation only |
| `external_federated` | Local preflight validation may exist, but provider owns some validity; capability and failure policy required |
| `materialized_projection` | No direct user mutation validation; refresh/build validation only |
| `owned_child` | Requires parent-linked child and collection rules |
| `append_only_record` | Insert/correction/reversal validation, not ordinary update validation |
| `system_technical` | Usually platform-owned validation, not business-admin-authored validation |

## 2.5 It did not model validation timing and dependency readiness

Some validations must run:
- before derivations,
- after derivations,
- before save,
- before transition,
- before posting,
- after external verification,
- during import preview,
- at import commit,
- during provider sync,
- during refresh/build of a projection.

For example:
- `line_taxable_amount > 0` should be checked only after pricing/tax derivations are complete.
- `invoice_total > 0` may depend on child-line aggregation.
- `gstin_snapshot is not blank` should be checked after snapshot copy but against the snapshot, not the live master.

## 2.6 It did not sufficiently model provider/external validation

External/provider-backed checks need explicit metadata for:
- provider capability,
- timeout policy,
- freshness policy,
- failure policy,
- authoritative response,
- retry/defer behavior,
- whether cached data is acceptable,
- whether failure blocks or warns.

Without this, external validations will become unpredictable and inconsistent across UI/API/import channels.

## 2.7 It did not sufficiently separate exact uniqueness, business duplicate checks, and fuzzy duplicates

| Need | Correct Owner |
|---|---|
| Exact structural uniqueness | `ConstraintDefinition` / database index |
| Exact operation-time business duplicate check | `ValidationRuleDefinition` if simple and deterministic |
| Fuzzy duplicate detection / similarity scoring | Future `DuplicateDetectionDefinition`, not validation rule |
| Cross-row duplicate inside import batch | Batch validation support within validation framework |

## 2.8 It did not cover message safety

Validation messages must not:
- leak hidden field values,
- expose masked regulated data,
- reveal cross-scope records that the user cannot access,
- expose provider internals,
- expose raw SQL or implementation details.

The earlier model had validation messages, but not message-governance requirements.

---

# 3. Non-Negotiable Architecture Principles

| Principle | Requirement |
|---|---|
| Validation is side-effect free | Validation may pass, fail, warn, or request acknowledgment; it must not mutate business data. |
| Database constraints are not validation rules | Structural invariants must remain in `FieldDefinition`, `RelationshipDefinition`, and `ConstraintDefinition`. |
| UI filtering is not validation | A lookup filter may hide invalid choices, but backend validation must still reject invalid submitted values. |
| UI requiredness is not backend enforcement | `UIReactionRuleDefinition` may show required state; `ValidationRuleDefinition` must enforce it where needed. |
| Security runs before detailed validation exposure | Unauthorized users must not receive validation details that leak inaccessible data. |
| Live relation and snapshot truth are distinct | Legal/historical validations must explicitly reference the correct fact source. |
| Derived data readiness must be explicit | Rules that use computed, rollup, or snapshot fields must define the phase after which they are valid to evaluate. |
| External validation must have failure policy | Provider-backed checks must define fail-closed, fail-open-with-warning, defer, or retry behavior. |
| Multiple rules can apply | Applicable blocking rules are cumulative unless explicitly replaced through governed versioning. |
| Lower layers cannot silently weaken upstream rules | Relaxation or disabling of inherited critical validations requires explicit upstream allowance. |
| Draft metadata cannot execute at runtime | Only compiled active rule versions are executable. |
| Rule evaluation must be deterministic within an execution context | Same payload + same context + same authoritative data must yield same result. |

---

# 4. Boundary with Other Metadata Objects

## 4.1 Ownership Matrix

| Concern | Metadata Owner |
|---|---|
| Data type, length, precision, simple min/max, base nullability | `FieldDefinition` |
| Physical `NOT NULL`, `UNIQUE`, `CHECK`, exclusion, FK constraints | `ConstraintDefinition` / generated database constraints |
| Relationship target, cardinality, key binding, referential integrity | `RelationshipDefinition` |
| Conditional requiredness, cross-field validity, action eligibility, child-count checks | `ValidationRuleDefinition` |
| UI show/hide/read-only/default visual reactions | `UIReactionRuleDefinition` |
| Data defaulting, formula calculation, rollup, snapshot copy | `FieldDerivationDefinition` / domain engine |
| Workflow state machine and transition graph | `LifecycleModelDefinition` |
| Button/action execution, sync/async handler, outcome | `ActionDefinition` |
| Permission and data access | `SecurityDefinition` |
| Charges, discounts, tax, accounting, commercial calculations | Domain-specific rule engines |
| Fuzzy duplicate matching | Future `DuplicateDetectionDefinition` |
| Lookup option filtering | `FieldValueSourceDefinition` / lookup binding |
| Import mapping and file parsing | `IntegrationContractDefinition` / import profile |
| Rule deployment/version/impact | `VersionDefinition`, `DependencyDefinition`, `PackageDefinition` |

## 4.2 Hard Boundary Rules

1. A validation rule shall **not** change field values, create records, calculate amounts, route approvals, or call an arbitrary mutating action.
2. A validation rule shall **not** grant or deny permissions.
3. A validation rule shall **not** define view visibility.
4. A validation rule shall **not** replace database constraints where a physical invariant is required.
5. A validation rule shall **not** use raw SQL, arbitrary JavaScript, shell commands, or direct database access.
6. A validation rule shall **not** be the source of a lookup filter, though a lookup filter and a validation rule may use the same business condition.
7. A validation rule shall **not** be used to model fuzzy duplicate scoring.
8. A validation rule shall **not** silently evaluate masked or inaccessible data without a governed service context.
9. A validation rule shall **not** require a user-editable correction on a field that is system-only, provider-owned, frozen, or projection-only unless a valid system correction path exists.
10. A validation rule shall **not** be used as a workaround for missing entity, field, relationship, lifecycle, or security metadata.

---

# 5. Validation Classification Model

Every `ValidationRuleDefinition` shall be classified across **nine independent dimensions**.

## 5.1 Dimension 1 — Validation Family

| Validation Family | Meaning | Examples |
|---|---|---|
| `conditional_presence` | Field or value becomes mandatory under a condition | GSTIN required when customer type is Registered Business |
| `cross_field_consistency` | Compare two or more fields on the same record | Delivery Date cannot be before Booking Date |
| `record_state_consistency` | Record must satisfy internal status or amount conditions | Invoice total must be greater than zero before submit |
| `child_row_validation` | Validate a child row/line independently | Requested Quantity must be > 0 |
| `child_collection_validation` | Validate collection presence/count/composition | At least one active line required before create |
| `aggregate_validation` | Validate sum/count/min/max across related children | Cancelled Quantity cannot exceed Pending Quantity |
| `relationship_eligibility` | Validate selected related record or relation state | Selected supplier must be active and valid for document date |
| `relationship_absence_or_presence` | Require or forbid related records | Job Card cannot close if open part requisitions exist |
| `temporal_validity` | Validate effective dates, intervals, or overlap | Tax rule date ranges must not overlap |
| `lifecycle_gate` | Validate transition into a lifecycle state | Submit blocked if mandatory attachments missing |
| `action_eligibility` | Validate whether a non-transition action may execute | Conversion allowed only when pending quantity exists |
| `import_row_validation` | Validate one imported row | Imported Part Code must exist |
| `import_batch_validation` | Validate whole file/batch/cross-row issues | Duplicate invoice numbers inside batch not allowed |
| `api_payload_validation` | Validate API create/update/upsert payload business validity | External ID required for API upsert |
| `bulk_operation_validation` | Validate bulk update/delete eligibility | Posted vouchers cannot be bulk edited |
| `provider_external_validation` | Validate using provider/external authoritative data | External campaign code must still be active in provider |
| `warning_advisory` | Non-blocking business warning | Supplier has overdue balance |
| `compliance_validity` | Legal/regulatory requirement | GST invoice requires taxable-party GSTIN snapshot |
| `exact_business_duplicate` | Deterministic duplicate blocking beyond structural key | Duplicate active line with same product + warehouse + purpose not allowed |

## 5.2 Dimension 2 — Evaluation Scope

| Evaluation Scope | Meaning |
|---|---|
| `field` | One field |
| `record` | One record |
| `child_row` | One child row/line |
| `child_collection` | All rows in a child relation |
| `related_record` | One linked record |
| `related_collection` | Many related records |
| `cross_entity` | Multiple entities |
| `batch` | Imported/bulk group |
| `provider` | External source |
| `projection_refresh` | Materialized/virtual refresh context |

## 5.3 Dimension 3 — Trigger Context

| Trigger Context | Meaning |
|---|---|
| `on_create` | First creation |
| `on_save` | Generic save |
| `on_update` | Update to existing record |
| `on_field_change_preview` | Optional UI/API preflight for changed fields |
| `before_submit` | Before submit transition |
| `before_approve` | Before approval |
| `before_reject` | Before reject if applicable |
| `before_post` | Before accounting/inventory/legal posting |
| `before_cancel` | Before cancellation |
| `before_close` | Before close |
| `before_reopen` | Before reopen |
| `before_reverse` | Before reversal |
| `before_delete` | Before delete attempt |
| `before_restore` | Before restore |
| `before_convert` | Before document conversion |
| `before_import_preview` | During import validation preview |
| `before_import_commit` | Before import commit |
| `before_api_create` | API create |
| `before_api_update` | API update |
| `before_api_upsert` | API upsert |
| `before_bulk_operation` | Bulk action |
| `before_provider_write` | Before write to provider |
| `on_provider_response` | After provider validation response |
| `before_projection_refresh` | Before projection/materialized refresh |
| `after_projection_refresh_validation` | Validate refreshed projection output |

## 5.4 Dimension 4 — Enforcement Layer

| Enforcement Layer | Meaning |
|---|---|
| `database_constraint` | Structural invariant enforced by PostgreSQL |
| `application_sync` | Synchronous backend validation before operation completes |
| `application_async_advisory` | Asynchronous advisory; cannot block already-completed operation |
| `provider_sync` | Blocking provider validation |
| `provider_async` | Provider callback/advisory |
| `import_pipeline` | Import preview/commit pipeline |
| `projection_pipeline` | Refresh/build validation for derived entities |

**Rule:** `ValidationRuleDefinition` primarily owns `application_sync`, `provider_sync`, `import_pipeline`, and selected `projection_pipeline` validations.  
`database_constraint` is represented for traceability but is not authored as a business validation rule.

## 5.5 Dimension 5 — Severity / Outcome

| Severity | Meaning | Runtime Outcome |
|---|---|---|
| `error_blocking` | Operation must fail | Block |
| `warning_acknowledge` | Operation may continue after explicit acknowledgment | Warn + capture acknowledgment |
| `warning_nonblocking` | Operation may continue without acknowledgment | Warn only |
| `info` | Informational guidance | Display only |
| `advisory_async` | Post-operation signal | Notify/log, never block completed operation |

## 5.6 Dimension 6 — Data Truth Source

| Truth Source | Meaning | Example |
|---|---|---|
| `current_record` | Current payload/record | booking_date |
| `persisted_record` | Stored version before change | previous status |
| `snapshot_field` | Frozen copied fact | gstin_snapshot |
| `live_relationship` | Current linked master record | current supplier status |
| `effective_dated_relationship` | Related fact valid as of business date | active scheme on invoice date |
| `derived_field` | Computed/rollup value after derivation | invoice_total |
| `provider_current` | Live provider response | OEM campaign status |
| `provider_cached` | Cached provider fact with freshness policy | latest credit score cache |
| `projection_value` | Read-model field | open balance projection |
| `import_batch` | Values in current import file | duplicate invoice numbers within file |

**Rule:** Validation authors must choose the correct truth source explicitly where ambiguity exists.  
A legal posted-document rule must not accidentally validate against mutable live master data when it should validate a frozen snapshot.

## 5.7 Dimension 7 — Evaluation Phase / Dependency Readiness

| Phase | Meaning |
|---|---|
| `pre_defaulting` | Before default values are applied |
| `post_defaulting` | After defaults, before calculations |
| `post_derivation` | After formulas, snapshots, and rollups required by the rule are available |
| `pre_persistence` | Before write |
| `pre_transition` | Before lifecycle transition |
| `post_provider_response` | After provider result is available |
| `import_row_phase` | After parse/map of each row |
| `import_batch_phase` | After all rows are available |
| `projection_refresh_phase` | During projection/materialized refresh |

**Rule:** A validation that references derived, rollup, or snapshot fields must declare a phase after those values are guaranteed to exist.

## 5.8 Dimension 8 — Applicability Scope

| Applicability Scope | Meaning |
|---|---|
| `entity_wide` | Applies to base entity |
| `document_type_specific` | Applies only to a document type/variant |
| `view_preview_only` | Exposed for preview in a view but backend rule still owned elsewhere |
| `channel_specific` | Web/API/import/provider |
| `lifecycle_state_specific` | Applies only in certain record states |
| `action_specific` | Applies only for specific action |
| `layer_specific` | Applies from Platform/Vertical/Tenant/Node layer |
| `effective_dated` | Applies during date interval |
| `package_specific` | Introduced by package/version |

## 5.9 Dimension 9 — Determinism / Stability

| Determinism Type | Meaning |
|---|---|
| `pure_deterministic` | Same payload + same persisted data always gives same result |
| `time_dependent` | Uses current date/time or business date |
| `provider_dependent` | Uses external provider response |
| `projection_dependent` | Uses refresh state/read model |
| `configuration_dependent` | Uses effective-dated configuration |
| `security_context_dependent` | Uses guarded runtime context but must not replace permission checks |

Rules that are not `pure_deterministic` must declare:
- source,
- timestamp basis,
- freshness policy if relevant,
- retry/failure policy if relevant.

---

# 6. Validation Archetypes and Correct Usage

## 6.1 Conditional Presence Rule

Use when a field is structurally nullable but becomes required under business context.

**Example:**  
`gstin_snapshot` is mandatory before posting a GST invoice when tax treatment = registered taxable supply.

**Do not use for:**  
A field that must never be null in storage. That belongs to structural constraints.

## 6.2 Cross-Field Consistency Rule

Use when values on the same record must agree.

**Examples:**
- delivery date >= booking date
- valid till date >= document date
- cancellation date >= create date

## 6.3 Child Row Rule

Use when each line/item/child record must independently satisfy a condition.

**Examples:**
- requested_qty > 0
- line warehouse must be valid
- file size <= allowed limit

## 6.4 Child Collection Rule

Use when the parent requires a collection-wide condition.

**Examples:**
- at least one active line before create
- no duplicate line with same product + warehouse + requirement date
- maximum 3 attachments

## 6.5 Aggregate Rule

Use when validation depends on child aggregation or related collection measures.

**Examples:**
- cancelled_qty <= pending_qty
- sum of line amounts must equal header total
- total active quantity must be > 0 before conversion

## 6.6 Relationship Eligibility Rule

Use when selected related records must satisfy current business conditions beyond structural referential validity.

**Examples:**
- supplier must be active on document date
- product must belong to selected company scope
- warehouse must be valid for login node

## 6.7 Relationship Existence/Absence Rule

Use when related records must or must not exist.

**Examples:**
- job card cannot close while open parts requisitions exist
- invoice cannot post without at least one valid tax line if tax applicable
- customer cannot deactivate while open transactions exist

## 6.8 Temporal Rule

Use for effective-dated intervals and overlap control.

**Examples:**
- no overlapping active tax rate for same state + HSN + tax type
- dealer-scheme mapping must be active on invoice date
- vehicle ownership relation valid as of document date

## 6.9 Lifecycle Gate Rule

Use when a transition requires conditions but the rule does not itself define the transition.

**Examples:**
- submit blocked until mandatory attachments exist
- approve blocked until approval comments entered
- post blocked if tax calculation is stale

## 6.10 Action Eligibility Rule

Use for allowed actions that are not themselves core state transitions.

**Examples:**
- convert PR to PO only when pending quantity exists
- manual close requires close remarks
- delete attempt blocked when business policy forbids delete

## 6.11 Import/Bulk Rule

Use for import/bulk specific execution contexts.

**Examples:**
- duplicate invoice number within batch
- external code required on upsert
- row count cannot exceed configured limit
- posted records cannot be bulk edited

## 6.12 Provider/External Rule

Use when the authoritative truth is external.

**Examples:**
- OEM allocation code must still be valid in provider
- external customer status must be active
- provider must accept update before local commit if provider is source of truth

## 6.13 Warning/Advisory Rule

Use for business signals that do not block by default.

**Examples:**
- supplier has overdue balance
- customer has high claim rate
- vehicle warranty expires soon

**Rule:** Warnings must define whether acknowledgment is required.

## 6.14 Exact Business Duplicate Rule

Use for deterministic, exact duplicate checks that depend on business context.

**Examples:**
- duplicate active purchase requisition line with same product + warehouse + business differentiators not allowed
- duplicate active scheme mapping for same dealer + scheme + effective range not allowed

**Do not use for:**  
Fuzzy duplicate detection such as “possible duplicate customer based on similar name.” That is a future duplicate-detection capability, not validation.

---

# 7. Structural Constraint vs Validation Rule vs Business Rule

| Need | Correct Mechanism | Example |
|---|---|---|
| Field can never be null in any stored record | Structural constraint | `record_id NOT NULL` |
| Quantity must always be positive for a row in table | Structural constraint if invariant is permanent and local-row-only | `CHECK (qty > 0)` |
| GSTIN required only for registered customer type | Validation rule | Conditional requiredness |
| Supplier must be active on document date | Validation rule | Related-record eligibility |
| Discount amount calculation | Domain rule/calculation | Rule engine |
| Show remarks only when status = Cancelled | UI reaction | Show/hide |
| User cannot approve because lacks permission | Security | Permission denial |
| Approval route for amount > threshold | Workflow/approval rule | Routing |
| Similar customer names should be flagged | Duplicate detection | Fuzzy match |

## 7.1 PostgreSQL Boundary

Use database constraints when the rule:
- applies to all rows at all times,
- depends only on the current row or enforceable key structure,
- must never be bypassed by any runtime channel,
- maps cleanly to PostgreSQL constraints.

Use `ValidationRuleDefinition` when the rule:
- depends on operation,
- depends on lifecycle state,
- depends on child collections,
- depends on related records,
- depends on external/provider data,
- depends on effective date,
- is warning-level,
- or changes by tenant/document type/version.

---

# 8. Entity Archetype Compatibility

| Entity Archetype | Supported Validation Patterns | Prohibited / Restricted Patterns |
|---|---|---|
| `native_persistent` | Full validation support | None beyond normal guardrails |
| `virtual_computed` | Query parameter validation, projection/read-model consistency, refresh checks | Ordinary create/update/save validations |
| `external_federated` | Local preflight, provider-response validation, provider capability checks | Assuming local DB enforcement where provider owns truth |
| `materialized_projection` | Refresh/build validation, read-model consistency | User-edit save/update validation |
| `junction_association` | link uniqueness, temporal overlap, scope compatibility, association attributes | Treating history-bearing links as simple mutable lookups |
| `owned_child` | child row, child collection, parent aggregate, ownership-consistency rules | Independent parentless validation |
| `append_only_record` | insert, correction, reversal, sequence-integrity validations | ordinary edit/delete validations |
| `system_technical` | platform-controlled validation only | business-admin-authored rules unless explicitly allowed |

---

# 9. Field Archetype Compatibility

| Field Archetype | Validation Guidance |
|---|---|
| Stored business field | Fully validatable |
| Stored extension field | Fully validatable subject to layer and package governance |
| System/technical field | Validate system correctness, not user input |
| Identity/key field | Prefer structural constraints; use validation for business-key context |
| Relationship reference field | Validate live relation/business eligibility, not only FK existence |
| Picklist/value-set field | Validate allowed values and effective-dated eligibility |
| Computed virtual field | Use only after derivation phase; do not require user correction |
| Persisted computed field | Validate after derivation; inspect stale/recalc policy |
| Rollup field | Validate after aggregate computation |
| Snapshot field | Use for historical/legal truth; validate freeze/readiness |
| External/provider field | Validate only within provider capability and freshness policy |
| Projection field | Usually read-only; validate projection consistency, not user input |
| Compound parent field | Validate constituent completeness and composition rules |
| Compound constituent field | May have local validation but must respect compound contract |
| Media reference field | Validate attachment metadata, size, type, count, lifecycle window |

---

# 10. Relationship-Aware Validation

## 10.1 Relationship optionality vs business mandatory rule

- `RelationshipDefinition` owns structural optionality/cardinality.
- `ValidationRuleDefinition` owns operation-time mandatory business conditions.

**Example:**  
A Sales Invoice may structurally allow `ship_to_customer` to be null, but the selected document type may require it before submit.

## 10.2 Owned child collection checks

Validation rules must support:
- minimum child count,
- maximum child count,
- active child count,
- duplicate child checks,
- child aggregate checks,
- parent-to-child consistency,
- child-to-parent state compatibility.

## 10.3 Temporal relationships

Validation rules referencing effective-dated relationships must specify:
- evaluation date source,
- valid interval semantics,
- overlap handling,
- open-ended interval behavior,
- historical/current resolution.

## 10.4 External and indirect relationships

Validation rules over external relationships must specify:
- key binding strategy,
- provider capability,
- data freshness,
- fallback policy,
- scope mapping behavior,
- whether provider response is authoritative.

## 10.5 Snapshot versus live relation

| Validation Need | Correct Truth Source |
|---|---|
| “Current supplier is active before creating new PR” | live relationship |
| “GSTIN on already posted invoice was present at posting time” | snapshot field |
| “Scheme was applicable on invoice date” | effective-dated relationship |
| “Customer name shown on historical invoice” | snapshot field |

---

# 11. Execution Model and Order of Validation

## 11.1 Runtime Order of Operations

The system shall evaluate validation in this high-level order:

1. **Authentication and coarse authorization**
2. **Metadata/runtime contract resolution**
3. **Payload/schema/type parsing**
4. **Structural field and relationship checks**
5. **Default application**
6. **Derivation/formula/snapshot/rollup execution where required**
7. **Validation rules by declared phase**
8. **Lifecycle/action permission and transition orchestration**
9. **Persistence**
10. **Post-commit async advisories, notifications, or projection refreshes**

## 11.2 Detailed Rule Execution Order

Within the validation stage:

1. Blocking database-compatible structural checks
2. Field/record blocking rules
3. Child-row blocking rules
4. Child-collection and aggregate blocking rules
5. Relationship/temporal blocking rules
6. Action/lifecycle gate blocking rules
7. Provider blocking rules
8. Warning-acknowledge rules
9. Warning-nonblocking and info rules

## 11.3 Security Precedence

- Authorization must occur before disclosing detailed validation errors.
- If user lacks permission to perform the operation, the user receives an authorization error rather than detailed hidden-data validation messages.
- Validation service may execute under governed service context internally, but messages returned to the user must be filtered for permitted visibility.

## 11.4 Incremental / Dirty-Field Evaluation

The system shall support:
- dependency graph from rule to referenced fields/relationships/derived fields,
- incremental reevaluation for UI preview when affected fields change,
- full authoritative validation on save/submit/post/import/API commit,
- explicit `dirtyFields` input in preview contexts,
- no omission of blocking rules during authoritative commit.

## 11.5 Atomicity

- Parent and owned-child validations executed in a single business operation shall succeed or fail atomically.
- Partial acceptance of invalid child rows is not allowed unless the operation explicitly supports staged import review.
- Validation failure shall not leave partially committed parent-child state.

---

# 12. External / Provider Validation Model

## 12.1 Provider Validation Metadata

A provider-backed validation shall define:

| Field | Meaning |
|---|---|
| `providerBindingId` | External provider integration |
| `requestContractId` | Request shape |
| `responseMappingId` | Mapping of provider response to pass/fail/warning |
| `freshnessPolicy` | `live_required`, `cached_allowed`, `cached_with_max_age`, `not_applicable` |
| `timeoutPolicy` | Timeout in ms and behavior |
| `failurePolicy` | `fail_closed`, `fail_open_with_warning`, `defer_operation`, `retry_then_fail` |
| `authoritative` | Whether provider result is final truth |
| `auditEvidencePolicy` | What response evidence is retained |
| `idempotencyContext` | Optional if provider call tied to repeatable action |

## 12.2 Failure Policy

| Policy | Meaning |
|---|---|
| `fail_closed` | Block operation if provider cannot confirm validity |
| `fail_open_with_warning` | Continue with warning |
| `defer_operation` | Queue or mark pending until validation can complete |
| `retry_then_fail` | Retry according to policy, then block if still unavailable |

## 12.3 Provider Guardrails

1. Provider validation shall not be hidden inside arbitrary expression functions.
2. Provider calls must be declared metadata dependencies.
3. Provider failure behavior must be explicit.
4. Sensitive provider responses must follow protection policy.
5. Provider-based blocking rules must have user-safe error messages.

---

# 13. Import, Bulk, and API Validation

## 13.1 Import Validation Stages

| Stage | Purpose |
|---|---|
| Parse validation | File, headers, data types |
| Row validation | Each row independently |
| Batch validation | Cross-row duplicate, totals, file-level limits |
| Reference validation | Master/lookup existence and eligibility |
| Preview issue generation | Error/warning list before commit |
| Commit validation | Re-run authoritative rules before persistence |

## 13.2 Bulk Operation Validation

Bulk operations must support:
- entity-level eligibility,
- record-by-record validation,
- grouped failure reporting,
- partial success policy only when explicitly allowed,
- prohibition of bulk updates on frozen/posted/append-only records where applicable.

## 13.3 API Validation

The API layer shall distinguish:
- transport/schema validation,
- integration contract validation,
- business validation,
- provider validation.

Business validation must run consistently for API create/update/upsert unless the API contract explicitly represents a different business operation.

---

# 14. Warning and Acknowledgment Model

## 14.1 Warning Types

| Warning Type | Behavior |
|---|---|
| `warning_acknowledge` | User must explicitly acknowledge before continuation |
| `warning_nonblocking` | Displayed but no acknowledgment required |
| `advisory_async` | Produced after operation; does not block already completed operation |

## 14.2 Acknowledgment Metadata

For `warning_acknowledge`, metadata shall define:
- whether acknowledgment is required once per operation or once per record/version,
- whether a reason is required,
- who acknowledged,
- timestamp,
- acknowledged warning code,
- whether warning acknowledgment is audited.

## 14.3 Warning Escalation

A lower layer may convert a warning into an error only when allowed by governance.  
A lower layer may not downgrade a platform-level error into warning unless upstream metadata explicitly permits relaxation.

---

# 15. Message Model and Data Protection

## 15.1 Message Requirements

Every active rule must have:
- stable message code,
- business-readable message,
- severity,
- localization key,
- affected fields/relations when safe to expose,
- optional remediation hint,
- optional acknowledgment text for warnings.

## 15.2 Dynamic Placeholders

Supported placeholders may include:
- field label,
- rule label,
- document date,
- configured threshold,
- count,
- amount,
- record number where user has visibility.

Dynamic placeholders must **not** expose:
- masked regulated values,
- hidden field values,
- provider internal IDs,
- cross-scope record identity not visible to user,
- raw expression or SQL.

## 15.3 Message Prioritization

When multiple blocking rules fail:
1. sort by configured priority,
2. group by location: header, line, child collection, relationship, action,
3. deduplicate equivalent messages,
4. expose full machine-readable result to API consumers,
5. expose user-safe messages in UI.

---

# 16. Governance, Layering, and Versioning

## 16.1 Rule Ownership

Rules may be owned by:
- Platform
- Vertical
- Tenant
- Node

**Role is not a schema-owning layer.**

## 16.2 Downstream Operations

| Operation | Meaning |
|---|---|
| `add` | Add additional rule |
| `constrain` | Tighten inherited rule or add stricter companion rule |
| `decorate` | Change label/message only where allowed |
| `disable` | Disable inherited rule only if upstream allows |
| `relax` | Weaken inherited behavior only if upstream allows |
| `replace` | Replace only through explicit version-governed migration, not silently |

## 16.3 Rule Conflict Resolution

- Multiple applicable blocking rules are cumulative.
- No “last write wins” for validation outcome.
- If two rules conflict logically, compiler must surface conflict.
- If a downstream rule relaxes upstream behavior without permission, activation must fail.
- When the same message condition is repeated, compiler should warn about duplication.

## 16.4 Effective Dating

Rules may declare:
- `effectiveFrom`
- `effectiveTo`
- `businessDateBasis`
- `version`
- `packageVersion`

This is essential for regulatory or commercial policy changes.

---

# 17. Expression and Evaluation Model

## 17.1 Expression Language Requirements

The expression language shall support:
- field references,
- constants,
- logical operators,
- comparisons,
- null checks,
- string/date/number functions,
- collection functions,
- relation existence checks,
- temporal interval checks,
- query binding references,
- controlled provider validation references,
- no arbitrary code execution.

## 17.2 Recommended MVP Function Catalogue

| Function | Use |
|---|---|
| `isBlank(value)` | Blank/null check |
| `isNotBlank(value)` | Requiredness |
| `length(value)` | String length |
| `matches(value, patternCode)` | Regex/pattern |
| `today()` | Current date |
| `businessDate()` | Operation business date |
| `daysBetween(a,b)` | Date interval |
| `sum(collection, field)` | Child aggregate |
| `count(collection, filter?)` | Child count |
| `exists(collection, filter)` | Child/related existence |
| `notExists(collection, filter)` | Child/related absence |
| `all(collection, predicate)` | All child rows satisfy condition |
| `any(collection, predicate)` | Any child row satisfies condition |
| `isActiveAsOf(relationship, date)` | Temporal relation validity |
| `overlaps(rangeA, rangeB)` | Overlap check |
| `snapshot(field)` | Explicit snapshot reference |
| `live(fieldOrRelationship)` | Explicit live reference |
| `providerResult(binding, key)` | Governed provider response |
| `isFresh(binding, maxAge)` | Cached freshness check |

## 17.3 Prohibited Expression Behavior

Expressions shall not:
- run raw SQL,
- run arbitrary JavaScript,
- mutate data,
- call arbitrary services,
- bypass security,
- enumerate all records without bounded query binding,
- directly dereference hidden sensitive values in user messages.

## 17.4 Query Budget and Complexity

Every rule shall have computed complexity metadata:
- referenced fields count,
- referenced relationships,
- collection scans,
- provider calls,
- query bindings,
- expected evaluation class: `constant`, `local_record`, `bounded_related`, `unbounded_risk`, `provider_call`.

Compiler shall:
- block unbounded scans in synchronous blocking rules,
- warn when rule requires expensive aggregation,
- require indexed query bindings for high-volume validations,
- prohibit N+1 related fetch patterns.

---

# 18. ValidationRuleDefinition Metadata Model

```json
{
  "validationRuleId": "vr_sales_invoice_gstin_snapshot_required",
  "entityId": "ent_sales_invoice",
  "apiName": "gstin_snapshot_required_before_post",
  "label": "GSTIN snapshot required before posting registered GST invoice",
  "description": "Blocks posting when a registered taxable invoice has no frozen GSTIN snapshot.",
  "validationFamily": "compliance_validity",
  "evaluationScope": "record",
  "triggerContexts": ["before_post"],
  "enforcementLayer": "application_sync",
  "severity": "error_blocking",
  "priority": 100,
  "truthSource": "snapshot_field",
  "evaluationPhase": "post_derivation",
  "applicability": {
    "documentTypes": ["vehicle_sales_invoice", "parts_sales_invoice"],
    "channels": ["web", "api"],
    "lifecycleStates": ["ready_to_post"],
    "effectiveFrom": "2026-04-01",
    "effectiveTo": null
  },
  "condition": {
    "expressionLanguage": "idms_expression_v2",
    "expression": "tax_treatment == 'REGISTERED_TAXABLE_SUPPLY'"
  },
  "assertion": {
    "expressionLanguage": "idms_expression_v2",
    "expression": "isNotBlank(snapshot(gstin_snapshot))"
  },
  "dependencyProfile": {
    "fieldIds": ["fld_tax_treatment", "fld_gstin_snapshot"],
    "relationshipIds": [],
    "derivedFieldIds": ["fld_gstin_snapshot"],
    "queryBindingIds": [],
    "providerBindingIds": []
  },
  "affectedTargets": {
    "fieldIds": ["fld_gstin_snapshot"],
    "relationshipIds": [],
    "childRelationIds": []
  },
  "message": {
    "code": "INV-GST-POST-001",
    "localizationKey": "validation.invoice.gstin_snapshot_required",
    "text": "GSTIN snapshot is required before posting this registered GST invoice.",
    "remediationHint": "Review customer tax details and regenerate the invoice snapshot before posting."
  },
  "warningAcknowledgmentPolicy": null,
  "providerPolicy": null,
  "bypassPolicy": {
    "allowed": false,
    "permissionCode": null,
    "reasonRequired": false
  },
  "governance": {
    "owningLayer": "Platform",
    "owningPackageId": "pkg_india_gst_core",
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false,
    "canDownstreamDisable": false,
    "criticality": "compliance_critical"
  },
  "lifecycle": {
    "metadataStatus": "draft",
    "version": "2.0.0"
  },
  "testCases": [
    {
      "name": "Registered taxable invoice without snapshot fails",
      "operation": "post",
      "input": {
        "tax_treatment": "REGISTERED_TAXABLE_SUPPLY",
        "gstin_snapshot": null
      },
      "expectedOutcome": "error_blocking"
    },
    {
      "name": "Unregistered supply without snapshot passes this rule",
      "operation": "post",
      "input": {
        "tax_treatment": "UNREGISTERED_SUPPLY",
        "gstin_snapshot": null
      },
      "expectedOutcome": "pass"
    }
  ]
}
```

---

# 19. Metadata Field Specification

| Field | Type | Mandatory | Rules |
|---|---|---:|---|
| `validationRuleId` | string | Yes | Immutable internal ID |
| `entityId` | entity reference | Yes | Active/draft parent entity |
| `apiName` | string | Yes | Unique within owning entity; locked after activation except versioned migration |
| `label` | string | Yes | Business-readable |
| `description` | text | Yes | Must explain business purpose |
| `validationFamily` | enum | Yes | Must be from supported family catalogue |
| `evaluationScope` | enum | Yes | Must match referenced metadata |
| `triggerContexts` | array | Yes | At least one trigger for active rules |
| `enforcementLayer` | enum | Yes | Must be valid for entity archetype |
| `severity` | enum | Yes | Defines runtime behavior |
| `priority` | integer | Yes | Used for ordering and message display |
| `truthSource` | enum | Yes | Explicit when ambiguity exists |
| `evaluationPhase` | enum | Yes | Must satisfy dependency readiness |
| `condition` | expression | No | If omitted, assertion always applies |
| `assertion` | expression | Yes | Must evaluate true for pass |
| `dependencyProfile` | object | Yes | Compiler-generated or author-declared references |
| `affectedTargets` | object | No | UI/API highlighting and message grouping |
| `message.code` | string | Yes | Stable unique code |
| `message.localizationKey` | string | Yes | Required for localizable message |
| `message.text` | string | Yes | Default language text |
| `message.remediationHint` | string | No | Business-safe hint |
| `warningAcknowledgmentPolicy` | object | Conditional | Required for `warning_acknowledge` |
| `providerPolicy` | object | Conditional | Required for provider-backed validation |
| `bypassPolicy` | object | Yes | Explicitly set; default `allowed=false` |
| `governance` | object | Yes | Ownership and downstream policy |
| `lifecycle.metadataStatus` | enum | Yes | draft, active, deprecated, disabled, retired |
| `lifecycle.version` | semver | Yes | Versioned metadata |
| `testCases` | array | Conditional | Mandatory for compliance-critical, provider-backed, and blocking transition rules |

---

# 20. Runtime Validation Result Contract

```json
{
  "valid": false,
  "operation": "post",
  "entityApiName": "sales_invoice",
  "recordId": "rec_123",
  "metadataVersion": "2.0.0",
  "errors": [
    {
      "ruleId": "vr_sales_invoice_gstin_snapshot_required",
      "code": "INV-GST-POST-001",
      "severity": "error_blocking",
      "message": "GSTIN snapshot is required before posting this registered GST invoice.",
      "remediationHint": "Review customer tax details and regenerate the invoice snapshot before posting.",
      "affectedTargets": {
        "fields": ["gstin_snapshot"],
        "relations": [],
        "childRows": []
      },
      "location": "header"
    }
  ],
  "warnings": [],
  "infos": [],
  "acknowledgmentsRequired": []
}
```

## 20.1 Child Row Example

```json
{
  "ruleId": "vr_pr_line_requested_qty_positive",
  "code": "PR-LINE-015",
  "severity": "error_blocking",
  "message": "Requested Quantity must be greater than zero.",
  "affectedTargets": {
    "fields": ["requested_qty"],
    "childRelation": "pr_lines",
    "childRowId": "line_3"
  },
  "location": "child_row"
}
```

## 20.2 Warning Acknowledgment Example

```json
{
  "ruleId": "vr_supplier_credit_warning",
  "code": "SUP-WARN-002",
  "severity": "warning_acknowledge",
  "message": "Supplier has an overdue balance. Review before continuing.",
  "acknowledgmentRequired": true,
  "acknowledgmentReasonRequired": false
}
```

---

# 21. Compile-Time Validation Rules

The metadata compiler shall block activation when any of the following occur:

| Code | Scenario | Required Outcome |
|---|---|---|
| `VAL-COMP-001` | Missing entity | Block |
| `VAL-COMP-002` | Unknown or inactive field reference | Block |
| `VAL-COMP-003` | Unknown or inactive relationship reference | Block |
| `VAL-COMP-004` | Invalid expression syntax | Block |
| `VAL-COMP-005` | Incompatible data type comparison | Block |
| `VAL-COMP-006` | Missing assertion | Block |
| `VAL-COMP-007` | Missing message code/text/localization key | Block |
| `VAL-COMP-008` | Duplicate active message code | Block |
| `VAL-COMP-009` | Rule references derived/snapshot field before readiness phase | Block |
| `VAL-COMP-010` | Rule requires user correction on non-user-writable field without remediation path | Block |
| `VAL-COMP-011` | Provider validation without provider/failure/freshness policy | Block |
| `VAL-COMP-012` | Synchronous blocking rule contains unbounded scan | Block |
| `VAL-COMP-013` | Rule relaxes inherited critical rule without permission | Block |
| `VAL-COMP-014` | Error rule has no valid trigger context | Block |
| `VAL-COMP-015` | Warning acknowledgment rule missing acknowledgment policy | Block |
| `VAL-COMP-016` | Entity archetype does not support requested trigger | Block |
| `VAL-COMP-017` | Snapshot-required rule references live master when snapshot truth is declared | Block |
| `VAL-COMP-018` | Exact duplicate rule lacks deterministic key set | Block |
| `VAL-COMP-019` | Rule exposes masked/hidden data in message template | Block |
| `VAL-COMP-020` | Critical rule missing required test cases | Block |
| `VAL-COMP-021` | Temporal rule missing evaluation date basis | Block |
| `VAL-COMP-022` | Rule cycle detected through dependent derivations/rules | Block |
| `VAL-COMP-023` | Duplicate/conflicting rules create contradictory outcomes | Warn or block based on severity |
| `VAL-COMP-024` | Deprecated field/relation dependency without migration replacement | Block activation for new version |

---

# 22. Runtime Validation Scenarios

## 22.1 Header / Record-Level
- mandatory document type before create
- invoice total > 0 before submit
- valid till date >= document date

## 22.2 Child Row
- requested quantity > 0
- file type allowed
- cancelled quantity <= pending quantity

## 22.3 Child Collection
- at least one active line before create
- max 3 attachments
- no duplicate active line by exact differentiator set

## 22.4 Aggregate
- sum(line totals) = header total within precision tolerance
- active pending quantity > 0 before conversion

## 22.5 Relationship
- supplier active on document date
- product active and valid for company
- no open dependent records before deactivation

## 22.6 Temporal
- no overlapping active tax rate interval
- applicable dealer-scheme relation active as of invoice date

## 22.7 Lifecycle / Action
- manual close requires close remarks
- no edit after ordering begins
- delete prohibited, use cancel

## 22.8 Snapshot-Aware
- posted invoice requires nonblank GSTIN snapshot
- posted document print uses snapshot legal name, not live customer name

## 22.9 External / Provider
- external OEM campaign code validated by provider
- provider timeout fails closed for compliance-critical rule
- cached provider status accepted only within freshness limit

## 22.10 Import / Batch
- duplicate invoice number inside import batch
- invalid part code row-level rejection
- file total mismatch at batch level

---

# 23. API Requirements

## 23.1 Metadata Authoring APIs

- `POST /admin/metadata/validation-rules`
- `GET /admin/metadata/validation-rules/{validationRuleId}`
- `PATCH /admin/metadata/validation-rules/{validationRuleId}`
- `POST /admin/metadata/validation-rules/{validationRuleId}/activate`
- `POST /admin/metadata/validation-rules/{validationRuleId}/deprecate`
- `POST /admin/metadata/validation-rules/{validationRuleId}/simulate`
- `GET /admin/metadata/entities/{entityId}/validation-rules`

## 23.2 Runtime APIs

- `POST /runtime/entities/{entityApiName}/validate`
- `POST /runtime/entities/{entityApiName}/actions/{actionCode}/validate`
- `POST /runtime/import-profiles/{importProfileId}/validate`
- `POST /runtime/providers/{providerBindingId}/validate` where governed provider-specific validation is exposed

## 23.3 Simulation API

The simulation endpoint must allow:
- payload input,
- operation context,
- lifecycle state,
- document type,
- channel,
- related records fixture,
- child rows fixture,
- provider response mock,
- expected result preview.

---

# 24. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| `AC-VAL2-001` | Given a structurally nullable field that is conditionally required before submit, when the condition is true and the field is blank, then submit is blocked by validation rule while ordinary draft save may still succeed if configured. |
| `AC-VAL2-002` | Given a Purchase Requisition with zero active lines, when create is attempted, then create is blocked by child collection validation. |
| `AC-VAL2-003` | Given a Purchase Requisition line with requested quantity <= 0, when line save is attempted, then the line is rejected with a child-row-specific message. |
| `AC-VAL2-004` | Given a posted-document compliance rule uses a snapshot field, when the live customer master changes later, then the posted validation result remains based on the frozen snapshot. |
| `AC-VAL2-005` | Given a provider-backed blocking rule and provider timeout policy = fail_closed, when provider is unavailable, then operation is blocked with configured safe message. |
| `AC-VAL2-006` | Given a warning requiring acknowledgment, when the warning fires and acknowledgment is not supplied, then the operation cannot complete; when acknowledgment is supplied, then operation may continue and acknowledgment is audited. |
| `AC-VAL2-007` | Given a derived field is referenced before its declared readiness phase, when activation is attempted, then compiler blocks activation. |
| `AC-VAL2-008` | Given an unauthorized user attempts an action, when runtime evaluates request, then authorization failure is returned without leaking hidden validation details. |
| `AC-VAL2-009` | Given lower-layer rule attempts to relax inherited compliance-critical rule without permission, when activation is attempted, then activation is blocked. |
| `AC-VAL2-010` | Given an import batch contains duplicate invoice numbers, when batch validation runs, then batch-level error is produced even if individual rows are otherwise valid. |
| `AC-VAL2-011` | Given an external entity is provider-capability-driven, when a local unsupported update rule is configured, then compiler blocks unsupported validation trigger. |
| `AC-VAL2-012` | Given an exact duplicate business rule with deterministic differentiators, when duplicate active line is added, then operation is blocked; given only similar but non-exact values, then ValidationRuleDefinition does not perform fuzzy matching. |
| `AC-VAL2-013` | Given dirty-field preview validation is requested, when a referenced field changes, then dependent preview rules are reevaluated; when final save occurs, then all authoritative blocking rules are reevaluated. |
| `AC-VAL2-014` | Given a temporal rule uses effective-dated relationship, when evaluation date is missing, then activation is blocked. |
| `AC-VAL2-015` | Given an active validation message template references a masked field value, when activation is attempted, then compiler blocks activation. |

---

# 25. Negative Scenarios

| Scenario | Expected Behavior |
|---|---|
| Rule requires user to fill a computed-only field | Activation blocked |
| Rule on virtual computed entity uses `on_save` trigger | Activation blocked |
| Provider validation has no failure policy | Activation blocked |
| Rule references disabled relation | Activation blocked |
| Rule uses raw SQL or arbitrary code | Activation blocked |
| UI hides field but backend validation still fails | UI must show safe remediation; backend remains authoritative |
| Lower layer disables platform compliance rule without permission | Activation blocked |
| Blocking rule uses unbounded related-record scan | Activation blocked or marked invalid for synchronous use |
| Cross-row duplicate validation configured as fuzzy name match | Rejected; use duplicate-detection capability |
| Validation message exposes Aadhaar/GSTIN raw value to unauthorized user | Activation blocked |
| External provider returns stale cached data beyond max age | Apply configured failure policy |
| Child collection rule passes header but invalid child row exists | Operation fails atomically |
| Rule uses live customer GSTIN for posted invoice legal check where snapshot required | Activation blocked or flagged as unsafe truth source |
| Rule defines both `fail_closed` and `fail_open_with_warning` | Activation blocked due to contradictory policy |
| Warning rule has no acknowledgment policy but is marked acknowledgment-required | Activation blocked |

---

# 26. Non-Functional Requirements

## 26.1 Performance
- Local record validations should be near-constant time.
- Bounded related-record validations must use indexed query bindings.
- Unbounded synchronous validation is prohibited.
- Runtime should support incremental rule reevaluation for preview, but authoritative commit validation must remain complete.

## 26.2 Reliability
- Validation execution must be deterministic within declared context.
- Provider failures must follow explicit policy.
- Validation failures must not produce partial commits.

## 26.3 Observability
- Rule executions, failures, bypasses, acknowledgments, provider failures, and simulation runs must be loggable.
- Critical rules must expose evaluation diagnostics to authorized admins without leaking sensitive data.

## 26.4 Localization
- Messages must use localization keys.
- Rule label and description should support translation in future scope.

## 26.5 Maintainability
- Rules must be versioned.
- Dependency graph must identify referenced fields, relationships, query bindings, providers, and derived fields.
- Test cases must be stored with rule metadata for regression.

---

# 27. Migration from Earlier Validation Model

## 27.1 What Remains Valid from v1
The following earlier concepts remain valid:
- validation rules are separate from UI reactions and security,
- multiple rules may apply,
- validation rules can block or warn,
- rule expressions must be sandboxed,
- backend enforcement is mandatory,
- bypass must be explicit and audited.

## 27.2 What Must Change
The following areas must be upgraded:
1. Replace single flat `ruleType` with richer classification dimensions.
2. Add child-row, child-collection, aggregate, temporal, provider, batch, and snapshot-aware validation support.
3. Add `truthSource` and `evaluationPhase`.
4. Add provider policy and failure handling.
5. Add message protection and localization.
6. Add warning acknowledgment model.
7. Add entity-archetype and field-archetype compatibility checks.
8. Add import batch and bulk validation support.
9. Add complexity scoring and query budget checks.
10. Separate structural uniqueness from operation-time duplicate validation more clearly.

---

# 28. AI Developer Guardrails

1. Do not implement `ValidationRuleDefinition` as a generic mutable rule engine.
2. Do not use raw SQL or eval-style code execution in validation expressions.
3. Do not let UI-only validation be the authoritative enforcement layer.
4. Do not assume every entity supports create/update validation.
5. Do not require user correction on system-derived, provider-owned, frozen, or projection-only fields.
6. Do not validate legal posted-document truth using live mutable master data when snapshot truth is required.
7. Do not use validation rules to do calculations, defaults, approval routing, security, or UI show/hide behavior.
8. Do not downgrade upstream blocking rules unless governance explicitly allows it.
9. Do not allow provider-backed validation without timeout/failure/freshness policy.
10. Do not allow synchronous rules with unbounded scans.
11. Do not use fuzzy duplicate detection inside validation rules.
12. Do not expose sensitive field values in user-facing messages.
13. Do not skip full validation on authoritative commit merely because preview validation passed.

---

# 29. Critical Review Checklist

Before marking this capability complete, confirm:

| Review Question | Must Be True |
|---|---|
| Are structural constraints and operation-time validations separated? | Yes |
| Can the model validate headers, lines, child collections, aggregates, relationships, and actions? | Yes |
| Can it distinguish live relation from snapshot truth? | Yes |
| Can it handle virtual, external, materialized, owned-child, and append-only entities? | Yes |
| Can it validate derived fields only after readiness? | Yes |
| Does provider validation have explicit failure policy? | Yes |
| Are warnings and acknowledgments first-class? | Yes |
| Are import row and import batch validations distinct? | Yes |
| Are messages safe for masked/hidden data? | Yes |
| Are lower-layer relaxations governed? | Yes |
| Are validation dependencies tracked? | Yes |
| Are performance budgets and unbounded scans controlled? | Yes |
| Is UI preview separated from backend authority? | Yes |
| Are test cases required for critical rules? | Yes |

---

# 30. Next Architecture Impact

After this corrected `ValidationRuleDefinition v2`, the following documents must be reviewed for alignment:

1. `SecurityDefinition`
   - message safety,
   - authorization-before-validation behavior,
   - bypass permission,
   - masked data exposure.

2. `RuntimeContractDefinition`
   - warning/acknowledgment contract,
   - field/child validation results,
   - provider capability and freshness exposure,
   - validation preview versus authoritative commit contract.

3. `Version_Dependency_Package_Model`
   - dependencies on fields, relationships, derivations, providers, query bindings, document types, and packages.

4. `ViewDefinition` and `UIReactionRuleDefinition`
   - UI requiredness mirroring,
   - safe display of validation locations,
   - preview behavior.

5. Future `ConstraintDefinition`
   - structural uniqueness,
   - database constraints,
   - exclusion constraints,
   - generated PostgreSQL enforcement metadata.

---

# 31. Reference Inputs Used

## Internal iDMS Inputs
- Current iDMS Entity Designer implementation extract: field behaviors, planned conditional presence, entity references, dependencies, compile readiness, actions, and layer governance.
- Existing metadata architecture observations: attributes include mandatory/nullable/read-only/virtual-field behavior; relations are first-class metadata; entity metadata includes runtime/persistence behavior.
- Existing Entity Studio rule guide: multiple validation rules per key and active/inactive validation status.
- Purchase Requisition FRD and validation catalogue: field-level, record-level, action-level, line-level, warning, and transition validation patterns.
- Revised `EntityDefinition v2`, `FieldDefinition v2`, and `RelationshipDefinition v2`.

## External Primary References
- Salesforce Metadata API — `ValidationRule`
  - https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_validationformulas.htm
- Salesforce Tooling API — `ValidationRule`
  - https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_validationrule.htm
- Microsoft Dataverse — business rules and validation concepts
  - https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-intro
  - https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-create-business-rule
- PostgreSQL — constraints
  - https://www.postgresql.org/docs/current/ddl-constraints.html
