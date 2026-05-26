# iDMS Admin Studio — EntityDefinition and Entity Creation Requirement Document v2
## Supersedes the earlier EntityDefinition requirement document
### Audience: Product, Architecture, Engineering, QA, AI Coding Agents
### Status: Revised Target Requirements
### Purpose: Define a complete enterprise-grade entity model for iDMS Admin Studio, including native, virtual, external, materialized, association, and owned entity patterns.

---

## 0. Supersession Note

This document **supersedes the earlier EntityDefinition requirement document**.

The earlier version was incomplete because it treated `Transaction / Master Data / Configuration / Ledger-like` as the primary entity classification and did not sufficiently model:

- Virtual / computed entities
- External / federated entities
- Materialized projection entities
- Save capability versus storage mode
- Lookup eligibility as an independent capability
- Importability, printability, and company/tenant scoping as independent capabilities
- Runtime source binding and source-of-truth ownership
- Difference between base entity, document type, and view overlay
- Difference between entity virtualization and field virtualization

The revised model below must be treated as the target truth for future implementation.

---

## 1. Design Objective

Entity Designer must not be a screen for only creating persisted database-backed business objects.

It must be able to define the full spectrum of enterprise entities used by iDMS:

1. Canonical persisted business entities
2. Virtual computed entities
3. External/federated entities
4. Materialized projection/read-model entities
5. Junction/association entities
6. Child/owned entities
7. High-volume or append-only entities
8. System/technical entities where required by the platform

The entity model must support both:
- **Business semantics**: What kind of object is this?
- **Runtime semantics**: Where does its data come from, can it be saved, and how is it consumed?

---

## 2. Non-Negotiable Architecture Principles

| Principle | Requirement |
|---|---|
| Separate business classification from runtime architecture | `Transaction`, `Master`, `Configuration`, and `Ledger-like` must not be the only entity classifiers. |
| Virtual is not one thing | iDMS must distinguish `virtual_computed`, `external_federated`, and `materialized_projection` entities. |
| Saveability is independent from storage | `Can Be Saved` must be a mutability policy, not assumed from entity category. |
| Lookup eligibility is independent | Any appropriate entity can be a lookup source; it must not be restricted only to Master entities. |
| Base entity is not document type | A document type or entity view is an overlay over a base entity, not a new canonical entity unless storage/lifecycle/identity materially differs. |
| Entity virtualization and field virtualization are orthogonal | A physical entity can contain virtual fields; a virtual entity can expose projected/computed fields. |
| Source of truth must be explicit | Every entity must declare whether iDMS, an external system, or a derived projection is the authoritative source. |
| Runtime capability must be explicit | Save, search, lookup, import, export, print, analytics, API exposure, and extension must be explicit capabilities. |
| No raw implementation assumptions | Entity creation must not automatically assume physical table, soft delete, workflow, global search, or CRUD actions. |
| Runtime must consume compiled metadata | Draft metadata must never be interpreted directly at runtime. |

---

## 3. Entity Classification Model

EntityDefinition must classify every entity across **five independent dimensions**.

### 3.1 Dimension 1 — Business Category

This describes the business nature of the entity.

| Business Category | Meaning | Examples |
|---|---|---|
| `master_data` | Stable business reference data | Customer, Vehicle, Part, Supplier |
| `transaction` | Operational document or business transaction | Service Job Card, Sales Invoice, Receipt |
| `configuration` | Business setup/configuration | Tax Rate, Price Type, Service Type |
| `ledger_like` | Financial or stock movement record where corrections are additive | Journal Entry, Stock Ledger |
| `reference` | Shared code/reference data | Country, State, Currency |
| `technical` | Platform-level internal entity | Audit Log, Integration Retry Queue |

**Rule:** Business category supplies defaults only. It must not fully determine persistence, mutability, lookup eligibility, or UI capabilities.

### 3.2 Dimension 2 — Entity Archetype

This describes the runtime nature of the entity.

