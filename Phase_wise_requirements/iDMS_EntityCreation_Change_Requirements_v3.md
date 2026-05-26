# iDMS Admin Studio — Entity Creation Change Requirements v3

**Document Type:** Developer Change Requirements  
**Module:** Admin Studio → Entity Designer → Entity Creation Wizard  
**Audience:** Product Owner, Solution Architect, AI/Codex Developer, Backend Developer, Frontend Developer, QA  
**Status:** Implementation-ready draft  
**Date:** 2026-05-12  
**Supersedes:** Existing `entity-creation-guide.md` implementation behavior wherever this document explicitly changes it.

---

## 1. Objective

Enhance the existing Entity Creation wizard so that it becomes an enterprise-grade metadata creation flow, not only a business-friendly schema shell creator.

The current wizard already supports:
- Create from Template
- Create from Blank
- Extend Existing Entity
- Archetypes such as Native Persistent, Virtual Computed, External/Federated, Materialized Projection, Junction/Association, Owned Child, Append-Only, and System/Technical
- Identity, scope, capability profile, and review/create flow

This change requirement preserves the above foundation but adds missing enterprise capabilities, stricter metadata validation, better source-of-truth handling, provider capability handling, safer key design, and clearer distinction between business object types.

---

## 2. Current Problem Summary

The existing wizard is good as a business guide, but it is not sufficient as an implementation-grade Entity Creation capability.

### Key issues

1. Missing entity archetypes:
   - Activity / Interaction Entity
   - Staging / Import Entity
   - High-Volume / Event Log Entity
   - Integration Event / Outbox Entity
   - Posting Document Entity
   - Reference / Code Entity

2. External/Federated entity setup is under-specified.
   - Current behavior captures only `externalSystemCode`.
   - This must be replaced or extended with a Provider Capability Contract.

3. Primary key strategy is risky.
   - Users should not casually choose natural/composite/external as the physical primary key.
   - iDMS-owned entities should use internal UUID as the physical primary key.
   - Natural, composite, and external keys should be alternate/business/external keys.

4. Owned Child behavior is too simplistic.
   - Current guide implies child records cascade when parent is deleted.
   - Deletion and mutation must be lifecycle-aware.

5. Append-only is overused.
   - Payment Receipt is not always pure append-only.
   - Many financial documents are editable in Draft and immutable only after Posting.
   - Add Posting Document Entity.

6. Node-level isolation language is too absolute.
   - Node-owned data may still be visible upward based on hierarchy/security.
   - “Never visible to another branch” must not be hardcoded.

7. Capability toggles are too simplistic.
   - Capabilities must store requested value, effective value, lock state, source, and lock reason.

8. Missing decision gate.
   - The system must ask whether a new entity is really required.
   - Many cases should be document type, view, field, relation, workflow, projection, or package extension instead.

9. Missing compile-time blockers.
   - The wizard must prevent invalid archetype/capability/storage/provider combinations before draft creation or before publish.

---

## 3. Design Principles

The developer must follow these non-negotiable rules:

1. Entity Creation must create a governed metadata object, not just a table/schema shell.
2. Entity archetype, business category, source-of-truth, persistence mode, mutability mode, scope policy, and capability profile must be separate metadata dimensions.
3. Do not treat `Transaction / Master / Configuration / Ledger-like` as complete entity classification.
4. Do not hard-lock all external entities as read-only. External mutability depends on provider capability.
5. Do not allow business users to choose physical natural/composite/external primary keys directly.
6. Always use internal UUID as the physical primary key for iDMS-owned persisted entities.
7. Owned-child delete/update behavior must be lifecycle-aware.
8. UI capability toggles must not bypass compiler validation.
9. Node scope must support hierarchy roll-up when security policy allows.
10. No entity becomes Active without metadata compiler validation and release package publication.

---

## 4. Revised Entity Creation Wizard Flow

### 4.1 Current flow

```text
Origin → [Archetype] → [Source] → Identity → Scope → Capabilities → Review
Origin → Template → Identity → Scope → Capabilities → Review
Origin → Base Entity → Identity → Review
```

### 4.2 Required flow

```text
0. Entity Creation Decision Gate
1. Origin
2. Archetype
3. Source / Provider / Package / Derivation
4. Identity
5. Key & Numbering
6. Storage & Persistence
7. Scope & Ownership
8. Security Defaults
9. Capability Profile
10. System Fields & Required Policies
11. Compile Preview
12. Review & Create Draft Shell
```

---

## 5. Step 0 — Entity Creation Decision Gate

### 5.1 Purpose

Before opening the full wizard, the system must help the user decide whether a new entity is truly required.

### 5.2 UI behavior

Show a decision panel with the question:

> “Are you sure this should be a new Entity?”

