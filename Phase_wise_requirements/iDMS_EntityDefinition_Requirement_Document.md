# iDMS Admin Studio — EntityDefinition Requirement Document

**Document Type:** Product + Functional + Implementation Requirement  
**Module:** Entity Designer / Metadata Platform  
**Component:** EntityDefinition  
**Prepared For:** AI Developer / Engineering Team  
**Version:** 1.0  
**Status:** Implementation Ready for Architecture Review  
**Primary Database:** PostgreSQL  
**Related Components:** FieldDefinition, RelationshipDefinition, ViewDefinition, ActionDefinition, ValidationRuleDefinition, SecurityDefinition, Runtime Metadata Resolver, Metadata Compiler

---

## 1. Purpose

EntityDefinition is the root metadata object for every configurable business object in iDMS.

It defines the identity, classification, ownership, storage strategy, lifecycle references, runtime policy references, and governance behavior of an entity.

EntityDefinition shall not directly store full field definitions, UI layouts, validation rules, workflow definitions, action definitions, permissions, or integration contracts. It shall reference those metadata objects through identifiers.

The purpose of this requirement document is to define the functional and implementation requirements for EntityDefinition so that iDMS can evolve from a screen-level schema builder into an enterprise-grade metadata platform.

---

## 2. Background and Current Implementation Context

The current Entity Designer implementation already supports entity creation through templates, blank entities, and extension of base entities. Clone and package creation patterns are planned but not fully wired.

The current implementation also includes:

- Entity identity properties such as label, plural label, entity type, description, domain, category, owning layer, and display name field.
- Entity categories such as Transaction, Master Data, Configuration, and Ledger-like.
- Category-driven behavior such as delete policy, standard actions, lookup eligibility, and governance rules.
- Entity behavior flags such as lifecycle stages, audit trail, soft delete, reporting, global search, extension policy, and requiredness relaxation.
- Entity metadata lifecycle states such as Draft, Active, and Deprecated.
- Schema compile readiness to prevent activation of broken schema definitions.
- Layer model covering Platform, Vertical, Tenant, Node, and Role.

This document refines that foundation and defines the next architecture-level implementation.

---

## 3. Design Principles

### 3.1 EntityDefinition is the metadata root

EntityDefinition shall represent the business object. It shall not become a database table definition editor.

Correct example:

```json
{
  "entityId": "ent_service_job_card",
  "apiName": "service_job_card",
  "label": "Service Job Card",
  "entityCategory": "Transaction"
}
```

Incorrect example:

```json
{
  "customer_name": "varchar",
  "invoice_amount": "numeric"
}
```

### 3.2 EntityDefinition references child metadata

EntityDefinition shall reference child metadata objects. It shall not embed large metadata objects inline.

Referenced child objects include:

- FieldDefinition
- RelationshipDefinition
- ConstraintDefinition
- ValidationRuleDefinition
- LifecycleModelDefinition
- ViewDefinition
- ActionDefinition
- SecurityDefinition
- IntegrationContractDefinition
- AnalyticsContractDefinition
- VersionDefinition
- DependencyDefinition

### 3.3 Metadata lifecycle and record lifecycle shall remain separate

Metadata lifecycle defines whether the EntityDefinition itself is draft, active, deprecated, retired, or archived.

Record lifecycle defines whether an actual business record is open, submitted, approved, closed, posted, cancelled, or reversed.

These lifecycles shall not be mixed.

### 3.4 Role shall not be treated as a schema-owning layer

Platform, Vertical, Tenant, and Node may own metadata depending on governance rules.

Role shall affect permissions, visibility, action availability, and view access. Role shall not create entities, fields, relationships, or storage definitions.

### 3.5 PostgreSQL storage shall be derived from logical metadata

Admin users shall not be forced to select PostgreSQL datatypes while creating business entities.

The system shall derive PostgreSQL storage types from logical data types defined in FieldDefinition.

EntityDefinition shall define the storage strategy at entity level. FieldDefinition shall define the logical data type, physical data type, and UI control mappings at field level.

---

## 4. Scope

### 4.1 In scope

This requirement covers:

- EntityDefinition metadata model.
- Entity identity rules.
- Entity classification rules.
- Entity ownership and layer governance.
- Entity storage strategy for PostgreSQL.
- Entity metadata lifecycle.
- Entity display defaults.
- Entity runtime policy references.
- Entity creation, update, activation, deprecation, retirement, and read behavior.
- EntityDefinition JSON schema.
- PostgreSQL table structure for metadata storage.
- Validation rules and validation messages.
- Metadata compiler checks for EntityDefinition.
- Runtime resolver output expectations.
- User stories and acceptance criteria.

### 4.2 Out of scope

This requirement does not define the full implementation of:

- FieldDefinition.
- RelationshipDefinition.
- Rule Engine.
- Workflow Engine.
- UI layout builder.
- Security engine.
- API gateway.
- Package installation engine.
- Analytics semantic layer.
- Translation workbench.

This document defines references and boundaries for these components where EntityDefinition depends on them.

---

## 5. Terminology

| Term | Definition |
|---|---|
| Entity | A governed business object such as Customer, Vehicle, Service Job Card, Sales Invoice, or Journal Voucher. |
| EntityDefinition | Metadata object that defines the identity, classification, storage strategy, lifecycle references, and runtime policies of an entity. |
| API Name | Stable technical name used by APIs, metadata references, generated contracts, and developer tools. |
| Entity Category | Business behavior category such as Transaction, Master Data, Configuration, or Ledger-like. |
| Business Object Type | More specific classification inside a category, such as Operational Document, Financial Document, Party Master, Asset Master, Accounting Entry, or Tax Configuration. |
| Metadata Lifecycle | Lifecycle of the metadata definition itself. |
| Record Lifecycle | Lifecycle of actual business records created from the entity. |
| Owning Layer | Metadata ownership level such as Platform, Vertical, Tenant, or Node. |
| Runtime Contract | Resolved metadata output consumed by UI, API, workflow, rule, and integration engines. |
| Metadata Compiler | Service that validates and compiles draft metadata into active runtime metadata. |
| Runtime Resolver | Service that resolves active metadata for a specific tenant, node, role, user, locale, channel, and record state. |

---

## 6. Recommended Naming Corrections

The current implementation uses the term `Entity Type` for the snake_case technical name. This shall be renamed to `API Name`.

| Current Term | Required Term | Reason |
|---|---|---|
| Entity Type | API Name | Avoids confusion with Entity Category. |
| Category | Entity Category | Clarifies that this value drives behavior. |
| Template | Entity Template | Clarifies that template is only a creation pattern. |
| Display Name Field | Default Display Field | Aligns with runtime lookup and UI resolution. |

