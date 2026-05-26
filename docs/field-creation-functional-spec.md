# iDMS Admin Studio — Field Creation & Editing: Functional Specification

**Version:** 1.0  
**Date:** May 12, 2026  
**Audience:** Product, Architecture, Engineering, QA, AI Coding Agents  
**Status:** Baseline — authoritative reference for Field Designer implementation

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Core Architecture Distinctions](#2-core-architecture-distinctions)
3. [Operational Modes](#3-operational-modes)
4. [Step 1 — Field Family Selection](#4-step-1--field-family-selection)
5. [Step 2 — Source (Catalog vs Local)](#5-step-2--source-catalog-vs-local)
6. [Step 3A — Attribute Catalog Browser](#6-step-3a--attribute-catalog-browser)
7. [Step 3B — Identity (Local Field)](#7-step-3b--identity-local-field)
8. [Step 4 — Type-Specific Configuration](#8-step-4--type-specific-configuration)
9. [Step 5 — Behavior Editor](#9-step-5--behavior-editor)
10. [Step 6 — Governance Editor](#10-step-6--governance-editor)
11. [Edit Field Mode](#11-edit-field-mode)
12. [Constrain Inherited Field Mode](#12-constrain-inherited-field-mode)
13. [Field Inspector — Right Panel](#13-field-inspector--right-panel)
14. [Field Grid](#14-field-grid)
15. [Field Lifecycle Management Panel](#15-field-lifecycle-management-panel)
16. [v2 Classification Dimensions](#16-v2-classification-dimensions)
17. [Advanced Metadata Objects](#17-advanced-metadata-objects)
18. [System Fields vs Business Fields](#18-system-fields-vs-business-fields)
19. [Industry Use Cases](#19-industry-use-cases)
20. [Field Type Quick Reference](#20-field-type-quick-reference)

---

## 1. Purpose & Scope

### 1.1 What Field Creation Achieves

Field creation is the mechanism by which a metadata author declares what data an entity stores, how that data is sourced, how it behaves across the record lifecycle, and what governance rules protect it. It is **not** a database column configuration tool — it is a business metadata authoring tool whose output is compiled into a runtime contract that drives storage, APIs, UI layouts, validation, security, and audit.

A field definition in iDMS Admin Studio answers six questions simultaneously:

1. **What** is this field? (semantic role, label, business purpose)
2. **Where** does its value come from? (direct entry, formula, lookup, provider, snapshot, rollup)
3. **How** is it stored? (physical column, virtual, extension table, JSONB, provider-backed)
4. **Who** can change it? (user, system, integration, derived/read-only)
5. **How** is it used for querying? (searchable, filterable, sortable, aggregatable)
6. **What governance** protects it? (classification, export policy, API exposure, masking, audit)

### 1.2 Scope of This Document

This document covers:
- All 4 operational modes of the field authoring drawer (add via catalog, add local, edit, constrain)
- All 7 wizard steps and their logic, validations, and defaults
- All 26 field types and every configuration parameter
- All 11 behavior properties and 12 governance properties
- The field inspector right panel, field grid, and lifecycle management panel
- The v2 classification model with 6 independent dimensions
- Advanced metadata objects (QueryCapabilities, ValueSourceDefinition, DerivationDefinition, SnapshotPolicy, ProtectionPolicy, DisplayFormat)
- System fields vs business fields
- 7 industry use cases (Automotive DMS, Tyres, Paint, Heavy Equipment, Healthcare, Insurance, Real Estate)

**Out of scope:**
- `ViewDefinition` — how fields render in screen layouts (separate specification)
- `ValidationRuleDefinition` — cross-field and conditional validation rules (separate specification)
- `RelationshipDefinition` cardinality and cascade rules (separate specification)
- API runtime contract details beyond what is configured in field governance

---

## 2. Core Architecture Distinctions

### 2.1 FieldDefinition vs ViewFieldDefinition

| Concern | `FieldDefinition` | `ViewFieldDefinition` |
|---|---|---|
| Data meaning | ✓ — semantic role, business purpose | — |
| Value origin | ✓ — formula, lookup, provider, snapshot | — |
| Persistence | ✓ — physical column, virtual, JSONB | — |
| Mutability | ✓ — user editable, system only, derived | — |
| Query capability | ✓ — searchable, filterable, sortable | — |
| Governance | ✓ — classification, export, API, masking | — |
| Screen placement | — | ✓ — section, tab, order, column width |
| UI control type | Default hint only | ✓ — control override per view |
| Label override | — | ✓ — view-specific label |
| Conditional visibility | — | ✓ — show/hide rule per view context |

> **Rule:** The same `FieldDefinition` may render as a dropdown in a form, a chip in a list view, a plain label in print, and a multi-select filter panel — without changing the `FieldDefinition` itself.

### 2.2 FieldDefinition vs FieldCatalogDefinition

| Concept | Meaning |
|---|---|
| `FieldCatalogDefinition` | Reusable blueprint / preset. Defines recommended type, classification, behaviors, and governance for standard enterprise fields (GSTIN, VIN, Indian Mobile, PAN, etc.). Not attached to any entity. |
| `FieldInstance` (FieldDefinition) | Instantiated field attached to a specific entity. May reference a catalog entry via `attributeRef`. Inherits default behaviors from the catalog entry but can be overridden. |

When a field is added from the catalog, its `attributeRef` is set to the catalog's `attribute_code`, providing a permanent traceability link back to the catalog blueprint.

### 2.3 Entity Archetype Constrains Field Behavior

A field's valid configuration space is constrained by the archetype of its owning entity:

| Entity Archetype | Field Constraint |
|---|---|
| `native_persistent` | All field families supported. Physical column is the default persistence. |
| `virtual_computed` | Only `computed`, `projection`, `reference` families. No physical persistence. |
| `external_federated` | Only `external`, `reference`, `computed` families. Mutability is provider-capability-driven. |
| `materialized_projection` | `projection` and `stored_business` allowed. Refresh-only mutability for projected fields. |
| `append_only_record` | All families but mutability is `append_immutable` after insert. |
| `owned_child` | All families. Lifecycle is governed by parent entity. |
| `posting_document` | All families. `editable_until_state` (draft phase only). Snapshot fields strongly recommended for financial amounts. |
| `reference_code` | Primarily `stored_business` and `value_set`. No computed/rollup families needed. |

---

## 3. Operational Modes

The field authoring interface is a slide-in drawer. It operates in four distinct modes, each with a different step sequence.

### 3.1 Mode Comparison

| Mode | Trigger | Step Sequence | Purpose |
|---|---|---|---|
| **Add via Catalog** | "Add Field" → Source = Catalog | `family → source → catalog → configure → behavior → governance` | Add a field sourced from the attribute catalog |
| **Add Local (Custom)** | "Add Field" → Source = Local | `family → source → identity → configure → behavior → governance` | Add a brand-new custom field |
| **Edit Field** | Edit (pencil) button on any existing field | `configure → behavior → governance` | Modify configuration, behavior, and governance of an existing field |
| **Constrain Inherited** | "Constrain" on an inherited field row | `behavior → governance` | Apply an overlay constraint on a field inherited from a parent entity |

### 3.2 Step Indicators

The drawer displays a horizontal step progress indicator at the top. Completed steps are clickable (navigate back). The current step is highlighted. Future steps are greyed out.

### 3.3 Navigation Controls

- **Next →** — advances to next step (disabled if current step has validation errors)
- **← Back** — returns to previous step (no data loss)
- **Save Field** — appears on the final step (Governance), commits the field to the entity schema
- **✕ Cancel** — closes drawer and discards unsaved changes; confirmation prompt if any data was entered

### 3.4 Overlay Confirmation

When saving a field on an entity that **extends a parent entity**, the system shows an **Overlay Confirmation Panel** before committing. This panel:
- Shows the field's effect on the parent schema
- Identifies the overlay operation (`extend`, `constrain`, `decorate`)
- Warns if the field ID conflicts with an inherited field
- Requires explicit confirmation before saving

---

## 4. Step 1 — Field Family Selection

### 4.1 What Is a Field Family?

A field family is the highest-level classification of a field. It describes **where the field's value comes from** and **what its structural role is**. Selecting a family pre-populates the field's `fieldArchetype`, `fieldMutabilityMode`, and `fieldPersistenceMode` with sensible defaults.

There are 11 field families:

### 4.2 Field Family Definitions

| Family | Label | Description | Default Archetype | Default Mutability | Default Persistence | Default Field Type |
|---|---|---|---|---|---|---|
| `stored` | Standard Stored | User-entered or imported value stored in its own column. The most common field type. | `stored_business` | `user_editable` | `physical_column` | `text` |
| `reference` | Reference / Relationship | Foreign-key reference to another entity record. Shows a lookup picker in the UI. | `relationship_reference` | `user_editable` | `physical_column` | `entity_ref` |
| `value_set` | Value-Set / Picklist | Value chosen from a closed or governed list. Inline list, master picklist, or dependent cascade. | `value_set` | `user_editable` | `physical_column` | `select` |
| `computed` | Computed / Formula | Value derived from a formula over sibling fields. Can be virtual (no storage) or persisted. | `computed_virtual` | `derived_read_only` | `generated_virtual` | `computed` |
| `rollup` | Rollup / Aggregate | Aggregates values from related child records using SUM, COUNT, AVG, MIN, or MAX. | `rollup` | `derived_read_only` | `relation_backed` | `rollup` |
| `snapshot` | Snapshot / Frozen Copy | Point-in-time copy of a master field that freezes when a lifecycle event fires. | `snapshot_copy` | `snapshot_refreshable_until_freeze` | `snapshot_column` | `text` |
| `external` | External / Provider | Value synced from an external system (ERP, OEM portal, CRM). iDMS does not own the canonical value. | `external_mapped` | `integration_only` | `provider_backed` | `text` |
| `projection` | Projection | Re-exposes a field from a source entity in a projection or materialized view entity. | `projection_field` | `derived_read_only` | `query_projected` | `text` |
| `compound` | Compound / Multi-Part | A multi-part value with named sub-fields (e.g., full address = line1 + city + state + pincode). | `compound_parent` | `user_editable` | `physical_column` | `text` |
| `media` | Media / File | File upload, image, signature capture, or barcode/QR. Stores a reference to the binary. | `media_reference` | `user_editable` | `physical_column` | `file` |
| `system` | System / Technical | Platform-managed field. Auto-generated by the system — record_id, tenant_id, created_at, etc. | `system_generated` | `system_only` | `physical_column` | `text` |

### 4.3 Semantic Role Suggestions per Family

When a family is selected, the identity step pre-selects a recommended semantic role. The author can change it.

| Family | Suggested Semantic Roles (first = default) |
|---|---|
| `stored` | `business_attribute`, `measure`, `dimension`, `display_name`, `status`, `business_key` |
| `reference` | `business_attribute`, `dimension`, `external_id` |
| `value_set` | `business_attribute`, `status`, `dimension` |
| `computed` | `derived_indicator`, `measure`, `business_attribute` |
| `rollup` | `measure`, `derived_indicator` |
| `snapshot` | `snapshot_attribute`, `business_attribute` |
| `external` | `external_id`, `business_attribute`, `alternate_key` |
| `projection` | `business_attribute`, `measure`, `dimension` |
| `compound` | `business_attribute`, `dimension` |
| `media` | `business_attribute` |
| `system` | `primary_key`, `scope_key`, `audit` |

### 4.4 Visual Presentation

Each family card shows:
- **Family label** in bold
- **One-sentence description**
- **Defaults badge**: "Defaults: Archetype · Mutability · Persistence" (e.g., "User-editable · Physical column · Direct entry")

The `computed`, `rollup`, `snapshot`, `external`, and `projection` families display an informational badge reminding the author that these result in read-only or system-managed fields.

---

## 5. Step 2 — Source (Catalog vs Local)

After selecting a family (except for `system` family which skips to identity), the author chooses how the field definition originates:

### 5.1 Catalog Source

**Choose this when:** The field concept exists in the shared attribute catalog (e.g., `booking_date`, `contact_email`, `gstin_number`, `vehicle_vin`).

**What happens:**
- The catalog browser (Step 3A) opens next
- Selecting a catalog entry pre-populates field ID, label, field type, description, classification, default behaviors, and default governance
- The field's `attributeRef` is set to the catalog entry's `attribute_code`
- The source layer is locked to match the catalog entry's `owner_layer`

**Benefits:**
- Consistent field definitions across entities
- Pre-configured governance for sensitive/regulated data (e.g., GST number always gets `regulated` classification and `maskInExport: true` from the catalog)
- Catalog usage tracking (`used_in` array on catalog entry shows which entities use it)

### 5.2 Local Source

**Choose this when:** The field concept is entity-specific and does not belong in a shared catalog (e.g., `preferred_delivery_slot` for a specific tenant's workflow).

**What happens:**
- The identity step (Step 3B) opens next
- The author must define all properties from scratch
- The system suggests similar catalog entries in a side panel while the author types the label — this nudges authors toward catalog-first field creation

**Similar Catalog Suggestions panel:**
- Appears when field label is at least 3 characters
- Shows top 3 matching catalog entries with match score
- Author can switch to catalog mode at any time before confirming field ID

---

## 6. Step 3A — Attribute Catalog Browser

### 6.1 Layout

The catalog browser presents the full attribute catalog organized by domain. The layout has two columns:
- **Left column**: domain-grouped catalog entry list with search
- **Right column**: hover preview panel for the highlighted entry

### 6.2 Domain Groups

Catalog entries are grouped by their `domain` property and rendered as collapsible sections. Each section header shows the domain name and entry count. Sections default to expanded.

### 6.3 Entry List Row

Each entry in the list shows:
- **Label** (bold)
- **attribute_code** (monospace, muted)
- **"used" badge** — shown in blue if this attribute is already used in the current entity (already-used entries can still be added again for multi-instance scenarios)
- **Type** and **classification** on a second line
- **Chevron →** to select

### 6.4 Search

A search input filters the catalog by label, attribute_code, and description simultaneously. Search is debounced and case-insensitive.

### 6.5 Hover Preview

Hovering over an entry shows a preview panel with:
- Full attribute_code in monospace
- Field type badge
- Classification badge (color-coded)
- Full description
- `owner_layer` badge
- `protected` indicator (if true — platform-managed fields cannot be modified)
- Default behaviors and governance from the catalog entry

### 6.6 Selecting an Entry

Clicking an entry navigates to Step 4 (configure) with the field pre-populated from the catalog entry's data.

---

## 7. Step 3B — Identity (Local Field)

### 7.1 Label

Free-text input for the field's display name. Required. No length restriction in the UI though the compiled runtime enforces max 100 characters.

### 7.2 Field ID (API Name)

Auto-generated from the label via slug conversion (lowercase, spaces → underscores, special characters removed, max 50 characters). Example: "Customer Name" → `customer_name`.

**Key rules:**
- Must be unique within the entity's field list
- Only lowercase letters, digits, and underscores are allowed
- Cannot start with a digit or underscore
- Cannot be a platform-reserved word (`id`, `tenant_id`, `node_id`, `created_at`, `updated_at`, `deleted_at`, `record_id`)
- **Immutable after first save** — changing the Field ID after a field has been saved requires a migration governance action
- The author can manually override the auto-generated slug before saving for the first time

**Immutability note:** Once the entity is saved with this field, the field ID becomes the persistent storage column name and API field name. Renaming it is a breaking schema change that requires dependency analysis.

### 7.3 Description

Optional rich-text description explaining the field's business purpose. Displayed in hover previews, governance reports, and field catalog. Best practice: 1–3 sentences covering what the field stores and why it exists.

### 7.4 Field Type Picker

A grouped dropdown presenting all 26 supported field types:

| Group | Types |
|---|---|
| Basic | Text, Text Area, Number, Decimal, Boolean / Toggle |
| Date & Time | Date, Date & Time, Time |
| Finance | Currency, Percentage |
| Selection | Select (dropdown), Multi-Select |
| Relations | Entity Reference |
| Media | File Upload |
| Complex | Collection / Grid |
| Contact | Email, Phone, URL |
| Advanced | Auto Number, Computed, Rollup (Aggregate), JSON, Rich Text, Geo Point, Signature, Barcode / QR, Rating |

Selecting a field type may update the behavior defaults (e.g., selecting `computed` locks presence to `optional` and editability to `readonly`).

### 7.5 Semantic Role

The semantic role describes why this field exists in the business/domain model. It is one of 13 values and is used for governance reporting, catalog classification, and cross-entity consistency analysis.

| Semantic Role | Meaning | Typical Examples |
|---|---|---|
| `business_attribute` | Core business fact (most common) | `booking_date`, `mobile_no`, `remarks` |
| `measure` | Quantitative metric for aggregation | `invoice_amount`, `quantity`, `duration_hours` |
| `dimension` | Categorical attribute for grouping/filtering | `region`, `product_category`, `service_type` |
| `display_name` | Canonical label shown in dropdowns, search | `customer_name`, `model_name`, `part_description` |
| `status` | Workflow or lifecycle state carrier | `order_status`, `claim_status`, `job_status` |
| `business_key` | Human-facing unique identifier | `order_number`, `invoice_number`, `job_card_no` |
| `alternate_key` | Additional unique identifier | `vin`, `registration_number`, `chassis_no` |
| `external_id` | Integration upsert/matching key | `oem_customer_id`, `erp_vendor_code` |
| `primary_key` | Physical/logical record identity | `record_id` (system-generated) |
| `scope_key` | Tenant/company/node partition key | `tenant_id`, `node_id`, `company_id` |
| `audit` | System-managed change-tracking | `created_at`, `created_by`, `updated_at` |
| `derived_indicator` | Computed flag or score | `is_overdue`, `is_gst_registered`, `credit_risk` |
| `snapshot_attribute` | Point-in-time frozen copy of a master field | `customer_name_snapshot`, `price_at_booking` |

### 7.6 Layer Assignment

The `sourceLayer` determines which organizational layer "owns" this field. Layer assignment is typically locked to the current editing context. Valid layers:

| Layer | Meaning | Who authors it |
|---|---|---|
| `platform` | Core platform fields — present in all tenants | Platform engineering |
| `vertical` | Industry-vertical fields — shared across all tenants in this vertical (e.g., Automotive DMS) | Vertical product team |
| `tenant` | Tenant-specific fields — applies to one company group | Tenant administrator |
| `node` | Node/branch-specific fields — applies to one branch | Branch/node administrator |

> **Rule:** A field's source layer must be ≥ the author's session layer. A tenant-layer session cannot author a `platform` field.

---

## 8. Step 4 — Type-Specific Configuration

Each field type has a dedicated configuration panel. The panels are rendered by the `FieldTypeConfigurator` component and appear in the "Configure" step. Configuration is stored in the field's `typeConfig` property (a free-form record keyed by the config param name).

> **Note on computed and rollup fields:** These types lock certain behavior settings. Computed and rollup fields automatically force `editability: readonly` and `presence: optional` and these are non-overridable.

---

### 8.1 Text (`text`)

Stores a single-line string value.

| Config Parameter | Type | Description |
|---|---|---|
| `minLength` | number | Minimum character count (0 = no minimum) |
| `maxLength` | number | Maximum character count |
| `pattern` | string | Regular expression for format validation (e.g., `^[A-Z0-9]+$` for uppercase alphanumeric) |
| `uppercaseTransform` | boolean | Auto-transforms input to uppercase on save |
| `trim` | boolean | Strips leading/trailing whitespace on save |

**Use when:** Single-line free text, codes, names, identifiers without a dedicated type.

---

### 8.2 Text Area (`textarea`)

Multi-line free text. Not for formatted/rich content.

| Config Parameter | Type | Description |
|---|---|---|
| `maxLength` | number | Maximum character count |
| `lineCountHint` | number | Suggested visible row count in the editor (2–20) |

> Rich text formatting is not available for textarea. Use `rich_text` type for formatted content.

---

### 8.3 Number (`number`)

Whole or decimal number (displayed without currency/percentage context).

| Config Parameter | Type | Description |
|---|---|---|
| `min` | number | Minimum allowed value |
| `max` | number | Maximum allowed value |
| `integerOnly` | boolean | When true, only integer values are accepted (no decimal input) |
| `allowNegative` | boolean | When false, negative values are rejected |

---

### 8.4 Decimal (`decimal`)

Precise decimal number — use for quantities, rates, and measurements.

| Config Parameter | Type | Description |
|---|---|---|
| `precision` | number | Total significant digits (e.g., 10 allows 1234567.89) |
| `scale` | number | Decimal places (e.g., 2 for 0.01 precision) |
| `min` | number | Minimum allowed value |
| `max` | number | Maximum allowed value |
| `roundingMode` | `half_up` \| `half_even` \| `truncate` | How fractional results are rounded. `half_even` (Banker's rounding) recommended for financial calculations. |

> **Architecture rule:** Financial amounts must use `currency` type, not `decimal`. Do not store money in floating-point types. Decimal is for measured quantities (litres, kilograms, square metres).

---

### 8.5 Boolean (`boolean`)

A true/false flag.

| Config Parameter | Type | Description |
|---|---|---|
| `defaultValue` | `true` \| `false` \| `null` | Pre-filled state (null = no default) |
| `displayStyle` | `switch` \| `checkbox` | UI rendering hint (toggle switch vs checkbox) |

---

### 8.6 Currency (`currency`)

Monetary amount stored as an integer or precise decimal. Never stored as a floating-point type.

| Config Parameter | Type | Description |
|---|---|---|
| `currencySource` | `tenant_default` \| `fixed` \| `lookup` | Where the applicable currency is determined |
| `fixedCurrency` | string (ISO 4217) | Required when `currencySource = fixed` (e.g., `INR`, `USD`, `EUR`) |
| `precision` | number | Total significant digits |
| `scale` | number | Decimal places (typically 2 for most currencies; 0 for JPY) |
| `min` | number | Minimum value (often 0 for amounts) |
| `max` | number | Maximum value |
| `allowNegative` | boolean | Allow negative amounts (e.g., for credit notes) |

**Currency Source Options:**
- `tenant_default` — uses the tenant's configured default currency (most common)
- `fixed` — currency is hardcoded and always the same
- `lookup` — currency is determined by the value of another field on the same record

---

### 8.7 Percentage (`percentage`)

A numeric percentage value.

| Config Parameter | Type | Description |
|---|---|---|
| `min` | number | Minimum % (typically 0) |
| `max` | number | Maximum % (typically 100, but can exceed for special cases) |
| `scale` | number | Decimal places for the percentage |
| `showPercentSymbol` | boolean | Whether to render the % symbol in the UI |

---

### 8.8 Date (`date`)

A calendar date (no time component). Stored as ISO 8601 date string.

| Config Parameter | Type | Description |
|---|---|---|
| `minDate` | ISO date string | Earliest allowed date |
| `maxDate` | ISO date string | Latest allowed date |
| `allowPast` | boolean | Whether past dates are permitted |
| `allowFuture` | boolean | Whether future dates are permitted |

**Default Source Options for Date:** `today` is available as a dynamic default.

---

### 8.9 Date & Time (`datetime`)

A full timestamp. Stored as ISO 8601 datetime.

| Config Parameter | Type | Description |
|---|---|---|
| `timezoneMode` | `user_tz` \| `utc` \| `tenant_tz` | How the timestamp is displayed to users. The stored value is always UTC. |
| `systemSet` | boolean | When true, field is auto-timestamped by the system (e.g., `created_at` pattern). Not user-editable. |

**Default Source Options:** `now` is available as a dynamic default.

---

### 8.10 Time (`time`)

A time-of-day value without a date.

| Config Parameter | Type | Description |
|---|---|---|
| `stepMinutes` | 5 \| 10 \| 15 \| 30 \| 60 | Time picker step interval |
| `defaultTime` | `HH:MM` string | Pre-filled time value in 24-hour format |
| `allowPast` | boolean | Whether times before the current time are allowed (primarily for appointment scheduling) |
| `use12Hour` | boolean | Display in 12-hour AM/PM format instead of 24-hour |

---

### 8.11 Select (`select`)

A single-value dropdown from a governed or inline list.

| Config Parameter | Type | Description |
|---|---|---|
| `valueSource` | `inline` \| `master` \| `enum` | Where the available options come from |
| `optionItems` | `{label: string, value: string}[]` | Inline options (when `valueSource = inline`). Label = display text; value = stored code. |
| `defaultValue` | string | Pre-selected option value |
| `showInactive` | boolean | Whether to include disabled/inactive options in the picker |

**Value Source Details:**
- `inline` — Options are defined directly on this field. Each option has a distinct `label` (shown in UI) and `value` (stored in the database). The value must be a stable slug — changing stored values is a breaking change.
- `master` — Options come from a master data entity (e.g., a "Payment Mode" master). The field acts as a lookup.
- `enum` — Options are a system-defined enum (e.g., workflow states). Managed by the platform, not by the field author.

**Dependent Options (Cascading Picklist):**
When `valueSource = inline`, authors can configure cascading behavior where this field's available options depend on the value of another `select` field on the same entity. Configuration:
- **Depends on Field** — pick a sibling select field
- **Per parent value** — define which options appear for each value of the parent field
- If no dependent options are configured for a given parent value, this field is hidden

---

### 8.12 Multi-Select (`multi_select`)

Same as `select` but stores an array of values. Additional parameters:

| Config Parameter | Type | Description |
|---|---|---|
| `minSelected` | number | Minimum number of selections required |
| `maxSelected` | number | Maximum number of selections allowed |

> Dependent options are not available for multi-select (only for single-select).

---

### 8.13 Entity Reference (`entity_ref`)

A foreign-key reference to a record in another entity. Renders as a searchable lookup picker.

| Config Parameter | Type | Description |
|---|---|---|
| `targetEntity` | string (entityType) | The entity being referenced |
| `keyField` | string (fieldId) | The field on the target entity used as the reference key (usually `record_id`) |
| `displayField` | string (fieldId) | The field on the target entity shown in the picker dropdown |
| `searchFields` | string[] | Fields on the target entity searched when the user types in the picker |
| `activeFilter` | boolean | When true, only records where `is_active = true` appear in the picker |
| `cardinality` | `single` \| `multiple` | Single reference (FK) or multi-reference (junction table) |
| `onDelete` | `restrict` \| `cascade` \| `set_null` \| `archive` | What happens when the referenced record is deleted |
| `filterConditions` | `FilterConditionGroup` | Optional structured filter to pre-narrow the picker to a subset of target records |

**Delete Behavior:**
- `restrict` (default) — prevents deletion of the referenced record while this reference exists
- `cascade` — deletes this record when the referenced record is deleted
- `set_null` — clears this field when the referenced record is deleted
- `archive` — archives this record and marks the reference as archived

**Filter Conditions (Condition Builder):**
Authors can add structured filter conditions using the Condition Builder component. This allows an entity_ref picker to only show records matching specific criteria (e.g., "only show active supplier contracts in current node").

---

### 8.14 File Upload (`file`)

Stores a reference to a managed file object. Actual binary is stored in the platform's file store; this field holds the reference ID.

| Config Parameter | Type | Description |
|---|---|---|
| `allowedExtensions` | string[] | Permitted file extensions (e.g., `['pdf', 'jpg', 'png']`). Empty = all allowed. |
| `maxFileSizeMb` | number | Maximum file size per upload in megabytes |
| `maxCount` | number | Maximum number of files allowed (for multi-file upload fields) |
| `requiredBeforeSubmit` | boolean | File must be attached before the record can be submitted |

> Virus scanning is enforced at the platform level for all file uploads, regardless of this field's configuration.

---

### 8.15 Collection / Grid (`collection`)

An embedded repeating grid of structured rows. Suitable for line items, labour entries, or tabular child data that doesn't warrant a separate entity. For relationships with query, governance, or bulk import needs, use an `owned_child` entity with a `RelationshipDefinition` instead.

| Config Parameter | Type | Description |
|---|---|---|
| `collectionLabel` | string | Plural label above the grid (e.g., "Line Items", "Labour Entries") |
| `minItems` | number | Minimum number of rows required |
| `maxItems` | number | Maximum number of rows allowed |
| `addRowEnabled` | boolean | Whether the user can add new rows |
| `deleteRowEnabled` | boolean | Whether the user can delete rows |
| `rowNumbering` | boolean | Show sequential row numbers in the leftmost column |
| `itemFields` | `{fieldId, label, fieldType, required}[]` | Column definitions for each row. Supported item field types: text, number, decimal, boolean, select, date, currency, percentage. |

---

### 8.16 Email (`email`)

A validated email address string.

| Config Parameter | Type | Description |
|---|---|---|
| `maxLength` | number | Maximum length (RFC 5321 maximum is 254) |
| `lowercaseNormalization` | boolean | Converts to lowercase on save for consistency |
| `validationMessage` | string | Custom error message shown when format is invalid |

> Email fields automatically receive `classification: sensitive` as the inferred default.

---

### 8.17 Phone (`phone`)

A phone number with optional country code handling.

| Config Parameter | Type | Description |
|---|---|---|
| `countryCodeMode` | `fixed` \| `user_select` \| `tenant_default` | How the country code dialing prefix is determined |
| `defaultCountry` | string (ISO 3166-1 alpha-2) | Default country code (e.g., `IN` for India, `US` for USA) |
| `minLength` | number | Minimum digit count |
| `maxLength` | number | Maximum digit count |
| `allowExtension` | boolean | Allow extension numbers (e.g., "ext 123") |

> Phone fields automatically receive `classification: sensitive` as the inferred default.

---

### 8.18 URL (`url`)

A web URL with scheme validation.

| Config Parameter | Type | Description |
|---|---|---|
| `allowedSchemes` | string[] | Permitted URL schemes. Default: `['https']`. Options: `https`, `http`, `ftp`. |
| `maxLength` | number | Maximum URL character length |
| `openNewTab` | boolean | Display hint: open link in new browser tab |

> A warning is shown when `https` is not in the allowed schemes list, as non-HTTPS URLs present security risks for external resources.

---

### 8.19 Auto Number (`auto_number`)

A system-generated sequential identifier following a configurable format. The actual format, sequence, padding, prefix, and reset policy are configured in the **Code Settings master** — not in the field itself.

| Config Parameter | Type | Description |
|---|---|---|
| `codeSettingType` | `document` \| `master` | Whether this field uses a Document Code Setting (e.g., order numbers, invoice numbers) or a Master Code Setting (e.g., customer codes, part codes) |
| `codeSettingId` | string | ID of the selected code setting from the master |
| *(preview)* | — | Auto-populated from selected code setting: sample output, manual override allowed flag |

**After selecting a code setting, the UI shows:**
- A preview of the generated code (e.g., `VO-MUM-2026-00001`)
- Whether manual override is allowed (configured in the Code Settings master)
- A reminder that format, sequence scope, and reset policy are managed in the Code Settings master, not here

> Auto-number fields are always set by the system (`editability: system_only`) unless the code setting explicitly permits manual override.

---

### 8.20 Computed / Formula (`computed`)

A value derived from a formula expression over sibling fields on the same record.

| Config Parameter | Type | Description |
|---|---|---|
| `mode` | `display_only` \| `persisted_later` | `display_only` = virtual, not stored (current scope). `persisted_later` = will be stored (planned, next scope). |
| `expression` | string | Formula expression using fieldId references (e.g., `ex_showroom_price * tax_rate / 100`) |
| `referencedFields` | string[] | Comma-separated list of fieldIds used in the expression |
| `recalculationTrigger` | `on_field_change` \| `on_save` \| `on_submit` | When the formula re-evaluates |

**Locked behavior:** Computed fields always have:
- `editability: readonly` — users cannot set computed field values
- `presence: optional` — computed fields are never required (they compute themselves)
- `apiInputAllowed: false` — API cannot write to computed fields

---

### 8.21 Rollup / Aggregate (`rollup`)

Aggregates values from related child entity records.

| Config Parameter | Type | Description |
|---|---|---|
| `sourceEntity` | string (entityType) | The child entity whose records are aggregated (must have an `entity_ref` field pointing back to the current entity) |
| `aggregateFunction` | `COUNT` \| `SUM` \| `MIN` \| `MAX` \| `AVG` | The aggregate operation. `COUNT` requires no source field; others require a numeric field. |
| `sourceField` | string (fieldId) | The numeric field on the source entity to aggregate (required for SUM, MIN, MAX, AVG) |

**Source Entity Discovery:**
The UI automatically lists only entities that have an `entity_ref` field pointing to the current entity, making it easy to find valid rollup sources.

**Locked behavior:** Rollup fields are always:
- `editability: readonly`
- `presence: optional`
- `apiInputAllowed: false`

---

### 8.22 JSON (`json`)

Stores an arbitrary JSON object or array. Use only when no structured schema alternative exists — JSON fields bypass schema validation and are not efficiently queryable.

| Config Parameter | Type | Description |
|---|---|---|
| `maxSizeKb` | number | Maximum JSON payload size in kilobytes |
| `jsonSchema` | string | Optional JSON Schema definition to validate the stored value |
| `expertOnly` | boolean | Hides the field by default in UI builders; only expert users see it |

> A warning is always displayed in the UI: "JSON fields store unstructured data and bypass schema validation. Use only when no structured alternative exists."

---

### 8.23 Rich Text (`rich_text`)

HTML-formatted text with a WYSIWYG editor.

| Config Parameter | Type | Description |
|---|---|---|
| `maxLength` | number | Maximum character count (includes HTML markup) |
| `allowedFormatting` | string[] | Which formatting options are enabled: `Bold`, `Italic`, `Underline`, `Bullet List`, `Numbered List`, `Headings`, `Links` |

> Sanitization is always enforced by the platform — script injection and unsafe HTML are blocked regardless of configuration. File embeds within rich text are disabled for security.

---

### 8.24 Geo Point (`geo_point`)

Stores a geographic coordinate (latitude + longitude).

| Config Parameter | Type | Description |
|---|---|---|
| `precision` | number | Decimal places in the coordinate values (2–8). Higher precision = greater location accuracy. |

> Displayed as a map pin in compatible UI layouts. Interactive map preview available in record detail UI.

---

### 8.25 Signature (`signature`)

Captures a digital signature. Stores a reference to the signature image.

| Config Parameter | Type | Description |
|---|---|---|
| `captureMode` | `draw` \| `upload` \| `both` | How the signature is captured |
| `signerNameRequired` | boolean | Whether the signer must type their name |
| `timestampRequired` | boolean | Whether the capture timestamp is embedded in the stored signature |

> Available on mobile and tablet browsers (touch drawing). Desktop shows a drawing canvas with mouse input.

---

### 8.26 Barcode / QR (`barcode`)

Stores a barcode or QR code value. Can be scanned via device camera or manually entered.

| Config Parameter | Type | Description |
|---|---|---|
| `format` | `QR` \| `Code128` \| `EAN13` \| `EAN8` \| `DataMatrix` | Barcode symbology |
| `scanInput` | boolean | Enable camera scan as an input method |
| `manualInputFallback` | boolean | Allow manual text entry when scan is not available |

---

### 8.27 Rating (`rating`)

A numeric rating on a configurable scale.

| Config Parameter | Type | Description |
|---|---|---|
| `min` | number | Minimum rating value (typically 0 or 1) |
| `max` | number | Maximum rating value (typically 5 or 10) |
| `step` | number | Increment between valid values (0.5 for half-star ratings, 1 for whole numbers) |
| `displayStyle` | `stars` \| `numbers` \| `emoji` \| `thumbs` | Visual rendering style (thumbs is only valid with min=1, max=2) |

---

### 8.28 Snapshot Configuration (Family: Snapshot)

When the `snapshot` family is selected, a dedicated **Snapshot Configuration panel** (the `SnapshotConfig` component) replaces the standard type configurator. This panel defines the freeze semantics for a point-in-time copy field.

| Config Parameter | Type | Description |
|---|---|---|
| `sourceEntityType` | string (entityType) | The entity that owns the canonical value to copy from |
| `sourceFieldId` | string (fieldId) | The field on the source entity whose value is copied |
| `copyTrigger` | `on_select` \| `on_create` \| `on_save` \| `on_state_change` | When the snapshot value is first copied |
| `refreshUntilState` | string | Workflow state name. The snapshot refreshes on every trigger until this state is reached (leave blank to always refresh until freeze). |
| `freezeAtState` | string | Workflow state name. When the parent record enters this state, the snapshot value is permanently frozen. |
| `overwriteRule` | `always_overwrite` \| `only_if_empty` \| `never_after_freeze` | What happens when the copy trigger fires again before freeze state |

**Copy Trigger Details:**
- `on_select` — value is copied the moment the user selects the source record in a reference picker
- `on_create` — value is copied when the parent record is first saved
- `on_save` — value is re-copied on every save until freeze state is reached
- `on_state_change` — value is copied when a specific workflow state is entered

**Overwrite Rule Details:**
- `always_overwrite` — the snapshot updates every time the trigger fires (useful for "last known good" patterns)
- `only_if_empty` — copy only when the snapshot field is currently blank; never overwrite an existing value
- `never_after_freeze` — copy once; after the freeze state is reached, the value is permanent

> **After freezing:** The stored snapshot value is never overwritten. If the source master record changes after the parent document was posted/approved, the snapshot preserves the historical value. Corrections require a new revision of the parent document.

---

## 9. Step 5 — Behavior Editor

The Behavior step defines how the field participates in the record's data entry lifecycle. All 11 behavior properties are configurable here.

### 9.1 Presence / Requiredness

Defines when the field's value is mandatory. This is not just a "required" flag — it controls at which lifecycle event the system enforces value presence.

| Presence Value | Meaning |
|---|---|
| `optional` | Field can be left empty at any time (default for most fields) |
| `on_create` | Must have a value when the record is first created and saved |
| `on_update` | Must have a value when the record is updated (but not required on initial creation) |
| `before_submit` | Must have a value before the record can be submitted for approval |
| `before_approve` | Must have a value before an approver can approve the record |
| `conditional` | Requiredness is governed by a validation rule (configured separately in the Rule Builder — this option is planned, not yet implemented) |

**UI presentation:** Radio buttons with the description of the selected option shown below.

**Constraints:** Computed and rollup fields are always `optional` (locked). System-managed fields (protected) have presence locked to `on_create`.

### 9.2 Editability

Defines who can change the field value and under what lifecycle conditions.

| Editability Value | Meaning |
|---|---|
| `always` | Any authorized user can edit the field at any time |
| `create_only` | The field can be set when creating the record but cannot be changed afterward |
| `until_submit` | Editable until the record is submitted for approval; read-only after |
| `readonly` | Never directly editable by users (read-only display field) |
| `system_only` | Only the platform or backend process can write to this field |
| `integration_only` | Only approved integration connectors can write; the UI cannot |

### 9.3 Visibility

Defines how the field's value appears by default in the UI. This is a default hint — specific views can override it.

| Visibility Value | Meaning |
|---|---|
| `default` | Field and its value are visible normally |
| `hidden` | Field is hidden from the UI by default (but still present in the schema and APIs) |
| `masked` | Value is displayed as `•••` by default; actual value is retrievable by authorized users |

### 9.4 Default Value Source

Defines where the field's initial value comes from when a new record is created.

| Default Source | Meaning |
|---|---|
| `none` | No default value (field starts blank) |
| `static` | A specific static value configured in the next input |
| `today` | The current date (date fields only) |
| `now` | The current date and time (datetime fields only) |
| `session_tenant` | The current user's tenant ID |
| `session_node` | The current user's branch/node ID |
| `session_user` | The current user's user ID |
| `tenant_default_currency` | The tenant's configured default currency (currency fields only) |

When `static` is selected, an additional text input appears for the static value.

### 9.5 Search & List Toggles

Five boolean toggles that control how the field participates in list and search contexts:

| Property | Meaning |
|---|---|
| `searchable` | Field values are included in keyword/full-text search queries |
| `filterable` | Field can be used as a filter condition in list views and reports |
| `sortable` | Field can be used as a sort column in list views and exports |
| `includeInDefaultList` | Field appears in the auto-generated default list view columns |
| `includeInLookupDisplay` | Field value appears in entity_ref picker dropdowns when this entity is referenced from another entity |

### 9.6 Audit Behavior

Defines whether changes to this field's value are tracked in the audit log.

| Audit Value | Meaning |
|---|---|
| `none` | Changes are not logged |
| `audit_change` | The field's old and new values are recorded in the audit log on every change |
| `audit_masked` | Changes are logged, but both old and new values are masked in the audit log (for PII/sensitive data) |

> **Best practice:** Set `audit_change` for business-critical fields (amounts, key dates, status transitions). Set `audit_masked` for sensitive fields (PAN, Aadhaar, bank account). `audit_masked` is automatically applied when `classification = regulated`.

---

## 10. Step 6 — Governance Editor

The Governance step defines how the field's data is protected, who can access it, and how it participates in exports and integrations.

### 10.1 Data Classification

The primary governance level. Drives all other governance defaults.

| Classification | Color | Meaning | Auto-Defaults |
|---|---|---|---|
| `open` | Green | Safe to share externally — customer portals, public APIs, exports | includeInExport: true, maskInExport: false, apiOutputMasked: false |
| `internal` | Grey | Business use only — not for external audiences (default for most fields) | includeInExport: true, maskInExport: false, apiOutputMasked: false |
| `sensitive` | Amber | Personal or commercially confidential data — PII, pricing, commissions | includeInExport: false, maskInExport: true, apiOutputMasked: true |
| `regulated` | Red | Subject to external legal/regulatory obligation — GSTIN, PAN, Aadhaar, bank accounts | includeInExport: false, maskInExport: true, apiOutputMasked: true |

Selecting a classification auto-adjusts the other governance properties. The author can then further customize.

**Auto-classification by field type:**
- `email`, `phone`, `signature`, `geo_point` → default to `sensitive`
- All others → default to `internal`

### 10.2 Downstream Overlay Permissions

Three toggles that control what downstream layers (tenant, node) can do with this field:

| Property | Meaning |
|---|---|
| `canDownstreamConstrain` | Downstream layers can tighten behaviors (e.g., make optional → required, always editable → create_only). Default: **true** |
| `canDownstreamRelax` | Downstream layers can loosen behaviors (e.g., make required → optional). Default: **false** |
| `canDownstreamDisable` | Downstream layers can disable/hide this field entirely. Default: **false** |

> Setting `canDownstreamRelax: true` on a regulated field risks governance bypass. This combination triggers a compile warning.

### 10.3 Export & Import Control

| Property | Default | Meaning |
|---|---|---|
| `includeInExport` | true (open/internal), false (sensitive/regulated) | Whether this field appears in CSV/Excel exports |
| `maskInExport` | false (open/internal), true (sensitive/regulated) | Whether exported values are masked (shown as `***`) |
| `allowImport` | false | Whether this field's value can be set via CSV/bulk import |
| `allowBulkUpdate` | false | Whether this field can be updated via mass/bulk update operations |

### 10.4 API Access Control

| Property | Default | Meaning |
|---|---|---|
| `apiInputAllowed` | true (non-computed), false (computed/rollup) | Whether the API accepts writes to this field |
| `apiOutputAllowed` | true | Whether this field's value is included in API read responses |
| `apiOutputMasked` | false (open/internal), true (sensitive/regulated) | Whether API responses mask this field's value |

### 10.5 External ID Flag

| Property | Default | Meaning |
|---|---|---|
| `isExternalId` | false | Marks this field as the integration upsert/matching key. When an external system sends records, this field is used to find existing records for update vs new record creation. |

> Only one field per entity should have `isExternalId: true`. The compiler emits a warning if multiple fields have this flag set.

---

## 11. Edit Field Mode

### 11.1 Activation

Edit mode is triggered by:
- The **Edit** (pencil icon) button in the Field Grid's Actions column
- The **Edit** button in the Field Inspector's header
- The **"Open full editor"** button at the bottom of the Field Inspector

### 11.2 Step Sequence

Edit mode skips the Family and Source steps and starts at **Configure**:

```
configure → behavior → governance
```

The Field Identity section (label, field ID, field type) is shown read-only at the top of the Configure step for context.

### 11.3 Field ID Immutability

The Field ID (API name / `fieldId`) is **permanently immutable** once the field has been saved to an entity:
- The Field ID input is shown as read-only (greyed out)
- A tooltip explains: "Field ID is the physical column name and API field name. Renaming requires a migration governance action."
- Changing a field's ID after deployment would be a breaking change for: all existing records, all dependent validation rules, all layout views, any active APIs/integrations

### 11.4 Computed Field Lock

When editing a `computed` or `rollup` field, the following behavior properties are locked and shown as greyed-out:
- **Presence** — locked to `optional`
- **Editability** — locked to `readonly`

These are enforced by the field type's nature and cannot be overridden.

### 11.5 Protected Field Editing

Fields with `protected: true` (system/platform fields) open in a limited edit mode:
- Configure step is read-only
- Behavior step shows all properties but most are read-only
- Governance step allows some classification changes for tenant-layer governance overrides
- The Edit button in the Field Inspector shows a tooltip: "Protected fields have limited editing"

### 11.6 Dependency Warning

When the author changes the field type or a significant configuration property (e.g., entity_ref target, select value source), a warning is shown listing active dependencies that may be affected:
- Validation rules that reference this field
- Views that include this field with type-specific column config
- API consumers (from governance metadata)
- Workflow rules that react to this field

---

## 12. Constrain Inherited Field Mode

### 12.1 What Is an Inherited Field?

When an entity has a `parentEntityType` set (it extends another entity via the Overlay pattern), all fields from the parent entity appear in the Field Grid's "Inherited Fields" section. These fields are owned by the parent entity and cannot be directly edited.

A **constraint overlay** allows the child entity to tighten or restrict an inherited field's behavior and governance without changing the field's definition in the parent.

### 12.2 Activation

Click the **"Constrain"** button in the Actions column of an inherited field row in the Field Grid. The Add Field Drawer opens in constrain mode.

### 12.3 Step Sequence

Constrain mode has the shortest sequence — only two steps:

```
behavior → governance
```

The field identity and configuration are read-only (shown at the top for reference) because the owning layer controls those. Only behaviors and governance can be overlaid.

### 12.4 What Can and Cannot Be Constrained

| Property | Can Overlay? | Notes |
|---|---|---|
| Presence | ✓ (if `canDownstreamConstrain: true`) | Can only tighten (optional → required). Cannot relax if `canDownstreamRelax: false`. |
| Editability | ✓ (if `canDownstreamConstrain: true`) | Can make more restrictive. Cannot unlock system_only fields. |
| Visibility | ✓ | Can hide or mask a visible field. Cannot show a field the parent made hidden. |
| Classification | ✓ | Can increase classification level (internal → sensitive). Cannot decrease. |
| maskInExport | ✓ | Can add masking. Cannot remove masking set by the parent. |
| `canDownstreamDisable` | ✓ (if `canDownstreamDisable: true` on parent field) | Can disable the field for this layer entirely. |
| Field ID | ✗ | Fixed by parent |
| Field Type | ✗ | Fixed by parent |
| Type configuration | ✗ | Fixed by parent |
| Source layer | ✗ | Fixed by parent |

### 12.5 Overlay Operation

The resulting FieldInstance in the child entity has:
- `overlayOperation: 'constrain'`
- `sourceLayer` set to the current editing layer (tenant/node)
- `inheritedFrom` set to the parent entity's `entityType`

The constrained field is rendered differently in the Field Grid — it shows an "inherited + constrained" badge and its original inherited values alongside the constraint overrides.

### 12.6 Protected Field Exception

Fields with `protected: true` **cannot be constrained**. They are rendered in the inherited section with a lock icon and no "Constrain" button. Platform-managed fields maintain uniform behavior across all layers.

---

## 13. Field Inspector — Right Panel

The Field Inspector is the 360px-wide right panel in the Schema Builder page. It has two states: **Entity Readiness** (when no field is selected) and **Field Detail** (when a field is selected).

### 13.1 Entity Readiness State (No Field Selected)

When no field is selected, the inspector shows the entity's overall health:

**Stats row (4 cards):**
- Total Fields count
- Active fields count (green)
- Draft fields count (amber)
- Disabled fields count (red)

**Readiness Checks (4 checks):**
1. Entity has description
2. Has at least one Active field marked `includeInLookupDisplay: true`
3. No compile errors (from the conflict detection engine)
4. All system/protected fields are in Active lifecycle

**Compile Issues panel:** Lists all errors and warnings from the schema compiler for the entity.

**Referenced By panel:** Lists all other entities that have an `entity_ref` field pointing to this entity (reverse relations). Each entry shows a Panel visibility toggle (whether a sub-panel appears on the detail view) and a navigation link.

### 13.2 Field Detail State (Field Selected)

When a field is clicked in the grid, the inspector shows detailed information for that field.

**Header section:**
- **Editable label input** — click to edit the label inline; changes are saved on blur
- **Lifecycle badge** — current lifecycle state with its color
- **Edit button** — opens the full field editor (Add Field Drawer in edit mode)
- **Field ID** (monospace, below header)
- **Type badge** and **Layer badge** (color-coded by source layer)
- **Description** if present

**Quick Settings strip (5 inline controls):**

| Control | Type | Description |
|---|---|---|
| Presence | Dropdown select | Quick-change presence without opening full editor |
| Visibility | Button group (Visible / Hidden / Masked) | Toggle visibility state |
| Classification | Dropdown select (color-coded) | Quick-change data classification |
| Searchable | Toggle switch | Enable/disable field searchability |
| Status / Lifecycle | Current state badge + transition buttons | Transition field lifecycle inline (see Section 15) |

All Quick Settings changes are saved immediately to the entity schema via `saveSchemaField`.

Protected fields have all Quick Settings controls disabled (greyed out with `cursor: not-allowed`).

### 13.3 Accordion Sections (7)

The inspector shows 7 collapsible sections after the Quick Settings strip:

**1. Identity**
- Field ID (monospace)
- Catalog reference (`attributeRef`) if sourced from catalog
- Protected status (with lock icon)
- Storage Type — computed from the field's type and governance (Physical Column, Virtual/Computed, Extension Column, Provider-Backed, Snapshot Column, etc.)
- View Participation — inline selector (`list_and_form` / `form_only` / `explicit`)

**2. Data Type**
- Field type badge
- All `typeConfig` key-value pairs rendered as property rows
- Empty state if no type configuration is set

**3. Behavior Details**
- All 11 behavior properties shown as key-value rows
- Boolean values shown in green (Yes) or red (No)

**4. Governance**
- Classification badge (color-coded)
- All 12 governance properties shown as key-value rows

**5. Overlay**
- Source layer (color-coded badge)
- Overlay operation (`extend`, `constrain`, `decorate`, etc.)
- Lifecycle transition reason (if set)
- Replacement field ID (if set during deprecation)

**6. Usage / Dependencies**
- Lists all dependencies on this field (validation rules, workflow rules, layout views, API consumers, reports)
- Each dependency shows: type, name, artifact key, severity (info/warning/breaking), recommended action
- "No dependencies recorded" state when dependency list is empty

**7. Compile Readiness**
- Lists all compile errors and warnings for this specific field
- Each issue shows: severity icon, error code, human-readable message
- "No issues for this field" success state with green checkmark

### 13.4 Open Full Editor Footer

A full-width **"Open full editor"** button at the bottom of the inspector opens the Add Field Drawer in edit mode. Disabled and shows explanatory text for protected fields.

---

## 14. Field Grid

The Field Grid is the primary field management surface in the Schema Builder page, presented under the "Fields" sub-tab.

### 14.1 Layout

A full-height scrollable table with a fixed sticky header and a toolbar above it.

### 14.2 Toolbar Controls

**Add Field button (primary):** Opens the Add Field Drawer in new-field mode.

**Search input:** Filters the field list in real-time by label, Field ID, field type, or description. Shows a clear (×) button when active.

**Filter button:** Opens a popover with three filter groups:
- **Status**: Draft, Active, Disabled (toggle pills for each)
- **Layer**: Platform, Vertical, Tenant, Node (toggle pills)
- **Protected fields only**: Toggle switch

Active filters show as colored chip pills in the toolbar. Each chip has a remove (×) button.

**Columns picker:** Opens a popover listing all 12 columns with checkboxes. Authors can show/hide columns to customize the view.

**Field count:** Shows current count vs total (e.g., "8 of 14" when filters are active, "14 fields" when no filter).

### 14.3 Table Columns

| Column Key | Label | Description |
|---|---|---|
| `label` | Label | Field label (bold). Shows lock icon for protected fields. Shows "Display Name" badge for the entity's `displayNameFieldId`. Shows description on second line if present. |
| `fieldId` | Field ID | Monospace API name |
| `type` | Type | Field type as a small badge |
| `layer` | Layer | Source layer as a color-coded pill |
| `required` | Required | Presence behavior as short text (Optional / Create / Update / Submit / Approve / Cond.) |
| `editable` | Editable | Editability value with underscores replaced by spaces |
| `visible` | Visible | Eye / EyeOff / masked icons |
| `protected` | Protected | Lock icon if protected, dash if not |
| `lifecycle` | Status | Lifecycle state with icon and color |
| `usedBy` | Used By | Count of active dependencies |
| `views` | Views | "X / Y" showing how many views include this field |
| `actions` | Actions | Edit button (pencil), Delete button (trash, hidden for protected fields) |

**Default visible columns:** label, type, layer, required, visible, lifecycle, actions

### 14.4 Row Behavior

- **Click row** — selects/deselects the field; updates the Field Inspector
- **Edit button** — opens AddFieldDrawer in edit mode
- **Delete button** — removes the field from the entity schema (only available for non-protected fields when the entity is saved)

### 14.5 Row Visual States

- **Selected**: Light orange background (`hsl(22 100% 51% / 0.08)`)
- **Editing Layer Highlight**: When an editing layer filter is active, fields matching the layer get a subtle tinted left-border highlight. Fields not from the editing layer are slightly dimmed (78% opacity).
- **Disabled Lifecycle**: Fields in `disabled` state are rendered at 55% opacity
- **Protected**: Very slight purple tint on the row background

### 14.6 Inherited Fields Section

When an entity has a `parentEntityType`, a separate **"Inherited Fields"** section appears above the owned fields table:
- Header: "Inherited Fields (N) — from `{parentEntityType}`" with a "Read-only — click to Constrain" note
- Inherited field rows are shown with an amber "inherited" badge on the label
- Clicking an inherited row opens the Constrain drawer
- A "Constrain" button appears in the Actions column

### 14.7 View Mode Status Bar

A status bar appears below the toolbar when:
- **Resolved View** (`viewMode = 'resolved'`): Shows "✓ Resolved view — showing all layers merged"
- **Editing Layer** active: Shows a colored badge "Editing as: {layer}"

---

## 15. Field Lifecycle Management Panel

### 15.1 Access

The Lifecycle panel is available as the **Lifecycle** sub-tab within the Schema Builder page (when enabled), or via the quick lifecycle transitions in the Field Inspector. The dedicated panel (FieldLifecyclePanel) shows all fields in a scrollable list with their current state and transition options.

### 15.2 Field Lifecycle State Machine

Each field has a `lifecycle` property that follows this state machine:

```
draft ──────► active ────► disabled ──► active
  │                             │
  └───────────► disabled        └──► (removed — requires migration governance)

deprecated ──► active
```

| From | Can Transition To | Notes |
|---|---|---|
| `draft` | `active`, `disabled` | New fields start as draft. Activating makes them live. |
| `active` | `disabled` | Cannot directly deprecate — must disable first. |
| `disabled` | `active` | Re-enables a previously disabled field. |
| `deprecated` | `active` | Recovery path for incorrectly deprecated fields. |

**Physical removal** is not available through the Entity Designer. Removing a field from the physical schema requires dependency analysis and a migration governance action.

### 15.3 Lifecycle State Meanings

| State | Meaning | Color |
|---|---|---|
| `draft` | Field is being authored — not yet compiled or active in the runtime contract | Grey (#6b7280) |
| `active` | Field is live — included in the compiled schema, API contracts, and UI layouts | Green (#10b981) |
| `disabled` | Field is suppressed — excluded from UI and APIs but still exists in the schema | Red (#ef4444) |
| `deprecated` | Field is marked for removal — dependency analysis in progress | Amber (#f59e0b) |

### 15.4 Transition Modal

When a lifecycle transition is triggered (from the panel or the Inspector), a modal dialog appears:

**Fields in the modal:**
- **Reason** (required for `disabled` transitions, optional for others) — text area explaining why this transition is happening
- **Replacement Field ID** (optional, for `disabled` or `deprecated` transitions) — the Field ID of the field that replaces this one
- **Effective Date** (optional) — planned date for the transition

**Confirm button styling:**
- Transitioning to `disabled` → red confirm button
- All other transitions → primary accent button

**Validation:**
- Reason is required before a `disabled` transition can be confirmed
- The transition is saved to the field's `lifecycleMeta` object: `{reason, replacementFieldId, effectiveDate}`

### 15.5 Inline Quick Transitions (Field Inspector)

The Field Inspector's Quick Settings strip shows the current lifecycle state and available transition buttons inline:
- Current state shown as a colored label
- Transition buttons appear only when the entity is saved to the store
- Protected fields show no transition buttons (cannot transition)
- Unsaved entities show "Save entity to change" hint instead of transition buttons

---

## 16. v2 Classification Dimensions

Every `FieldInstance` can be classified across six independent dimensions. These dimensions are optional for backward compatibility but are required for all new fields created after v2 implementation. They are stored as typed properties on `FieldInstance` and are used by the compiler, governance engine, and catalog analytics.

### 16.1 Dimension 1 — Semantic Role (`semanticRole`)

Describes **why** this field exists in the business/domain model.

| Value | Business Meaning |
|---|---|
| `primary_key` | Internal immutable technical identity (record_id, uuid) |
| `business_key` | Human/business-recognizable unique identifier (job_card_no, invoice_number) |
| `alternate_key` | Additional uniqueness key (VIN, chassis_no, registration_no) |
| `external_id` | Integration matching/upsert key (oem_customer_id, erp_vendor_code) |
| `display_name` | Preferred record caption/label for dropdowns, search, notifications |
| `status` | Workflow or lifecycle state carrier (order_status, claim_status) |
| `scope_key` | Organizational partition key (tenant_id, company_id, node_id) |
| `audit` | Platform audit field (created_at, created_by, updated_at) |
| `business_attribute` | Core business fact — most fields (customer_name, booking_date, remarks) |
| `measure` | Numeric metric intended for aggregation (invoice_amount, quantity, area_sqft) |
| `dimension` | Categorical attribute for grouping/filtering (region, product_category, service_type) |
| `derived_indicator` | Computed flag or score (is_overdue, is_gst_registered, credit_risk_score) |
| `snapshot_attribute` | Point-in-time frozen copy of a master field (customer_name_snapshot, price_at_booking) |

### 16.2 Dimension 2 — Field Archetype Code (`fieldArchetype`)

Describes **how** the field's value comes into existence.

| Value | Value Origin | Typical Use |
|---|---|---|
| `stored_business` | User-entered or imported, stored in own column | `customer_name`, `booking_date` |
| `stored_extension` | Tenant/vertical custom field, stored in extension table | `preferred_delivery_slot` |
| `system_generated` | Platform auto-generates the value | `record_id`, `created_at`, `order_number` |
| `relationship_reference` | FK to another entity | `customer_id`, `vehicle_id`, `supplier_id` |
| `value_set` | Value chosen from a governed picklist or inline list | `customer_type`, `payment_mode` |
| `computed_virtual` | Calculated at query time; not persisted | `days_open`, `is_overdue` |
| `computed_persisted` | Calculated on save; stored for performance | `line_total`, `taxable_value` |
| `rollup` | Aggregated from related child records | `total_parts_amount`, `open_claim_count` |
| `snapshot_copy` | Copied from source and frozen at a lifecycle event | `customer_name_snapshot`, `gstin_snapshot` |
| `external_mapped` | Synced from external system; provider is source of truth | `sap_customer_code`, `oem_allocation_status` |
| `projection_field` | Re-exposed from a source entity in a projection entity | `open_balance` in a summary entity |
| `compound_parent` | Virtual logical grouping of constituent sub-fields | `address`, `geo_location` |
| `compound_constituent` | Scalar sub-field of a compound parent | `address_line1`, `latitude` |
| `media_reference` | Points to a managed file/media/binary object | `invoice_attachment_id`, `signature_id` |
| `technical_shadow` | Platform-internal helper field, not user-facing | `search_vector`, `sync_hash`, `row_version` |

### 16.3 Dimension 3 — Logical Shape (`logicalShape`)

Describes the **structural shape** of the field's value.

| Value | Shape | Examples |
|---|---|---|
| `scalar` | Single atomic value | text, integer, decimal, date, boolean |
| `reference` | Foreign-key pointer to another entity record | entity_ref |
| `value_set` | A value from a closed/governed list | select, multi_select |
| `multi_value` | Array/set of scalar values | multi-select, tags |
| `compound` | Structured composite with named sub-fields | address, person_name, geolocation |
| `structured` | Free-form JSON / rich object | json type |
| `media` | Binary/attachment reference | file, signature, barcode |
| `derived` | Computed from other fields or entities | computed, rollup |
| `collection` | Embedded list of sub-records | collection/grid type |

### 16.4 Dimension 4 — Field Persistence Mode (`fieldPersistenceMode`)

Describes **where and how** the field value is physically stored. This is field-level persistence — distinct from the entity's overall `PersistenceMode`.

| Value | Storage |
|---|---|
| `physical_column` | Standard column in the entity's primary table |
| `extension_column` | Column in the tenant extension table (`{entity}_ext`) |
| `jsonb_extension` | Stored inside a governed JSONB column (flexible, less queryable) |
| `generated_virtual` | `GENERATED ALWAYS AS (virtual)` — computed at read, no physical storage |
| `generated_stored` | `GENERATED ALWAYS AS (stored)` — computed on write, physical column |
| `query_projected` | Not stored; projected from a view or sub-query at read time |
| `provider_backed` | Value lives in an external provider's system |
| `snapshot_column` | Physical column holding a point-in-time frozen copy |
| `relation_backed` | Value is derived from a foreign relation (rollup aggregation) |
| `none` | No persistence — metadata/virtual only |

> **Architecture rule:** JSONB extension is prohibited for fields that are financial_critical, compliance_critical, integration_key, or report_critical (see StorageRiskClass).

### 16.5 Dimension 5 — Field Mutability Mode (`fieldMutabilityMode`)

Defines **who or what** can change the field value, at the field level.

| Value | Who Can Write |
|---|---|
| `user_editable` | User can edit freely within business rules and security |
| `create_only` | Set at creation; immutable afterward |
| `editable_until_state` | Editable until a specific workflow state is reached |
| `system_only` | Only the platform or backend process can write |
| `integration_only` | Only approved integration connectors can write |
| `provider_capability_driven` | Writability is determined by the external provider's advertised capabilities |
| `derived_read_only` | Never directly editable; value is produced by derivation (formula/rollup) |
| `refresh_only` | Updated only via a scheduled or triggered refresh cycle |
| `append_immutable` | Value is set on insert and can never be changed afterward |
| `snapshot_refreshable_until_freeze` | Editable/refreshable until a freeze lifecycle event fires; then permanently immutable |

### 16.6 Dimension 6 — Value Source Binding Mode (`valueSourceBindingMode`)

Describes **the mechanism** that produces or provides this field's value.

| Value | Mechanism |
|---|---|
| `direct_entry` | User types the value directly |
| `static_value_set` | Fixed inline list defined on the field |
| `governed_picklist` | Values from a reusable managed picklist/code setting |
| `lifecycle_state_set` | Values tied to the entity's workflow lifecycle state model |
| `entity_lookup` | Value selected from another entity's records |
| `external_lookup` | Value fetched from an external API/provider at runtime |
| `dependent_value_set` | Options filtered by parent field's current value (cascading picklist) |
| `query_binding` | Value derived from a configured query or view expression |
| `provider_binding` | Value supplied by an external system connector |
| `formula_binding` | Value computed from a formula over sibling fields |
| `rollup_binding` | Value aggregated from related child entity records |
| `copy_binding` | Value copied from a related record field (snapshot/convenience copy) |
| `projection_binding` | Value re-exposed from a source entity via a projection/read model |
| `none` | No value-source binding needed (system-managed or always null) |

---

## 17. Advanced Metadata Objects

These objects are nested within `FieldInstance` and provide richer, independently-governable metadata for specific field concerns.

### 17.1 FieldQueryCapabilities

Explicit, independently governable query participation flags. Preferred over simple booleans on `FieldBehaviors` because they can be constrained by provider capability and declared as derived from type inference.

```typescript
interface FieldQueryCapabilities {
  searchable: boolean;           // full-text / keyword search inclusion
  filterable: boolean;           // usable as WHERE filter condition
  sortable: boolean;             // usable as ORDER BY column
  groupable: boolean;            // usable as GROUP BY dimension
  aggregatable: boolean;         // eligible for SUM/COUNT/AVG/MIN/MAX
  lookupDisplayEligible: boolean;// can appear in entity_ref picker display
  fullTextEligible: boolean;     // eligible for full-text index (tsvector)
  capabilitySource:              // how these capabilities were determined
    'explicit'                   // designer explicitly set these flags
    | 'derived_from_type'        // auto-inferred from field type
    | 'provider_capability'      // determined by external provider
    | 'inherited_from_projection'; // inherited from source field
  indexPolicyId?: string;        // reference to index configuration policy
}
```

### 17.2 FieldValueSourceDefinition

Governs value sourcing for governed value-set and lookup fields. Richer than the simple `typeConfig` approach; used for catalog-level field definitions.

```typescript
interface FieldValueSourceDefinition {
  bindingMode: ValueSourceBindingMode;

  // For static_value_set / governed_picklist
  storedValueMode?: 'code' | 'label' | 'integer_id' | 'uuid';  // what is stored
  displayValueMode?: 'label' | 'code' | 'label_and_code';        // what is shown

  // For entity_lookup
  targetEntityType?: string;
  targetKeyField?: string;
  targetDisplayField?: string;
  targetSearchFields?: string[];
  filterConditions?: FilterConditionGroup;

  // For external_lookup
  externalEndpointCode?: string;
  externalDisplayField?: string;
  externalKeyField?: string;

  // For dependent_value_set (cascading picklist)
  dependsOnFieldId?: string;
  dependentOptions?: Record<string, Array<{ label: string; value: string }>>;

  // For formula_binding / query_binding
  expressionText?: string;
  referencedFieldIds?: string[];

  // For rollup_binding
  sourceEntityType?: string;
  aggregateFunction?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'LATEST';
  sourceFieldId?: string;

  // For copy_binding
  copySourceEntityType?: string;
  copySourceFieldId?: string;
  copyTriggerEvent?: 'on_select' | 'on_create' | 'on_save' | 'on_state_change';
}
```

### 17.3 FieldDerivationDefinition

For computed, rollup, snapshot, and projection fields. Describes how the value is derived and the refresh contract.

```typescript
interface FieldDerivationDefinition {
  derivationType: 'formula' | 'rollup' | 'copy_snapshot' | 'projection';
  refreshPolicy?: 'realtime' | 'on_save' | 'scheduled' | 'manual' | 'on_state_change';
  stalenessTolerance?: 'realtime' | 'minutes' | 'hours' | 'daily' | 'not_applicable';

  // For formula
  formulaExpression?: string;
  referencedFieldIds?: string[];

  // For rollup
  rollupSourceEntity?: string;
  rollupAggregateFunction?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'LATEST';
  rollupSourceFieldId?: string;

  // For copy_snapshot
  snapshotSourceEntityType?: string;
  snapshotSourceFieldId?: string;
  snapshotCopyTrigger?: 'on_select' | 'on_create' | 'on_save' | 'on_state_change';
  snapshotFreezeAtState?: string;
  snapshotOverwriteRule?: 'always_overwrite' | 'only_if_empty' | 'never_after_freeze';

  // For projection
  projectionSourceEntityType?: string;
  projectionExpression?: string;
}
```

### 17.4 FieldSnapshotPolicy

Dedicated freeze-semantics object for snapshot_copy fields. Provides more precise control than the generic derivation definition.

```typescript
interface FieldSnapshotPolicy {
  sourceEntityType: string;
  sourceFieldId: string;
  copyTrigger: 'on_select' | 'on_create' | 'on_save' | 'on_state_change';
  overwriteRule: 'always_overwrite' | 'only_if_empty' | 'never_after_freeze';
  refreshUntilState?: string;   // keep refreshing until this state is reached
  freezeAtState?: string;       // permanently freeze when this state is entered
}
```

### 17.5 FieldProtectionPolicy

Fine-grained masking, encryption, and retention rules beyond the basic `governance.maskInExport` flag.

```typescript
interface FieldProtectionPolicy {
  maskingBehavior?: 'none' | 'partial' | 'full' | 'tokenize';
  maskPattern?: string;         // e.g., 'XXXX-XXXX-####' for partial masking
  encryptAtRest?: boolean;
  encryptionKeyRef?: string;    // key management reference
  retentionPolicyId?: string;   // links to a data retention / purge policy
  accessLogLevel?: 'none' | 'read' | 'write' | 'all';  // audit granularity beyond auditBehavior
  exportRedactionBehavior?: 'exclude' | 'mask' | 'tokenize';
}
```

### 17.6 FieldDisplayFormat

Locale-aware display formatting for numeric, currency, date, and time fields. Ensures Indian currency formatting, regional date masks, and time conventions are consistently applied.

```typescript
interface FieldDisplayFormat {
  decimalPlaces?: number;
  thousandSeparator?: 'international' | 'indian' | 'none';  // Indian = lakh/crore separators
  currencySymbolPosition?: 'prefix' | 'suffix';
  negativeDisplay?: 'minus_sign' | 'parentheses' | 'red_text';
  dateFormat?: string;          // e.g., 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'
  timeFormat?: '12h' | '24h';
  showSeconds?: boolean;
  multiplyBy100?: boolean;      // for percentage fields stored as 0.xx
}
```

**Auto-defaults by field type:**

| Field Type | Default Display Format |
|---|---|
| `currency` | decimalPlaces: 2, thousandSeparator: 'indian', currencySymbolPosition: 'prefix', negativeDisplay: 'parentheses' |
| `percentage` | decimalPlaces: 2, thousandSeparator: 'none', multiplyBy100: false |
| `number` / `decimal` | decimalPlaces: 2, thousandSeparator: 'international' |
| `date` | dateFormat: 'dd/MM/yyyy' |
| `datetime` | dateFormat: 'dd/MM/yyyy', timeFormat: '24h', showSeconds: false |
| `time` | timeFormat: '24h', showSeconds: false |

---

## 18. System Fields vs Business Fields

### 18.1 What Are System Fields?

System fields are fields with `protected: true`. They are defined by the platform or vertical layer and cannot be modified, deleted, or constrained by tenant/node layers. They appear in the Field Grid with a lock icon (🔒) and a purple badge.

### 18.2 System Field Behavior

| Property | System Field Behavior |
|---|---|
| Presence | Usually `on_create` or locked |
| Editability | Usually `system_only` or `readonly` |
| Lifecycle | Cannot be transitioned by business users |
| Deletion | Not allowed through Entity Designer |
| Constrain | Not allowed |
| Classification | Fixed by platform (cannot be downgraded) |

### 18.3 Standard System Fields by Archetype

Every `native_persistent` entity automatically receives these system fields from the platform layer:

| Field ID | Label | Type | Semantic Role | Description |
|---|---|---|---|---|
| `record_id` | Record ID | `text` | `primary_key` | System-generated UUID. Never user-editable. |
| `tenant_id` | Tenant ID | `text` | `scope_key` | Routing key for multi-tenant data isolation. |
| `node_id` | Node ID | `text` | `scope_key` | Branch/node routing key for multi-location isolation. |
| `created_at` | Created At | `datetime` | `audit` | Timestamp when the record was first created. |
| `created_by` | Created By | `text` | `audit` | User ID of the record creator. |
| `updated_at` | Updated At | `datetime` | `audit` | Timestamp of the most recent update. |
| `owner_id` | Owner | `text` | `business_attribute` | User or team ID that owns this record (for row-level security). Added when entity has `recordOwnershipModel: user_owned` or `team_owned`. |

Additional system fields per archetype:

| Archetype | Additional System Fields |
|---|---|
| `native_persistent` with soft delete | `deleted_at`, `deleted_by` |
| `posting_document` | `posted_at`, `posted_by`, `document_state` |
| `append_only_record` | `sequence_no`, `correction_of` (for counter entries) |
| `staging_import` | `import_batch_id`, `source_system`, `promotion_status` |
| `integration_outbox` | `event_type`, `retry_count`, `last_attempted_at`, `delivery_status` |

### 18.4 Business Field Guidelines

Business fields (all non-protected fields) are created and managed by the platform, vertical, tenant, or node layer depending on their scope:

| Field Scope | Who Creates It | Layer | Examples |
|---|---|---|---|
| Universal vertical fields | Vertical product team | `vertical` | `booking_date`, `vehicle_model`, `order_status` |
| Tenant configuration fields | Tenant administrator | `tenant` | `preferred_delivery_slot`, `internal_salesperson_code` |
| Branch-specific fields | Node administrator | `node` | `showroom_zone`, `service_bay_number` |
| Overlay constraints | Tenant/Node administrator | `tenant` / `node` | Tightening inherited vertical field requiredness |

---

## 19. Industry Use Cases

The following scenarios illustrate how Field Creation and Editing is used in real enterprise deployments across seven industries that use iDMS Admin Studio.

---

### 19.1 Automotive DMS — Vehicle Invoice with Snapshot Fields

**Context:** A Vehicle Invoice is a `posting_document` archetype — editable in draft, permanently immutable once posted. The GSTIN, customer name, and ex-showroom price are legally required to reflect the values **at the time of invoicing**, not the current master values. If the customer's GSTIN is updated six months later, historical invoices must not change.

**Solution: Three Snapshot Fields**

**Field 1: Customer Name (Snapshot)**

| Property | Value |
|---|---|
| Label | Customer Name (at Invoice) |
| Field ID | `customer_name_snapshot` |
| Field Family | `snapshot` |
| Field Type | `text` |
| Semantic Role | `snapshot_attribute` |
| Snapshot Source Entity | `customer` |
| Snapshot Source Field | `full_name` |
| Copy Trigger | `on_select` — copies the name when the customer is selected in the Customer picker |
| Refresh Until State | `draft` |
| Freeze At State | `posted` |
| Overwrite Rule | `never_after_freeze` |
| Classification | `internal` |
| Presence | `on_create` |

**Field 2: GST Number (Snapshot, Regulated)**

| Property | Value |
|---|---|
| Label | GSTIN (at Invoice) |
| Field ID | `gstin_snapshot` |
| Field Family | `snapshot` |
| Field Type | `text` |
| Semantic Role | `snapshot_attribute` |
| Snapshot Source Entity | `customer` |
| Snapshot Source Field | `gstin_number` |
| Copy Trigger | `on_select` |
| Freeze At State | `posted` |
| Overwrite Rule | `never_after_freeze` |
| Classification | `regulated` |
| maskInExport | `true` |
| Audit Behavior | `audit_masked` |

**Field 3: Ex-Showroom Price (Snapshot, Financial)**

| Property | Value |
|---|---|
| Label | Ex-Showroom Price (at Booking) |
| Field ID | `ex_showroom_price_snapshot` |
| Field Family | `snapshot` |
| Field Type | `currency` |
| Semantic Role | `snapshot_attribute` |
| storageRiskClass | `financial_critical` |
| Snapshot Source Entity | `vehicle_model` |
| Snapshot Source Field | `ex_showroom_price` |
| Copy Trigger | `on_select` (when model is selected) |
| Freeze At State | `posted` |
| Presence | `on_create` |
| Editability | `create_only` |

**Other Key Fields on Vehicle Invoice:**

| Field | Type | Key Config |
|---|---|---|
| `invoice_number` | `auto_number` | codeSettingType: document, codeSettingId: dc_vehicle_invoice |
| `customer_ref` | `entity_ref` | targetEntity: customer, onDelete: restrict |
| `invoice_date` | `date` | defaultSource: today, allowFuture: false |
| `total_invoice_value` | `currency` | editability: system_only, storageRiskClass: financial_critical |
| `gst_amount` | `computed` | expression: `taxable_value * gst_rate / 100` |

---

### 19.2 Tyres Industry — Tyre Fitment Record

**Context:** A Tyre Fitment Record tracks which tyre was fitted to which vehicle axle on which date. The DOT code (US Department of Transportation tyre manufacturing date code) is a regulated compliance field. The tyre size and brand are copied from the Tyre master at fitment and frozen — because the tyre master may be updated or the record may be deactivated, but the fitment record needs to show what was actually fitted.

**Field 1: DOT Code (Regulated, Pattern-Validated)**

| Property | Value |
|---|---|
| Label | DOT Code |
| Field ID | `dot_code` |
| Field Family | `stored` |
| Field Type | `text` |
| Semantic Role | `alternate_key` |
| Pattern | `^DOT[A-Z0-9]{8,12}$` |
| Classification | `regulated` |
| Audit Behavior | `audit_change` |
| Presence | `on_create` |
| Editability | `create_only` (immutable after fitment is recorded) |
| allowImport | `true` (for historical data migration) |

**Field 2: Tyre Size (Snapshot)**

| Property | Value |
|---|---|
| Label | Tyre Size (at Fitment) |
| Field ID | `tyre_size_snapshot` |
| Field Family | `snapshot` |
| Field Type | `text` |
| Semantic Role | `snapshot_attribute` |
| Snapshot Source Entity | `tyre_catalogue` |
| Snapshot Source Field | `tyre_size` |
| Copy Trigger | `on_select` |
| Freeze At State | `confirmed` |
| Overwrite Rule | `never_after_freeze` |

**Field 3: Rollup on Vehicle Master — Tyre Replacements Count**

| Property | Value |
|---|---|
| Label | Total Tyre Replacements |
| Field ID | `total_tyre_replacements` |
| Field Family | `rollup` (on the **Vehicle** entity, not Fitment) |
| Field Type | `rollup` |
| Semantic Role | `measure` |
| Source Entity | `tyre_fitment` (child entity with entity_ref to vehicle) |
| Aggregate Function | `COUNT` |
| Presence | `optional` |
| Editability | `readonly` |

**Other Key Fields on Tyre Fitment Record:**

| Field | Type | Key Config |
|---|---|---|
| `vehicle_ref` | `entity_ref` | targetEntity: vehicle, onDelete: restrict |
| `axle_position` | `select` | options: Front Left, Front Right, Rear Left, Rear Right, Spare |
| `fitment_date` | `date` | defaultSource: today, allowFuture: false |
| `fitment_mileage` | `number` | integerOnly: true, min: 0 |
| `tyre_condition` | `select` | options: New, Good, Worn, Damaged — inline value set |
| `technician_signature` | `signature` | captureMode: draw, signerNameRequired: true |

---

### 19.3 Paint Industry — Paint Mixing Order

**Context:** A decorative/automotive paint manufacturer manages mixing orders where a base paint is combined with tinting agents to produce custom colours. The colour code comes from a governed master picklist (hundreds of industry-standard colour codes). The tint ratio is computed from the mixing formula. Each batch gets a system-generated batch code for traceability.

**Field 1: Colour Code (Governed Picklist)**

| Property | Value |
|---|---|
| Label | Colour Code |
| Field ID | `colour_code` |
| Field Family | `value_set` |
| Field Type | `select` |
| Semantic Role | `dimension` |
| Value Source | `master` (linked to Colour Codes master entity) |
| Classification | `internal` |
| Filterable | `true` |
| Sortable | `true` |
| includeInDefaultList | `true` |

**Field 2: Tint Ratio (Computed)**

| Property | Value |
|---|---|
| Label | Tint Ratio (%) |
| Field ID | `tint_ratio_pct` |
| Field Family | `computed` |
| Field Type | `computed` |
| Semantic Role | `derived_indicator` |
| Expression | `tint_volume_ml / (base_volume_ml + tint_volume_ml) * 100` |
| Referenced Fields | `tint_volume_ml`, `base_volume_ml` |
| Recalculation Trigger | `on_field_change` |
| Mode | `display_only` |
| Classification | `internal` |

**Field 3: Batch Code (Auto Number)**

| Property | Value |
|---|---|
| Label | Batch Code |
| Field ID | `batch_code` |
| Field Family | `stored` |
| Field Type | `auto_number` |
| Semantic Role | `business_key` |
| Code Setting Type | `document` |
| Code Setting ID | `dc_paint_batch` (format: BATCH-{YEAR}-{SEQ}) |
| Editability | `system_only` |
| Presence | `on_create` |
| Searchable | `true` |
| includeInDefaultList | `true` |

**Field 4: Compatible Surfaces (Multi-Select)**

| Property | Value |
|---|---|
| Label | Compatible Surfaces |
| Field ID | `compatible_surfaces` |
| Field Family | `value_set` |
| Field Type | `multi_select` |
| Semantic Role | `dimension` |
| Value Source | `inline` |
| Options | Wall, Ceiling, Wood, Metal, Concrete, Plastic |
| Min Selected | 1 |
| Max Selected | 6 |
| Filterable | `true` |

**Other Key Fields on Paint Mixing Order:**

| Field | Type | Key Config |
|---|---|---|
| `base_paint_ref` | `entity_ref` | targetEntity: paint_product, displayField: product_name |
| `base_volume_ml` | `decimal` | precision: 8, scale: 2, min: 0 |
| `tint_volume_ml` | `decimal` | precision: 8, scale: 2, min: 0 |
| `mixing_technician` | `entity_ref` | targetEntity: employee, displayField: full_name |
| `mixing_datetime` | `datetime` | defaultSource: now, editability: create_only |
| `quality_approved` | `boolean` | displayStyle: switch, defaultValue: false |

---

### 19.4 Heavy Equipment — Rental Contract

**Context:** A heavy equipment rental business tracks rental contracts that include scheduling child records (rental_schedule) for each rental period. The contract needs live rollup totals of rental days and rental revenue from the schedule records, which update automatically as schedule lines are added.

**Field 1: Total Rental Days (Rollup — COUNT)**

| Property | Value |
|---|---|
| Label | Total Rental Days |
| Field ID | `total_rental_days` |
| Field Family | `rollup` |
| Field Type | `rollup` |
| Semantic Role | `measure` |
| Source Entity | `rental_schedule` (child entity with `contract_ref` entity_ref to this entity) |
| Aggregate Function | `COUNT` |
| Classification | `internal` |
| Filterable | `true` |
| Sortable | `true` |
| includeInDefaultList | `true` |

**Field 2: Total Rental Revenue (Rollup — SUM)**

| Property | Value |
|---|---|
| Label | Total Rental Revenue |
| Field ID | `total_rental_revenue` |
| Field Family | `rollup` |
| Field Type | `rollup` |
| Semantic Role | `measure` |
| Source Entity | `rental_schedule` |
| Aggregate Function | `SUM` |
| Source Field | `daily_rate_amount` (currency field on rental_schedule) |
| storageRiskClass | `financial_critical` |
| Classification | `sensitive` |

**Other Key Fields on Rental Contract:**

| Field | Type | Key Config |
|---|---|---|
| `contract_number` | `auto_number` | codeSettingType: document, codeSettingId: dc_rental_contract |
| `equipment_ref` | `entity_ref` | targetEntity: equipment, displayField: equipment_code |
| `customer_ref` | `entity_ref` | targetEntity: customer, onDelete: restrict |
| `start_date` | `date` | allowPast: true, allowFuture: true, presence: on_create |
| `end_date` | `date` | allowFuture: true |
| `deposit_amount` | `currency` | currencySource: tenant_default, presence: on_create |
| `contract_status` | `select` | valueSource: lifecycle_state_set (Draft, Confirmed, Active, Completed, Terminated) |

---

### 19.5 Healthcare — Patient Record

**Context:** A healthcare provider stores patient records that contain personally identifiable information (PII) and regulated identifiers (Aadhaar number, blood group). These fields need strict governance: masking in exports, audit logging for all access, and API masking to prevent accidental exposure.

**Field 1: Aadhaar Number (Regulated, Masked, Audited)**

| Property | Value |
|---|---|
| Label | Aadhaar Number |
| Field ID | `aadhaar_number` |
| Field Family | `stored` |
| Field Type | `text` |
| Semantic Role | `alternate_key` |
| Pattern | `^[2-9]{1}[0-9]{11}$` (12-digit Aadhaar format) |
| Min Length | 12 |
| Max Length | 12 |
| Classification | `regulated` |
| maskInExport | `true` |
| apiOutputMasked | `true` |
| Audit Behavior | `audit_masked` |
| Presence | `optional` |
| Editability | `create_only` |
| canDownstreamRelax | `false` |
| canDownstreamDisable | `false` |

**Field 2: Blood Group (Select, Sensitive)**

| Property | Value |
|---|---|
| Label | Blood Group |
| Field ID | `blood_group` |
| Field Family | `value_set` |
| Field Type | `select` |
| Semantic Role | `business_attribute` |
| Value Source | `inline` |
| Options | A+, A-, B+, B-, AB+, AB-, O+, O- |
| Classification | `sensitive` |
| Filterable | `true` |
| Audit Behavior | `audit_change` |

**Field 3: Patient ID (Auto Number)**

| Property | Value |
|---|---|
| Label | Patient ID |
| Field ID | `patient_id` |
| Field Family | `stored` |
| Field Type | `auto_number` |
| Semantic Role | `business_key` |
| Code Setting Type | `master` |
| Code Setting ID | `mc_patient` (format: PAT-{NODE}-{SEQ}) |
| Searchable | `true` |
| includeInDefaultList | `true` |

**Other Key Fields on Patient Record:**

| Field | Type | Key Config |
|---|---|---|
| `full_name` | `text` | classification: internal, presence: on_create, searchable: true |
| `date_of_birth` | `date` | allowFuture: false, presence: on_create, classification: sensitive |
| `mobile` | `phone` | classification: sensitive, maskInExport: true, presence: on_create |
| `emergency_contact_mobile` | `phone` | classification: sensitive |
| `admitted_date` | `date` | defaultSource: today, allowFuture: false |
| `is_active` | `boolean` | defaultValue: true, displayStyle: switch |

---

### 19.6 Insurance — Policy Record

**Context:** An insurance company records policies where the annual premium is computed from the sum insured multiplied by the premium rate. The formula must always be display-only (not stored) and recalculate whenever either input changes. The policy status is driven by a governed lifecycle.

**Field 1: Sum Insured (Currency, Financial Critical)**

| Property | Value |
|---|---|
| Label | Sum Insured |
| Field ID | `sum_insured` |
| Field Family | `stored` |
| Field Type | `currency` |
| Semantic Role | `measure` |
| Currency Source | `tenant_default` |
| Precision | 12, Scale: 2 |
| Min | 0 |
| Allow Negative | `false` |
| storageRiskClass | `financial_critical` |
| Classification | `sensitive` |
| Presence | `on_create` |
| Editability | `until_submit` |
| Audit Behavior | `audit_change` |

**Field 2: Premium Rate (Percentage, Create-Only)**

| Property | Value |
|---|---|
| Label | Premium Rate (%) |
| Field ID | `premium_rate_pct` |
| Field Family | `stored` |
| Field Type | `percentage` |
| Semantic Role | `measure` |
| Min | 0, Max: 100, Scale: 4 |
| Classification | `sensitive` |
| Presence | `on_create` |
| Editability | `create_only` |
| Audit Behavior | `audit_change` |

**Field 3: Annual Premium (Computed)**

| Property | Value |
|---|---|
| Label | Annual Premium |
| Field ID | `annual_premium` |
| Field Family | `computed` |
| Field Type | `computed` |
| Semantic Role | `measure` |
| Mode | `display_only` |
| Expression | `sum_insured * premium_rate_pct / 100` |
| Referenced Fields | `sum_insured`, `premium_rate_pct` |
| Recalculation Trigger | `on_field_change` |
| storageRiskClass | `financial_critical` |
| Classification | `sensitive` |

**Field 4: Policy Status (Select, Lifecycle-Driven)**

| Property | Value |
|---|---|
| Label | Policy Status |
| Field ID | `policy_status` |
| Field Family | `value_set` |
| Field Type | `select` |
| Semantic Role | `status` |
| Value Source | `lifecycle_state_set` |
| Editability | `system_only` |
| Filterable | `true` |
| includeInDefaultList | `true` |

**Other Key Fields on Policy Record:**

| Field | Type | Key Config |
|---|---|---|
| `policy_number` | `auto_number` | codeSettingType: document, codeSettingId: dc_insurance_policy |
| `customer_ref` | `entity_ref` | targetEntity: customer, presence: on_create |
| `product_type` | `select` | options: Motor, Health, Property, Life, Marine — filterable |
| `inception_date` | `date` | presence: on_create, allowPast: true |
| `renewal_date` | `date` | filterable: true, sortable: true |
| `nominee_name` | `text` | classification: sensitive, presence: optional |

---

### 19.7 Real Estate — Property Agreement

**Context:** A real estate management platform records property sale/lease agreements. The agreement number is auto-generated, the property and customer are referenced, and the agreed price is snapshotted from the property's market value at the time the agreement is signed — because the market value may fluctuate, but the legal agreement locks in the price at signing.

**Field 1: Agreement Number (Auto Number)**

| Property | Value |
|---|---|
| Label | Agreement Number |
| Field ID | `agreement_number` |
| Field Family | `stored` |
| Field Type | `auto_number` |
| Semantic Role | `business_key` |
| Code Setting Type | `document` |
| Code Setting ID | `dc_property_agreement` (format: AGR-{CITY}-{YEAR}-{SEQ}) |
| Presence | `on_create` |
| Editability | `system_only` |
| Searchable | `true` |
| includeInDefaultList | `true` |

**Field 2: Property Reference (Entity Reference)**

| Property | Value |
|---|---|
| Label | Property |
| Field ID | `property_ref` |
| Field Family | `reference` |
| Field Type | `entity_ref` |
| Semantic Role | `business_attribute` |
| Target Entity | `property` |
| Key Field | `record_id` |
| Display Field | `property_name` |
| Search Fields | `property_name`, `property_code`, `address_line` |
| Cardinality | `single` |
| On Delete | `restrict` |
| Active Filter | `true` |
| Presence | `on_create` |
| Editability | `create_only` |

**Field 3: Agreed Price (Snapshot — Frozen at Signing)**

| Property | Value |
|---|---|
| Label | Agreed Price (at Signing) |
| Field ID | `agreed_price_snapshot` |
| Field Family | `snapshot` |
| Field Type | `currency` |
| Semantic Role | `snapshot_attribute` |
| storageRiskClass | `financial_critical` |
| Snapshot Source Entity | `property` |
| Snapshot Source Field | `market_value` |
| Copy Trigger | `on_select` (when property is selected) |
| Refresh Until State | `draft` |
| Freeze At State | `signed` |
| Overwrite Rule | `never_after_freeze` |
| Classification | `sensitive` |
| Audit Behavior | `audit_change` |
| Presence | `on_create` |

**Other Key Fields on Property Agreement:**

| Field | Type | Key Config |
|---|---|---|
| `customer_ref` | `entity_ref` | targetEntity: customer, presence: on_create, editability: create_only |
| `agreement_type` | `select` | options: Sale, Lease, Rent-to-Own, Leaseback — filterable |
| `agreement_date` | `date` | defaultSource: today, allowFuture: false, presence: on_create |
| `possession_date` | `date` | allowFuture: true |
| `registration_no` | `text` | classification: regulated, audit_change, presence: before_approve |
| `property_area_sqft` | `decimal` | precision: 10, scale: 2, min: 0, classification: internal |
| `stamp_duty_amount` | `currency` | storageRiskClass: financial_critical, classification: sensitive |

---

## 20. Field Type Quick Reference

All 26 supported field types with their key metadata defaults:

| Field Type | Group | Logical Shape | Default Persistence | Default Classification | Key Config Properties |
|---|---|---|---|---|---|
| `text` | Basic | `scalar` | `physical_column` | `internal` | minLength, maxLength, pattern, uppercaseTransform, trim |
| `textarea` | Basic | `scalar` | `physical_column` | `internal` | maxLength, lineCountHint |
| `number` | Basic | `scalar` | `physical_column` | `internal` | min, max, integerOnly, allowNegative |
| `decimal` | Basic | `scalar` | `physical_column` | `internal` | precision, scale, min, max, roundingMode |
| `boolean` | Basic | `scalar` | `physical_column` | `internal` | defaultValue, displayStyle |
| `date` | Date & Time | `scalar` | `physical_column` | `internal` | minDate, maxDate, allowPast, allowFuture |
| `datetime` | Date & Time | `scalar` | `physical_column` | `internal` | timezoneMode, systemSet |
| `time` | Date & Time | `scalar` | `physical_column` | `internal` | stepMinutes, defaultTime, allowPast, use12Hour |
| `currency` | Finance | `scalar` | `physical_column` | `sensitive` | currencySource, fixedCurrency, precision, scale, allowNegative |
| `percentage` | Finance | `scalar` | `physical_column` | `internal` | min, max, scale, showPercentSymbol |
| `select` | Selection | `value_set` | `physical_column` | `internal` | valueSource, optionItems, defaultValue, dependentOptions |
| `multi_select` | Selection | `multi_value` | `physical_column` | `internal` | valueSource, optionItems, minSelected, maxSelected |
| `entity_ref` | Relations | `reference` | `physical_column` | `internal` | targetEntity, keyField, displayField, searchFields, cardinality, onDelete, filterConditions |
| `file` | Media | `media` | `physical_column` | `internal` | allowedExtensions, maxFileSizeMb, maxCount, requiredBeforeSubmit |
| `collection` | Complex | `collection` | `physical_column` | `internal` | collectionLabel, minItems, maxItems, addRowEnabled, deleteRowEnabled, itemFields |
| `email` | Contact | `scalar` | `physical_column` | `sensitive` | maxLength, lowercaseNormalization, validationMessage |
| `phone` | Contact | `scalar` | `physical_column` | `sensitive` | countryCodeMode, defaultCountry, minLength, maxLength, allowExtension |
| `url` | Contact | `scalar` | `physical_column` | `internal` | allowedSchemes, maxLength, openNewTab |
| `auto_number` | Advanced | `scalar` | `physical_column` | `internal` | codeSettingType, codeSettingId |
| `computed` | Advanced | `derived` | `generated_virtual` | `internal` | mode, expression, referencedFields, recalculationTrigger |
| `rollup` | Advanced | `derived` | `relation_backed` | `internal` | sourceEntity, aggregateFunction, sourceField |
| `json` | Advanced | `structured` | `physical_column` | `internal` | maxSizeKb, jsonSchema, expertOnly |
| `rich_text` | Advanced | `scalar` | `physical_column` | `internal` | maxLength, allowedFormatting |
| `geo_point` | Advanced | `compound` | `physical_column` | `sensitive` | precision |
| `signature` | Advanced | `media` | `physical_column` | `sensitive` | captureMode, signerNameRequired, timestampRequired |
| `barcode` | Advanced | `scalar` | `physical_column` | `internal` | format, scanInput, manualInputFallback |
| `rating` | Advanced | `scalar` | `physical_column` | `internal` | min, max, step, displayStyle |

> **Note on Snapshot fields:** Snapshot fields use the parent field's type (typically `text` or `currency`) but are configured using the `SnapshotConfig` panel rather than the standard type configurator. Their `fieldPersistenceMode` is always `snapshot_column`.

---

## Appendix A — Architecture Rules (Non-Negotiable)

The following rules are enforced by the metadata compiler and are never configurable by the field author:

1. **Money is not floating-point.** Currency fields are stored with explicit precision and scale. The `decimal` type is not appropriate for financial amounts.
2. **Business picklists are not PostgreSQL ENUMs.** Select fields are stored as varchar codes, not database enum types. Adding a new option to a select field must never require a database schema migration.
3. **GSTIN and Aadhaar are never stored in plain text without masking.** Fields with `regulated` classification and pattern `GSTIN`/`Aadhaar` must have `apiOutputMasked: true` and `maskInExport: true`. The compiler enforces this.
4. **Computed and rollup fields cannot be required.** `presence: on_create/on_update/before_submit` is blocked for fields with `editability: readonly` or `derived_read_only` mutability.
5. **Snapshots must declare a freeze state.** A `snapshot` family field with no `freezeAtState` configured generates a compile warning: `SNAPSHOT_NO_FREEZE_STATE`.
6. **External ID uniqueness.** Only one field per entity may have `isExternalId: true`. Multiple external ID flags generate a compile error: `MULTIPLE_EXTERNAL_ID_FIELDS`.
7. **Field IDs are immutable after activation.** Changing a `fieldId` after a field reaches `active` lifecycle state requires a migration governance action and generates a breaking schema diff entry.
8. **JSONB is prohibited for financial, compliance, and integration-key fields.** `fieldPersistenceMode: jsonb_extension` is blocked when `storageRiskClass` is `financial_critical`, `compliance_critical`, or `integration_key`.
9. **Draft metadata does not run.** The runtime API contract is generated from compiled active metadata only. Draft fields are excluded from API schemas, UI layouts, and validation rules.
10. **Backend validation is authoritative.** Frontend field configurations are UI guidance. All required validation and security enforcement happens at the API/backend layer from compiled metadata contracts.

---

## Appendix B — Glossary

| Term | Definition |
|---|---|
| `FieldInstance` | An instantiated field definition attached to a specific entity. The runtime representation of a field. |
| `FieldCatalogDefinition` | A reusable field blueprint in the attribute catalog. Not attached to any entity. |
| `attributeRef` | The `attribute_code` linking a FieldInstance back to its catalog source. |
| `overlayOperation` | How this field modifies or extends a parent entity's field: extend, replace, constrain, decorate, disable. |
| `sourceLayer` | The organizational layer that owns/defines this field: platform, vertical, tenant, node. |
| `lifecycle` | The field's current activation state: draft, active, disabled, deprecated. |
| `typeConfig` | A free-form key-value record holding type-specific configuration parameters. |
| `behaviors` | The FieldBehaviors object containing presence, editability, visibility, defaultSource, and toggle flags. |
| `governance` | The FieldGovernance object containing classification, export policy, API policy, and overlay permissions. |
| `snapshotPolicy` | The FieldSnapshotPolicy object defining freeze semantics for snapshot_copy fields. |
| `storageRiskClass` | Data integrity/compliance criticality: normal, compliance_critical, financial_critical, integration_key, report_critical. |
| DOT Code | US Department of Transportation tyre identification number — a regulated identifier in the tyres industry. |
| GSTIN | Goods and Services Tax Identification Number — a regulated identifier in Indian tax law. |
| Aadhaar | India's 12-digit biometric identity number — a regulated identifier with strict data protection requirements. |
| posting_document | Entity archetype for business documents that are editable in draft and permanently immutable after posting. |
| Overlay Confirmation | The panel shown when saving a field in an entity that extends a parent, requesting explicit confirmation of the overlay. |