| Entity Archetype | Meaning | Typical Use |
|---|---|---|
| `native_persistent` | Canonical data stored and owned by iDMS | Customer, Service Job Card |
| `virtual_computed` | Runtime-computed or query-backed entity with no authoritative persistence of its own | Customer 360 summary, open balance view |
| `external_federated` | Entity representing data owned by an external system | SAP Customer, OEM Vehicle Allocation |
| `materialized_projection` | Derived read model physically stored for speed/search/reporting, but not source of truth | Customer Search Projection, Job Card Analytics Snapshot |
| `junction_association` | Link entity joining two or more entities, optionally with its own attributes | Campaign-Applicable Model, Dealer-Scheme Mapping |
| `owned_child` | Child/detail entity whose lifecycle is owned by a parent | Invoice Line, Job Card Part Line |
| `append_only_record` | Immutable or near-immutable record stream | Ledger Line, Event Log, Audit Record |
| `system_technical` | Platform-managed technical object not normally created by business configurators | Metadata Compilation Job, Integration Webhook Delivery |

### 3.3 Dimension 3 — Persistence Mode

This describes how the entity is physically represented.

| Persistence Mode | Meaning | PostgreSQL-Oriented Mapping |
|---|---|---|
| `physical_table` | Native table with iDMS-owned persistence | Table |
| `extension_backed` | Canonical entity with extension storage for lower-layer fields | Base table + extension table |
| `view_backed` | Runtime query with no stored copy | PostgreSQL view |
| `materialized_view_backed` | Derived query persisted for performance | PostgreSQL materialized view or projection table |
| `foreign_table_backed` | External source exposed through database federation | PostgreSQL foreign table / FDW |
| `provider_backed` | External source accessed through service/connector/provider | API/provider binding |
| `stream_backed` | Event or append stream with specialized persistence | Event store / partitioned table |
| `none` | Metadata-only/system-only entity with no record persistence | No business record store |

### 3.4 Dimension 4 — Mutability Mode

This defines whether and how records can change.

| Mutability Mode | Meaning |
|---|---|
| `read_write` | Create, update, and allowed delete operations |
| `read_only` | No record create/update/delete through iDMS |
| `append_only` | Insert allowed; update/delete prohibited except controlled reversal/correction patterns |
| `system_managed` | Only system jobs/processes may mutate |
| `integration_write_only` | Only integrations/providers may write |
| `provider_capability_driven` | CRUD support depends on external provider capability |
| `derived_refresh_only` | Records refreshed/rebuilt from source; user cannot directly edit |

### 3.5 Dimension 5 — Scope Policy

This defines organizational ownership and data visibility.

| Scope Policy | Meaning |
|---|---|
| `global` | Shared across all tenants/companies where allowed |
| `tenant_scoped` | Isolated by tenant |
| `company_scoped` | Isolated by company/legal entity |
| `node_scoped` | Isolated by branch/node |
| `hierarchical_scope` | Access rolls up through hierarchy |
| `external_scope` | Scope inherited from provider/external system |
| `not_applicable` | Entity is not business-data scoped |

---

## 4. Critical Conceptual Distinctions

### 4.1 Entity vs Document Type vs View

| Concept | Meaning | Example |
|---|---|---|
| Entity | Canonical business object with its own identity, storage model, and runtime contract | `sales_order` |
| Document Type | Business variant of the same core entity | `vehicle_sales_order`, `parts_sales_order` |
| View | UI/runtime presentation of entity or document type | `sales_order_add_form`, `sales_order_index_list` |

**Rule:** Do **not** create a new entity when the requirement can be satisfied by a document type or view overlay over the same canonical data model.

Create a new entity only when one or more of the following materially differ:
- Source of truth
- Storage model
- Identity/key model
- Relationship ownership
- Record lifecycle
- Legal/accounting meaning
- Security boundary
- Integration contract

### 4.2 Virtual Entity vs Virtual Field

| Concept | Meaning |
|---|---|
| Virtual Entity | The entity itself has no canonical record store, or is sourced from a query/provider rather than owned persistence |
| Virtual Field | A field is computed/projected/non-persisted even when the parent entity is physical |

A physical entity can contain virtual fields.  
A virtual entity can contain projected or computed fields.  
They are related but not interchangeable concepts.

### 4.3 External/Federated Entity vs Virtual/Computed Entity