Example:

```json
{
  "label": "Vehicle Order",
  "apiName": "vehicle_order",
  "entityCategory": "Transaction"
}
```

---

## 7. EntityDefinition Metadata Model

EntityDefinition shall be implemented as a structured metadata object with the following sections:

1. Identity
2. Classification
3. Ownership
4. Storage
5. Display Defaults
6. Lifecycle
7. Runtime Policies
8. Governance Flags
9. System Audit
10. References

---

## 8. EntityDefinition — Field Specification

### 8.1 Identity Section

| Field | Type | Required | Editable After Activation | Validation | Description |
|---|---:|---:|---:|---|---|
| entityId | string | Yes | No | Must be globally unique. Recommended prefix: `ent_`. | Immutable internal identifier. |
| apiName | string | Yes | No | Lowercase snake_case. Max 63 characters. Must start with a letter. Allowed characters: `a-z`, `0-9`, `_`. Must be globally unique within namespace. | Stable technical name used by APIs and metadata references. |
| label | string | Yes | Yes | Min 2 characters. Max 100 characters. Must not be blank after trimming. | Singular user-facing label. |
| pluralLabel | string | Yes | Yes | Min 2 characters. Max 120 characters. Must not be blank after trimming. | Plural user-facing label. |
| description | string | No | Yes | Max 1000 characters. | Business purpose and lifecycle explanation. |
| entityCode | string | No | No after activation | Uppercase alphanumeric with underscore. Max 20 characters. | Short business code used for numbering, package references, and logs. |
| namespace | string | Yes | No | Lowercase snake_case. Must exist in PackageDefinition or ModuleDefinition. | Namespace of the module or package that owns the entity. |

### 8.2 Classification Section

| Field | Type | Required | Editable After Activation | Allowed Values | Description |
|---|---:|---:|---:|---|---|
| domain | string | Yes | Yes with governance | Sales, Service, Finance, Spare Parts, CRM, Accounting, Taxation, Inventory, Network, System, Reference | High-level business domain. |
| module | string | Yes | Yes with governance | Configured module catalog value. | Product module responsible for the entity. |
| entityCategory | enum | Yes | No after activation if records exist | Transaction, Master Data, Configuration, Ledger-like | Drives default behavior, delete policy, lookup eligibility, and standard actions. |
| businessObjectType | enum | Yes | Yes with governance | Operational Document, Financial Document, Party Master, Asset Master, Product Master, Configuration Record, Accounting Entry, Reference Data, System Object | More specific business classification. |
| industryVertical | enum | Yes | No after activation | Core, Automobile, Real Estate, FMCG, Paints, System | Industry ownership context. |
| lookupEligible | boolean | Derived | No direct edit | Derived from entityCategory unless overridden by governance policy. | Determines whether records can be selected in lookup fields. |

### 8.3 Ownership Section

| Field | Type | Required | Editable After Activation | Allowed Values | Description |
|---|---:|---:|---:|---|---|
| owningLayer | enum | Yes | No | Platform, Vertical, Tenant, Node | Defines metadata ownership. Role is not allowed. |
| owningPackageId | string | Yes | No after activation | Must reference active PackageDefinition. | Package that introduced the entity. |
| owningModule | string | Yes | Yes with governance | Must reference ModuleDefinition. | Product module responsible for maintenance. |
| protected | boolean | Yes | Yes with platform permission | true, false | Prevents unsafe modification by downstream layers. |
| extensionPolicyId | string | Yes | Yes with governance | Must reference ExtensionPolicyDefinition. | Controls whether lower layers can extend. |
| overridePolicyId | string | Yes | Yes with governance | Must reference OverridePolicyDefinition. | Controls what lower layers can modify. |

### 8.4 Storage Section

| Field | Type | Required | Editable After Activation | Allowed Values | Description |
|---|---:|---:|---:|---|---|
| storageStrategy | enum | Yes | No after activation | physical_table, shared_table, extension_table, jsonb_extension, external_entity, virtual_entity | Defines how records of this entity are stored. |
| tableName | string | Conditional | No after activation | Required when storageStrategy is `physical_table` or `shared_table`. | PostgreSQL table name. |
| primaryKeyField | string | Yes | No | Default: `id`. | Primary key column name. |
| primaryKeyStrategy | enum | Yes | No | uuid, bigserial, composite | Recommended: `uuid`. |
| tenantScoped | boolean | Yes | No after activation | true, false | Defines whether records are scoped by tenant. |
| nodeScoped | boolean | Yes | Yes with governance | true, false | Defines whether records are scoped by branch/node. |
| softDeletePolicyId | string | Conditional | Yes with governance | Must reference SoftDeletePolicyDefinition. | Defines archival behavior. Mandatory except Ledger-like. |
| partitionPolicyId | string | No | Yes with architecture permission | Must reference PartitionPolicyDefinition. | Optional high-volume partitioning policy. |
| retentionPolicyId | string | No | Yes with compliance permission | Must reference DataRetentionPolicyDefinition. | Optional retention policy. |

### 8.5 Display Defaults Section

| Field | Type | Required | Editable After Activation | Description |
|---|---:|---:|---:|---|
| defaultDisplayFieldId | string | Conditional | Yes | Field used to represent a record in lookup, search result, title area, notifications, and audit references. Required before activation. |
| defaultListViewId | string | Conditional | Yes | Default list view. Required before activation when entity is UI-enabled. |
| defaultFormViewId | string | Conditional | Yes | Default create/edit/detail form view. Required before activation when entity is UI-enabled. |
| defaultLookupViewId | string | Conditional | Yes | Default lookup selector view. Required before entity is lookup eligible. |
| titleFormat | string | No | Yes | Format pattern for record title. Example: `{job_card_no} - {vehicle_registration_no}`. |
| subtitleFormat | string | No | Yes | Format pattern for record subtitle. Example: `{customer_name} · {status}`. |

### 8.6 Lifecycle Section

| Field | Type | Required | Editable After Activation | Allowed Values | Description |
|---|---:|---:|---:|---|---|
| metadataStatus | enum | Yes | Controlled | Draft, Active, Deprecated, Retired, Archived | Lifecycle of the metadata definition. |
| recordLifecycleModelId | string | Conditional | Yes with governance | Must reference LifecycleModelDefinition. | Required for Transaction and Ledger-like entities. |
| activationPolicyId | string | Yes | Yes with platform permission | Must reference ActivationPolicyDefinition. | Defines compile checks required before activation. |
| versionId | string | Yes | System-managed | Must reference VersionDefinition. | Current metadata version. |
| activatedAt | datetime | System | No | System timestamp. | When metadata version was activated. |
| deprecatedAt | datetime | System | No | System timestamp. | When metadata version was deprecated. |
| retiredAt | datetime | System | No | System timestamp. | When metadata version was retired. |

