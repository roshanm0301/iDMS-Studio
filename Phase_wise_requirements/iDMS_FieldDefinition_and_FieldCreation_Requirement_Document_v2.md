# iDMS Admin Studio — FieldDefinition and Field Creation Requirement Document v2
## Supersedes the earlier FieldDefinition requirement document
### Audience: Product, Architecture, Engineering, QA, AI Coding Agents
### Status: Revised Target Requirements
### Purpose: Define a complete enterprise-grade field metadata model for iDMS Admin Studio across native, extension, virtual, computed, external, projected, compound, snapshot, and governed value-source field patterns.

---

## 0. Supersession Note

This document **supersedes the earlier FieldDefinition requirement document**.

The earlier version was directionally correct in separating business type, logical data type, PostgreSQL storage type, and UI control type. However, it was incomplete because it still modeled fields too much as **typed data columns with UI defaults** and did not sufficiently model:

- Virtual, computed, persisted-computed, rollup, projected, and external/provider-backed fields as distinct field archetypes
- Snapshot/frozen-copy fields that preserve transactional history after source master data changes
- Compound fields and constituent fields such as address, person name, and geolocation
- Value-source metadata as a first-class concern separate from field typing
- Field query capabilities as explicit or provider-derived capabilities instead of simple booleans
- Key roles such as primary key, business key, alternate key, external ID, display field, status field, and scope fields
- Data normalization, canonicalization, display representation, and stored-value versus display-value separation
- Protection policies beyond only data classification and masking
- Restrictions introduced by the revised EntityDefinition archetypes, especially `virtual_computed`, `external_federated`, and `materialized_projection`
- The difference between field catalog blueprints, instantiated fields, field value sources, and field derivation rules

The revised model below must be treated as the target truth for future implementation.

---

## 1. Design Objective

Field Designer must not be a screen for only adding database columns or UI controls.

It must be able to define the full spectrum of enterprise fields used by iDMS:

1. Canonical stored business fields
2. System and technical fields
3. Identity and key fields
4. Tenant/vertical extension fields
5. Relationship reference fields
6. Picklist/value-set fields
7. Virtual computed fields
8. Persisted computed fields
9. Rollup fields
10. Snapshot/frozen-copy fields
11. External/provider-mapped fields
12. Projection fields used by virtual or materialized entities
13. Compound fields and constituent fields
14. File/media reference fields
15. Query/search/reporting fields with explicit capability constraints

The field model must support both:

- **Business semantics**: What does this field mean?
- **Runtime semantics**: Where does its value come from, how is it stored, who may change it, and how can it be queried or rendered?

---

## 2. Non-Negotiable Architecture Principles

| Principle | Requirement |
|---|---|
| Field is not only a column | `FieldDefinition` must describe business meaning, value origin, persistence, mutability, queryability, governance, and runtime participation. |
| Business meaning is not data shape | `GSTIN`, `VIN`, `Invoice Amount`, and `Customer Name Snapshot` are business types; `text`, `currency`, and `compound` are logical shapes. |
| Logical type is not PostgreSQL type | Field creation must not expose raw PostgreSQL typing as the primary authoring decision. |
| UI field type is not data type | UI control selection belongs to `ViewDefinition`; `FieldDefinition` may only expose compatible/default controls. |
| Value source is separate from field type | Picklist, lookup, provider, lifecycle state set, dependent options, and query-backed options require a `FieldValueSourceDefinition` or equivalent child metadata. |
| Computed is not one thing | iDMS must distinguish virtual computed, persisted computed, rollup, snapshot copy, provider-derived, and projected fields. |
| Snapshot is not lookup copy | A snapshot field preserves historical value semantics and may freeze after a lifecycle event; it is not just a convenience copy-on-select. |
| Query capability must be explicit | Searchability, filterability, sortability, groupability, and aggregation eligibility must be metadata capabilities, not assumed from type alone. |
| Security is not visibility | Masking, hiding, encryption, export policy, and API policy must not be confused with display decisions. |
| Field behavior must respect entity archetype | A field on an external entity, virtual entity, or materialized projection cannot blindly inherit the same assumptions as a native persisted entity. |
| Draft metadata must not run directly | Runtime must consume only compiled/resolved active field metadata. |
| Downstream overlays are constrained | Lower layers may decorate or constrain only where permitted; they must not casually change source, storage, key role, or derivation semantics. |

---

## 3. Why the Earlier Version Was Insufficient

The earlier FieldDefinition document correctly separated:

- business type,
- logical data type,
- physical PostgreSQL type,
- and default UI control.

It also covered:

- basic field behavior,
- storage strategy,
- lifecycle,
- governance,
- dependency tracking,
- catalog fields,
- and PostgreSQL mapping.

However, after revising `EntityDefinition`, the previous field model is now incomplete for the following reasons.

### 3.1 It did not fully account for revised entity archetypes

The new entity model distinguishes `native_persistent`, `virtual_computed`, `external_federated`, `materialized_projection`, `junction_association`, `owned_child`, `append_only_record`, and `system_technical` entities. A field belonging to these archetypes cannot be treated uniformly.

Examples:

- A field on an `external_federated` entity may be provider-mapped and only conditionally sortable or writable.
- A field on a `virtual_computed` entity may be query-projected and not stored at all.
- A field on a `materialized_projection` entity may be physically stored but refresh-only, not user-editable.
- A field on an `append_only_record` entity may be immutable after creation even if it is physically stored.

### 3.2 It under-modeled value sourcing

Your older metadata model already treated **Attribute Datasource Metadata** as a distinct concept, including lookup type, picklist master, lookup entity, stored procedure/query binding, value member, display member, fetch/display columns, postback type, and filters. That is a strong signal that value sourcing must not be compressed into a couple of flags on the field itself.

### 3.3 It under-modeled derivation families

A field may be:

- computed at read time,
- computed and persisted,
- rolled up from related records,
- copied from a source and later frozen,
- provider-supplied,
- or projected from a query.

These are not the same behavior. They differ in persistence, writeability, refresh, audit, dependency, and migration behavior.

### 3.4 It missed compound fields

Enterprise platforms often support structured fields such as address and geolocation where the user sees one logical field while the platform stores or exposes constituent subfields. iDMS must support this pattern rather than forcing every complex field into disconnected flat columns.

### 3.5 It did not give snapshot fields enough weight

DMS documents frequently require historical preservation:

- customer name/address snapshot on invoice,
- GSTIN snapshot on tax invoice,
- part description snapshot on invoice lines,
- vehicle details snapshot at booking or delivery,
- tax rate snapshot on posted financial documents.