| Type | Source of Truth | Typical Persistence | Typical Mutability |
|---|---|---|---|
| External/Federated Entity | External system | External provider / foreign table / API | Provider-capability-driven |
| Virtual/Computed Entity | Derived from internal or mixed sources | None / view-backed | Usually read-only |
| Materialized Projection Entity | Derived from source entities | Stored projection / materialized view | Refresh-only |

---

## 5. Required Entity Archetypes

### 5.1 Native Persistent Entity

| Area | Requirement |
|---|---|
| Source of truth | iDMS |
| Typical persistence | Physical PostgreSQL table |
| Typical mutability | Read-write |
| Examples | Customer, Part, Service Job Card |
| Must support | Fields, relationships, validation rules, security, views, actions, APIs, imports, exports |
| Optional | Workflow, audit, soft delete, lookup eligibility, printability |

### 5.2 Virtual Computed Entity

| Area | Requirement |
|---|---|
| Source of truth | Derived from one or more source entities |
| Typical persistence | No own table; view/query/provider-backed |
| Typical mutability | Read-only |
| Examples | Customer 360 Summary, Dealer Outstanding Summary |
| Must support | Query binding, field mapping, security inheritance/resolution, refresh/query execution rules |
| Must not assume | Save, delete, import, workflow, direct field persistence |
| Optional | Lookup eligibility, searchability, export, analytics, cache policy |

### 5.3 External/Federated Entity

| Area | Requirement |
|---|---|
| Source of truth | External system |
| Typical persistence | Provider-backed or foreign-table-backed |
| Typical mutability | Provider-capability-driven; default read-only unless write support explicitly configured |
| Examples | OEM Vehicle Allocation, SAP Customer, External Warranty Claim |
| Must support | External data source/provider, external key, field mapping, timeout/retry policy, capability matrix, security mapping |
| Must not assume | iDMS owns lifecycle or physical table |
| Optional | Local cache, lookup eligibility, write-back, synchronization, import not applicable unless staged |

### 5.4 Materialized Projection Entity

| Area | Requirement |
|---|---|
| Source of truth | Derived from one or more source entities |
| Typical persistence | Materialized view or projection table |
| Typical mutability | Derived-refresh-only |
| Examples | Customer Search Projection, Service KPI Snapshot |
| Must support | Source binding, refresh policy, staleness policy, lineage, rebuild logic |
| Must not assume | User CRUD, direct validation lifecycle |
| Optional | Search, analytics, report builder, lookup use only if key stability guaranteed |

### 5.5 Junction / Association Entity

| Area | Requirement |
|---|---|
| Source of truth | iDMS or external depending design |
| Typical persistence | Physical table |
| Typical mutability | Read-write or constrained |
| Examples | Campaign-Applicable Model, Dealer-Scheme Mapping |
| Must support | At least two relationship bindings, uniqueness policy, optional payload attributes, duplicate prevention |
| Must not be modeled as | Multi-select text or arbitrary JSON list when relationship semantics matter |

### 5.6 Owned Child Entity

| Area | Requirement |
|---|---|
| Source of truth | Parent-owned within iDMS |
| Typical persistence | Physical table linked to parent |
| Typical mutability | Governed by parent lifecycle |
| Examples | Sales Invoice Line, Job Card Part Line |
| Must support | Owning parent relation, orphan policy, cascade/archive policy, parent-state edit restrictions |
| Must not assume | Independent lifecycle, independent menu, independent global search |

### 5.7 Append-Only Record Entity

| Area | Requirement |
|---|---|
| Source of truth | iDMS |
| Typical persistence | Physical or partitioned table |
| Typical mutability | Append-only |
| Examples | Journal Line, Stock Ledger Line, Audit Record |
| Must support | Immutable entry model, correction/reversal pattern, retention/partition profile |
| Must not allow | Ordinary edit/delete after commit |

### 5.8 System / Technical Entity

| Area | Requirement |
|---|---|
| Source of truth | Platform |
| Typical persistence | Physical/system-managed |
| Typical mutability | System-managed |
| Examples | Compilation Job, Webhook Delivery, Metadata Lock |
| Must support | System ownership, restricted visibility, technical lifecycle |
| Must not be exposed to | Business configurators by default |