### 8.7 Runtime Policies Section

| Field | Type | Required | Editable After Activation | Description |
|---|---:|---:|---:|---|
| auditPolicyId | string | Yes | Yes with compliance permission | Defines audit behavior for records and metadata changes. |
| securityPolicyId | string | Yes | Yes with security permission | Defines object-level, field-level, view-level, and action-level access resolution. |
| apiExposurePolicyId | string | Yes | Yes with integration permission | Defines whether entity is exposed through internal APIs, partner APIs, public APIs, and integration APIs. |
| importPolicyId | string | Yes | Yes with import permission | Defines import eligibility and import behavior. |
| exportPolicyId | string | Yes | Yes with export permission | Defines export eligibility and masking behavior. |
| analyticsPolicyId | string | Yes | Yes with analytics permission | Defines reporting and analytics participation. |
| searchPolicyId | string | Yes | Yes with governance | Defines global search indexing behavior. |
| localizationPolicyId | string | No | Yes | Defines label and format localization behavior. |

### 8.8 Governance Flags Section

| Field | Type | Required | Editable After Activation | Description |
|---|---:|---:|---:|---|
| allowExtension | boolean | Yes | Yes with governance permission | Allows lower layers to add metadata extensions. |
| allowFieldAddition | boolean | Yes | Yes with governance permission | Allows lower layers to add fields. |
| allowRelationshipAddition | boolean | Yes | Yes with governance permission | Allows lower layers to add relationships. |
| allowViewOverride | boolean | Yes | Yes with governance permission | Allows lower layers to create or override views. |
| allowActionAddition | boolean | Yes | Yes with governance permission | Allows lower layers to add custom actions. |
| allowRequirednessRelaxation | boolean | Yes | Yes with platform permission | Allows lower layers to make required fields less strict. Default false. |
| allowApiExposureOverride | boolean | Yes | Yes with platform permission | Allows lower layers to expose or restrict APIs. Default false. |

### 8.9 System Audit Section

| Field | Type | Required | Editable | Description |
|---|---:|---:|---:|---|
| createdBy | string | System | No | User who created the entity metadata. |
| createdAt | datetime | System | No | Creation timestamp. |
| updatedBy | string | System | No | User who last updated metadata. |
| updatedAt | datetime | System | No | Last update timestamp. |
| activatedBy | string | System | No | User who activated metadata. |
| deprecatedBy | string | System | No | User who deprecated metadata. |
| retiredBy | string | System | No | User who retired metadata. |
| changeReason | string | Conditional | Yes before submit | Required for activation, deprecation, retirement, and protected metadata change. |

---

## 9. Entity Categories and Default Behaviors

### 9.1 Transaction

Transaction entities represent business documents and operational records.

Examples:

- Vehicle Order
- Service Job Card
- Sales Invoice
- Purchase Invoice
- Receipt Voucher

Default behavior:

| Behavior | Default |
|---|---|
| workflowEnabled | true |
| auditRequired | true |
| softDeleteAllowed | true before posting or final closure |
| lookupEligible | false |
| reportingEnabled | true |
| globalSearchEnabled | true |
| standardActions | New, Edit, Delete, Submit, Approve, Reject, Refresh |

### 9.2 Master Data

Master Data entities represent reusable records.

Examples:

- Customer
- Vehicle
- Part
- Supplier
- GL Account

Default behavior:

| Behavior | Default |
|---|---|
| workflowEnabled | optional |
| auditRequired | true |
| softDeleteAllowed | true |
| lookupEligible | true |
| reportingEnabled | true |
| globalSearchEnabled | true |
| standardActions | New, Edit, Delete, Activate, Deactivate, Refresh |

### 9.3 Configuration

Configuration entities represent setup records.

Examples:

- Tax Rate
- Numbering Rule
- Approval Matrix
- Price Type

Default behavior:

| Behavior | Default |
|---|---|
| workflowEnabled | optional |
| auditRequired | true |
| softDeleteAllowed | true |
| lookupEligible | false by default |
| reportingEnabled | false by default |
| globalSearchEnabled | false by default |
| standardActions | New, Edit, Delete, Refresh |

### 9.4 Ledger-like

Ledger-like entities represent accounting, inventory, or legally sensitive immutable entries.

Examples:

- Journal Entry
- Stock Ledger
- Tax Ledger
- Accounting Posting

Default behavior:

| Behavior | Default |
|---|---|
| workflowEnabled | true |
| auditRequired | true |
| softDeleteAllowed | false |
| physicalDeleteAllowed | false |
| lookupEligible | false |
| reportingEnabled | true |
| globalSearchEnabled | false by default |
| standardActions | New, Edit Before Posting, Counter Entry, Refresh |

Ledger-like entities shall not allow physical delete, soft delete, or record mutation after final posting except through reversal or counter-entry mechanisms.

---

## 10. Metadata Lifecycle

### 10.1 Allowed States

| State | Meaning |
|---|---|
| Draft | Metadata is editable and not available for runtime use. |
| Active | Metadata is compiled and available for runtime use. |
| Deprecated | Metadata remains usable for existing dependencies but should not be selected for new configuration. |
| Retired | Metadata is no longer available for new records. Existing records remain readable based on retention policy. |
| Archived | Metadata is retained for audit/history only. |

### 10.2 Allowed Transitions

| From | To | Allowed | Guard |
|---|---|---:|---|
| Draft | Active | Yes | Metadata compiler must pass. |
| Draft | Deprecated | Yes | No active runtime dependency shall exist. |
| Active | Deprecated | Yes | Dependency analysis must pass with no blocking dependency. |
| Deprecated | Active | Conditional | Version compatibility check must pass. |
| Deprecated | Retired | Yes | No active configuration shall depend on this entity. |
| Retired | Archived | Yes | Retention policy must allow archival. |
| Active | Retired | No | Entity must be deprecated before retirement. |
| Retired | Active | No | Create a new version instead. |
| Archived | Active | No | Create a new entity version instead. |

### 10.3 Transition Rules

- Activation shall create a new active VersionDefinition.
- Activation shall compile all required runtime contracts.
- Deprecation shall block new references from newly created metadata.
- Deprecation shall not break existing records.
- Retirement shall block creation of new records.
- Retirement shall preserve read access according to security and retention policy.
- Archived metadata shall remain available for audit, historical reports, and record rendering.

---

## 11. PostgreSQL Storage Requirements

### 11.1 Metadata storage

EntityDefinition metadata shall be stored in PostgreSQL metadata tables.

