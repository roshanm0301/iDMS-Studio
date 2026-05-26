# Entity Creation — Functional Specification
### iDMS Admin Studio

| | |
|---|---|
| **Document Type** | Functional Specification |
| **Audience** | Product Managers · Functional Consultants · Business Analysts · Implementation Teams |
| **Version** | 1.0 |
| **Date** | May 12, 2026 |
| **Industries Covered** | Automotive DMS · Heavy Equipment · Healthcare · Insurance · Real Estate & Property Management |

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Feature Overview](#2-feature-overview)
3. [Step-by-Step Functional Description](#3-step-by-step-functional-description)
   - [Step 1 — Origin](#step-1--origin)
   - [Step 2A — Archetype Selection](#step-2a--archetype-selection-blank-path-only)
   - [Step 2B — Base Entity Selection](#step-2b--base-entity-selection-extend-path-only)
   - [Step 3 — Source Configuration](#step-3--source-configuration-conditional)
   - [Step 4 — Identity & Scope](#step-4--identity--scope)
   - [Step 5 — Key & Storage](#step-5--key--storage-blank-path-only)
   - [Step 6 — Security & Capabilities](#step-6--security--capabilities-blank-path-only)
   - [Step 7 — Review & Create](#step-7--review--create)
4. [Cross-Step Validation Summary](#4-cross-step-validation-summary)
5. [Industry Use Case Walkthroughs](#5-industry-use-case-walkthroughs)
6. [Post-Creation Architecture](#6-post-creation-architecture)
7. [Design Principles Observed](#7-design-principles-observed)

---

## 1. Purpose and Scope

Entity Creation is the foundational capability of iDMS Admin Studio. It allows platform administrators and functional consultants to define new data objects — called **Entities** — that become the canonical data structures of the business system.

Every screen, API, report, workflow, and integration in iDMS ultimately operates on Entities defined here.

This document describes each feature of the 7-step Entity Creation wizard, explains the business rationale behind design decisions, and illustrates every major concept with real-world examples drawn from industries where Dealer Management Systems (DMS) and CRM platforms are deployed.

---

## 2. Feature Overview

The wizard operates as a **guided, sequential flow** with two creation paths and up to 8 steps depending on choices made along the way. Each step gates progression — the **Next** button is disabled until the current step is valid.

### Two Creation Paths

| Path | When to Use |
|---|---|
| **Create from Blank** | Building a completely new data structure — choose archetype, configure capabilities, set security, define identity |
| **Extend a Base Entity** | Adding fields and behaviour on top of an existing entity defined by a platform or vertical layer (e.g. adding dealer-specific fields to the platform's `Vehicle` entity) |

### Wizard Steps at a Glance

```
Blank path:   Origin → Archetype → [Source] → Identity & Scope → Key & Storage → Security & Capabilities → Review & Create
Extend path:  Origin → Base Entity → Identity & Scope → Review & Create
```

> Steps in `[brackets]` are conditional — they only appear for certain archetype choices.

---

## 3. Step-by-Step Functional Description

---

### Step 1 — Origin

**What it does:** The user declares *how* this entity is being created.

| Option | Description |
|---|---|
| **Create from Blank** | Full wizard — choose archetype, configure all dimensions from scratch |
| **Extend a Base Entity** | Shorter wizard — inherit all fields from an existing entity, then add to it |

**Why it matters:** Prevents accidental duplication of master data entities when the real need is only to add tenant-specific fields. It also controls which subsequent steps appear.

#### Examples

> **Automotive DMS:** A Toyota dealer uses the platform's `Vehicle` entity. The tenant administrator chooses **Extend** to add `floor_plan_facility_id` and `certified_used_status` — without recreating the vehicle from scratch.

> **Healthcare:** A hospital chain extends the platform's `Patient` entity to add `local_insurance_scheme_code` and `preferred_language` specific to their region.

---

### Step 2A — Archetype Selection *(Blank path only)*

**What it does:** The user selects one of **14 archetypes** that describe the *runtime nature* of the entity — how it is stored, whether it can be saved, and what platform behaviours apply automatically.

> This is the most consequential decision in the wizard. The archetype pre-configures all defaults for persistence mode, mutability, storage, capabilities, and record ownership. All downstream steps adapt accordingly.

---

#### The 14 Archetypes

---

##### 1. Native Persistent

> Full read/write entity owned and stored by iDMS. The most common archetype for operational business data.

| Property | Value |
|---|---|
| Storage | Physical relational table |
| Mutability | Full create / update / delete |
| Record Ownership | User Owned (default) |
| Auto System Fields | `id`, `tenant_id`, `status`, `created_at`, `created_by`, `owner_id`, `updated_at`, `updated_by`, `is_deleted` |
| Default Capabilities | canSave · searchable · importable · exportable · reportable · apiExposed · auditable · workflowEnabled · extendable · eventPublishable |

**Examples**

> **Automotive:** `Service Job Card` — a technician's work order. Needs full lifecycle, owner assignment to a service advisor, workflow (Open → In Progress → Completed), and a complete audit trail.

> **Insurance:** `Policy Holder` — the canonical customer record. Needs import (migration), full CRUD, and API exposure for agent portals.

---

##### 2. Virtual Computed

> Read-only entity derived at query time from other entities. No physical table. Cannot be directly saved.

| Property | Value |
|---|---|
| Storage | SQL View |
| Mutability | Read-only |
| Auto System Fields | `id`, `computed_at`, `source_ref` |
| Default Capabilities | searchable · exportable · reportable · apiExposed · cacheable |

**Examples**

> **Automotive:** `Customer 360 View` — combines fields from Customer, Vehicle, Service History, and Outstanding Balance. Sales consultants see it on the customer detail page; no one edits it directly.

> **Real Estate:** `Property Portfolio Summary` — aggregates active listings, total portfolio value, vacancy rate, and average rent per landlord. Computed at runtime from Listing and Lease entities.

---

##### 3. External / Federated

> Entity whose data is owned and mastered by an **external system** (OEM portal, ERP, CRM, third-party API). iDMS reads it but does not own it.

| Property | Value |
|---|---|
| Storage | External provider |
| Mutability | Provider-capability-driven (may be read-only or limited write) |
| Auto System Fields | `id`, `external_key`, `last_synced_at`, `sync_status` |
| Required Config | External System Code (e.g. `OEM_PORTAL`) · Provider adapter binding |

**Examples**

> **Automotive:** `OEM Vehicle Allocation` — Toyota's production allocation for the upcoming quarter. The dealer can view which models are allocated, but cannot edit this data; it is mastered in Toyota's factory planning system.

> **Heavy Equipment:** `Equipment OEM Parts Catalog` — Caterpillar's official parts list and pricing, fetched via an OEM API. Service advisors use it to find part numbers; the DMS never modifies it.

---

##### 4. Materialized Projection

> A derived read model that is physically stored for performance, but is **not** the source of truth. Updated via scheduled or triggered refresh only — not directly editable.

| Property | Value |
|---|---|
| Storage | Materialized view or snapshot table |
| Mutability | Refresh-only |
| Auto System Fields | `id`, `source_entity_type`, `source_record_id`, `projection_built_at`, `is_stale` |
| Required Post-Creation | Refresh policy (mode, trigger, schedule) |

**Examples**

> **Automotive:** `Job Card Analytics Snapshot` — pre-computed table of all service jobs with aggregated labour hours, parts cost, and completion time. Rebuilt nightly to power the Service Performance dashboard without hitting the live transaction table.

> **Healthcare:** `Patient Billing Summary` — stored projection of outstanding balances, insurance claims, and payment history per patient. Refreshed hourly so billing staff see near-real-time data without running expensive joins each time.

---

##### 5. Junction / Association

> A many-to-many link entity connecting two other entities. May carry its own payload attributes describing the relationship.

| Property | Value |
|---|---|
| Storage | Junction table |
| Auto System Fields | `id`, `entity_a_ref`, `entity_b_ref`, `effective_from`, `effective_to`, `is_active` |
| Required Post-Creation | Define both relationship endpoints · Configure uniqueness constraint |

**Examples**

> **Automotive:** `Campaign Applicable Model` — links a marketing Campaign to the Vehicle Models it applies to. The link carries `discount_percentage` and `allocation_limit`.

> **Insurance:** `Agent Policy Assignment` — links Agents to the Policies they manage, carrying `role` (primary/secondary) and `assignment_date`.

---

##### 6. Owned Child

> A child/detail entity whose entire lifecycle is governed by a parent entity. The child cannot exist without the parent.

| Property | Value |
|---|---|
| Storage | Child table with parent foreign key |
| Auto System Fields | `id`, `parent_ref`, `line_number`, `tenant_id`, `created_at` |
| Required Post-Creation | Define parent relationship · Configure cascade delete/update policy |

**Examples**

> **Automotive:** `Sales Invoice Line` — individual line items on a vehicle sale invoice (vehicle, accessories, warranty, insurance). Deleting the Invoice cascades to all lines.

> **Heavy Equipment:** `Preventive Maintenance Schedule Line` — specific maintenance tasks (engine oil change, filter replacement) under a parent Maintenance Plan.

---

##### 7. Append-Only Record

> An immutable ledger or event record. Once written, it **cannot be modified**. Corrections are handled by counter-entries (reversals), not edits.

| Property | Value |
|---|---|
| Storage | Append-log table |
| Mutability | Append-only |
| Soft Delete | Disabled (forced immutability) |
| Auto System Fields | `id`, `tenant_id`, `entry_number` (auto-numbered), `occurred_at`, `actor_id`, `event_type` |

**Examples**

> **Automotive:** `Workshop Labour Journal` — every labour hour charged to a service job is a separate, immutable journal line. If an entry is wrong, a reversal entry is posted with a negative amount; the original entry is never touched.

> **Healthcare:** `Patient Medication Administration Record` — each dose administered is an append-only log entry with timestamp, nurse ID, and drug details. No entry can be deleted; amendments are handled by correction entries.

---

##### 8. System / Technical

> Platform-managed internal entities. Hidden from business configurators. All operational capabilities are locked off.

| Property | Value |
|---|---|
| Storage | System table |
| Mutability | System-managed only |
| All capabilities | Locked OFF |

**Example**

> *(All industries)* `Metadata Compilation Job` — tracks the status of a metadata compile run. This is iDMS infrastructure; no business user sees or interacts with it.

---

##### 9. Activity / Interaction *(v3)*

> Tasks, calls, appointments, follow-ups, and reminders. The CRM workhorse archetype. Timeline and notification eligible.

| Property | Value |
|---|---|
| Storage | Physical table |
| Record Ownership | User Owned |
| Auto System Fields | `activity_id`, `subject`, `activity_type`, `status`, `owner_id`, `assigned_to_id`, `start_datetime`, `due_datetime`, `completed_at`, `related_entity_type`, `related_record_id` |
| Default Capabilities | timelineEligible · notificationEligible · workflowEnabled · auditable · eventPublishable |

**Examples**

> **Automotive:** `Test Drive Follow-Up` — a salesperson schedules a follow-up call three days after a test drive. Linked to the Lead record, owned by the salesperson, appears in the customer's timeline.

> **Healthcare:** `Patient Appointment Reminder` — scheduled activity for an outbound call 48 hours before a procedure. Owned by the front-desk coordinator, linked to the Patient record.

---

##### 10. Staging / Import *(v3)*

> Temporary holding area for data imported from external files or systems before validation and promotion to the target entity. Supports row-level error reporting.

| Property | Value |
|---|---|
| Validation Statuses | Pending → Valid / Error → Promoted |
| Auto System Fields | `staging_record_id`, `batch_id`, `source_file_name`, `row_number`, `raw_payload`, `validation_status`, `validation_errors`, `target_entity_api_name`, `target_record_id`, `processed_at` |
| Retention Policy | Required (staging data is transient) |
| Locked Capabilities | stagingPromotable ON · retentionManaged ON |

**Examples**

> **Automotive:** `Used Vehicle Import Staging` — a CSV export from an auction house is imported nightly. Each row is validated against vehicle master rules (VIN format, mandatory fields). Valid rows are promoted to the `Vehicle` entity; errors are surfaced to the data team.

> **Insurance:** `Policy Migration Staging` — legacy policy records from an old system are bulk-loaded into staging, validated for completeness, and promoted to the `Policy` entity.

---

##### 11. High-Volume / Event Log *(v3)*

> Large-volume, append-heavy, time-series or telemetry data. Both a **retention policy** and a **partition policy** are required — enforced as blocking errors at creation time.

| Property | Value |
|---|---|
| Storage | Append-log table |
| Auto System Fields | `event_id`, `event_type`, `event_timestamp`, `source_system`, `tenant_id`, `node_id`, `payload`, `partition_key`, `retention_until` |
| Locked Capabilities | retentionManaged ON · partitioned ON |

**Examples**

> **Automotive:** `Vehicle Telematics Event Log` — connected vehicles emit GPS, speed, odometer, and fault code events at high frequency. Partitioned by `vehicle_id + month`; 12-month rolling retention.

> **Heavy Equipment:** `Machine Sensor Log` — excavators and cranes transmit hydraulic pressure, engine temperature, and fuel consumption readings every 30 seconds. Partitioned by `machine_id`; retained for 24 months for predictive maintenance analysis.

---

##### 12. Integration Outbox *(v3)*

> Reliable event publishing pattern with retry handling and dead-letter management. Entirely system-managed — no manual saves.

| Property | Value |
|---|---|
| Delivery Statuses | Pending → Sent / Failed → Dead Letter |
| Auto System Fields | `outbox_event_id`, `event_name`, `aggregate_entity_api_name`, `aggregate_record_id`, `payload`, `idempotency_key`, `delivery_status`, `retry_count`, `next_retry_at`, `last_error`, `published_at` |
| Locked Capabilities | eventPublishable ON · retentionManaged ON |

**Examples**

> **Automotive:** `Vehicle Status Change Outbox` — when a vehicle's status changes (Reserved → Sold), an event is published to the OEM's inventory reconciliation API. Guarantees at-least-once delivery with exponential backoff retries.

> **Insurance:** `Policy Issuance Event Outbox` — when a policy is issued, events are published to both the regulatory reporting system and the reinsurance platform via separate outbox consumers.

---

##### 13. Posting Document *(v3)*

> A business document that is **fully editable while in Draft** status and becomes **immutable once posted**. Supports formal cancellation and reversal.

| Property | Value |
|---|---|
| Mutability | Draft editable → Posted immutable |
| Posting Statuses | Draft · Posted · Cancelled · Reversed |
| Auto System Fields | `id`, `document_no` (auto-numbered), `document_date`, `posting_status`, `posted_at`, `posted_by`, `reversal_of_document_id`, `cancelled_at`, `cancelled_by`, `cancellation_reason`, `owner_id` |
| Locked Capabilities | reversible ON |
| Default Capabilities | workflowEnabled · auditable · printable · notificationEligible · eventPublishable · importable · exportable |

**Examples**

> **Automotive:** `Sales Invoice` — a vehicle sale invoice is created in Draft and edited until all charges are finalised. When the finance manager posts it, it becomes immutable. Errors are corrected via a reversal invoice; the original is marked `Reversed`.

> **Healthcare:** `Clinical Charge Sheet` — outpatient procedure charges are entered during the appointment (Draft). The billing team posts it to trigger insurance claim generation. A posted charge sheet can only be corrected via a credit note, never edited directly.

---

##### 14. Reference / Code *(v3)*

> Stable lookup and code data — currencies, tax codes, reason codes, unit of measure, service types. Org-owned, cacheable, effective-dated, lookup-eligible.

| Property | Value |
|---|---|
| Record Ownership | Org Owned |
| Auto System Fields | `code_id`, `code`, `label`, `description`, `status`, `effective_from`, `effective_to`, `sort_order`, `tenant_id` |
| Default Capabilities | lookupEligible · searchable · importable · exportable · apiExposed · cacheable · auditable · extendable · packageInstallable |

**Examples**

> **Automotive:** `Service Reason Code` — predefined codes for why a vehicle was brought in (Scheduled Maintenance, Warranty Complaint, Accident Repair). Effective-dated so historical records retain their original code labels.

> **Insurance:** `Claim Rejection Reason` — standardised codes explaining why a claim was rejected. Configured once, used across all claim processing screens.

---

### Step 2B — Base Entity Selection *(Extend path only)*

**What it does:** The user searches existing entities by name or API name and selects the one to extend. Blocks progression if no entity is selected.

**Why it matters:** Extension entities inherit all fields from the base entity at runtime. The platform resolves the overlay and merges fields. This enables a vertical solution to be enriched by tenant-specific fields **without forking the entity definition**.

> **Example:** A Ford dealer extends the platform `Lead` entity to add `financing_pre_approval_status` and `trade_in_vehicle_id` — fields specific to their sales process that do not belong in the platform-level definition.

---

### Step 3 — Source Configuration *(Conditional)*

**Appears for:** Virtual Computed · External / Federated · Materialized Projection · Staging / Import

**What it does:** For archetypes that derive data from elsewhere, the user must declare the data source before proceeding.

| Archetype | What to Configure |
|---|---|
| `virtual_computed` | Select one or more source entities the view is derived from |
| `materialized_projection` | Select one or more source entities |
| `external_federated` | Enter the **External System Code** (e.g. `OEM_PORTAL`, `SAP_PROD`) — mandatory, blocks progression if empty |
| `staging_import` | Target entity may be configured post-creation |

**Examples**

> **Automotive:** Creating a `Customer Open Balance View` (virtual_computed) requires selecting `Invoice` and `Payment` as source entities. The compiler validates SQL view definitions against those source schemas.

> **Heavy Equipment:** Creating an `SAP Equipment Master` (external_federated) requires entering `SAP_PROD` as the external system code, binding the entity to the SAP integration adapter.

---

### Step 4 — Identity & Scope

**What it does:** Defines the entity's identity, placement in the namespace, and data isolation boundary.

---

#### 4.1 Entity Label

Human-readable name displayed in the UI, navigation, and notifications. Minimum 2 characters.

> Examples: `Service Job Card` · `Insurance Policy` · `Preventive Maintenance Plan`

---

#### 4.2 API Name

Unique snake_case identifier auto-derived from the label. Editable before first save; **immutable after creation**. Used in all API endpoints, workflow definitions, validation rules, and integration mappings.

| Label | API Name |
|---|---|
| Service Job Card | `service_job_card` |
| Insurance Policy | `insurance_policy` |
| Vehicle Allocation | `vehicle_allocation` |

> **Guard:** Blocks progression if the API name already exists in the entity registry.

> **Why immutability matters:** Downstream artefacts (workflows, reports, API integrations, permission matrices) reference entities by API name. Changing the name post-creation would silently break all references.

---

#### 4.3 Namespace *(Required for non-platform layers)*

A module-level qualifier that prefixes the entity in API routing. Required for all entities **except** those created at the Platform layer.

| Namespace | Entity | Generated API Route |
|---|---|---|
| `auto_service` | `service_job_card` | `/api/v1/auto_service/service_job_card` |
| `claims` | `insurance_claim` | `/api/v1/claims/insurance_claim` |
| `property_ops` | `tenancy_agreement` | `/api/v1/property_ops/tenancy_agreement` |

> **Guard:** Non-platform entities cannot proceed from this step without a namespace of at least 2 characters. A red inline error explains the collision-prevention rationale.

> **Why it matters:** Without namespaces, two different tenant customisations could both define `service_order` and collide at the API layer. The namespace ensures `auto_service/service_order` is distinct from `warranty/service_order`.

---

#### 4.4 Description

Free-text explanation of when the entity is created, who creates it, and what its key lifecycle stages are. Helps downstream administrators and developers understand the intent without reading the field list.

---

#### 4.5 Domain

The business function owning this entity (e.g. Sales, Service, Finance, HR). Used for module grouping, report organisation, and permission matrix filtering.

---

#### 4.6 Business Category *(Read-only — set by archetype)*

Shows the category locked in by the archetype. Displayed with a lock icon — not user-editable. Users who need a different category must change the archetype.

| Archetype | Business Category |
|---|---|
| `native_persistent` | Transaction |
| `posting_document` | Transaction |
| `reference_code` | Reference |
| `append_only_record` | Ledger-like |
| `virtual_computed` | Reference |
| `system_technical` | Technical |

---

#### 4.7 Owning Layer *(Blank path only)*

Declares the architectural layer that owns this entity definition.

| Layer | Meaning | Example |
|---|---|---|
| **Platform** | Core iDMS entity; shared across all verticals | `Vehicle` master (base) |
| **Vertical** | Industry-specific entity | `Service Job Card` in the Automotive vertical |
| **Tenant** | Company-group-level customisation | `Fleet Account` for a dealer group |
| **Branch / Location** | Node-level entity isolated per physical location | `Workshop Walk-In` for a single branch |

---

#### 4.8 Scope Policy *(Blank path only)*

Defines the data isolation boundary — which users across which organisational units can see the data.

| Policy | Meaning | Typical Use |
|---|---|---|
| `tenant_scoped` | Each company group has its own isolated data | Standard for all operational entities |
| `company_scoped` | Isolated per legal company within a group | Multi-company financial entities |
| `node_scoped` | Isolated per branch / location | Workshop schedule for a single location |
| `hierarchical_scope` | Node-first, rolls up through hierarchy | Budget targets: branch → region → group |
| `global` | Shared across all tenants | Platform reference data |
| `external_scope` | Governed by external system's rules | OEM-federated vehicle allocation |

---

### Step 5 — Key & Storage *(Blank path only)*

**What it does:** Configures how records are identified beyond the system UUID, and confirms the physical storage strategy.

---

#### 5.1 Business Key Type

Declares whether this entity has a human-readable alternate key alongside the system UUID (which is always the physical primary key).

| Option | When to Use | Example |
|---|---|---|
| **UUID Only** | System UUID is sufficient; no user-visible key | Internal junction table |
| **Natural Key** | A single user-visible code uniquely identifies the record | VIN for Vehicle; Policy Number for Insurance |
| **Composite Key** | Multiple fields together form the unique business identity | Branch + Financial Year + Sequence for a voucher |
| **External ID** | Key assigned and managed by an external system | SAP vendor code |
| **Provider Key** | Key assigned by an integration provider | OEM allocation reference number |

---

#### 5.2 Short Code

2–5 character uppercase prefix used in auto-numbering sequences for document-type entities.

| Short Code | Entity | Generated Numbers |
|---|---|---|
| `VO` | Vehicle Order | `VO-2026-000001`, `VO-2026-000002` |
| `IC` | Insurance Claim | `IC-2026-004521` |
| `JC` | Job Card | `JC-2026-001834` |

---

#### 5.3 Plural Label

The plural form used in navigation headers, list view titles, search result counts, and API collection names.

| Singular | Plural |
|---|---|
| Service Job Card | Service Job Cards |
| Insurance Policy | Insurance Policies |
| Property | Properties |

---

#### 5.4 Storage Mode *(Read-only — set by archetype)*

Informational field confirming the physical storage footprint chosen by the archetype. Cannot be changed without changing the archetype.

| Archetype | Storage Mode |
|---|---|
| Native Persistent | Physical table |
| Virtual Computed | SQL view |
| External / Federated | External provider |
| Materialized Projection | Materialized view or table |
| Junction / Association | Junction table |
| Owned Child | Owned child table |
| Append-Only Record / High-Volume Event Log | Append log table |
| Integration Outbox | Outbox table |
| System / Technical | System table |

---

### Step 6 — Security & Capabilities *(Blank path only)*

The most configuration-rich step. Defines who can do what with this entity and which platform services it participates in.

---

#### 6.1 Record Ownership Model

Governs row-level security — who owns individual records and how access is shared.

| Model | Behaviour | Default For |
|---|---|---|
| **User Owned** | Each record has a single owning user. Row-level security is per-user. | `native_persistent` · `posting_document` · `activity_interaction` · `staging_import` |
| **Team Owned** | Record belongs to a team. All team members share access. | *(user-selectable override)* |
| **Org Owned** | All tenant users can read. No per-record owner concept. | `reference_code` |
| **Not Applicable** | Ownership concept does not apply to this archetype. | `virtual_computed` · `external_federated` · `junction_association` · `owned_child` · `append_only_record` · etc. |

For archetypes where ownership is not applicable, a locked **"Not applicable"** chip is shown with an explanation.

**Examples**

> **Automotive CRM:** A `Lead` entity uses **User Owned**. Each lead is assigned to a salesperson who owns it. Only that salesperson (and their manager) can see it by default. Switching to **Team Owned** means all members of the sales team can see the lead.

> **Insurance:** A `Policy` entity uses **User Owned**. The agent who wrote the policy owns it. Their team leader can view all policies in the team; other agents see only their own.

---

#### 6.2 Permission Posture

The entity's default access stance when a user has no explicit permission grant.

| Posture | Behaviour | Recommended For |
|---|---|---|
| **Deny by Default** *(Recommended)* | No access to create, read, update, delete, export, or call the API unless a role explicitly grants it | All financial, HR, or sensitive operational entities |
| **Allow by Default** | All roles have full access unless a deny rule is configured | Low-sensitivity reference/lookup data |

> **Example:** `Financial Journal Entry` (append_only_record) should be **Deny by Default** — only Finance roles should access it. `Service Type` (reference_code) might use **Allow by Default** since all service staff need to read it.

---

#### 6.3 Provider Security Mode *(External / Federated entities only)*

Controls how the user's identity is passed to the external provider.

| Mode | Meaning |
|---|---|
| `local_only` | iDMS authenticates with a system service account; user identity not propagated |
| `provider_only` | User must authenticate directly with the provider |
| `hybrid` | iDMS passes both system credentials and user context |
| `user_context_propagated` | User's iDMS token is propagated to the provider for row-level filtering |

---

#### 6.4 Capabilities

23 independent toggles defining which platform services this entity participates in. Archetypes pre-configure sensible defaults. Some capabilities are **locked** (with a tooltip explaining why) based on the archetype's inherent constraints.

##### Capability Groups

| Group | Capabilities | Business Significance |
|---|---|---|
| **Data Operations** | Can Be Saved · Lookup Eligible | Can records be created/updated? Can this entity be used as a reference field target? |
| **Import / Export** | Importable · Exportable | Can records be bulk-loaded from CSV? Can data be exported to Excel/CSV? |
| **Reporting** | Reportable · Printable | Does this feed analytics builders? Can records produce PDF/print output? |
| **API & Integration** | API Exposed · Event Publishable | Is a REST endpoint generated? Do state changes publish domain events? |
| **Offline & Cache** | Offline Enabled · Cacheable | Can field staff use this offline? Are query results cached for performance? |
| **Governance** | Extendable · Auditable · Workflow Enabled | Can downstream layers add fields? Is every change logged? Does this have a workflow lifecycle? |
| **CRM / Timeline** | Timeline Eligible · Notification Eligible | Do activities appear in the customer timeline? Can the entity trigger push/email reminders? |
| **Packages** | Package Installable | Can this entity be deployed via a configuration package? |
| **Data Lifecycle** | Reversible · Retention Managed · Partitioned | Is correction via reversal supported? Does data expire/archive? Is the table partitioned for performance? |
| **Advanced** | Provider Backed · Staging Promotable · Hierarchy Rollup Enabled | External data source? Can staged data be promoted? Does the hierarchy roll up? |

##### Locked Capability Examples

| Archetype | Capability | Locked State | Reason |
|---|---|---|---|
| `virtual_computed` | Can Be Saved | **OFF** | Cannot save directly — data is derived |
| `system_technical` | API Exposed | **OFF** | System entities are not exposed via public API |
| `integration_outbox` | Event Publishable | **ON** | Publishing is the outbox's sole purpose |
| `integration_outbox` | Can Be Saved | **OFF** | Outbox events are system-published — no manual saves |
| `high_volume_event_log` | Retention Managed | **ON** | Event logs always require retention policy |
| `high_volume_event_log` | Partitioned | **ON** | Event logs always require partition policy |
| `staging_import` | Staging Promotable | **ON** | Promotion is the staging purpose |
| `posting_document` | Reversible | **ON** | Posting documents always support reversal |
| `external_federated` | Provider Backed | **ON** | External entities are always provider-backed |

---

### Step 7 — Review & Create

**What it does:** Presents a consolidated summary of all wizard choices, surfaces compile-time validation feedback, previews system fields and API endpoints, and enables final confirmation.

---

#### 7.1 Identity Card

| Field | Example Value |
|---|---|
| Label | Service Job Card |
| API Name | `entity.service_job_card` |
| Category | Transaction |
| Domain | Service |
| Layer | Tenant |
| Key Type | Natural Key |
| Namespace | `auto_service` |
| Ownership | User Owned |

---

#### 7.2 Architecture Card

| Field | Example Value |
|---|---|
| Archetype | Native Persistent |
| Persistence | Physical Table |
| Mutability | Read/Write |
| Source of Truth | iDMS |
| Scope | Tenant Scoped |
| Storage | Physical Table |
| Security | Deny by Default |

---

#### 7.3 Capabilities Grid

A 4-column grid of all capabilities showing enabled (✓) vs. disabled state at a glance.

---

#### 7.4 API Endpoint Preview

When **API Exposed** is enabled, the exact REST endpoints that will be generated are shown in a monospace code block:

```
GET    /api/v1/{namespace}/{entity}          List records
GET    /api/v1/{namespace}/{entity}/{id}     Get a single record
POST   /api/v1/{namespace}/{entity}          Create a record       (only if canSave)
PATCH  /api/v1/{namespace}/{entity}/{id}     Update a record       (only if canSave)
DELETE /api/v1/{namespace}/{entity}/{id}     Delete a record       (only if canSave)
```

Method badges are colour-coded: `GET` = blue · `POST` = green · `PATCH` = orange · `DELETE` = red

When API Exposed is **disabled**, a note explains how to enable it.

**Example**

> `Service Job Card` with namespace `auto_service` generates:
> - `GET /api/v1/auto_service/service_job_card`
> - `POST /api/v1/auto_service/service_job_card`
> - `PATCH /api/v1/auto_service/service_job_card/{id}`
>
> These are the exact URLs the mobile technician app and the customer portal will consume.

---

#### 7.5 System Fields (Auto-Included)

All system fields automatically injected at entity creation are listed. These are determined by the archetype and cannot be removed at this stage.

> A `native_persistent` entity will always have: **ID · Tenant ID · Status · Created At · Created By · Owner · Updated At · Updated By · Is Deleted**

---

#### 7.6 Blocking Issues

Red-bordered issues that **prevent creation** unless resolved. The **Create Draft** button is disabled while any blocking issue exists.

| Code | Trigger | Message |
|---|---|---|
| `PROVIDER_ADAPTER_REQUIRED` | External/Federated — no adapter configured | Provider capability contract required |
| `VIRTUAL_NO_SOURCE` | Virtual Computed — no source entities selected | Requires a query binding or dataset definition |
| `PROJECTION_NO_SOURCE` | Materialized Projection — no source entities | Source entities required |
| `EVENT_LOG_NO_RETENTION` | High-Volume Event Log — retention disabled | Retention policy required |
| `EVENT_LOG_NO_PARTITION` | High-Volume Event Log — partition disabled | Partition policy required |
| `VIRTUAL_NO_SAVE` | Virtual Computed with Can Be Saved enabled | Cannot be directly saved |
| `PROVIDER_KEY_NO_PROVIDER` | Provider Key on non-federated entity | Provider key requires External/Federated archetype |

---

#### 7.7 Warnings

Amber-bordered advisory messages. Do not block creation, but should be addressed before publishing to production.

| Code | Trigger | Message |
|---|---|---|
| `API_SECURITY_REQUIRED` | API Exposed enabled | Configure API security before publishing |
| `NAMESPACE_MISSING` | Non-platform entity, no namespace set | Namespace prevents API name collisions |
| `CACHE_TTL_REQUIRED` | Cacheable enabled | Configure cache policy with TTL |
| `PRINT_TEMPLATE_NOT_CONFIGURED` | Printable enabled | No print template strategy configured |
| `EXTERNAL_SCOPE_MISMATCH` | External/Federated with non-external scope | External entities typically use external or tenant scope |
| `PROJECTION_STALE_REPORT` | Materialized Projection + Reportable | Configure stale data display policy |

---

#### 7.8 Post-Creation Next Steps

Contextual list of required follow-up actions, generated automatically based on the entity's archetype and capabilities.

| Archetype / Condition | Next Steps Generated |
|---|---|
| `owned_child` | Define parent relationship · Configure lifecycle-aware delete/update policy |
| `junction_association` | Define two relationship endpoints · Configure uniqueness constraint |
| `posting_document` | Configure posting lifecycle model · Configure document numbering · Configure reversal/cancellation policy · Configure audit policy |
| `staging_import` | Configure import validation rules · Configure promotion policy · Configure retention policy |
| `integration_outbox` | Configure retry policy · Configure dead-letter policy · Configure destination system mapping |
| `materialized_projection` | Configure refresh policy (mode, trigger, schedule) |
| User Owned or Team Owned | Configure owner field visibility and sharing rules in Permission Matrix |
| API Exposed | Configure API security before publishing |

---

## 4. Cross-Step Validation Summary

The wizard enforces these guards before allowing progression between steps:

| Step | Guard Condition |
|---|---|
| Origin | Must select a creation pattern |
| Archetype | Must select an archetype |
| Base Entity | Must select a valid base entity from the registry |
| Source | External/Federated: must enter an external system code |
| Identity | Label ≥ 2 characters · API Name must not already exist · Non-platform entities must provide a namespace ≥ 2 characters |
| Key & Storage | Always valid (defaults are acceptable) |
| Security & Capabilities | Always valid |
| Review | Blocking compile issues prevent creation |

---

## 5. Industry Use Case Walkthroughs

### Use Case 1 — Automotive Dealership: CRM Activity Module

> A Toyota dealer group is implementing iDMS CRM. The functional consultant creates the following entities:

| Entity | Archetype | Key Decisions |
|---|---|---|
| `Test Drive Activity` | Activity / Interaction | User Owned · Timeline Eligible · Notification Eligible · linked to Lead |
| `Follow-Up Call` | Activity / Interaction | User Owned · `due_datetime` triggers reminder notification |
| `Customer Communication Log` | Append-Only Record | Ledger-like · Immutable · captures every outbound call/SMS/email |
| `Lead Source Code` | Reference / Code | Org Owned · Cacheable · Lookup Eligible · used in Lead drop-down |

---

### Use Case 2 — Heavy Equipment Dealer: Preventive Maintenance Module

> A CAT dealer manages maintenance plans for 2,000 machines across 15 customer sites.

| Entity | Archetype | Key Decisions |
|---|---|---|
| `Maintenance Plan` | Native Persistent | User Owned · Workflow Enabled (Draft → Active → Completed) · Extendable |
| `Maintenance Task` | Owned Child | Parent = Maintenance Plan · `line_number` auto-assigned |
| `Machine Sensor Log` | High-Volume / Event Log | Partitioned by `machine_id + month` · 24-month retention · Append-Only |
| `CAT Parts Catalog` | External / Federated | External system = `CAT_PARTS_API` · Read-only · Lookup Eligible · Cacheable |

---

### Use Case 3 — Healthcare: Patient Services Platform

> A multi-hospital group needs a patient data platform.

| Entity | Archetype | Key Decisions |
|---|---|---|
| `Patient` | Native Persistent *(extended from platform)* | User Owned · Extendable · Auditable · Deny by Default |
| `Clinical Charge Sheet` | Posting Document | User Owned · Draft → Posted → Reversed · Printable · API Exposed |
| `Medication Administration Record` | Append-Only Record | Immutable · No soft delete · Auditable · Retention Managed |
| `Patient Appointment Reminder` | Activity / Interaction | Notification Eligible · Timeline Eligible · Linked to Patient |
| `Patient Billing Summary` | Materialized Projection | Source: Patient + Invoice + Payment · Nightly refresh · Reportable |

---

### Use Case 4 — Insurance: Claims Processing Platform

> A general insurance company configures their claims management system.

| Entity | Archetype | Key Decisions |
|---|---|---|
| `Insurance Claim` | Native Persistent | Natural Key (Claim Number) · Workflow Enabled · Auditable · Printable · API Exposed |
| `Claim Document` | Owned Child | Parent = Insurance Claim · No independent lifecycle |
| `Policy Migration Staging` | Staging / Import | Validates against Policy rules · Promotes to Policy entity · 30-day retention |
| `Claim Status Change Outbox` | Integration Outbox | Publishes to regulatory portal · Retry policy + dead-letter |
| `Rejection Reason Code` | Reference / Code | Org Owned · Cacheable · Lookup Eligible |

---

### Use Case 5 — Real Estate: Rental Operations Platform

> A property management company managing 5,000 residential units.

| Entity | Archetype | Key Decisions |
|---|---|---|
| `Tenancy Agreement` | Posting Document | User Owned · Natural Key (Agreement No.) · Immutable after signing · Printable |
| `Property` | Native Persistent | Natural Key (Property ID) · Lookup Eligible · Extendable |
| `Tenant-Property Assignment` | Junction / Association | Links Tenant to Property · carries `lease_start`, `lease_end`, `monthly_rent` |
| `Maintenance Request` | Native Persistent | User Owned · Workflow Enabled (Raised → Assigned → Resolved) · Notification Eligible |
| `Portfolio Summary` | Materialized Projection | Source: Property + Tenancy + Payment · Hourly refresh · Dashboard feed |
| `Property Viewing Activity` | Activity / Interaction | Timeline Eligible · Linked to Property + Lead · Owned by leasing agent |

---

## 6. Post-Creation Architecture

When the user confirms on the Review step, the wizard executes the following sequence:

```
1. Assemble EntityDefinition
   └─ All configured dimensions, capabilities, security defaults,
      record ownership, storage configuration, and namespace

2. Run buildCanonicalEntityAuthoringBundle()
   └─ Metadata-level validation: cross-field consistency checks,
      generate canonical metadata artefacts

3a. If valid → Store entity in draft status
    └─ Draft entities are visible in Entity Designer
       but do NOT generate runtime API endpoints or trigger
       workflow compilation until published

3b. If invalid → Show first validation error as toast notification
    └─ User stays on Review step to resolve the issue

4. On success → Navigate to entity's Schema page
   └─ User begins adding business fields
```

> **Important:** Draft metadata is **never** interpreted directly at runtime. Entities must be published (after field, rule, and security configuration) to become active.

---

## 7. Design Principles Observed

| Principle | How it is Implemented |
|---|---|
| **Archetype drives all defaults** | Selecting an archetype sets 20+ default values atomically. Users refine, not configure from scratch. |
| **Locked capabilities are transparent** | Locked toggles show a tooltip explaining why, preventing confusion without hiding information. |
| **Business category is not user-editable** | Derived from archetype, removing a common source of contradictory metadata in legacy DMS configurators. |
| **Namespace is enforced at Identity** | Required before leaving the Identity step (not post-creation) to prevent API collisions in multi-tenant deployments. |
| **Compile feedback is inline** | Blocking issues and warnings appear on the Review step before creation — not discovered at runtime. |
| **System fields are automatic** | Each archetype has a curated set of system-managed fields. Users add business fields post-creation. |
| **API preview is immediate** | The exact REST URL is shown at Review time so the integration team knows the endpoint before the entity is even created. |
| **Published metadata is immutable** | Entities in `active` status cannot have breaking changes applied without a version/dependency analysis — enforced at the platform layer. |

---

*iDMS Admin Studio · Entity Creation Functional Specification · v1.0 · May 2026*