The user must choose one of the following:

| Option | Description | Result |
|---|---|---|
| Create new entity | User needs a distinct business object with own metadata contract | Continue to wizard |
| Extend existing entity | User needs tenant/vertical/node additions | Redirect to Extend flow |
| Create document type | User needs variation of existing document | Redirect to Document Type flow or show “coming soon” |
| Create field | User only needs more data on existing entity | Redirect to Field creation |
| Create relationship / child grid | User needs related records | Redirect to Relationship or Relation View creation |
| Create view | User needs a different screen/list/print layout | Redirect to View Designer |
| Create projection/reporting model | User needs derived reporting/search model | Continue with Materialized Projection / Virtual Computed |
| Install package | User wants pre-built metadata bundle | Continue with Install from Package |

### 5.3 Validation

If the user selects “Create new entity,” system must show a confirmation note:

> “Create a new entity only when the object has its own identity, lifecycle, storage, security boundary, or source-of-truth.”

---

## 6. Step 1 — Origin

### 6.1 Existing options to keep

1. Create from Template
2. Create from Blank
3. Extend Existing Entity

### 6.2 New required option

4. Install from Package

### 6.3 Origin behavior

| Origin | Behavior |
|---|---|
| Template | Pre-fills archetype, category, system fields, default lifecycle, default capabilities |
| Blank | Allows expert configuration |
| Extend Existing Entity | Inherits base metadata and creates downstream overlay |
| Install from Package | Installs versioned metadata bundle with package ownership and upgrade path |

### 6.4 Package origin requirements

When user selects **Install from Package**, system must show:
- Package name
- Version
- Publisher
- Included entities
- Dependencies
- Upgrade policy
- Locked metadata
- Extension points
- Install impact preview

---

## 7. Step 2 — Revised Archetype Catalogue

### 7.1 Existing archetypes to keep

| Archetype | Keep? | Notes |
|---|---|---|
| Native Persistent | Yes | Standard iDMS-owned persisted entity |
| Virtual Computed | Yes | Must require Query Binding / Dataset Definition |
| External / Federated | Yes | Must require Provider Capability Contract |
| Materialized Projection | Yes | Must require refresh/rebuild policy |
| Junction / Association | Yes | Must define endpoints and uniqueness |
| Owned Child | Yes | Must require parent relationship and lifecycle behavior |
| Append-Only Record | Yes | Use for pure immutable event/ledger records |
| System / Technical | Yes | Platform/engineering only |

### 7.2 New archetypes to add

#### 7.2.1 Activity / Interaction Entity

**Purpose:** Capture tasks, calls, appointments, follow-ups, service reminders, campaign activities, customer interactions, and operational work items.

**Default characteristics:**
- Physical table
- Read/write
- Owner/assignee required
- Due date optional/required based on activity type
- Status lifecycle required
- Timeline eligible
- Notification/reminder eligible
- Polymorphic related-to relationship allowed

**Required system fields:**
- `activity_id`
- `subject`
- `activity_type`
- `status`
- `owner_id`
- `assigned_to_id`
- `start_datetime`
- `due_datetime`
- `completed_at`
- `related_entity_type`
- `related_record_id`

**Examples:**
- Customer Follow-up
- Test Drive Appointment
- Service Reminder
- Complaint Follow-up
- Technician Task

---

#### 7.2.2 Staging / Import Entity

**Purpose:** Temporarily hold imported or integrated data before validation and promotion to target entities.

**Default characteristics:**
- Physical table
- Batch-owned
- Validation-heavy
- Temporary/retention-bound
- Search disabled by default
- Reportable disabled by default
- Importable enabled by design
- Promotion required before business use

**Required system fields:**
- `staging_record_id`
- `batch_id`
- `source_file_name`
- `row_number`
- `raw_payload`
- `validation_status`
- `validation_errors`
- `target_entity_api_name`
- `target_record_id`
- `processed_at`

**Examples:**
- Customer Import Staging
- Vehicle Stock Import Staging
- Part Price Import Staging
- Bank Statement Import Staging
- OEM Allocation Staging

---

#### 7.2.3 High-Volume / Event Log Entity

**Purpose:** Store large-volume, append-heavy, often time-series or telemetry-like data.

**Default characteristics:**
- Append-only
- Partitioned by time/tenant/source
- Retention policy required
- Search limited
- Reportable through projections
- Not suitable for complex relational joins
- Not editable after insert

**Required system fields:**
- `event_id`
- `event_type`
- `event_timestamp`
- `source_system`
- `tenant_id`
- `node_id`
- `payload`
- `partition_key`
- `retention_until`

**Examples:**
- API Request Log
- Sync Event Log
- Notification Delivery Log
- Call Event Log
- Audit Event Stream