Recommended table:

```sql
CREATE TABLE md_entity_definition (
    entity_id              TEXT PRIMARY KEY,
    api_name               TEXT NOT NULL,
    namespace              TEXT NOT NULL,
    label                  TEXT NOT NULL,
    plural_label           TEXT NOT NULL,
    description            TEXT,
    entity_code            TEXT,
    domain                 TEXT NOT NULL,
    module                 TEXT NOT NULL,
    entity_category        TEXT NOT NULL,
    business_object_type   TEXT NOT NULL,
    industry_vertical      TEXT NOT NULL,
    owning_layer           TEXT NOT NULL,
    owning_package_id      TEXT NOT NULL,
    owning_module          TEXT NOT NULL,
    is_protected           BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_status        TEXT NOT NULL,
    active_version_id      TEXT,
    storage_strategy       TEXT NOT NULL,
    table_name             TEXT,
    primary_key_field      TEXT NOT NULL DEFAULT 'id',
    primary_key_strategy   TEXT NOT NULL DEFAULT 'uuid',
    tenant_scoped          BOOLEAN NOT NULL DEFAULT TRUE,
    node_scoped            BOOLEAN NOT NULL DEFAULT FALSE,
    display_config         JSONB NOT NULL DEFAULT '{}'::jsonb,
    lifecycle_config       JSONB NOT NULL DEFAULT '{}'::jsonb,
    runtime_policies       JSONB NOT NULL DEFAULT '{}'::jsonb,
    governance_flags       JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata_json          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by             TEXT NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT NOT NULL,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_by           TEXT,
    activated_at           TIMESTAMPTZ,
    deprecated_by          TEXT,
    deprecated_at          TIMESTAMPTZ,
    retired_by             TEXT,
    retired_at             TIMESTAMPTZ,
    change_reason          TEXT,
    CONSTRAINT uq_md_entity_api_name_namespace UNIQUE (namespace, api_name)
);
```

### 11.2 Why metadata_json is allowed

`metadata_json` may be used for forward-compatible metadata attributes. It shall not become the only storage for core searchable attributes.

Core attributes such as `api_name`, `entity_category`, `owning_layer`, `metadata_status`, and `active_version_id` shall remain first-class columns.

### 11.3 Runtime business table creation

When `storageStrategy = physical_table`, the system shall create or reference a PostgreSQL business table for record storage.

Recommended generated table pattern for transaction/master entities:

```sql
CREATE TABLE txn_service_job_card (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    node_id UUID,
    record_no TEXT,
    status TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID,
    deleted_at TIMESTAMPTZ
);
```

FieldDefinition and RelationshipDefinition shall add field-specific columns and foreign keys based on compiled metadata.

### 11.4 PostgreSQL datatype boundary

EntityDefinition shall not store individual field-level PostgreSQL datatypes.

FieldDefinition shall manage:

- Business field type.
- Logical data type.
- PostgreSQL physical data type.
- UI control mapping.

EntityDefinition shall only store:

- Entity storage strategy.
- Physical table name.
- Primary key strategy.
- Tenant and node scoping.
- Soft delete behavior.
- Partition and retention policy references.

---

## 12. Data Type Architecture Boundary

This section is included because EntityDefinition must not own field datatype decisions.

### 12.1 Four-level model

The platform shall use four distinct concepts:

| Level | Owner | Example |
|---|---|---|
| Business Field Type | FieldDefinition | GSTIN, VIN, Customer Reference, Currency Amount |
| Logical Data Type | FieldDefinition | text, decimal, date, entity_reference, enum |
| PostgreSQL Physical Type | FieldDefinition storage section | varchar(15), numeric(18,2), uuid, date |
| UI Control Type | ViewDefinition and ViewFieldDefinition | text input, currency input, autocomplete lookup, dropdown, status chip |

### 12.2 Required rule

EntityDefinition shall never ask the admin to select a PostgreSQL datatype for a field.

FieldDefinition shall derive recommended PostgreSQL storage from logical data type and allow advanced override only for architecture-level users.

### 12.3 Example mappings

| Business Field Type | Logical Data Type | PostgreSQL Type | Default UI Control |
|---|---|---|---|
| GSTIN | text_identifier | varchar(15) | uppercase_text_input |
| Invoice Amount | currency | numeric(18,2) | currency_input |
| Customer Reference | entity_reference | uuid | autocomplete_lookup |
| Invoice Date | date | date | date_picker |
| Created At | datetime | timestamptz | readonly_datetime |
| Status | enum | varchar(50) or code table FK | dropdown on form, chip on list |
| Internal ID | id | uuid | hidden |

### 12.4 UI control ownership

FieldDefinition may define the default UI control. ViewFieldDefinition shall define the actual UI control used in a specific view.

Example:

- Status field in form view: dropdown.
- Status field in list view: status chip.
- Status field in print view: plain text.
- Status field in filter panel: multi-select filter.

---

## 13. EntityDefinition JSON Schema — Target Shape

```json
{
  "entityId": "ent_service_job_card",
  "apiName": "service_job_card",
  "label": "Service Job Card",
  "pluralLabel": "Service Job Cards",
  "description": "Captures vehicle service work from job card opening to closure.",
  "entityCode": "SJC",
  "namespace": "auto_service",

  "classification": {
    "domain": "Service",
    "module": "Workshop Management",
    "entityCategory": "Transaction",
    "businessObjectType": "Operational Document",
    "industryVertical": "Automobile",
    "lookupEligible": false
  },

  "ownership": {
    "owningLayer": "Vertical",
    "owningPackageId": "pkg_auto_service_core",
    "owningModule": "Workshop Management",
    "protected": true,
    "extensionPolicyId": "policy_allow_tenant_extension",
    "overridePolicyId": "policy_constrain_only"
  },

  "storage": {
    "storageStrategy": "physical_table",
    "tableName": "txn_service_job_card",
    "primaryKeyField": "id",
    "primaryKeyStrategy": "uuid",
    "tenantScoped": true,
    "nodeScoped": true,
    "softDeletePolicyId": "policy_soft_delete_transaction",
    "partitionPolicyId": null,
    "retentionPolicyId": null
  },

  "display": {
    "defaultDisplayFieldId": "fld_job_card_no",
    "defaultListViewId": "view_sjc_default_list",
    "defaultFormViewId": "view_sjc_default_form",
    "defaultLookupViewId": null,
    "titleFormat": "{job_card_no}",
    "subtitleFormat": "{customer_name} · {vehicle_registration_no} · {status}"
  },

  "lifecycle": {
    "metadataStatus": "Draft",
    "recordLifecycleModelId": "lifecycle_service_job_card",
    "activationPolicyId": "policy_compile_required",
    "versionId": "ver_sjc_1_0_0",
    "activatedAt": null,
    "deprecatedAt": null,
    "retiredAt": null
  },

  "runtimePolicies": {
    "auditPolicyId": "audit_transaction_full",
    "securityPolicyId": "security_service_job_card",
    "apiExposurePolicyId": "api_internal_and_oem",
    "importPolicyId": "import_disabled",
    "exportPolicyId": "export_role_based",
    "analyticsPolicyId": "analytics_service_operations",
    "searchPolicyId": "search_enabled_transaction",
    "localizationPolicyId": "locale_india_default"
  },

  "governanceFlags": {
    "allowExtension": true,
    "allowFieldAddition": true,
    "allowRelationshipAddition": true,
    "allowViewOverride": true,
    "allowActionAddition": true,
    "allowRequirednessRelaxation": false,
    "allowApiExposureOverride": false
  },

  "systemAudit": {
    "createdBy": "usr_admin",
    "createdAt": "2026-05-11T10:00:00+05:30",
    "updatedBy": "usr_admin",
    "updatedAt": "2026-05-11T10:00:00+05:30",
    "activatedBy": null,
    "activatedAt": null,
    "changeReason": "Initial creation from Automobile Service template"
  }
}
```