If the source master changes later, historical documents must not silently change. This is a core enterprise requirement, not a future nice-to-have.

---

## 4. Field Classification Model

Every `FieldDefinition` must be classified across **six independent dimensions**.

### 4.1 Dimension 1 — Semantic Role

This describes why the field exists in the business/domain model.

| Semantic Role | Meaning | Examples |
|---|---|---|
| `primary_key` | Internal immutable technical identity | `id` |
| `business_key` | Human/business-recognizable unique identifier | `job_card_no`, `customer_code` |
| `alternate_key` | Additional uniqueness key | `vin`, `gstin_number` |
| `external_id` | Integration matching/upsert key | `oem_customer_id` |
| `display_name` | Preferred record caption/label field | `customer_name` |
| `status` | Record lifecycle/status carrier | `status_code` |
| `scope_key` | Organizational partition key | `tenant_id`, `company_id`, `node_id` |
| `audit` | Platform audit field | `created_at`, `updated_by` |
| `business_attribute` | Normal business data | `booking_date`, `mobile_no` |
| `measure` | Numeric field intended for aggregation | `invoice_amount`, `quantity` |
| `dimension` | Field intended for grouping/filtering | `service_type`, `part_category` |
| `derived_indicator` | Derived flag or score | `is_overdue`, `credit_risk_score` |
| `snapshot_attribute` | Historical copy of source data | `customer_name_snapshot` |

**Rule:** Semantic role is not the same as business type or logical data type. A `VIN` can be both `alternate_key` and `text_identifier`.

### 4.2 Dimension 2 — Field Archetype / Value Origin

This describes how the field obtains its value in the broader metadata model.

| Field Archetype | Meaning | Typical Examples |
|---|---|---|
| `stored_business` | User/system-owned canonical stored field | `customer_name`, `booking_date` |
| `stored_extension` | Lower-layer custom stored field | `preferred_delivery_slot` |
| `system_generated` | Platform-generated field | `id`, `created_at`, `record_version` |
| `relationship_reference` | Field storing relationship identity | `customer_id`, `vehicle_id` |
| `value_set` | Field constrained to governed values | `customer_type`, `payment_mode` |
| `computed_virtual` | Derived at runtime, not stored | `days_open`, `balance_due_live` |
| `computed_persisted` | Derived and physically stored for performance | `total_amount` |
| `rollup` | Aggregated from related records | `total_parts_amount`, `open_claim_count` |
| `snapshot_copy` | Copied from source and later preserved/frozen | `customer_name_snapshot`, `gstin_snapshot` |
| `external_mapped` | Value supplied by external provider/source of truth | `sap_customer_code`, `oem_allocation_status` |
| `projection_field` | Field exposed by a virtual/materialized projection | `open_balance`, `last_service_date` in a summary entity |
| `compound_parent` | Structured logical field with constituent fields | `address`, `geo_location`, `person_name` |
| `compound_constituent` | Child component of compound field | `address_line1`, `latitude`, `longitude` |
| `media_reference` | Field pointing to managed file/media object | `invoice_attachment_id`, `signature_id` |
| `technical_shadow` | System/internal helper field not normally user-facing | `search_vector`, `sync_hash` |

### 4.3 Dimension 3 — Logical Shape and Data Type

This describes the platform-level shape of the value, independent of physical storage and UI rendering.

| Logical Shape | Meaning | Examples |
|---|---|---|
| `scalar` | Single atomic value | text, integer, decimal, date, boolean |
| `reference` | Pointer to another record | entity reference, external reference |
| `value_set` | Code chosen from controlled vocabulary | select, dependent select |
| `multi_value` | Multiple primitive values | multi-select tags |
| `compound` | Structured field with known child constituents | address, geolocation, person name |
| `structured` | Flexible structured payload | JSON configuration |
| `media` | File/image/signature reference | attachment, signature |
| `derived` | Value produced by expression/aggregation/projection | formula, rollup |
| `collection` | Repeating child-like data structure | should usually become relation/owned child, not embedded field |

#### Recommended MVP logical data types

| Group | Logical Data Types |
|---|---|
| Text | `text`, `long_text`, `text_identifier`, `email`, `phone`, `url`, `rich_text` |
| Numeric | `integer`, `decimal`, `currency_amount`, `percentage`, `quantity`, `duration` |
| Temporal | `date`, `datetime`, `time` |
| Boolean | `boolean` |
| Value-set | `enum`, `multi_enum` |
| Relationship | `entity_reference`, `polymorphic_reference`, `external_reference` |
| Derived | `computed`, `rollup` |
| Structured | `json`, `address`, `geolocation`, `person_name` |
| Media | `file_reference`, `image_reference`, `signature_reference` |
| Generated | `auto_number` |

### 4.4 Dimension 4 — Persistence Mode

This describes where and how the field value is persisted.

| Persistence Mode | Meaning |
|---|---|
| `physical_column` | Stored in the entity's canonical table |
| `extension_column` | Stored in an extension table/column model |
| `jsonb_extension` | Stored in governed JSONB extension storage |
| `generated_virtual` | Computed on read; no storage |
| `generated_stored` | Computed and stored |
| `query_projected` | Supplied by query/view projection |
| `provider_backed` | Supplied by external provider/source |
| `snapshot_column` | Stored copied value with source and freeze semantics |
| `relation_backed` | Value represented by related child/junction structure rather than local scalar column |
| `none` | No business persistence; metadata-only/system use |

### 4.5 Dimension 5 — Mutability Mode

This defines who or what may change the field value.

| Mutability Mode | Meaning |
|---|---|
| `user_editable` | User may create/update subject to security and lifecycle |
| `create_only` | Set at creation and immutable afterward |
| `editable_until_state` | Editable until specified lifecycle state |
| `system_only` | Only platform/system process may set |
| `integration_only` | Only approved integration may write |
| `provider_capability_driven` | Writability depends on external provider capability |
| `derived_read_only` | Never directly editable; produced by derivation |
| `refresh_only` | Updated only by refresh/rebuild job |
| `append_immutable` | Set on insert and then immutable |
| `snapshot_refreshable_until_freeze` | Copied from source until a freeze event occurs |

### 4.6 Dimension 6 — Value Source / Binding Mode

This describes how valid or displayed values are sourced.