---

#### 7.2.4 Integration Event / Outbox Entity

**Purpose:** Reliable event publishing, retry handling, and outbound integration delivery.

**Default characteristics:**
- Append-only
- Status-driven
- Retryable
- Idempotency key required
- Payload stored
- Integration-owned
- Not user-editable except retry/cancel actions

**Required system fields:**
- `outbox_event_id`
- `event_name`
- `aggregate_entity_api_name`
- `aggregate_record_id`
- `payload`
- `idempotency_key`
- `delivery_status`
- `retry_count`
- `next_retry_at`
- `last_error`
- `published_at`

**Examples:**
- SalesInvoicePosted
- JobCardClosed
- CustomerUpdated
- PaymentReceiptPosted
- OEMSyncFailed

---

#### 7.2.5 Posting Document Entity

**Purpose:** Business document that is editable in draft but immutable after posting.

**Default characteristics:**
- Physical table
- Draft editable
- Posted immutable
- Reversal/cancellation policy required
- Document numbering required
- Audit required
- Workflow/lifecycle required
- Print eligible optional

**Required system fields:**
- `document_id`
- `document_no`
- `document_date`
- `posting_status`
- `posted_at`
- `posted_by`
- `reversal_of_document_id`
- `cancelled_at`
- `cancelled_by`
- `cancellation_reason`

**Examples:**
- Sales Invoice
- Payment Receipt
- Journal Voucher
- Cash Deposit Voucher
- Stock Adjustment Document

---

#### 7.2.6 Reference / Code Entity

**Purpose:** Stable lookup/code data, often global or tenant-overridable, with localization and effective-date behavior.

**Default characteristics:**
- Lookup eligible
- Cacheable
- Usually global or tenant-scoped
- Low-volume
- Active/inactive lifecycle
- Optional language labels
- Optional effective dating

**Required system fields:**
- `code_id`
- `code`
- `label`
- `description`
- `status`
- `effective_from`
- `effective_to`
- `sort_order`

**Examples:**
- Currency
- Unit of Measure
- Country Code
- Tax Category
- Reason Code

---

## 8. Step 3 — Source / Provider / Derivation

### 8.1 Virtual Computed

Do not allow only “source entities.” Require a **Query Binding / Dataset Definition**.

Required fields:
- Source entities
- Join model
- Filters
- Aggregations
- Security filter strategy
- Query mode: SQL view / runtime query / dataset resolver
- Cache policy
- Maximum expected row count
- Query performance budget

Validation:
- Block if no query binding is defined.
- Block if source entity is not active.
- Block if query references fields user cannot access without security filtering.
- Warn if row count estimate exceeds threshold.

---

### 8.2 External / Federated

Replace or extend `externalSystemCode` with **Provider Capability Contract**.

Required fields:
- `externalSystemCode`
- `providerAdapterCode`
- `providerEntityName`
- `authMode`
- `sourceOfTruth`
- `readSupported`
- `createSupported`
- `updateSupported`
- `deleteSupported`
- `actionSupported`
- `filterSupported`
- `sortSupported`
- `searchSupported`
- `paginationSupported`
- `expandSupported`
- `userContextPropagation`
- `timeoutMs`
- `retryPolicy`
- `cachePolicy`
- `errorMappingPolicy`

Validation:
- Block if provider adapter is not selected.
- Block if API exposed is ON but auth/security mapping is missing.
- Block if offline enabled is ON without sync contract.
- Lock capabilities based on provider capability.
- Do not hard-lock save to OFF; derive save capability from provider.

---

### 8.3 Materialized Projection

Required fields:
- Source entities
- Projection query/dataset
- Refresh mode: full / incremental
- Refresh trigger: scheduled / event-based / manual
- Refresh frequency
- Freshness SLA
- Stale data display policy
- Failure behavior
- Retry policy
- Last refresh metadata
- Rebuild permission

Validation:
- Block if source entities are missing.
- Block if refresh policy is missing.
- Warn if reportable/exportable is ON and stale data display is allowed.
- Block if projection contains sensitive fields without protection policy.

---

### 8.4 Staging / Import

Required fields:
- Target entity
- Batch type
- Import file format
- Validation mode
- Promotion mode: manual / automatic / approval required
- Error retention policy
- Raw payload storage policy

Validation:
- Block if target entity is missing.
- Block if validation policy is missing.
- Block if retention policy is missing.
- Block promotion if blocking validation errors exist.

---

### 8.5 Integration Event / Outbox

Required fields:
- Event source entity
- Event name
- Payload schema
- Destination system
- Delivery mode
- Retry policy
- Idempotency key strategy
- Dead-letter policy

Validation:
- Block if idempotency key is missing.
- Block if destination system is missing.
- Block if retry/dead-letter policy is missing.