---

## 14. Entity Creation Requirements

### 14.1 Creation patterns

EntityDefinition shall support these creation patterns:

| Pattern | MVP Status | Behavior |
|---|---|---|
| Template | Required | Creates EntityDefinition from predefined EntityTemplate. |
| Blank | Required | Creates empty EntityDefinition with mandatory system defaults. |
| Extend | Required | Creates child EntityDefinition or layer extension over parent entity based on governance. |
| Clone | Later | Creates independent copy of an existing entity metadata definition. |
| Package | Later | Installs entity metadata from PackageDefinition. |

### 14.2 Template creation behavior

When entity is created from template:

- System shall copy template identity defaults where applicable.
- System shall assign category, domain, business object type, storage defaults, lifecycle defaults, and runtime policies.
- System shall create required system fields through FieldDefinition.
- System shall create standard views through ViewDefinition.
- System shall create standard actions through ActionDefinition.
- System shall keep entity in Draft status until metadata compiler passes and user activates it.

### 14.3 Blank creation behavior

When entity is created blank:

- System shall require identity, classification, ownership, storage, and runtime policy minimums.
- System shall create system fields only.
- System shall not auto-create domain-specific fields.
- System shall require user to create minimum display configuration before activation.

### 14.4 Extend creation behavior

When entity is created by extension:

- System shall validate that parent entity allows extension.
- System shall inherit protected metadata from parent.
- System shall create layer-specific overlay metadata.
- System shall not allow lower layer to directly modify protected parent metadata.
- System shall create resolved view through compiler using parent plus extension metadata.

---

## 15. Validation Rules and Messages

### 15.1 Identity validations

| Rule | Message |
|---|---|
| label is blank after trimming | Entity label is required. |
| label length is less than 2 characters | Entity label must contain at least 2 characters. |
| label length exceeds 100 characters | Entity label cannot exceed 100 characters. |
| pluralLabel is blank after trimming | Plural label is required. |
| apiName is blank | API name is required. |
| apiName contains invalid characters | API name must use lowercase letters, numbers, and underscores only. |
| apiName starts with number or underscore | API name must start with a lowercase letter. |
| apiName exceeds 63 characters | API name cannot exceed 63 characters. |
| apiName already exists in namespace | API name already exists in this namespace. |
| apiName is changed after activation | API name cannot be changed after activation. |

### 15.2 Classification validations

| Rule | Message |
|---|---|
| entityCategory is missing | Entity category is required. |
| unsupported entityCategory is selected | Selected entity category is not supported. |
| businessObjectType is missing | Business object type is required. |
| businessObjectType is not valid for entityCategory | Business object type is not valid for the selected entity category. |
| Ledger-like entity has soft delete enabled | Ledger-like entities cannot allow delete. Use reversal or counter-entry. |
| Master Data entity has lookupEligible false without override reason | Master Data entities are lookup eligible by default. Provide an override reason. |

### 15.3 Ownership validations

| Rule | Message |
|---|---|
| owningLayer is Role | Role cannot own entity schema. Use security and view permissions for role-specific behavior. |
| owningPackageId is missing | Owning package is required. |
| protected entity is modified by unauthorized layer | This entity is protected and cannot be modified from the current layer. |
| extension not allowed by parent | This entity does not allow downstream extension. |

### 15.4 Storage validations

| Rule | Message |
|---|---|
| storageStrategy is missing | Storage strategy is required. |
| tableName is missing for physical_table | Table name is required for physical table storage. |
| tableName contains invalid characters | Table name must use lowercase letters, numbers, and underscores only. |
| tableName already exists | Table name already exists. |
| primaryKeyStrategy is missing | Primary key strategy is required. |
| primaryKeyStrategy is composite without composite definition | Composite primary key definition is required. |
| Ledger-like entity uses soft delete policy | Ledger-like entities cannot use soft delete policy. |

### 15.5 Lifecycle validations

| Rule | Message |
|---|---|
| recordLifecycleModelId missing for Transaction | Record lifecycle model is required for Transaction entities. |
| recordLifecycleModelId missing for Ledger-like | Record lifecycle model is required for Ledger-like entities. |
| activation attempted with compile errors | Entity cannot be activated because compile errors exist. |
| direct Active to Retired transition attempted | Entity must be deprecated before retirement. |
| Retired to Active transition attempted | Retired entities cannot be reactivated. Create a new version. |

### 15.6 Display validations

| Rule | Message |
|---|---|
| defaultDisplayFieldId missing before activation | Default display field is required before activation. |
| defaultDisplayFieldId references inactive field | Default display field must reference an active field. |
| defaultListViewId missing for UI-enabled entity | Default list view is required before activation. |
| defaultFormViewId missing for UI-enabled entity | Default form view is required before activation. |
| lookupEligible entity missing defaultLookupViewId | Default lookup view is required for lookup eligible entities. |

---

## 16. Metadata Compiler Requirements

Before EntityDefinition can move from Draft to Active, the Metadata Compiler shall validate:

| Area | Required Check |
|---|---|
| Identity | API name is valid and unique. |
| Classification | Entity category and business object type are compatible. |
| Ownership | Current user has permission to activate metadata in owning layer. |
| Storage | Storage strategy and table name are valid. |
| Fields | Required system fields exist and are active. |
| Relationships | Relationship references point to active target entities. |
| Views | Default list and form views exist when UI-enabled. |
| Lookup | Default lookup view exists when lookup eligible. |
| Actions | Standard actions can be computed for category. |
| Lifecycle | Required record lifecycle model exists. |
| Security | Security policy exists and at least one admin role can manage the entity. |
| API | API exposure policy is valid. |
| Audit | Audit policy is valid. |
| Dependency | Activation does not break active downstream metadata. |
| Version | New active version can be created. |

Compiler output shall include:

```json
{
  "status": "error",
  "errors": [
    {
      "code": "ENTITY_DEFAULT_DISPLAY_FIELD_MISSING",
      "message": "Default display field is required before activation.",
      "section": "display",
      "severity": "blocking"
    }
  ],
  "warnings": [],
  "readyForActivation": false
}
```

---

## 17. Runtime Resolver Requirements

The Runtime Resolver shall resolve EntityDefinition for a specific runtime context.

Input context:

```json
{
  "entityApiName": "service_job_card",
  "tenantId": "tenant_abc",
  "nodeId": "node_mumbai",
  "userId": "usr_123",
  "roleIds": ["role_service_advisor"],
  "locale": "en-IN",
  "channel": "web",
  "recordState": "Open"
}
```

Output shall include resolved:

- Entity identity.
- Active metadata version.
- Available fields.
- Available relationships.
- Available views.
- Available actions.
- Effective permissions.
- Effective runtime policies.
- Blocking runtime messages.

EntityDefinition output shall never expose metadata that the requesting user is not allowed to inspect.

---

## 18. API Requirements

### 18.1 Create EntityDefinition

`POST /metadata/entities`

Purpose: Create EntityDefinition in Draft status.

Request body shall contain minimum required identity, classification, ownership, storage, and runtime policy data.

Response shall return created EntityDefinition with generated `entityId`, `metadataStatus = Draft`, and `versionId`.

### 18.2 Get EntityDefinition

`GET /metadata/entities/{entityId}`

Purpose: Retrieve admin metadata view.

Access shall require metadata read permission.

### 18.3 Update EntityDefinition

`PATCH /metadata/entities/{entityId}`

Purpose: Update draft or editable fields.

Rules:

- Activated immutable fields shall reject modification.
- Protected metadata shall require governance permission.
- Change reason shall be required when changing protected, active, deprecated, or policy-sensitive metadata.

### 18.4 Validate EntityDefinition

`POST /metadata/entities/{entityId}/validate`

Purpose: Run compiler checks without activation.

Response shall return errors, warnings, and readiness status.

### 18.5 Activate EntityDefinition

`POST /metadata/entities/{entityId}/activate`

Purpose: Compile and activate EntityDefinition.

Rules:

- Blocking compiler errors shall prevent activation.
- Activation shall create an active VersionDefinition.
- Activation shall write metadata audit log.
- Activation shall publish resolved metadata to runtime registry.

### 18.6 Deprecate EntityDefinition

`POST /metadata/entities/{entityId}/deprecate`

Purpose: Mark entity metadata as deprecated.

Rules:

- Deprecation reason shall be required.
- Dependency analysis shall run before deprecation.
- New metadata references shall be blocked after deprecation.

### 18.7 Retire EntityDefinition

`POST /metadata/entities/{entityId}/retire`

Purpose: Retire entity metadata.

Rules:

- Entity must be Deprecated.
- Active record creation shall be blocked after retirement.
- Existing record access shall follow security and retention policy.

### 18.8 Resolve Runtime Entity Metadata

`POST /runtime/metadata/entities/{apiName}/resolve`

Purpose: Return runtime-resolved metadata for UI/API consumption.

Response shall be filtered by tenant, node, role, user, channel, locale, and record state.

---

## 19. User Stories and Acceptance Criteria

### Feature: EntityDefinition Metadata Foundation

#### User Story 1: Create EntityDefinition from template

As a platform admin, I want to create an entity from a predefined template so that I can start with governed business metadata instead of manually configuring everything.

Acceptance Criteria:

- Given a user selects a valid template, when the entity is created, then the system creates EntityDefinition in Draft status.
- Given the template defines category, domain, storage, lifecycle, and policies, when the entity is created, then those defaults are copied into EntityDefinition.
- Given the template creates system fields, when creation completes, then FieldDefinition records are created separately.
- Given the entity is created, when the user opens Schema Builder, then the entity context bar shows Draft status.
- Given required identity fields are missing, when the user submits creation, then the system blocks creation and shows validation messages.

Negative Scenarios:

- If API name already exists in the namespace, the system shall block creation.
- If selected template is inactive, the system shall block creation.
- If user lacks permission for the owning layer, the system shall block creation.

---

#### User Story 2: Create blank EntityDefinition

As an architect, I want to create a blank entity so that I can define a business object that does not fit existing templates.

Acceptance Criteria:

- Given the user selects blank creation, when the wizard opens, then the system requires identity, classification, ownership, storage, and runtime policies.
- Given required fields are valid, when the entity is created, then the entity is created in Draft status.
- Given the entity is blank, when created, then only required system fields are generated.
- Given the entity is blank, when activation is attempted without default display field, default list view, and default form view, then activation is blocked.

Negative Scenarios:

- If category is missing, creation is blocked.
- If storage strategy is missing, creation is blocked.
- If table name is invalid for physical table storage, creation is blocked.

---

#### User Story 3: Extend existing EntityDefinition

As a tenant admin, I want to extend an existing platform or vertical entity so that I can add tenant-specific metadata without modifying the base entity.

Acceptance Criteria:

- Given the parent entity allows extension, when the user creates an extension, then the system creates layer-specific metadata.
- Given the parent entity has protected fields, when viewed from tenant layer, then protected metadata is read-only.
- Given the tenant adds fields, when metadata is resolved, then runtime metadata includes parent fields plus tenant extension fields.
- Given the parent entity blocks extension, when the user attempts extension, then the system blocks the action.

Negative Scenarios:

- If current layer has no extension permission, extension is blocked.
- If parent entity is Deprecated or Retired, extension is blocked unless governance policy explicitly allows it.
- If extension attempts to relax protected requiredness, the system blocks it unless parent policy allows requiredness relaxation.

---

#### User Story 4: Validate EntityDefinition before activation

As an admin, I want the system to validate EntityDefinition before activation so that broken metadata does not enter runtime.

Acceptance Criteria:

- Given EntityDefinition is in Draft status, when validate is triggered, then compiler checks all required metadata sections.
- Given validation passes, when results are shown, then status is Pass and readyForActivation is true.
- Given blocking errors exist, when results are shown, then each error includes code, message, section, and severity.
- Given warnings exist but no errors exist, when results are shown, then activation is allowed with warnings.