| Value Source / Binding Mode | Meaning |
|---|---|
| `direct_entry` | User/system directly enters value |
| `static_value_set` | Fixed values defined with the field |
| `governed_picklist` | Reusable managed value set |
| `lifecycle_state_set` | Values derived from lifecycle model |
| `entity_lookup` | Values selected from another entity |
| `external_lookup` | Values selected from external provider/source |
| `dependent_value_set` | Options controlled by another field |
| `query_binding` | Options resolved through governed query binding |
| `provider_binding` | Value or options supplied by provider API |
| `formula_binding` | Value derived from formula/expression |
| `rollup_binding` | Value aggregated from related records |
| `copy_binding` | Value copied from source field |
| `projection_binding` | Value projected by view/query/read model |
| `none` | No value-source binding needed |

---

## 5. Critical Conceptual Distinctions

### 5.1 `FieldDefinition` vs `ViewFieldDefinition`

| Concept | Owns |
|---|---|
| `FieldDefinition` | Data meaning, origin, shape, persistence, mutability, governance, query capability |
| `ViewFieldDefinition` | Placement, section, label override, width, control override, view-specific visibility, tab order |

**Rule:** The same field may render as a dropdown in a form, a chip in a list, a plain label in print, and a multiselect filter in a filter panel without changing `FieldDefinition`.

### 5.2 Virtual Field vs Virtual Entity

| Concept | Meaning |
|---|---|
| Virtual field | The field is derived/non-persisted while the parent entity may still be physical |
| Virtual entity | The entity itself has no canonical stored record store or is provider/query-backed |

A physical entity may contain virtual fields. A virtual entity may expose projected fields. They must not be conflated.

### 5.3 Computed vs Rollup vs Snapshot vs Projection

| Type | Source | Persistence | Typical Writeability | Example |
|---|---|---|---|---|
| Computed virtual | Formula on same/current record context | None | Read-only | `days_open` |
| Computed persisted | Formula, stored for performance | Stored | Read-only/system-maintained | `line_total` |
| Rollup | Related records | Optional stored/materialized | Read-only/system-maintained | `total_parts_amount` |
| Snapshot copy | Source record copied at point in time | Stored | Refreshable until freeze | `customer_name_snapshot` |
| Projection | Query/read model output | Query or materialized storage | Refresh-only/read-only | `open_balance` |

### 5.4 Lookup Field vs RelationshipDefinition

A lookup/reference field stores or represents the value used in a relation. `RelationshipDefinition` owns cardinality, delete behavior, ownership, security inheritance, and inverse relation behavior.

**Rule:** `FieldDefinition` may reference a relationship but must not independently define relationship cardinality or cascade behavior.

### 5.5 Value Source vs Storage

A field can:

- store a `varchar(50)` code,
- source allowed values from a governed picklist,
- render as a dropdown,
- and expose a localized label.

These are related but separate concerns.

### 5.6 Default Value vs Derivation vs Validation vs UI Reaction

| Concern | Owner |
|---|---|
| Static/default initialization | `FieldDefinition` or `DefaultValuePolicy` |
| Derived value | `FieldDerivationDefinition` |
| Save/submit eligibility | `ValidationRuleDefinition` |
| Dynamic hide/show/lock/default-on-change behavior | `UIReactionRuleDefinition` |

### 5.7 Data Classification vs Protection Policy

Classification tells the system **what kind of data it is**. Protection policy tells the system **how it must be handled**.

| Example | Classification | Protection Policy |
|---|---|---|
| GSTIN | regulated | mask in exports, audit access, optionally encrypt at rest |
| Aadhaar | regulated | mask, encrypt/tokenize, restricted API output |
| Mobile | sensitive | mask in some exports, log access |
| Customer Name | internal | normal handling |

### 5.8 Field Label Translation vs Field Value Translation

| Concern | Meaning |
|---|---|
| Label translation | UI label shown in different languages |
| Value translation | Stored business text or picklist labels shown in different languages |

These must be modeled separately. A translated label does not mean the stored value is multilingual.

### 5.9 Snapshot Copy vs Convenience Copy Rule

| Type | Meaning |
|---|---|
| Convenience copy | Auto-populates data for user convenience; may be overwritten |
| Snapshot copy | Persists historical value and freezes based on lifecycle policy |

A tax invoice GSTIN snapshot is not a casual field-copy rule. It is part of legal document correctness.

---

## 6. Required Metadata Objects Around Fields

`FieldDefinition` must not absorb every concern into one bloated object. The following related metadata objects are required conceptually, even if implementation starts with nested JSON and is later normalized.

| Metadata Object | Purpose |
|---|---|
| `FieldCatalogDefinition` | Reusable blueprint/preset for field creation, such as GSTIN, PAN, VIN, Indian Mobile |
| `FieldDefinition` | Instantiated field attached to a specific entity |
| `FieldValueSourceDefinition` | Defines picklist, lookup, dependent options, provider, or query-backed value sourcing |
| `FieldDerivationDefinition` | Defines formula, rollup, snapshot copy, projection, refresh, and freeze semantics |
| `FieldFormatPolicy` | Defines display mask, locale formatting, stored-vs-display representation, and normalization rules |
| `FieldProtectionPolicy` | Defines masking, encryption/tokenization, redaction, export/API exposure defaults |
| `FieldQueryCapability` | Defines filter/sort/search/group/aggregate/index eligibility and provider-derived limitations |
| `ViewFieldDefinition` | Defines view-specific rendering and placement |

**Implementation note:** These may initially be stored as child structures of `FieldDefinition`, but the conceptual boundaries must remain explicit so the platform does not collapse into an unmaintainable “god field object.”

---

## 7. Required Field Archetypes

### 7.1 Stored Business Field

| Area | Requirement |
|---|---|
| Typical entity | `native_persistent`, `owned_child`, `junction_association` |
| Value origin | User/system entered |
| Persistence | `physical_column` |
| Mutability | Usually `user_editable` or lifecycle constrained |
| Examples | `customer_name`, `booking_date`, `remarks` |

### 7.2 Stored Extension Field

| Area | Requirement |
|---|---|
| Typical entity | Extensible native entity |
| Value origin | Tenant/vertical configuration |
| Persistence | `extension_column` or governed `jsonb_extension` |
| Mutability | User editable unless governed otherwise |
| Examples | `preferred_delivery_slot`, tenant-specific survey field |
| Rule | JSONB is not allowed for financial, posting, integration-key, report-critical, or workflow-critical fields. |

### 7.3 System / Technical Field

| Area | Requirement |
|---|---|
| Value origin | Platform generated |
| Persistence | Usually `physical_column` |
| Mutability | `system_only` or `append_immutable` |
| Examples | `id`, `created_at`, `updated_at`, `row_version`, `sync_hash` |
| Rule | Must be protected from normal business edits and lower-layer override. |