---

## 6. Entity Creation Decision Flow

Entity creation must be redesigned as a guided architecture workflow.

### 6.1 Step 1 — Select Creation Origin

| Origin | Meaning |
|---|---|
| `template` | Start from a governed template |
| `blank` | Start from scratch |
| `extend` | Add an overlay to an existing entity |
| `clone` | Duplicate a definition as a separate starting point |
| `package` | Install from package |
| `discover_external` | Create from external provider/catalog |

### 6.2 Step 2 — Select Entity Archetype

Mandatory selection:
- Native Persistent
- Virtual Computed
- External/Federated
- Materialized Projection
- Junction/Association
- Owned Child
- Append-only Record
- System/Technical

### 6.3 Step 3 — Select Business Category

Only where applicable:
- Master Data
- Transaction
- Configuration
- Ledger-like
- Reference
- Technical

### 6.4 Step 4 — Define Source of Truth and Persistence

Mandatory fields vary by archetype.

| Archetype | Mandatory setup |
|---|---|
| Native Persistent | table strategy, primary key strategy |
| Virtual Computed | source/query binding |
| External/Federated | provider/data source, external key |
| Materialized Projection | source/query binding, refresh policy |
| Junction | participating relationships |
| Owned Child | owning parent relation |
| Append-only | append policy, correction model |
| System Technical | owning subsystem |

### 6.5 Step 5 — Define Identity

| Attribute | Requirement |
|---|---|
| Stable entity ID | System generated, immutable |
| API name | Unique, stable, locked after activation |
| Label / plural label | User-facing |
| Display field | Required if lookup/search/displayable |
| Key strategy | Surrogate UUID, natural key, composite key, external key |
| Namespace/package | Required where package-owned |

### 6.6 Step 6 — Define Scope and Ownership

| Attribute | Requirement |
|---|---|
| Owning layer | Platform / Vertical / Tenant / Node |
| Owning package | Required if package-delivered |
| Scope policy | Global / tenant / company / node / hierarchical / external |
| Company-specific behavior | Must be derived from scope policy, not just a loose boolean |

### 6.7 Step 7 — Define Runtime Capability Profile

Capabilities must be explicit and independent.

| Capability | Examples |
|---|---|
| Can be saved | Whether records can be created/updated through iDMS |
| Lookup source | Whether entity can be referenced in lookup fields |
| Importable | Whether import contracts are allowed |
| Exportable | Whether exports are allowed |
| Printable | Whether print output is valid |
| Searchable | Whether global/entity search is supported |
| Reportable | Whether report/analytics use is allowed |
| API exposed | Whether runtime API is generated |
| Extendable | Whether downstream layers may add fields/behaviors |
| Company/tenant scoped | Whether data isolation applies |
| Cacheable | Whether runtime caching is allowed |
| Offline-enabled | Whether offline sync is allowed |

### 6.8 Step 8 — Define Lifecycle and Governance

| Requirement |
|---|
| Metadata lifecycle must exist for every entity |
| Record lifecycle is optional and only applies where meaningful |
| Virtual/external/materialized entities must not be forced into business workflow by default |
| Dependency registration must be active from initial creation |
| Compile validation must run before activation |
| Package/version ownership must be captured from creation |

### 6.9 Step 9 — Review and Compile

Review must display:
- Business category
- Entity archetype
- Persistence mode
- Mutability mode
- Source of truth
- Scope policy
- Runtime capabilities
- Storage/source binding
- Required downstream dependencies
- Risks and compile errors

---

## 7. EntityDefinition Metadata Model

### 7.1 Identity Block

| Field | Requirement |
|---|---|
| `entityId` | Immutable system ID |
| `apiName` | Stable unique technical name |
| `label` | Singular label |
| `pluralLabel` | Plural label |
| `description` | Business purpose |
| `namespace` | Package/module namespace |
| `entityCode` | Optional short code |
| `iconRef` | Optional UI icon |

### 7.2 Classification Block