Negative Scenarios:

- If default display field is missing, activation is blocked.
- If referenced lifecycle model does not exist, activation is blocked.
- If storage table name is invalid, activation is blocked.
- If security policy does not allow any admin to manage entity, activation is blocked.

---

#### User Story 5: Activate EntityDefinition

As a platform admin, I want to activate EntityDefinition so that the entity becomes available for runtime use.

Acceptance Criteria:

- Given compiler passes, when user activates entity, then metadataStatus changes to Active.
- Given activation succeeds, then active VersionDefinition is created.
- Given activation succeeds, then runtime metadata is published to runtime registry.
- Given activation succeeds, then audit log captures user, timestamp, previous status, new status, and change reason.
- Given activation succeeds, then immutable fields such as apiName, namespace, entityCategory, storageStrategy, tableName, and primaryKeyStrategy become locked.

Negative Scenarios:

- If compiler has blocking errors, activation is blocked.
- If user lacks activation permission, activation is blocked.
- If another active entity already has same API name and namespace, activation is blocked.

---

#### User Story 6: Deprecate EntityDefinition

As an architect, I want to deprecate an entity so that it is not used for new configuration while existing records remain safe.

Acceptance Criteria:

- Given entity is Active, when user deprecates it, then system requires deprecation reason.
- Given deprecation is confirmed, then metadataStatus changes to Deprecated.
- Given entity is Deprecated, then new metadata references to it are blocked.
- Given entity has existing records, then existing record read access continues based on security policy.
- Given entity has active dependencies, then dependency report is shown before confirmation.

Negative Scenarios:

- If user does not provide reason, deprecation is blocked.
- If dependency analysis has blocking issues, deprecation is blocked.
- If user lacks governance permission, deprecation is blocked.

---

#### User Story 7: Retire EntityDefinition

As an architect, I want to retire deprecated entity metadata so that new record creation is blocked while historical records remain available.

Acceptance Criteria:

- Given entity is Deprecated, when user retires it, then metadataStatus changes to Retired.
- Given entity is Retired, then new record creation is blocked.
- Given existing records exist, then records remain readable according to retention and security policies.
- Given retirement succeeds, then audit log captures user, timestamp, and reason.

Negative Scenarios:

- If entity is Active, retirement is blocked.
- If user lacks retirement permission, retirement is blocked.
- If retention policy is missing for compliance-sensitive entity, retirement is blocked.

---

## 20. Non-Functional Requirements

| Requirement Area | Requirement |
|---|---|
| Performance | Runtime metadata resolution should return within 300 ms for cached active metadata. |
| Auditability | Every create, update, activate, deprecate, retire, and policy change shall be audited. |
| Traceability | Each active EntityDefinition shall reference an active VersionDefinition. |
| Security | Runtime metadata response shall exclude unauthorized metadata. |
| Compatibility | API name and namespace shall remain stable after activation. |
| Scalability | Metadata model shall support platform, vertical, tenant, and node overlays. |
| Reliability | Activation shall be atomic. Metadata shall not partially activate. |
| Recoverability | Active metadata version shall be restorable through rollback design in VersionDefinition. |
| Database Safety | Generated PostgreSQL DDL shall be reviewed or executed through controlled migration service. |
| Extensibility | Additional metadata attributes shall be allowed through controlled JSONB extension without breaking schema. |

---

## 21. Implementation Notes for AI Developer

### 21.1 Recommended service components

Implement these services:

| Service | Responsibility |
|---|---|
| EntityMetadataService | CRUD operations for EntityDefinition. |
| EntityValidationService | Field-level and cross-section validation. |
| MetadataCompilerService | Activation checks and resolved metadata generation. |
| MetadataVersionService | Draft and active version management. |
| MetadataDependencyService | Dependency analysis. |
| RuntimeMetadataResolver | Tenant, node, role, user, locale, channel, and record-state resolution. |
| MetadataAuditService | Audit trail for metadata changes. |

### 21.2 Recommended architecture rule

Do not let UI directly read raw metadata tables for runtime screens.

Runtime screens shall consume only resolved runtime contracts from RuntimeMetadataResolver.

### 21.3 Recommended database rule

Do not create or alter business runtime tables directly inside EntityMetadataService.

DDL generation and execution shall be handled by a migration service that can:

- Generate DDL.
- Validate DDL.
- Preview DDL.
- Execute DDL.
- Audit DDL.
- Roll back failed DDL when possible.

### 21.4 Recommended caching rule

Active compiled metadata shall be cacheable using:

- entityId
- apiName
- namespace
- tenantId
- nodeId
- role set hash
- locale
- channel
- metadataVersion

Cache shall be invalidated when active metadata version changes.

---

## 22. Required Error Codes

| Code | Message |
|---|---|
| ENTITY_LABEL_REQUIRED | Entity label is required. |
| ENTITY_LABEL_TOO_SHORT | Entity label must contain at least 2 characters. |
| ENTITY_API_NAME_REQUIRED | API name is required. |
| ENTITY_API_NAME_INVALID | API name must use lowercase letters, numbers, and underscores only. |
| ENTITY_API_NAME_DUPLICATE | API name already exists in this namespace. |
| ENTITY_API_NAME_LOCKED | API name cannot be changed after activation. |
| ENTITY_CATEGORY_REQUIRED | Entity category is required. |
| ENTITY_CATEGORY_INVALID | Selected entity category is not supported. |
| ENTITY_BUSINESS_OBJECT_TYPE_REQUIRED | Business object type is required. |
| ENTITY_LAYER_ROLE_NOT_ALLOWED | Role cannot own entity schema. |
| ENTITY_STORAGE_STRATEGY_REQUIRED | Storage strategy is required. |
| ENTITY_TABLE_NAME_REQUIRED | Table name is required for physical table storage. |
| ENTITY_TABLE_NAME_INVALID | Table name must use lowercase letters, numbers, and underscores only. |
| ENTITY_LEDGER_DELETE_NOT_ALLOWED | Ledger-like entities cannot allow delete. Use reversal or counter-entry. |
| ENTITY_LIFECYCLE_REQUIRED | Record lifecycle model is required for this entity category. |
| ENTITY_DISPLAY_FIELD_REQUIRED | Default display field is required before activation. |
| ENTITY_DEFAULT_LIST_VIEW_REQUIRED | Default list view is required before activation. |
| ENTITY_DEFAULT_FORM_VIEW_REQUIRED | Default form view is required before activation. |
| ENTITY_LOOKUP_VIEW_REQUIRED | Default lookup view is required for lookup eligible entities. |
| ENTITY_COMPILE_ERRORS_EXIST | Entity cannot be activated because compile errors exist. |
| ENTITY_RETIRE_ACTIVE_NOT_ALLOWED | Entity must be deprecated before retirement. |
| ENTITY_REACTIVATE_RETIRED_NOT_ALLOWED | Retired entities cannot be reactivated. Create a new version. |
| ENTITY_EXTENSION_NOT_ALLOWED | This entity does not allow downstream extension. |
| ENTITY_PROTECTED_MODIFICATION_BLOCKED | This entity is protected and cannot be modified from the current layer. |