### 7.4 Identity / Key Field

| Area | Requirement |
|---|---|
| Semantic role | `primary_key`, `business_key`, `alternate_key`, or `external_id` |
| Must support | uniqueness scope, null handling, case sensitivity, dependency awareness |
| Examples | `id`, `job_card_no`, `vin`, `oem_customer_id` |
| Rule | Field key role must bind to `ConstraintDefinition`; a mere boolean flag is insufficient. |

### 7.5 Relationship Reference Field

| Area | Requirement |
|---|---|
| Persistence | Usually `uuid`/external key column |
| Value source | `entity_lookup`, `external_lookup`, or `provider_binding` |
| Examples | `customer_id`, `vehicle_id`, `supplier_id` |
| Rule | Must reference `RelationshipDefinition`; relationship behavior must not be duplicated in the field. |

### 7.6 Value-Set / Picklist Field

| Area | Requirement |
|---|---|
| Value source | `static_value_set`, `governed_picklist`, `lifecycle_state_set`, or `dependent_value_set` |
| Stored value | Stable code or governed value ID, not translated display label |
| Examples | `customer_type`, `service_type`, `payment_mode` |
| Rule | Business picklists must not be hard-coded as PostgreSQL ENUMs. |

### 7.7 Computed Virtual Field

| Area | Requirement |
|---|---|
| Value origin | Formula/expression |
| Persistence | `generated_virtual` or runtime formula |
| Mutability | `derived_read_only` |
| Examples | `days_open`, `is_overdue` |
| Rule | Must declare dependencies and allowed execution context. |

### 7.8 Computed Persisted Field

| Area | Requirement |
|---|---|
| Value origin | Formula/expression |
| Persistence | `generated_stored` or service-maintained column |
| Mutability | `system_only` |
| Examples | `line_total`, `taxable_value` |
| Rule | Persist only where performance, filtering, or historical correctness requires it. |

### 7.9 Rollup Field

| Area | Requirement |
|---|---|
| Value origin | Related child/linked records |
| Persistence | Virtual or materialized/stored |
| Mutability | `derived_read_only` / refresh-managed |
| Examples | `total_parts_amount`, `open_claim_count` |
| Rule | Must reference relationship, aggregate function, filter, refresh policy, and staleness semantics. |

### 7.10 Snapshot / Frozen-Copy Field

| Area | Requirement |
|---|---|
| Value origin | Copied from a source record/field |
| Persistence | `snapshot_column` |
| Mutability | `snapshot_refreshable_until_freeze` |
| Examples | `customer_name_snapshot`, `gstin_snapshot`, `tax_rate_snapshot` |
| Must support | source field, copy trigger, refresh policy, freeze event, overwrite rule, source traceability |
| Rule | Once frozen, source-master edits must not mutate historical snapshot values. |

### 7.11 External / Provider-Mapped Field

| Area | Requirement |
|---|---|
| Value origin | External provider/system |
| Persistence | `provider_backed`, `foreign_table_backed`, optional local cache |
| Mutability | `provider_capability_driven` or `integration_only` |
| Examples | `sap_customer_code`, `oem_allocation_status` |
| Rule | Queryability and writability must be provider-capability-driven, not blindly enabled. |

### 7.12 Projection Field

| Area | Requirement |
|---|---|
| Typical entity | `virtual_computed`, `materialized_projection` |
| Value origin | Query/projection/read model |
| Persistence | `query_projected` or persisted projection column |
| Mutability | `derived_read_only` or `refresh_only` |
| Examples | `last_service_date`, `open_balance` in summary entity |
| Rule | Must declare source projection and refresh/staleness semantics. |

### 7.13 Compound Field / Constituent Field

| Area | Requirement |
|---|---|
| Logical shape | `compound` |
| Examples | `address`, `geo_location`, `person_name` |
| Must support | parent field, constituent fields, serialization contract, display template, write behavior |
| Rule | Parent compound field and child constituents must map consistently to APIs and UI. |

### 7.14 Media Reference Field

| Area | Requirement |
|---|---|
| Persistence | reference to managed file/media service |
| Examples | `signature_id`, `vehicle_photo_id`, `attachment_id` |
| Rule | Binary content must not be stored in the business table itself. |

---

## 8. Field Creation Decision Flow

The creation wizard must first ask the configurator to classify **what kind of field they are creating**, not only ask them to choose a UI/input type.

### 8.1 Step 1 — Choose Field Origin

Allowed options:

1. From Field Catalog
2. New Local Business Field
3. Relationship Reference Field
4. Computed / Derived Field
5. Snapshot / Frozen-Copy Field
6. External / Provider-Mapped Field
7. Projection Field
8. Compound Field
9. System Field — internal/platform use only

### 8.2 Step 2 — Choose Business Meaning and Semantic Role

The wizard must capture:

- business type / meaning,
- semantic role,
- whether the field is key-like,
- whether it is a display field,
- whether it represents money, quantity, date, status, or snapshot semantics.

### 8.3 Step 3 — Resolve Parent Entity Constraints

Before continuing, the system must check the parent entity archetype.

Examples:

- A `virtual_computed` entity must not allow ordinary user-editable physical fields unless explicitly designed as hybrid/cached projection.
- An `external_federated` entity must default to provider-backed fields and provider-driven capabilities.
- A `materialized_projection` entity must default projected fields to refresh-only.
- An `append_only_record` entity must default field mutability to immutable after insert.

### 8.4 Step 4 — Choose Logical Shape and Type

The wizard must separate:

- business type,
- logical data type,
- compound/reference/value-set shape,
- and UI default control recommendation.

### 8.5 Step 5 — Configure Value Source or Derivation

Required only when applicable:

- picklist/value source,
- lookup source,
- dependent options,
- formula,
- rollup,
- snapshot copy,
- provider binding,
- projection binding.

### 8.6 Step 6 — Resolve Persistence and Storage

The system must infer a recommended persistence mode and PostgreSQL mapping from:

- parent entity archetype,
- field archetype,
- logical data type,
- query/search/reporting needs,
- governance and compliance needs.

### 8.7 Step 7 — Configure Behavior and Governance

The wizard must capture:

- mutability,
- presence/requiredness baseline,
- default/initialization behavior,
- protection policy,
- import/export/API participation,
- query capabilities,
- downstream overlay policy.

### 8.8 Step 8 — Review Compiler Feedback

Before save/activation, the user must see:

- unresolved dependencies,
- unsupported archetype combinations,
- storage risks,
- query capability gaps,
- masking/protection issues,
- relationship/source inconsistencies,
- provider limitations,
- migration implications.