---

## 9. Step 4 — Identity

### 9.1 Existing fields to keep

- Entity Label
- API Name
- Record Display Name
- Business Category
- Domain

### 9.2 Additional fields to add

| Field | Required | Notes |
|---|---|---|
| Description | Recommended | Business purpose |
| Namespace | Required for package/platform entities | Example: `auto_service` |
| Short Code | Optional | Example: `SJC`, `INV` |
| Owning Module | Required | Sales, Service, Finance, CRM, Integration |
| Entity Plural Label | Required | Auto-generated, editable before creation |
| Icon | Optional | Used in navigation and admin UX |

### 9.3 API name rules

- Auto-generate from label.
- Allow edit before create.
- Lock after creation.
- Must be unique globally within namespace.
- Use lowercase snake_case.
- Max 63 chars recommended for PostgreSQL compatibility.
- Reserved words must be blocked.

Validation messages:
- `Entity label must be at least 2 characters.`
- `API name already exists in this namespace.`
- `API name can contain only lowercase letters, numbers, and underscores.`
- `API name cannot be changed after the entity is created.`
- `API name conflicts with a reserved system name.`

---

## 10. Step 5 — Key & Numbering

### 10.1 Physical primary key rule

For all iDMS-owned persisted entities:
- Use internal UUID as physical primary key.
- Do not allow business user to select natural/composite/external as physical primary key.

### 10.2 Revised UI

Replace “Primary Key Strategy” with:

**Internal Record ID**
- Always UUID for persisted iDMS-owned entities
- System-managed
- Hidden from business users by default

**Business Key / Alternate Key**
- None
- Natural business key
- Composite business key
- External ID
- Provider key

### 10.3 Business key behavior

| Key Type | Implementation |
|---|---|
| Natural business key | UUID PK + unique constraint on business field |
| Composite business key | UUID PK + composite unique constraint |
| External ID | UUID PK + external ID field + unique/indexed constraint |
| Provider key | Local UUID PK + provider key mapping |

Validation:
- Block natural/composite key if fields not yet defined; allow post-create configuration.
- Block external ID key without external system/provider context.
- Block duplicate key definition.
- Warn if business key contains mutable fields.

---

## 11. Step 6 — Storage & Persistence

### 11.1 Required storage modes

| Storage Mode | Used For |
|---|---|
| `physical_table` | Native, posting, activity, reference, staging |
| `owned_child_table` | Owned child |
| `junction_table` | Junction/association |
| `append_log_table` | Append-only/event logs |
| `outbox_table` | Integration outbox |
| `sql_view` | Virtual computed |
| `materialized_view_or_table` | Materialized projection |
| `external_provider` | External/federated |
| `system_table` | System/technical |

### 11.2 Storage fields

- `storageMode`
- `tableName`
- `schemaName`
- `partitionPolicyId`
- `retentionPolicyId`
- `archivePolicyId`
- `extensionTableName`
- `softDeleteEnabled`
- `auditPolicyId`

Validation:
- Block table name conflict.
- Block physical storage for virtual computed.
- Block direct update storage for materialized projection.
- Require retention policy for staging and high-volume/event-log entities.
- Require partition policy for high-volume/event-log entities.
- Require parent foreign key for owned child storage.

---

## 12. Step 7 — Scope & Ownership

### 12.1 Owning Layer

Keep:
- Platform
- Vertical
- Tenant
- Node

Do not treat Role as schema-owning layer.

### 12.2 Fix Node wording

Replace:

> “Node-level entities are isolated per branch. Records from one branch are never visible to another.”

With:

> “Node-owned records are primarily created and maintained by a node. Visibility, roll-up, and cross-node access are controlled by Scope Policy and SecurityDefinition.”

### 12.3 Scope policies

Keep and refine:
- Global
- Tenant-scoped
- Company-scoped
- Node-scoped
- Hierarchical
- External/provider-scoped

### 12.4 Required fields by scope

| Scope | Required Field |
|---|---|
| Tenant-scoped | `tenant_id` |
| Company-scoped | `company_id` |
| Node-scoped | `node_id` |
| Hierarchical | `node_id` + hierarchy resolver |
| External | provider scope mapping |

Validation:
- Block company-scoped entity without company field.
- Block tenant-scoped entity without tenant field.
- Block node-scoped/hierarchical entity without node field.
- Block external scope without provider security/scope mapping.

---

## 13. Step 8 — Security Defaults

Add a step to configure default security posture.

### 13.1 Required security defaults

- Entity admin role
- Record create permission default
- Record read permission default
- Record update permission default
- Record delete permission default
- Export permission default
- API access default
- Field protection default
- Provider security mode for external entities

### 13.2 Provider security modes