| Field | Requirement |
|---|---|
| `businessCategory` | One of the defined business categories |
| `entityArchetype` | One of the defined archetypes |
| `businessObjectType` | Optional more-specific subtype |
| `domain` | Sales, Service, Finance, etc. |
| `module` | Product module ownership |
| `industryVertical` | Optional vertical ownership |

### 7.3 Source-of-Truth Block

| Field | Requirement |
|---|---|
| `sourceOfTruthType` | `idms`, `external_system`, `derived`, `platform` |
| `sourceEntityIds` | Required for derived/projection entities |
| `externalSystemCode` | Required for external entities |
| `lineageDescription` | Required for derived/materialized entities |

### 7.4 Persistence Block

| Field | Requirement |
|---|---|
| `persistenceMode` | Defined persistence mode |
| `tableName` | Required for physical entities |
| `extensionTableName` | Optional/required when extension-backed |
| `viewName` | Required for view-backed |
| `materializedViewName` | Required for materialized |
| `foreignTableName` | Required for FDW-backed |
| `providerBindingId` | Required for provider-backed |
| `partitionPolicyId` | Optional/high-volume |
| `refreshPolicyId` | Required for materialized projection |
| `cachePolicyId` | Optional |

### 7.5 Mutability Block

| Field | Requirement |
|---|---|
| `mutabilityMode` | Defined mutability mode |
| `canCreate` | Boolean/effective capability |
| `canUpdate` | Boolean/effective capability |
| `canDelete` | Boolean/effective capability |
| `canSave` | Effective summary capability |
| `writebackPolicyId` | Required for external writable entities |
| `correctionPolicyId` | Required for append-only/ledger-like entities |

### 7.6 Identity and Key Block

| Field | Requirement |
|---|---|
| `primaryKeyStrategy` | `uuid`, `natural`, `composite`, `external` |
| `primaryKeyFields` | Required fields |
| `externalKeyFields` | Required for external entities |
| `displayFieldId` | Required for lookup/displayable entities |
| `dedupePolicyId` | Required for importable entities |

### 7.7 Scope Block

| Field | Requirement |
|---|---|
| `scopePolicy` | Defined scope policy |
| `tenantFieldId` | Required if tenant scoped |
| `companyFieldId` | Required if company scoped |
| `nodeFieldId` | Required if node scoped |
| `securityInheritancePolicyId` | Optional |

### 7.8 Capability Block

| Field | Requirement |
|---|---|
| `lookupEligible` | Independent capability |
| `importable` | Independent capability |
| `exportable` | Independent capability |
| `printable` | Independent capability |
| `searchable` | Independent capability |
| `reportable` | Independent capability |
| `apiExposed` | Independent capability |
| `extendable` | Independent capability |
| `offlineEnabled` | Independent capability |
| `cacheable` | Independent capability |

### 7.9 Governance Block

| Field | Requirement |
|---|---|
| `owningLayer` | Platform / Vertical / Tenant / Node |
| `owningPackageId` | Package ownership |
| `protected` | Whether downstream mutation is restricted |
| `extensionPolicyId` | Downstream extension rules |
| `overridePolicyId` | Downstream override rules |
| `dataClassificationDefault` | Default classification for entity records |
| `auditPolicyId` | Entity audit policy |

### 7.10 Lifecycle Block

| Field | Requirement |
|---|---|
| `metadataStatus` | Draft / Active / Deprecated / Retired |
| `recordLifecycleModelId` | Optional; required only where meaningful |
| `activationPolicyId` | Compile/publish requirement |
| `retirementPolicyId` | Deactivation/retirement behavior |

### 7.11 Runtime Binding Block

| Field | Requirement |
|---|---|
| `repositoryBindingId` | Repository/store adapter |
| `queryBindingId` | Required for virtual/materialized |
| `providerBindingId` | Required for external |
| `apiContractId` | Optional/runtime API |
| `runtimeResolverHints` | Optional performance/runtime hints |

---

## 8. Capability Matrix by Archetype