---

## 9. FieldDefinition Metadata Model

### 9.1 High-Level Structure

```json
{
  "fieldId": "fld_sales_invoice_customer_name_snapshot",
  "entityId": "ent_sales_invoice",
  "apiName": "customer_name_snapshot",
  "label": "Customer Name",
  "identity": {},
  "semantics": {},
  "archetype": {},
  "shape": {},
  "persistence": {},
  "valueSourceRef": {},
  "derivationRef": {},
  "mutability": {},
  "formatPolicyRef": {},
  "queryCapabilities": {},
  "protectionPolicyRef": {},
  "integration": {},
  "analytics": {},
  "lifecycle": {},
  "overlayPolicy": {},
  "dependencies": {},
  "audit": {}
}
```

### 9.2 Identity

| Property | Required | Notes |
|---|---:|---|
| `fieldId` | Yes | Internal immutable ID |
| `entityId` | Yes | Parent entity |
| `apiName` | Yes | Stable technical name; locked after activation |
| `label` | Yes | User-facing label |
| `description` | No | Business purpose |
| `namespace` | Conditional | Required for package-owned field |
| `createdByLayer` | Yes | Platform, Vertical, Tenant, Node |
| `sourceCatalogFieldId` | Conditional | Required when instantiated from catalog |

### 9.3 Semantics

| Property | Required | Notes |
|---|---:|---|
| `businessType` | Yes | Examples: `gstin`, `vin`, `money_amount`, `customer_name_snapshot` |
| `semanticRole` | Yes | From semantic-role catalog |
| `dataDomain` | No | Party, Vehicle, Finance, Tax, Service, Geography, etc. |
| `isDisplayCandidate` | Yes | Whether field may be used as record display text |
| `keyRole` | No | primary, business, alternate, external, none |
| `constraintIds` | No | Links to uniqueness/check constraints |

### 9.4 Archetype and Origin

| Property | Required | Notes |
|---|---:|---|
| `fieldArchetype` | Yes | Stored, computed, rollup, snapshot, external, projection, compound, etc. |
| `valueOrigin` | Yes | User, system, formula, related records, source copy, provider, projection |
| `sourceAuthority` | Yes | iDMS, external provider, derived, platform |
| `parentEntityCompatibility` | Yes | Compiler-derived compatibility result |

### 9.5 Shape and Logical Type

| Property | Required | Notes |
|---|---:|---|
| `logicalShape` | Yes | scalar, reference, value_set, multi_value, compound, structured, media, derived |
| `logicalDataType` | Yes | text, currency_amount, entity_reference, address, etc. |
| `dataSubType` | No | E.g., Indian mobile, GSTIN, HSN, SAC |
| `compoundParentFieldId` | Conditional | For constituent fields |
| `constituentFieldIds` | Conditional | For compound parent fields |

### 9.6 Persistence

| Property | Required | Notes |
|---|---:|---|
| `persistenceMode` | Yes | physical_column, extension_column, jsonb_extension, generated_virtual, generated_stored, query_projected, provider_backed, snapshot_column, relation_backed |
| `tableName` | Conditional | For physical/extension/snapshot storage |
| `columnName` | Conditional | For physical/extension/snapshot storage |
| `pgDataType` | Conditional | PostgreSQL storage type |
| `length` | Conditional | For varchar/text identifiers |
| `precision` | Conditional | For numeric |
| `scale` | Conditional | For numeric |
| `nullable` | Yes | Physical storage nullability |
| `generatedExpressionRef` | Conditional | For generated fields |
| `storageRiskClass` | Yes | normal, compliance_critical, financial_critical, integration_key, report_critical |

### 9.7 Value Source Reference

| Property | Required | Notes |
|---|---:|---|
| `valueSourceDefinitionId` | Conditional | Required when source/binding mode is not `none` or `direct_entry` |
| `bindingMode` | Yes | picklist, lifecycle, lookup, provider, query, dependent, etc. |
| `storedValueMode` | Yes | code, id, external_key, normalized_value, constituent, reference_id |
| `displayValueMode` | Yes | label, template, formatted, compound, provider_display |

### 9.8 Derivation Reference

| Property | Required | Notes |
|---|---:|---|
| `derivationDefinitionId` | Conditional | Required for computed, rollup, snapshot, projection |
| `derivationType` | Conditional | formula, rollup, copy_snapshot, projection |
| `refreshPolicy` | Conditional | on_read, on_write, scheduled, event_driven, manual_refresh |
| `freezePolicy` | Conditional | Required for snapshot fields |
| `stalenessTolerance` | No | Required where projections may lag |

### 9.9 Mutability

| Property | Required | Notes |
|---|---:|---|
| `mutabilityMode` | Yes | From mutability catalog |
| `editableUntilState` | Conditional | Required when lifecycle-bound |
| `writeChannels` | Yes | UI, API, import, integration, system |
| `effectiveWritePolicy` | Yes | Resolved result after entity, lifecycle, and security constraints |

### 9.10 Format and Normalization

| Property | Required | Notes |
|---|---:|---|
| `formatPolicyId` | No | Locale/display formatting |
| `normalizationPolicyId` | No | Trim, uppercase, lowercase, E.164, canonical code, whitespace folding |
| `inputMask` | No | UI hint only; not substitute for validation |
| `storedRepresentation` | Yes | canonical value representation |
| `displayRepresentation` | Yes | formatted/display representation |
| `translationPolicy` | No | label-only, value-translatable, non-translatable |

### 9.11 Query Capabilities

| Property | Required | Notes |
|---|---:|---|
| `searchable` | Yes | Whether field participates in search |
| `filterable` | Yes | Whether field may be filtered |
| `sortable` | Yes | Whether field may be sorted |
| `groupable` | Yes | Whether field may be grouped |
| `aggregatable` | Yes | Whether field may be summarized |
| `lookupDisplayEligible` | Yes | Whether field may appear in lookup display |
| `fullTextEligible` | Yes | Whether field may enter full-text index |
| `indexPolicyId` | No | Standard, unique, partial, GIN, expression, none |
| `capabilitySource` | Yes | explicit, derived_from_type, provider_capability, inherited_from_projection |

### 9.12 Protection and Governance