For External/Federated entities:
- Local iDMS security only
- Provider security only
- Hybrid: iDMS pre-check + provider enforcement
- User-context propagated to provider

Validation:
- Block API exposed if API security is not configured.
- Block external entity if provider security mode is missing.
- Warn if provider security cannot enforce row-level restrictions.

---

## 14. Step 9 — Capability Profile

### 14.1 Existing toggles to keep

- Can Be Saved
- Lookup Eligible
- Searchable
- Importable
- Exportable
- Reportable
- Printable
- API Exposed
- Cacheable
- Offline Enabled
- Extendable
- Workflow Eligible
- Auditable

### 14.2 New capabilities to add

| Capability | Purpose |
|---|---|
| Timeline Eligible | Activity/interactions appear in timeline |
| Notification Eligible | Can produce reminders/notifications |
| Package Installable | Can be installed/updated through package |
| Event Publishable | Can publish domain events |
| Reversible | Supports reversal/counter-entry/cancellation |
| Retention Managed | Has retention/TTL/archive policy |
| Partitioned | Uses partitioning strategy |
| Provider Backed | Uses external provider |
| Staging Promotable | Can promote to target entity |
| Hierarchy Rollup Enabled | Supports roll-up aggregation/access |

### 14.3 Capability object structure

Do not store simple booleans only.

Each capability must be stored as:

```json
{
  "capability": "canSave",
  "requestedValue": true,
  "effectiveValue": false,
  "locked": true,
  "source": "archetype_default",
  "lockedReason": "Entity archetype is Virtual Computed"
}
```

### 14.4 Capability validation rules

| Condition | Expected Behavior |
|---|---|
| Virtual Computed + Can Be Saved ON | Block |
| Materialized Projection + direct update ON | Block |
| External + Can Save ON but provider update unsupported | Block or lock OFF |
| External + Can Save ON and provider update supported | Allow |
| Offline Enabled + External without sync contract | Block |
| Cacheable ON without TTL/cache policy | Block |
| API Exposed ON without API security | Block |
| Printable ON without print strategy | Warn |
| Importable ON without import contract | Warn/block based on archetype |
| Reportable ON for sensitive entity without protection policy | Warn/block |

---

## 15. Step 10 — System Fields & Required Policies

The system must auto-create or require policy configuration based on archetype.

### 15.1 System fields by archetype

#### Native Persistent
- `id`
- `tenant_id`
- `status`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `is_deleted`

#### Posting Document
- all Native fields
- `document_no`
- `document_date`
- `posting_status`
- `posted_at`
- `posted_by`
- `reversal_of_document_id`
- `cancelled_at`
- `cancelled_by`
- `cancellation_reason`

#### Activity / Interaction
- `activity_id`
- `subject`
- `activity_type`
- `status`
- `owner_id`
- `assigned_to_id`
- `start_datetime`
- `due_datetime`
- `completed_at`
- `related_entity_type`
- `related_record_id`

#### Staging / Import
- `staging_record_id`
- `batch_id`
- `source_file_name`
- `row_number`
- `raw_payload`
- `validation_status`
- `validation_errors`
- `target_entity_api_name`
- `target_record_id`
- `processed_at`

#### High-Volume / Event Log
- `event_id`
- `event_type`
- `event_timestamp`
- `source_system`
- `tenant_id`
- `node_id`
- `payload`
- `partition_key`
- `retention_until`

#### Integration Outbox
- `outbox_event_id`
- `event_name`
- `aggregate_entity_api_name`
- `aggregate_record_id`
- `payload`
- `idempotency_key`
- `delivery_status`
- `retry_count`
- `next_retry_at`
- `last_error`
- `published_at`

#### Reference / Code
- `code_id`
- `code`
- `label`
- `description`
- `status`
- `effective_from`
- `effective_to`
- `sort_order`

### 15.2 Required policies by archetype

| Archetype | Required Policies |
|---|---|
| Native Persistent | audit, security, scope |
| Virtual Computed | query binding, cache/performance, security filter |
| External/Federated | provider capability, security mapping, error mapping |
| Materialized Projection | refresh, lineage, stale data, rebuild permission |
| Junction | endpoint, uniqueness, lifecycle |
| Owned Child | parent relation, cascade/restrict rules |
| Append-Only | reversal/correction, retention |
| Posting Document | posting lifecycle, numbering, reversal/cancellation |
| Activity | assignment, reminder, timeline |
| Staging | import validation, promotion, retention |
| High-Volume/Event Log | partition, retention, archive |
| Integration Outbox | retry, idempotency, dead-letter |
| Reference/Code | localization/effective date optional, cache |
| System/Technical | platform ownership, hidden security |

---

## 16. Step 11 — Compile Preview

Before creating the draft shell, show a compile preview.