| Capability | Native Persistent | Virtual Computed | External/Federated | Materialized Projection | Junction | Owned Child | Append-only |
|---|---:|---:|---:|---:|---:|---:|---:|
| Can save | Usually Yes | No | Provider-driven | No | Yes | Parent-driven | Insert only |
| Lookup eligible | Configurable | Configurable | Configurable | Configurable with stable key | Rare/Configurable | Usually No | Usually No |
| Importable | Configurable | No | Usually No | No | Configurable | Parent-driven | Usually No |
| Printable | Configurable | Usually No | Configurable | Usually No | No | Parent-driven | No |
| Searchable | Configurable | Configurable | Configurable | Usually Yes | Configurable | Parent-driven | Configurable |
| Reportable | Configurable | Usually Yes | Configurable | Usually Yes | Configurable | Configurable | Usually Yes |
| Workflow eligible | Configurable | Usually No | Usually No | No | Usually No | Parent-driven | Usually No |
| Extension eligible | Configurable | Limited | Limited | No/limited | Configurable | Limited | Usually No |

---

## 9. Compile-Time Validation Rules

### 9.1 Universal Rules

| Rule ID | Validation |
|---|---|
| ENT.VAL.001 | `apiName` must be unique and immutable after activation. |
| ENT.VAL.002 | Every entity must have `businessCategory`, `entityArchetype`, `persistenceMode`, `mutabilityMode`, and `scopePolicy`. |
| ENT.VAL.003 | Every entity must declare a source of truth. |
| ENT.VAL.004 | Lookup-eligible entities must have stable key and display field. |
| ENT.VAL.005 | Importable entities must have import contract and dedupe/upsert policy. |
| ENT.VAL.006 | Company/tenant/node-scoped entities must have matching scope fields or scope provider binding. |
| ENT.VAL.007 | Runtime may consume only compiled active metadata. |

### 9.2 Archetype-Specific Rules

| Rule ID | Validation |
|---|---|
| ENT.VAL.101 | `virtual_computed` entities cannot be `read_write`. |
| ENT.VAL.102 | `virtual_computed` entities must have `queryBindingId` or equivalent source binding. |
| ENT.VAL.103 | `external_federated` entities must have `externalSystemCode`, `providerBindingId`, and external key mapping. |
| ENT.VAL.104 | External entities are read-only by default unless explicit provider write capability is configured. |
| ENT.VAL.105 | `materialized_projection` entities must define source lineage, refresh policy, and staleness policy. |
| ENT.VAL.106 | `materialized_projection` entities cannot be treated as canonical source-of-truth entities. |
| ENT.VAL.107 | `junction_association` entities must define required participating relationships and duplicate-prevention policy. |
| ENT.VAL.108 | `owned_child` entities must define owning parent, orphan policy, and parent lifecycle dependency. |
| ENT.VAL.109 | `append_only_record` entities must not allow ordinary update/delete after commit. |
| ENT.VAL.110 | `system_technical` entities must be hidden from ordinary business configurators unless explicitly exposed. |

---

## 10. PostgreSQL-Oriented Storage Guidance

| Entity Pattern | PostgreSQL-Oriented Strategy |
|---|---|
| Native persistent | Physical table |
| Extension-backed canonical entity | Base table + extension table |
| Virtual computed | PostgreSQL view or service query binding |
| Materialized projection | Materialized view or projection table with refresh process |
| External/federated | Foreign table / FDW or provider-backed API adapter |
| High-volume append-only | Partitioned table and retention policy |
| Junction | Physical table with unique composite constraint |

**Rule:** PostgreSQL implementation detail must be available to architects/developers but hidden from ordinary business configurators.

---

## 11. Creation Wizard Requirements

### 11.1 Required Wizard Sections

| Step | Section |
|---|---|
| 1 | Creation Origin |
| 2 | Entity Archetype |
| 3 | Business Classification |
| 4 | Source of Truth & Persistence |
| 5 | Identity & Key Strategy |
| 6 | Scope & Ownership |
| 7 | Runtime Capability Profile |
| 8 | Lifecycle & Governance |
| 9 | Review & Compile |

### 11.2 Conditional Wizard Behavior