| Property | Required | Notes |
|---|---:|---|
| `classification` | Yes | open, internal, sensitive, regulated |
| `protectionPolicyId` | Yes | Masking, encryption/tokenization, redaction, access logging |
| `apiInputDefault` | Yes | Default input allowance |
| `apiOutputDefault` | Yes | Default output allowance |
| `exportDefault` | Yes | Default export allowance/masking |
| `importDefault` | Yes | Default import allowance |
| `bulkUpdateDefault` | Yes | Default bulk-update allowance |
| `auditMode` | Yes | none, audit_changes, audit_masked, audit_access_and_changes |

### 9.13 Integration

| Property | Required | Notes |
|---|---:|---|
| `externalMappings` | No | Mappings to external systems |
| `upsertParticipation` | Yes | Whether field participates in upsert |
| `idempotencyParticipation` | Yes | Whether field participates in dedup/idempotency |
| `externalAuthorityPolicy` | No | For provider-backed fields |
| `syncDirection` | No | inbound, outbound, bidirectional, none |

### 9.14 Analytics

| Property | Required | Notes |
|---|---:|---|
| `analyticsEnabled` | Yes | Whether available for analytics |
| `semanticAnalyticsRole` | No | dimension, measure, identifier, date_dimension, attribute |
| `defaultAggregation` | Conditional | Required for measures |
| `piiRestricted` | Yes | Whether analytics use is restricted |

### 9.15 Lifecycle and Overlay

| Property | Required | Notes |
|---|---:|---|
| `status` | Yes | draft, active, disabled, deprecated, retired |
| `version` | Yes | Metadata version |
| `parentFieldId` | Conditional | For inherited fields |
| `overlayMode` | Yes | original, inherited, decorated, constrained, disabled, extended |
| `canDownstreamDecorate` | Yes | Label/help/display safe changes |
| `canDownstreamConstrain` | Yes | Tighten validation/query/visibility where allowed |
| `canDownstreamRelax` | Yes | Default false |
| `canDownstreamDisable` | Yes | Default false for protected fields |
| `canDownstreamChangePersistence` | Yes | Default false |
| `canDownstreamChangeDerivation` | Yes | Default false |

### 9.16 Dependencies

Dependencies must include at minimum:

- views,
- relation views,
- validation rules,
- UI reaction rules,
- formulas,
- rollups,
- snapshot derivations,
- relationships,
- actions,
- security definitions,
- API contracts,
- import/export contracts,
- analytics models,
- search indexes,
- materialized projections,
- packages,
- migrations,
- provider mappings.

---

## 10. Capability Matrix by Field Archetype

| Capability | Stored Business | Computed Virtual | Computed Persisted | Rollup | Snapshot | External Mapped | Projection | Compound |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| User editable | Yes | No | No | No | Conditional before freeze | Provider-dependent | No | Parent-dependent |
| Physical storage | Yes | No | Yes | Optional | Yes | Optional/cache only | Optional | Constituent-dependent |
| API input | Yes | No | No | No | Conditional | Provider-dependent | No | Constituent-dependent |
| API output | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Importable | Yes | No | No | No | Usually no | Provider-dependent | No | Constituent-dependent |
| Filterable | Usually | If computable/query-supported | Usually | If persisted/query-supported | Yes | Provider-dependent | Projection-dependent | Constituent-dependent |
| Sortable | Usually | If computable/query-supported | Usually | If persisted/query-supported | Yes | Provider-dependent | Projection-dependent | Usually through constituents |
| Security-controlled | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Dependency tracking | Yes | Required | Required | Required | Required | Required | Required | Required |

---

## 11. Constraints by Parent Entity Archetype

| Parent Entity Archetype | Field Requirements |
|---|---|
| `native_persistent` | May support most field archetypes subject to governance |
| `virtual_computed` | Fields default to `projection_field` or `computed_virtual`; no ordinary user-editable physical fields by default |
| `external_federated` | Fields default to `external_mapped`; write/search/sort/filter capabilities must be provider-driven |
| `materialized_projection` | Fields default to `projection_field`; physical persistence allowed but mutability must be `refresh_only` |
| `junction_association` | Must include relation-key fields and may include own stored business attributes |
| `owned_child` | May include stored and snapshot fields; lifecycle may inherit parent state |
| `append_only_record` | Fields must default to immutable after insert unless explicit correction model exists |
| `system_technical` | Fields default system-managed; business-admin field creation should be restricted |

---

## 12. Compile-Time Validation Rules

The metadata compiler must block activation when any of the following occurs:

### 12.1 Identity and Naming

1. Duplicate `apiName` within same entity.
2. `apiName` exceeds PostgreSQL-safe technical limits or violates naming convention.
3. Protected system field is being modified by lower layer.

### 12.2 Entity Compatibility

4. User-editable physical field is created on a `virtual_computed` entity without approved hybrid storage policy.
5. Non-provider-backed field is created on an `external_federated` entity where source-of-truth is external and no local extension is allowed.
6. Non-refresh-only projected field is created on `materialized_projection` entity.
7. Mutable field is added to `append_only_record` entity without explicit correction policy.

### 12.3 Storage and Data Type

8. Currency/financial field uses floating-point physical storage.
9. JSONB extension is selected for financial, posting, integration-key, compliance-critical, or workflow-critical field.
10. `scale > precision` for numeric field.
11. Compound parent/constituent mappings are incomplete.
12. Snapshot field has no persisted destination column.

### 12.4 Derivation and Source

13. Computed/rollup/snapshot/projection field has no derivation definition.
14. Rollup field references missing or incompatible relationship.
15. Snapshot field has no source field, copy trigger, or freeze policy.
16. Provider-backed field lacks provider capability declaration.
17. Field uses unsupported combination of derivation and parent entity archetype.

### 12.5 Query and Presentation

18. Field is marked sortable/filterable/searchable where provider or query source cannot support the capability.
19. Field is selected as display field but is not available in runtime read contract.
20. Lookup display field is classified/hidden in a way that would expose protected data.

### 12.6 Protection and Integration

21. Regulated field has no protection policy.
22. `apiOutputDefault = allow_unmasked` on regulated field without explicit approved policy.
23. External ID field has no uniqueness/constraint binding.
24. Snapshot legal/tax field is configured as live provider value instead of persisted snapshot where document immutability requires history.

### 12.7 Lifecycle and Overlay

25. Active field changes persistence mode without migration plan.
26. Lower layer attempts to relax a protected validation or alter key/derivation/storage semantics without permission.
27. Retired field remains used by active rule, API contract, or view without migration.

---

## 13. PostgreSQL-Oriented Storage Guidance

### 13.1 Recommended PostgreSQL Mapping