### 16.1 Preview content

- Entity identity
- Archetype
- Storage mode
- Mutability mode
- Source-of-truth
- Scope policy
- System fields
- Required policies
- Capability grid with requested/effective/locked values
- Blocking issues
- Warnings
- Required next steps after creation

### 16.2 Blocking issue examples

- `Provider capability contract is required for External/Federated entities.`
- `Owned Child entity must have a parent relationship.`
- `Posting Document entity requires a posting lifecycle model.`
- `High-Volume/Event Log entity requires partition and retention policies.`
- `API Exposed cannot be enabled without API security configuration.`
- `Offline Enabled cannot be enabled for external entity without sync contract.`
- `Materialized Projection requires a refresh policy.`
- `Virtual Computed entity requires a query binding.`
- `Natural/composite/external key cannot be used as physical primary key.`

---

## 17. Step 12 — Review & Create Draft Shell

### 17.1 Existing behavior to keep

The entity should be created in Draft status and the user should be redirected to Schema Builder.

### 17.2 Required change

The draft shell must include:
- EntityDefinition record
- Archetype metadata
- Source-of-truth metadata
- Storage metadata
- Scope metadata
- Capability metadata
- System fields
- Required policy placeholders
- Compile status
- Package ownership if applicable

### 17.3 Draft entity status

New entity should remain:
- `Draft`
- `Not Runtime Available`
- `Not API Exposed`
- `Not Reportable`
- `Not Search Indexed`

until publish/activation succeeds.

---

## 18. Metadata Model Changes

### 18.1 EntityDefinition additions

Add or confirm these fields:

```json
{
  "entityId": "uuid",
  "apiName": "string",
  "label": "string",
  "pluralLabel": "string",
  "namespace": "string",
  "shortCode": "string",
  "description": "string",
  "origin": "template|blank|extend|package",
  "archetype": "native_persistent|virtual_computed|external_federated|materialized_projection|junction|owned_child|append_only|system_technical|activity_interaction|staging_import|high_volume_event_log|integration_outbox|posting_document|reference_code",
  "businessCategory": "transaction|master_data|configuration|ledger_like|reference|technical",
  "domain": "string",
  "owningLayer": "platform|vertical|tenant|node",
  "scopePolicy": "global|tenant|company|node|hierarchical|external",
  "sourceOfTruth": "idms|external|derived|platform",
  "storageMode": "physical_table|owned_child_table|junction_table|append_log_table|outbox_table|sql_view|materialized_view_or_table|external_provider|system_table",
  "mutabilityMode": "read_write|read_only|append_only|draft_edit_posted_immutable|system_managed|provider_capability_driven|refresh_only|staging_promote_only",
  "metadataStatus": "draft|active|deprecated|retired",
  "packageId": "string",
  "versionId": "string"
}
```

### 18.2 CapabilityDefinition

Create capability records or embedded objects with:

```json
{
  "entityId": "uuid",
  "capabilityCode": "canSave",
  "requestedValue": true,
  "effectiveValue": false,
  "locked": true,
  "source": "archetype_default|template|package|user|provider|compiler",
  "lockedReason": "Entity archetype is Virtual Computed"
}
```

### 18.3 ProviderCapabilityContract

```json
{
  "entityId": "uuid",
  "externalSystemCode": "SAP_PROD",
  "providerAdapterCode": "sap_odata_v2",
  "providerEntityName": "LedgerEntry",
  "authMode": "system|user_delegated|oauth|api_key",
  "readSupported": true,
  "createSupported": false,
  "updateSupported": false,
  "deleteSupported": false,
  "actionSupported": true,
  "filterSupported": true,
  "sortSupported": true,
  "searchSupported": false,
  "paginationSupported": true,
  "expandSupported": false,
  "userContextPropagation": true,
  "timeoutMs": 30000,
  "retryPolicyId": "retry_standard_external",
  "cachePolicyId": "cache_15_min",
  "errorMappingPolicyId": "sap_error_mapping"
}
```

### 18.4 ProjectionRefreshPolicy

```json
{
  "entityId": "uuid",
  "refreshMode": "full|incremental",
  "refreshTrigger": "scheduled|event_based|manual",
  "scheduleCron": "0 2 * * *",
  "freshnessSlaMinutes": 1440,
  "allowStaleDisplay": true,
  "allowStaleExport": false,
  "failureBehavior": "show_last_successful|hide|show_warning",
  "retryPolicyId": "retry_projection_refresh"
}
```

### 18.5 RetentionPolicy

```json
{
  "entityId": "uuid",
  "retentionMode": "none|ttl|archive_then_delete|archive_only",
  "retentionDays": 365,
  "archiveTarget": "cold_storage",
  "deleteAfterArchive": false
}
```