| Condition | Required UI Behavior |
|---|---|
| Entity Archetype = Virtual Computed | Show query/source binding; hide ordinary save/delete options by default |
| Entity Archetype = External/Federated | Show provider, data source, external key, provider capability matrix |
| Entity Archetype = Materialized Projection | Show source entities, refresh policy, staleness tolerance |
| Entity Archetype = Junction | Show participating relationships and duplicate prevention |
| Entity Archetype = Owned Child | Show owning parent, orphan handling, relation behavior |
| Mutability = Append-only | Disable edit/delete after commit; require correction policy |
| Lookup Eligible = true | Require display field + search field config |
| Importable = true | Require import contract + dedupe/upsert strategy |
| Scope Policy = Company/Tenant/Node | Require matching scope binding |
| Source of Truth = external | Prevent assumptions that iDMS owns record lifecycle |

---

## 12. Defaults and Inference Rules

| Input | Default Outcome |
|---|---|
| Business Category = `master_data` | Suggest read-write, lookup-eligible, searchable |
| Business Category = `transaction` | Suggest read-write, workflow-capable, printable optional |
| Business Category = `ledger_like` | Suggest append-only, no ordinary delete |
| Archetype = `virtual_computed` | Default read-only, non-importable, non-saveable |
| Archetype = `external_federated` | Default provider-capability-driven, read-only until provider says otherwise |
| Archetype = `materialized_projection` | Default derived-refresh-only, reportable/searchable |
| Archetype = `owned_child` | Default parent-driven lifecycle, no standalone menu |
| Archetype = `junction_association` | Default no standalone workflow unless explicitly required |

**Rule:** Defaults are suggestions. Final capability resolution must be explicit and compiler-validated.

---

## 13. Examples

### 13.1 Native Persistent — Customer

```json
{
  "apiName": "customer",
  "businessCategory": "master_data",
  "entityArchetype": "native_persistent",
  "sourceOfTruthType": "idms",
  "persistenceMode": "physical_table",
  "mutabilityMode": "read_write",
  "scopePolicy": "tenant_scoped",
  "lookupEligible": true,
  "importable": true,
  "searchable": true
}
```

### 13.2 Virtual Computed — Customer 360 Summary

```json
{
  "apiName": "customer_360_summary",
  "businessCategory": "reference",
  "entityArchetype": "virtual_computed",
  "sourceOfTruthType": "derived",
  "sourceEntityIds": ["customer", "vehicle", "sales_invoice", "service_job_card"],
  "persistenceMode": "view_backed",
  "mutabilityMode": "read_only",
  "scopePolicy": "tenant_scoped",
  "lookupEligible": false,
  "reportable": true,
  "searchable": false
}
```

### 13.3 External/Federated — OEM Vehicle Allocation

```json
{
  "apiName": "oem_vehicle_allocation",
  "businessCategory": "reference",
  "entityArchetype": "external_federated",
  "sourceOfTruthType": "external_system",
  "externalSystemCode": "OEM_PORTAL",
  "persistenceMode": "provider_backed",
  "providerBindingId": "provider_oem_allocation",
  "mutabilityMode": "provider_capability_driven",
  "scopePolicy": "external_scope",
  "lookupEligible": true,
  "searchable": true
}
```

### 13.4 Materialized Projection — Customer Search Projection

```json
{
  "apiName": "customer_search_projection",
  "businessCategory": "reference",
  "entityArchetype": "materialized_projection",
  "sourceOfTruthType": "derived",
  "sourceEntityIds": ["customer", "customer_address", "customer_contact"],
  "persistenceMode": "materialized_view_backed",
  "mutabilityMode": "derived_refresh_only",
  "refreshPolicyId": "customer_search_refresh_realtime",
  "scopePolicy": "tenant_scoped",
  "lookupEligible": true,
  "searchable": true
}
```

---

## 14. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| AC-ENT-001 | User can create a native persistent entity with source of truth, storage, mutability, scope, and capability metadata explicitly captured. |
| AC-ENT-002 | User can create a virtual computed entity without assigning a physical table and cannot enable ordinary save operations unless an approved writeback pattern exists. |
| AC-ENT-003 | User can create an external/federated entity by selecting provider/data source, external keys, and provider capability matrix. |
| AC-ENT-004 | User can create a materialized projection entity with source lineage and refresh policy. |
| AC-ENT-005 | Lookup eligibility is configurable independently of business category and requires a stable key plus display field. |
| AC-ENT-006 | Company/tenant/node scoping cannot be activated without a valid scope binding. |
| AC-ENT-007 | A document type or entity view can be created as an overlay without creating a new base entity when canonical storage and lifecycle remain shared. |
| AC-ENT-008 | Compiler blocks activation if entity archetype and mutability/persistence configuration conflict. |
| AC-ENT-009 | Runtime contract exposes only compiled active metadata, never draft metadata. |
| AC-ENT-010 | Existing physical entities may contain virtual fields without becoming virtual entities. |