| Logical Data Type | Default PostgreSQL Mapping | Notes |
|---|---|---|
| `text` | `text` or `varchar(n)` | Use `varchar(n)` only when true business maximum exists |
| `text_identifier` | `varchar(n)` | Used for GSTIN, PAN, VIN, codes |
| `email` | `text` or `varchar(320)` | Normalize and validate in metadata/rules |
| `phone` | `varchar(32)` | Store normalized canonical number; render separately |
| `integer` | `integer` / `bigint` | Choose based on range |
| `decimal` | `numeric(p,s)` | Exact value |
| `currency_amount` | `numeric(18,2)` default | Exact, never float |
| `quantity` | `numeric(18,3)` default | Scale is domain-configurable |
| `percentage` | `numeric(p,s)` | Platform must freeze percentage convention |
| `boolean` | `boolean` | Nullable only when true tri-state needed |
| `date` | `date` | Business date |
| `datetime` | `timestamptz` | System/actual timestamp |
| `time` | `time` | Time of day |
| `entity_reference` | `uuid` / external key | Relation-linked |
| `enum` | stable code / governed FK | Avoid PostgreSQL ENUM for configurable business picklists |
| `multi_enum` | junction relation preferred | JSONB only for non-query-critical cases |
| `json` | `jsonb` | Flexible structure; index only where justified |
| `computed` | virtual formula / generated column / stored service output | Depends on derivation semantics |
| `address` | constituent columns or structured model | Must define constituent contract |
| `geolocation` | `numeric` lat/long or geometry strategy | Must define precision and indexing policy |
| `file_reference` | `uuid` | References managed file service |

### 13.2 Generated Columns

PostgreSQL generated columns may be used for **simple deterministic technical computations**, but not blindly for all business formulas. Business formulas that depend on external state, lifecycle, provider data, or complex domain logic should remain in the rule/formula engine.

### 13.3 JSONB Use

`jsonb` is acceptable for flexible extension data but must not become the default escape hatch. If a field is:

- financially critical,
- tax/compliance critical,
- workflow-critical,
- integration-key,
- heavily searched,
- heavily reported,
- or used in constraints,

then the field should use governed physical or promoted extension storage rather than casual JSONB.

### 13.4 Collation and Search

Text fields must declare whether sorting/searching is:

- case-sensitive or case-insensitive,
- locale-aware or binary,
- accent-sensitive or accent-insensitive,
- normalized before comparison.

This is especially important for multilingual and cross-country deployments.

---

## 14. Field Creation Wizard Requirements

### 14.1 Required Wizard Branches

The UI must not show one flat “Field Type” picker as the sole entry point. It must first branch by field family:

1. Standard Stored Field
2. Reference / Relationship Field
3. Value-Set / Picklist Field
4. Computed Field
5. Rollup Field
6. Snapshot Field
7. External / Provider Field
8. Projection Field
9. Compound Field
10. Media Field
11. System Field — internal only

### 14.2 Advanced Mode vs Business Mode

| Mode | What user sees |
|---|---|
| Business mode | Business meaning, field family, display label, simple behavior, source selection |
| Advanced mode | Persistence mode, query capabilities, provider capability, protection policy, normalization, derivation details |
| Architect mode | PostgreSQL mapping overrides, storage risk class, migration implications, compiler diagnostics |

### 14.3 Wizard Must Explain Consequences

Examples:

- “Snapshot fields preserve historical values after freeze and will not follow source-master changes.”
- “External provider fields may not support sorting, filtering, or offline use.”
- “JSONB extension is unsuitable for financial or integration-key fields.”
- “A rollup field depends on a relationship and refresh policy.”

---

## 15. Defaults and Inference Rules

### 15.1 Defaults by Field Archetype

| Archetype | Default Mutability | Default Persistence | Default Queryability |
|---|---|---|---|
| Stored business | `user_editable` | `physical_column` | Derived from type |
| Stored extension | `user_editable` | `extension_column` | Derived from type |
| System generated | `system_only` | `physical_column` | Usually explicit |
| Relationship reference | Lifecycle-dependent | `physical_column` | Filterable/sortable if joined/indexed |
| Computed virtual | `derived_read_only` | `generated_virtual` | Disabled unless query-supported |
| Computed persisted | `system_only` | `generated_stored` | Enabled where stored/indexed |
| Rollup | `derived_read_only` | virtual or stored | Depends on storage/refresh strategy |
| Snapshot | `snapshot_refreshable_until_freeze` | `snapshot_column` | Usually enabled |
| External mapped | `provider_capability_driven` | `provider_backed` | Provider-driven |
| Projection | `refresh_only` | `query_projected` or projection column | Projection-driven |
| Compound parent | Usually constituent-driven | constituent-driven | Depends on constituents |

### 15.2 Defaults by Business Type

| Business Type | Default Considerations |
|---|---|
| GSTIN/PAN/Aadhaar | regulated, normalized uppercase/format, protection policy mandatory |
| Amount | exact numeric, currency policy, aggregation = sum candidate |
| Quantity | quantity scale, optional unit binding |
| Status | lifecycle-bound value source, queryable, not arbitrary picklist |
| Customer Name Snapshot | snapshot field with freeze policy |
| Address | compound field or governed constituent group |
| Mobile Number | normalized canonical storage, display formatting separated |

---

## 16. Examples

### 16.1 GSTIN Field

```json
{
  "apiName": "gstin_number",
  "businessType": "gstin",
  "semanticRole": "alternate_key",
  "fieldArchetype": "stored_business",
  "logicalDataType": "text_identifier",
  "persistenceMode": "physical_column",
  "pgDataType": "varchar",
  "length": 15,
  "mutabilityMode": "user_editable",
  "normalizationPolicy": "uppercase_trim",
  "classification": "regulated",
  "protectionPolicy": "regulated_identifier_default",
  "queryCapabilities": {
    "filterable": true,
    "sortable": true,
    "searchable": true
  }
}
```

### 16.2 Invoice Customer Name Snapshot

```json
{
  "apiName": "customer_name_snapshot",
  "businessType": "customer_name_snapshot",
  "semanticRole": "snapshot_attribute",
  "fieldArchetype": "snapshot_copy",
  "logicalDataType": "text",
  "persistenceMode": "snapshot_column",
  "mutabilityMode": "snapshot_refreshable_until_freeze",
  "derivation": {
    "type": "copy_snapshot",
    "sourceField": "customer.name",
    "copyTrigger": "on_customer_select",
    "refreshUntilState": "draft",
    "freezeAtState": "posted"
  }
}
```

### 16.3 Live Outstanding Amount