---

## 19. API Changes

### 19.1 Create draft entity API

`POST /admin/metadata/entities/draft`

Request must accept the revised metadata sections.

Response:

```json
{
  "entityId": "ent_123",
  "metadataStatus": "draft",
  "compileStatus": "warning",
  "blockingIssues": [],
  "warnings": [
    {
      "code": "PRINT_TEMPLATE_NOT_CONFIGURED",
      "message": "Printable is enabled but no print template strategy is configured."
    }
  ],
  "nextSteps": [
    "Add business fields",
    "Configure views",
    "Configure lifecycle model"
  ]
}
```

### 19.2 Compile preview API

`POST /admin/metadata/entities/compile-preview`

Response:

```json
{
  "canCreateDraft": true,
  "canPublish": false,
  "blockingIssues": [],
  "warnings": [],
  "effectiveCapabilities": []
}
```

### 19.3 Provider capability lookup API

`GET /admin/integration/providers/{providerAdapterCode}/capabilities`

Returns available provider operations and query capabilities.

---

## 20. Acceptance Criteria

### AC1 — Decision Gate

Given the user clicks Create Entity  
When the create flow starts  
Then the system must show the Entity Creation Decision Gate before the wizard.

### AC2 — Install from Package

Given the user selects Install from Package  
When a package is selected  
Then the system must show package version, dependencies, locked metadata, extension points, and install impact.

### AC3 — Expanded Archetype List

Given the user selects Create from Blank  
When the Archetype step appears  
Then the system must show all required archetypes including Activity, Staging, High-Volume/Event Log, Integration Outbox, Posting Document, and Reference/Code.

### AC4 — External Provider Capability

Given the user selects External/Federated  
When the Source step appears  
Then the user must configure Provider Capability Contract, not only External System Code.

### AC5 — External Save Capability

Given the selected provider supports update  
When Can Be Saved is requested  
Then the system may allow save capability based on provider rules.

Given the provider does not support update  
When Can Be Saved is requested  
Then the system must lock effective capability to false and show the provider limitation.

### AC6 — UUID Physical Primary Key

Given the user creates an iDMS-owned persisted entity  
When the entity draft is created  
Then the physical primary key must be UUID.

### AC7 — Alternate Keys

Given the user selects Natural, Composite, or External key  
When the entity is created  
Then the system must model it as alternate/business/external key, not physical primary key.

### AC8 — Owned Child Parent Required

Given the user selects Owned Child  
When trying to continue past archetype/source configuration  
Then the system must require a parent relationship.

### AC9 — Lifecycle-aware Owned Child Behavior

Given the entity is Owned Child  
When parent lifecycle is Posted/Closed  
Then child delete/update must follow the parent lifecycle policy and must not blindly cascade.

### AC10 — Posting Document

Given the user selects Posting Document  
When creating the entity  
Then the system must require posting lifecycle, document numbering, reversal/cancellation policy, and audit policy.

### AC11 — High-Volume/Event Log

Given the user selects High-Volume/Event Log  
When creating the entity  
Then the system must require partition and retention policy.

### AC12 — Staging/Import

Given the user selects Staging/Import  
When creating the entity  
Then the system must require target entity, batch fields, validation policy, promotion policy, and retention policy.

### AC13 — Capability Object

Given capabilities are shown  
When a capability is locked  
Then the UI must show requested value, effective value, lock status, source, and lock reason.

### AC14 — Node Scope

Given the user selects Node owning layer or Node-scoped policy  
When reviewing scope  
Then the system must not state records are never visible upward; it must explain hierarchy/security-controlled visibility.

### AC15 — Compile Preview

Given the user reaches Review  
When clicking Compile Preview  
Then the system must show blockers, warnings, effective capabilities, system fields, required policies, and next steps.

### AC16 — Draft Shell

Given the user clicks Create Draft Shell  
When there are no blocking issues  
Then the system creates an entity in Draft status and redirects to Schema Builder.

### AC17 — Runtime Lock

Given a draft entity is created  
When checking runtime availability  
Then it must not be API exposed, searchable, reportable, or runtime available until published.

---

## 21. Negative Scenarios and Validation Messages