---

## 15. Negative Scenarios and Validation Messages

| Scenario | Expected System Response |
|---|---|
| Virtual computed entity configured as ordinary read-write | Block save: `Virtual computed entities cannot be configured for ordinary direct writes.` |
| External entity created without provider binding | Block save: `External/federated entity requires a provider binding and external key mapping.` |
| Materialized projection without refresh policy | Block save: `Materialized projection requires a refresh policy.` |
| Lookup eligible entity without display field | Block save: `Lookup-eligible entity requires a display field.` |
| Company-scoped entity without company binding | Block save: `Company-scoped entity requires a company scope field or scope provider.` |
| Owned child entity without parent relation | Block save: `Owned child entity requires an owning parent relationship.` |
| Append-only entity with ordinary delete enabled | Block activation: `Append-only entities cannot allow ordinary delete operations.` |
| User creates Vehicle Sales Order as a new entity while base Sales Order entity already covers same canonical model | System should warn: `This requirement may be better modeled as a document type or view overlay over the existing Sales Order entity.` |

---

## 16. Out of Scope for This Requirement

| Area | Reason |
|---|---|
| Event-definition metadata | Must remain a separate `EventDefinition` artifact, not forced into CRUD entity design |
| Full connector implementation | Covered by provider/integration architecture |
| Full query language builder | Covered by query binding design |
| Full UI layout builder | Covered by ViewDefinition |
| Field-level storage detail | Covered by FieldDefinition |
| Relationship behavior detail | Covered by RelationshipDefinition |

---

## 17. Migration Impact on Current Design

The existing Entity Designer implementation already has useful foundations:
- Entity identity
- Template / blank / extend creation
- Business categories
- Compile readiness
- Layer ownership
- Field storage types including virtual and persisted computed fields

However, the current entity creation model must be expanded because it currently:
- Overloads business category as if it defines full entity behavior
- Auto-infers lookup eligibility too narrowly
- Assumes saveability and persistence too implicitly
- Does not expose virtual/external/materialized entity archetypes
- Does not model source-of-truth ownership
- Does not distinguish base entity from document type/view overlay during creation

The recommended approach is **evolution, not rewrite**:
1. Preserve existing entity identity/category model.
2. Add archetype, persistence, mutability, source-of-truth, and scope dimensions.
3. Refactor behavior flags into an explicit capability profile.
4. Add archetype-aware compile validation.
5. Update templates to be archetype-specific rather than category-only.

---

## 18. Recommended Implementation Sequence

| Phase | Scope |
|---|---|
| 1 | Add missing metadata fields to EntityDefinition model |
| 2 | Add entity archetype, persistence mode, mutability mode, source-of-truth, and scope policy enums |
| 3 | Refactor current behavior flags into explicit capability profile |
| 4 | Add archetype-specific compile validations |
| 5 | Update creation wizard flow |
| 6 | Add templates: Native Master, Native Transaction, Virtual Computed, External Lookup, Materialized Projection, Junction, Owned Child |
| 7 | Add runtime contract resolution updates |
| 8 | Add migration guidance for existing implemented entities |

---

## 19. Final Product Position

Entity Designer must be capable of defining not only **what data exists**, but also:

- where it comes from,
- where it lives,
- whether iDMS owns it,
- whether it can be saved,
- how it is scoped,
- whether it can be used as lookup/search/reporting source,
- whether it is canonical, derived, external, or projection-based,
- and whether the requirement should be modeled as a new entity at all.

Without these distinctions, Entity Designer remains a database-backed form builder.  
With these distinctions, it becomes a genuine enterprise metadata platform.