---

## 23. MVP Implementation Checklist

### 23.1 Must implement now

- EntityDefinition table.
- EntityDefinition create API.
- EntityDefinition read API.
- EntityDefinition update API.
- EntityDefinition validate API.
- EntityDefinition activate API.
- EntityDefinition deprecate API.
- EntityDefinition retire API.
- EntityDefinition metadata lifecycle.
- Identity validation.
- Classification validation.
- Ownership validation.
- Storage validation.
- Display validation.
- Runtime policy reference validation.
- Compiler readiness result.
- Metadata audit log.
- Active version creation on activation.
- Immutable field locking after activation.

### 23.2 Must design now, implementation can be staged

- PackageDefinition linkage.
- Dependency graph.
- Runtime metadata contract.
- Migration service.
- Rollback through VersionDefinition.
- Tenant and node overlay resolution.
- Role-based runtime metadata filtering.
- Localization policy.
- Data retention policy.

### 23.3 Should not implement inside EntityDefinition

- Field datatype mapping.
- UI component rendering.
- Validation rule expression engine.
- Workflow transition engine.
- Permission evaluation engine.
- API execution engine.
- Report builder.
- AI schema generation.

EntityDefinition shall reference these components and policies. It shall not execute them.

---

## 24. Sample EntityDefinition Records

### 24.1 Customer Master

```json
{
  "entityId": "ent_customer",
  "apiName": "customer",
  "label": "Customer",
  "pluralLabel": "Customers",
  "namespace": "crm_core",
  "classification": {
    "domain": "CRM",
    "module": "Customer Management",
    "entityCategory": "Master Data",
    "businessObjectType": "Party Master",
    "industryVertical": "Core",
    "lookupEligible": true
  },
  "storage": {
    "storageStrategy": "physical_table",
    "tableName": "mst_customer",
    "primaryKeyField": "id",
    "primaryKeyStrategy": "uuid",
    "tenantScoped": true,
    "nodeScoped": false
  },
  "lifecycle": {
    "metadataStatus": "Draft",
    "recordLifecycleModelId": "lifecycle_master_active_inactive"
  }
}
```

### 24.2 Service Job Card

```json
{
  "entityId": "ent_service_job_card",
  "apiName": "service_job_card",
  "label": "Service Job Card",
  "pluralLabel": "Service Job Cards",
  "namespace": "auto_service",
  "classification": {
    "domain": "Service",
    "module": "Workshop Management",
    "entityCategory": "Transaction",
    "businessObjectType": "Operational Document",
    "industryVertical": "Automobile",
    "lookupEligible": false
  },
  "storage": {
    "storageStrategy": "physical_table",
    "tableName": "txn_service_job_card",
    "primaryKeyField": "id",
    "primaryKeyStrategy": "uuid",
    "tenantScoped": true,
    "nodeScoped": true
  },
  "lifecycle": {
    "metadataStatus": "Draft",
    "recordLifecycleModelId": "lifecycle_service_job_card"
  }
}
```

### 24.3 Journal Entry

```json
{
  "entityId": "ent_journal_entry",
  "apiName": "journal_entry",
  "label": "Journal Entry",
  "pluralLabel": "Journal Entries",
  "namespace": "finance_core",
  "classification": {
    "domain": "Finance",
    "module": "General Ledger",
    "entityCategory": "Ledger-like",
    "businessObjectType": "Accounting Entry",
    "industryVertical": "Core",
    "lookupEligible": false
  },
  "storage": {
    "storageStrategy": "physical_table",
    "tableName": "fin_journal_entry",
    "primaryKeyField": "id",
    "primaryKeyStrategy": "uuid",
    "tenantScoped": true,
    "nodeScoped": true,
    "softDeletePolicyId": null
  },
  "lifecycle": {
    "metadataStatus": "Draft",
    "recordLifecycleModelId": "lifecycle_journal_entry_posting"
  }
}
```

---

## 25. Development Guardrails

The developer shall follow these guardrails:

1. Do not hardcode business entity names in the EntityDefinition service.
2. Do not let Role own schema metadata.
3. Do not allow API name changes after activation.
4. Do not allow Ledger-like entities to use delete policy.
5. Do not store child metadata inline inside EntityDefinition.
6. Do not expose raw admin metadata to runtime UI.
7. Do not let UI bypass compiler validation.
8. Do not create PostgreSQL DDL from UI directly without migration service.
9. Do not use PostgreSQL ENUM for business-configurable dropdowns.
10. Do not use floating-point types for financial amounts.
11. Do not use document number as primary key.
12. Do not mix metadata lifecycle with record lifecycle.
13. Do not treat hidden UI fields as security.
14. Do not activate metadata if required runtime policies are missing.

---

## 26. Reference Architecture Inputs

This requirement document is based on:

1. Current iDMS Admin Studio Entity Designer functional specification.
2. Salesforce metadata platform pattern where objects, fields, layouts, permissions, packages, and runtime UI metadata are modeled as separate but related metadata capabilities.
3. PostgreSQL storage capabilities including native UUID, numeric, timestamp, and JSONB support.
4. iDMS architectural direction to support Platform, Vertical, Tenant, and Node-level metadata customization.
5. Product decision that Role should affect security and experience, not schema ownership.

---

## 27. Final Implementation Summary

EntityDefinition shall become the root metadata object for iDMS business entities.

It shall define:

- What the entity is.
- Which business domain it belongs to.
- Which category-driven behavior applies.
- Which layer and package own it.
- How records are stored at entity level.
- Which lifecycle model governs records.
- Which policies govern audit, security, API, import, export, analytics, search, and localization.
- Which default display and runtime views apply.
- Which metadata lifecycle state is active.
- Which version is published.
- Which governance rules control downstream extension.

EntityDefinition shall not define:

- Field-level datatypes.
- UI controls.
- Field validations.
- Relationship cardinality details.
- View layouts.
- Action execution logic.
- Security evaluation logic.
- API execution logic.

Those shall be defined by dedicated metadata objects and resolved at runtime through the Metadata Compiler and Runtime Metadata Resolver.

This separation is mandatory for building Entity Designer as a metadata platform rather than a form builder.