| Scenario | Expected Message |
|---|---|
| API name duplicate | `API name already exists in this namespace.` |
| API name invalid | `API name can contain only lowercase letters, numbers, and underscores.` |
| External entity without provider | `Provider capability contract is required for External/Federated entities.` |
| Virtual computed without query binding | `Virtual Computed entity requires a query binding or dataset definition.` |
| Materialized projection without refresh policy | `Materialized Projection requires a refresh policy.` |
| Owned child without parent | `Owned Child entity must have a parent relationship.` |
| Junction without two endpoints | `Junction entity must define two relationship endpoints.` |
| Posting document without lifecycle | `Posting Document entity requires a posting lifecycle model.` |
| High-volume without retention | `High-Volume/Event Log entity requires a retention policy.` |
| High-volume without partition | `High-Volume/Event Log entity requires a partition policy.` |
| Staging without target entity | `Staging entity requires a target entity.` |
| API exposed without security | `API Exposed cannot be enabled without API security configuration.` |
| Offline external without sync | `Offline Enabled cannot be enabled for external entity without a sync contract.` |
| Cacheable without TTL | `Cacheable entity requires a cache policy with TTL.` |
| Natural key as physical PK | `Natural, composite, and external keys are stored as alternate keys. Physical primary key remains UUID.` |
| Reportable sensitive entity without protection | `Reportable entity contains protected data. Configure field protection before publishing.` |
| Node scope absolute isolation | `Node visibility is controlled by Scope Policy and SecurityDefinition, not by owning layer alone.` |

---

## 22. Migration Requirements for Existing Implementation

### 22.1 Existing entities

For existing entities created through the current wizard:
- Backfill `archetype`.
- Backfill `sourceOfTruth`.
- Backfill `storageMode`.
- Backfill `mutabilityMode`.
- Convert simple capability booleans into capability objects.
- Set physical primary key strategy to UUID where applicable.
- Move natural/composite/external key choices to alternate-key metadata.
- Add missing policy placeholders based on archetype.

### 22.2 Existing external entities

For entities with only `externalSystemCode`:
- Create ProviderCapabilityContract placeholder.
- Set capabilities to unknown/pending until provider is configured.
- Block publish until provider capability is resolved.

### 22.3 Existing owned-child entities

For owned-child entities:
- Require parent relationship metadata.
- Add lifecycle-aware delete/update policy.
- Disable blind cascade for posted/closed parent documents.

### 22.4 Existing append-only entities

Review whether each append-only entity is:
- pure append-only event/log, or
- posting document with draft/post lifecycle.

Move Payment Receipt, Invoice, Voucher-like objects to Posting Document where appropriate.

---

## 23. QA Test Matrix

QA must test each archetype:

1. Native Persistent
2. Virtual Computed
3. External/Federated
4. Materialized Projection
5. Junction/Association
6. Owned Child
7. Append-Only
8. System/Technical
9. Activity/Interaction
10. Staging/Import
11. High-Volume/Event Log
12. Integration Outbox
13. Posting Document
14. Reference/Code

For each archetype, QA must verify:
- default capabilities
- locked capabilities
- required system fields
- required policies
- valid storage mode
- scope behavior
- compile blockers
- draft creation
- publish blocking until required metadata is complete

---

## 24. Developer Guardrails

The developer must not:

1. Use simple booleans as final capability model.
2. Hard-code External/Federated as always read-only.
3. Allow natural/composite/external keys as physical primary keys.
4. Treat Node owning layer as absolute data isolation.
5. Allow Owned Child records to blindly cascade delete after parent is posted/closed.
6. Allow Virtual Computed entities to be directly saved.
7. Allow Materialized Projection entities to be directly updated.
8. Allow API exposure without API security.
9. Allow cacheable entities without TTL/cache policy.
10. Publish entities without compile validation.
11. Build provider-backed entities without provider capability metadata.
12. Mix business category with entity archetype.
13. Treat package installation as same as template copying.

---

## 25. Implementation Priority

### Priority 1 — Safety fixes

1. Add Entity Creation Decision Gate.
2. Add capability object model.
3. Enforce UUID physical primary key.
4. Fix external provider capability.
5. Fix owned-child lifecycle behavior.
6. Add compile blockers.

### Priority 2 — Missing archetypes

1. Posting Document
2. Activity / Interaction
3. Staging / Import
4. High-Volume / Event Log
5. Integration Outbox
6. Reference / Code

### Priority 3 — Enterprise maturity

1. Install from Package
2. Provider capability lookup
3. Materialized projection operational metadata
4. Security defaults
5. Runtime availability locks
6. Migration/backfill scripts

---

## 26. Definition of Done

The change is complete only when:

1. All new archetypes are available in the wizard.
2. All archetypes generate correct default capabilities and system fields.
3. Capability model stores requested/effective/locked/source/lock reason.
4. External/Federated entities use Provider Capability Contract.
5. Physical PK is UUID for all iDMS-owned persisted entities.
6. Natural/composite/external keys are alternate keys.
7. Owned-child behavior is lifecycle-aware.
8. Compile Preview blocks invalid configurations.
9. Draft entities are not runtime active until publish.
10. Existing entity records are migrated/backfilled safely.
11. Unit tests and integration tests cover every archetype.
12. QA confirms negative scenarios and validation messages.