```json
{
  "apiName": "live_outstanding_amount",
  "businessType": "outstanding_amount",
  "semanticRole": "measure",
  "fieldArchetype": "computed_virtual",
  "logicalDataType": "currency_amount",
  "persistenceMode": "generated_virtual",
  "mutabilityMode": "derived_read_only",
  "derivation": {
    "type": "formula",
    "refreshPolicy": "on_read"
  }
}
```

### 16.4 OEM Allocation Status on External Entity

```json
{
  "apiName": "allocation_status",
  "businessType": "allocation_status",
  "semanticRole": "status",
  "fieldArchetype": "external_mapped",
  "logicalDataType": "enum",
  "persistenceMode": "provider_backed",
  "mutabilityMode": "provider_capability_driven",
  "valueSource": {
    "bindingMode": "provider_binding",
    "providerCode": "oem_allocation_api"
  },
  "queryCapabilities": {
    "capabilitySource": "provider_capability"
  }
}
```

### 16.5 Compound Address Field

```json
{
  "apiName": "billing_address",
  "businessType": "postal_address",
  "semanticRole": "business_attribute",
  "fieldArchetype": "compound_parent",
  "logicalDataType": "address",
  "logicalShape": "compound",
  "constituentFields": [
    "billing_address_line1",
    "billing_address_line2",
    "billing_city",
    "billing_state_code",
    "billing_pincode",
    "billing_country_code"
  ]
}
```

---

## 17. Acceptance Criteria

1. System must allow fields to be classified independently by semantic role, archetype, logical type, persistence mode, mutability mode, and value-source mode.
2. System must not require an administrator to choose raw PostgreSQL type as the first field-authoring decision.
3. System must support at least the required field archetypes defined in this document.
4. System must allow snapshot fields with source, refresh, and freeze semantics.
5. System must support compound parent fields and constituent fields.
6. System must maintain stored-value/display-value separation for lookup/value-set fields.
7. System must support a dedicated value-source definition for picklists, lookups, dependent options, query bindings, and provider bindings.
8. System must prevent invalid field combinations based on parent entity archetype.
9. System must expose query capabilities separately from logical data type.
10. System must support provider-driven query/write capabilities for external fields.
11. System must bind key-like fields to constraint definitions rather than rely only on boolean flags.
12. System must prevent lower layers from altering active field persistence/derivation semantics unless explicitly allowed.
13. System must track dependencies across rules, formulas, rollups, projections, views, APIs, packages, provider mappings, and migrations.
14. Runtime contract must expose only compiled active field metadata after resolving security, entity archetype, provider capability, and view context.
15. Field creation wizard must branch by field family, not only by simple UI control type.

---

## 18. Negative Scenarios and Validation Messages

| Scenario | Required Behavior / Message |
|---|---|
| User creates user-editable stored field on virtual computed entity | Block: `Virtual computed entities cannot contain ordinary user-editable stored fields without an approved hybrid storage policy.` |
| User creates snapshot field without freeze policy | Block: `Snapshot field requires a freeze policy.` |
| User creates rollup without relationship | Block: `Rollup field requires a valid relationship and aggregate definition.` |
| User marks provider field sortable without provider support | Block: `Selected provider does not support sorting for this field.` |
| User uses JSONB for invoice amount | Block: `Financial, posting, and compliance-critical fields cannot use JSONB extension storage.` |
| User exposes regulated field unmasked by default | Block/warn: `Regulated fields require an approved protection policy before unmasked output is allowed.` |
| User tries to change active field from physical to JSONB | Block: `Active field persistence changes require a migration plan.` |
| User creates customer name snapshot as live lookup projection | Warn/block where document history matters: `Historical document fields must use snapshot semantics, not live lookup semantics.` |
| User creates compound parent without constituents | Block: `Compound field requires constituent field mapping.` |
| User marks translated label field as multilingual value field | Block/warn: `Field label translation and field value translation must be configured separately.` |

---

## 19. Out of Scope for This Requirement

The following are intentionally not fully designed here, although this model reserves space for them:

1. Full formula expression language
2. Full rollup execution engine
3. Full value-source designer UI
4. Field-level encryption/tokenization implementation
5. Multilingual value storage engine
6. Advanced unit-of-measure conversion engine
7. Physical migration orchestration engine
8. Full-text search engine implementation
9. Offline sync engine behavior for provider-backed fields
10. AI-assisted field recommendation

---

## 20. Migration Impact on Current Design

The current implementation already provides useful building blocks:

- rich type catalog,
- catalog/local field creation,
- lifecycle-aware presence,
- editability,
- visibility,
- default sources,
- audit,
- governance,
- dependency tracking,
- view participation,
- storage type classification.

However, it must be revised as follows:

| Current Design Area | Required Change |
|---|---|
| Single broad “field type” concept | Split into business type, archetype, logical data type, persistence mode, and UI compatibility |
| `Computed` and `Rollup` treated as advanced types | Model derivation families explicitly and separately |
| Field copy rules | Split convenience copy from snapshot/frozen-copy semantics |
| `Entity Reference` field | Bind to RelationshipDefinition and FieldValueSourceDefinition |
| Select/Multi-Select options | Move into governed value-source metadata |
| Searchable/filterable/sortable booleans | Evolve into query capability model with provider/projection constraints |
| Data classification only | Add protection-policy layer |
| `virtual` storage type | Distinguish computed virtual, projection, and provider-backed fields |
| Storage strategy | Add snapshot, query-projected, provider-backed, generated-stored distinctions |
| Current presets | Evolve into reusable FieldCatalogDefinition blueprints |

---

## 21. Recommended Implementation Sequence

1. Extend metadata model with field dimensions and archetypes.
2. Introduce `FieldValueSourceDefinition` boundary.
3. Introduce `FieldDerivationDefinition` boundary.
4. Add snapshot/frozen-copy field support.
5. Add query capability model.
6. Add parent-entity-archetype compatibility checks.
7. Add compound-field support.
8. Add protection-policy hook.
9. Refactor field wizard into field-family-first flow.
10. Update runtime contract compiler/resolver to emit effective field capabilities.

---

## 22. Final Product Position

`FieldDefinition` in iDMS Admin Studio must be treated as a **multi-dimensional field contract**, not as a database-column setup form and not as a UI-input setup form.

A mature field model must describe:

- what the field means,
- where its value comes from,
- how it is represented,
- how it is stored,
- who may mutate it,
- how it can be queried,
- how it is protected,
- how it participates in runtime, integration, and analytics,
- and how it behaves across native, virtual, external, materialized, and document-history scenarios.

Anything less will create hidden architectural debt in DMS transactions, integrations, analytics, and future configurability.
