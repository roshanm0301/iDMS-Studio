# iDMS Admin Studio — FieldDefinition Requirement Document

**Document Type:** Functional Requirement and Implementation Specification  
**Module:** Entity Designer  
**Metadata Object:** FieldDefinition  
**Target Audience:** AI Developer, Product Owner, Solution Architect, Backend Developer, Frontend Developer, QA  
**Status:** Frozen for Implementation Baseline  
**Version:** 1.0  
**Date:** 2026-05-11  

---

## 1. Purpose

This document defines the required architecture, behavior, validation rules, metadata structure, and implementation expectations for **FieldDefinition** in iDMS Admin Studio.

FieldDefinition is the metadata object that defines a field belonging to an EntityDefinition. It must describe the business meaning of the field, the platform logical data type, the PostgreSQL storage mapping, default UI rendering guidance, governance controls, lifecycle state, and integration participation.

This document is implementation-ready. The developer must not infer missing behavior from UI assumptions. Any behavior not defined in this document must be treated as out of scope unless explicitly added in a future version.

---

## 2. Background

The current Entity Designer implementation supports field creation and management using catalog fields and local custom fields. It also supports multiple field types, behavior settings, governance controls, lifecycle states, overlay operations, data classification, display formats, dependency tracking, and storage type classification.

The next architecture step is to freeze FieldDefinition as a stable metadata object so that the platform can safely support:

- Entity schema design
- PostgreSQL schema generation
- Runtime UI rendering
- API input and output contracts
- Import and export contracts
- Security and masking
- Validation and rule binding
- Layer-based extension
- Dependency and impact analysis
- Package and version management

---

## 3. Core Product Decision

FieldDefinition must not be treated as a simple UI field configuration.

FieldDefinition is a governed metadata contract.

The following boundary is frozen:

| Concern | Owner |
|---|---|
| Business meaning of the field | FieldDefinition |
| Platform logical data type | FieldDefinition |
| PostgreSQL physical storage mapping | FieldDefinition.storage |
| Default UI control recommendation | FieldDefinition.uiDefaults |
| Actual UI placement and rendering per screen | ViewDefinition |
| Role-based access and security enforcement | SecurityDefinition |
| Conditional business validation | ValidationRuleDefinition |
| Conditional UI show, hide, lock, unlock, and defaulting | UIReactionRuleDefinition |
| Relationship cardinality and delete behavior | RelationshipDefinition |
| Integration input and output contract variations | IntegrationContractDefinition |
| Analytics semantic usage | AnalyticsContractDefinition |

The developer must keep this separation. Do not add conditional business rules, role-specific access decisions, screen layout placement, and relationship lifecycle behavior directly inside FieldDefinition.

---

## 4. Scope

### 4.1 In Scope

This implementation must support:

1. Field identity metadata
2. Field source metadata
3. Business type and logical data type separation
4. PostgreSQL storage metadata
5. Default UI control metadata
6. Type-specific configuration
7. Field behavior metadata
8. Field governance metadata
9. Import, export, and API participation metadata
10. Search, filter, sort, and lookup display participation
11. Field lifecycle management
12. Field overlay policy
13. Field dependency tracking hooks
14. Field compile-readiness validations
15. FieldDefinition create, update, read, activate, disable, deprecate, and dependency-check operations
16. Sample runtime contract output for resolved fields
17. Acceptance criteria and negative scenarios

### 4.2 Out of Scope

The following are not part of this FieldDefinition implementation baseline:

1. Full visual layout designer
2. Cross-field validation expression builder
3. Full UI reaction engine
4. Complete relationship modeling
5. Full package installation and upgrade engine
6. Physical field deletion from production tables
7. Full multilingual translation workbench
8. Advanced analytics semantic modeling
9. Field-level encryption engine
10. Complete data migration engine

The metadata model must be designed so these capabilities can be added later without breaking the baseline design.

---

## 5. Definitions

| Term | Definition |
|---|---|
| FieldDefinition | Metadata record that defines one field belonging to an entity. |
| Business Type | Business meaning of the field, such as GSTIN, VIN, Invoice Amount, Customer Reference. |
| Logical Data Type | Platform-level data type independent of PostgreSQL and UI, such as text, currency, date, entity_reference. |
| Physical Data Type | PostgreSQL-specific storage type, such as varchar, numeric, uuid, date, timestamptz, jsonb. |
| UI Control Type | Frontend component used to render or capture a field, such as text input, date picker, currency input, lookup autocomplete. |
| View Field | Field configuration inside a specific view. It controls placement, width, section, and view-specific control. |
| Catalog Field | Reusable pre-governed field definition available from the shared attribute catalog. |
| Local Field | Custom field created only for the selected entity. |
| System Field | Platform-owned field created automatically by the system. |
| Inherited Field | Field inherited from a higher layer or base entity. |
| Overlay | Controlled modification of inherited metadata by a downstream layer. |
| Compile Readiness | Validation state that determines whether a field and its parent entity can be activated. |
| Runtime Resolver | Service that returns resolved metadata based on tenant, node, role, user, locale, channel, and record state. |

---

## 6. Architecture Principles

### 6.1 FieldDefinition Defines Data, Not Screen Layout

FieldDefinition must define what the data is. ViewDefinition must define how the data appears in a specific screen.

Example:

- FieldDefinition says `status` is an enum backed by a lifecycle state code.
- List View says `status` is rendered as a status chip.
- Form View says `status` is rendered as a dropdown when editable.
- Print View says `status` is rendered as plain text.

### 6.2 Business Type, Logical Type, PostgreSQL Type, and UI Control Must Be Separate

The system must maintain four distinct layers.

```text
Business Type
   ↓
Logical Data Type
   ↓
PostgreSQL Physical Data Type
   ↓
Default UI Control Type
```

Example:

```text
GSTIN
   ↓
text_identifier
   ↓
varchar(15)
   ↓
uppercase_text_input
```

Example:

```text
Customer Reference
   ↓
entity_reference
   ↓
uuid
   ↓
autocomplete_lookup
```

Example:

```text
Invoice Amount
   ↓
currency
   ↓
numeric(18,2)
   ↓
currency_input
```

### 6.3 PostgreSQL Type Must Be Derived by Default

Business users and functional consultants must not be required to select PostgreSQL types.

The system must derive the recommended PostgreSQL storage mapping from the logical data type and type configuration. Architect mode may allow limited override before field activation.

### 6.4 FieldDefinition Must Not Store Conditional Business Rules

FieldDefinition can define simple field-level configuration such as regex, min value, max value, precision, scale, required on create, and read-only after create.

FieldDefinition must not store complex conditional logic such as:

- GSTIN is mandatory when Customer Type is Registered Business.
- Discount Percent is mandatory when Discount Type is Percentage.
- Invoice Date cannot be before Delivery Date.
- Closing a Job Card is blocked when pending part issue exists.

These rules must be stored in ValidationRuleDefinition.

### 6.5 UI Visibility Is Not Security

FieldDefinition can define default visibility and masking. It must not be treated as final security enforcement.

The final field access decision must come from SecurityDefinition and Runtime Resolver.

### 6.6 Physical Field Deletion Must Not Be Allowed from Entity Designer

A field that has been activated must not be physically removed through normal Entity Designer actions.

Physical deletion requires a migration-governed process outside this baseline.

---

## 7. FieldDefinition Metadata Object

### 7.1 High-Level Structure

```json
{
  "fieldId": "fld_customer_gstin",
  "entityId": "ent_customer",
  "apiName": "gstin_number",
  "label": "GSTIN Number",
  "description": "Goods and Services Tax Identification Number for registered business customers.",
  "source": {},
  "typing": {},
  "storage": {},
  "typeConfig": {},
  "behavior": {},
  "uiDefaults": {},
  "governance": {},
  "integration": {},
  "analytics": {},
  "lifecycle": {},
  "overlayPolicy": {},
  "dependencySummary": {},
  "audit": {}
}
```

---

## 8. FieldDefinition Sections and Field Specification

### 8.1 Identity

| Field | Type | Required | Editable After Activation | Description | Validation |
|---|---:|---:|---:|---|---|
| fieldId | string | Yes | No | Internal immutable ID. | Generated by system. Must be unique globally. |
| entityId | string | Yes | No | Parent EntityDefinition ID. | Must reference an existing entity. |
| apiName | string | Yes | No | Stable technical name used in APIs, rules, imports, and storage mapping. | Snake case. Starts with alphabet. Allows lowercase letters, numbers, underscore. Max 63 chars. Unique within entity. |
| label | string | Yes | Yes | User-facing field label. | Min 2 chars. Max 100 chars. |
| description | string | No | Yes | Business explanation of the field. | Max 500 chars. |
| namespace | string | No | No | Owning package or module namespace. | Required for package-owned fields. |
| helpText | string | No | Yes | Tooltip or inline guidance for users. | Max 500 chars. |

#### Validation Messages

| Scenario | Message |
|---|---|
| apiName missing | Field API name is required. |
| apiName invalid | Field API name must use lowercase letters, numbers, and underscores, and must start with a letter. |
| apiName duplicate | Field API name already exists for this entity. |
| label missing | Field label is required. |
| entityId invalid | Parent entity does not exist. |

---

### 8.2 Source

| Field | Type | Required | Description |
|---|---:|---:|---|
| sourceType | enum | Yes | Field source. Allowed values: system, catalog, local, inherited. |
| catalogFieldId | string | Conditional | Required when sourceType is catalog. |
| presetCode | string | Conditional | Optional preset code such as INDIA_GSTIN, INDIA_PAN, VIN. |
| inheritedFromFieldId | string | Conditional | Required when sourceType is inherited. |
| createdByLayer | enum | Yes | Platform, Vertical, Tenant, Node. Role is not allowed. |
| createdByPackageId | string | Conditional | Required when the field is package-owned. |

#### Rules

1. `sourceType = system` fields must be protected by default.
2. `sourceType = inherited` fields must not allow direct storage mapping changes in the child layer.
3. `sourceType = catalog` must copy the preset configuration into the field metadata at creation time and retain catalog lineage.
4. `sourceType = local` must require explicit typing, storage derivation, and governance settings.

---

### 8.3 Typing

| Field | Type | Required | Description |
|---|---:|---:|---|
| businessType | string | Yes | Business meaning of the field. Examples: gstin, pan, vin, money_amount, customer_reference. |
| logicalDataType | enum | Yes | Platform-level type. |
| dataSubType | string | No | Optional subtype. Example: indian_mobile, hsn_code, sac_code. |
| valueSourceType | enum | Conditional | Required for enum, multi_enum, and entity_reference. |
| valueSourceId | string | Conditional | Picklist ID, master entity ID, lifecycle model ID, or relationship ID. |

#### MVP Logical Data Types

| Logical Data Type | Description |
|---|---|
| text | Short or medium text. |
| long_text | Long remarks and descriptions. |
| text_identifier | Identifier with strict format, such as GSTIN, PAN, VIN. |
| integer | Whole number. |
| decimal | Exact numeric value. |
| currency | Monetary amount. |
| percentage | Percentage value. |
| boolean | True and false value. |
| date | Business date without time. |
| datetime | Timestamp with timezone semantics. |
| time | Time of day. |
| enum | Single-select coded value. |
| multi_enum | Multi-select coded values. |
| entity_reference | Reference to another entity record. |
| file_reference | Reference to file metadata. |
| json | Structured flexible JSON data. |
| auto_number | Generated business identifier. |
| computed | Derived value. |

#### Later Logical Data Types

| Logical Data Type | Reason Deferred |
|---|---|
| rollup | Requires relationship model and aggregation strategy. |
| rich_text | Requires sanitization and rendering policy. |
| geo_point | Requires map and geo-index strategy. |
| signature | Requires media storage and legal acceptance policy. |
| barcode | Requires scanning and format support. |
| rating | Simple to build, but not core. |
| polymorphic_reference | Requires advanced relationship resolution. |
| grid | Requires child schema and persistence strategy. |
| collection | Requires complex nested data model. |

---

### 8.4 PostgreSQL Storage

| Field | Type | Required | Description |
|---|---:|---:|---|
| storageStrategy | enum | Yes | physical_column, extension_column, jsonb_extension, virtual, persisted_computed, external. |
| tableName | string | Conditional | Required for physical_column and extension_column. |
| columnName | string | Conditional | Required for physical_column and extension_column. |
| pgDataType | enum | Conditional | PostgreSQL storage type. |
| length | number | Conditional | Required for varchar. |
| precision | number | Conditional | Required for numeric when scale is defined. |
| scale | number | Conditional | Required for decimal, currency, percentage. |
| nullable | boolean | Yes | Whether database column allows null. |
| defaultDbValue | string | No | Database-level default, only for safe technical defaults. |
| indexPolicy | enum | No | none, standard_index, unique_index, gin_index, expression_index. |
| generatedExpression | string | Conditional | Required for persisted_computed when implemented using generated column. |

#### Storage Strategy Rules

| Strategy | Rule |
|---|---|
| physical_column | Used for platform and vertical fields that are important for transactions, reports, rules, search, joins, and compliance. |
| extension_column | Used for promoted tenant fields that require reporting, validation, search, and indexing. |
| jsonb_extension | Used for low-risk custom extension fields that are not core to reporting, posting, integrations, and compliance. |
| virtual | Used for computed fields that are calculated at runtime and not stored. |
| persisted_computed | Used for computed fields that need persisted value for performance. |
| external | Used when the entity reads field values from an external source and does not own storage. |

#### PostgreSQL Mapping Table

| Logical Data Type | Default PostgreSQL Type | Notes |
|---|---|---|
| text | text or varchar(n) | Use varchar only when a real business length exists. |
| long_text | text | Used for remarks and descriptions. |
| text_identifier | varchar(n) | Required length should come from business type. |
| integer | integer or bigint | Use bigint for high-volume counters. |
| decimal | numeric(p,s) | Exact decimal. |
| currency | numeric(18,2) | Scale can be overridden by currency policy. |
| percentage | numeric(7,4) | Store percentage consistently using platform convention. |
| boolean | boolean | Null allowed only when business requires unknown state. |
| date | date | Used for business dates. |
| datetime | timestamptz | Used for timestamps that need timezone correctness. |
| time | time | Used for time of day. |
| enum | varchar(50) or uuid | Use code value or picklist value ID. |
| multi_enum | junction table or jsonb | Junction table is preferred when queryability matters. |
| entity_reference | uuid | Must link to RelationshipDefinition. |
| file_reference | uuid | References file metadata table. |
| json | jsonb | Used for flexible structured data. |
| auto_number | varchar(n) | Generated by numbering service. |
| computed | none, generated column, or stored column | Depends on computation strategy. |

#### Storage Validation Messages

| Scenario | Message |
|---|---|
| columnName duplicate | Column name already exists for this entity storage table. |
| pgDataType missing | PostgreSQL data type is required for physical storage. |
| precision missing | Precision is required for numeric storage. |
| scale greater than precision | Scale cannot be greater than precision. |
| invalid jsonb usage | JSONB extension is not allowed for financial, compliance, posting, search-critical, or integration-key fields. |
| physical change after activation | Physical storage changes require a migration workflow. |

---

### 8.5 Type Configuration

Type configuration depends on logicalDataType.

#### Text and Text Identifier

| Config | Type | Description |
|---|---:|---|
| minLength | number | Minimum character count. |
| maxLength | number | Maximum character count. |
| regex | string | Validation pattern. |
| trim | boolean | Remove leading and trailing spaces. |
| uppercase | boolean | Convert input to uppercase. |
| lowercase | boolean | Convert input to lowercase. |

Rule: uppercase and lowercase must not both be true.

#### Number, Decimal, Currency, Percentage

| Config | Type | Description |
|---|---:|---|
| minValue | number | Minimum allowed value. |
| maxValue | number | Maximum allowed value. |
| allowNegative | boolean | Whether negative values are allowed. |
| precision | number | Total digits for decimal storage. |
| scale | number | Digits after decimal. |
| roundingMode | enum | half_up, half_even, truncate. |
| currencySource | enum | tenant_default, fixed, field_reference, lookup. |
| fixedCurrencyCode | string | Required when currencySource is fixed. |

#### Date, DateTime, Time

| Config | Type | Description |
|---|---:|---|
| minDate | date | Minimum date. |
| maxDate | date | Maximum date. |
| allowPast | boolean | Whether past dates are allowed. |
| allowFuture | boolean | Whether future dates are allowed. |
| timezoneMode | enum | user, tenant, utc. |
| stepMinutes | number | Time interval. |

#### Enum and Multi Enum

| Config | Type | Description |
|---|---:|---|
| valueSourceType | enum | static_picklist, picklist_master, lifecycle_state, external_source. |
| picklistCode | string | Required for picklist-backed field. |
| allowInactiveValuesOnExistingRecords | boolean | Existing records may retain inactive values. |
| allowCustomValue | boolean | Must default to false. |
| dependentOnFieldId | string | Optional dependency field. |

Rule: Do not use PostgreSQL ENUM for business dropdowns in the MVP.

#### Entity Reference

| Config | Type | Description |
|---|---:|---|
| relationshipId | string | Required. |
| targetEntityId | string | Required through relationship. |
| displayFieldId | string | Default target display field. |
| lookupViewId | string | Default lookup view. |
| filterPolicyId | string | Optional selectable-record filter. |
| allowCreateFromLookup | boolean | Whether user can create target record from lookup. |

Rule: FieldDefinition must not store full cardinality and delete behavior. Those belong to RelationshipDefinition.

#### File Reference

| Config | Type | Description |
|---|---:|---|
| allowedFileTypes | array | Allowed file extensions or MIME types. |
| maxFileSizeMb | number | Maximum file size. |
| allowMultiple | boolean | Whether multiple files are allowed. |
| storageProviderPolicyId | string | File storage provider policy. |

#### Auto Number

| Config | Type | Description |
|---|---:|---|
| numberingStrategyId | string | Required. |
| prefix | string | Optional fallback prefix. |
| padding | number | Number padding. |
| resetPolicy | enum | never, financial_year, calendar_year, tenant, node. |

Rule: Auto number must be generated by the numbering service and not by direct user entry.

#### Computed

| Config | Type | Description |
|---|---:|---|
| computationMode | enum | formula_engine, database_generated, service_computed. |
| expressionId | string | Required for formula engine mode. |
| dependencies | array | Referenced fields. |
| persistValue | boolean | Whether value is stored. |

Rule: Computed fields are read-only by default.

---

### 8.6 Behavior

| Field | Type | Required | Description |
|---|---:|---:|---|
| presence | enum | Yes | optional, required_on_create, required_on_update, required_before_submit, required_before_approve. |
| editability | enum | Yes | always, create_only, until_submit, readonly, system_only, integration_only. |
| defaultSource | enum | Yes | none, static_value, today, now, session_user, session_tenant, session_node, tenant_default_currency. |
| defaultValue | any | Conditional | Required when defaultSource is static_value. |
| auditMode | enum | Yes | none, audit_changes, audit_and_mask_values. |
| searchable | boolean | Yes | Whether included in search index. |
| filterable | boolean | Yes | Whether available in filters. |
| sortable | boolean | Yes | Whether sorting is allowed. |
| includeInDefaultList | boolean | Yes | Whether auto-added to default list view. |
| includeInLookupDisplay | boolean | Yes | Whether available for lookup display. |

#### Behavior Rules

1. `system_only` fields cannot be edited by users.
2. `integration_only` fields cannot be edited through UI.
3. `readonly` fields cannot accept user input through UI, import, and normal API update.
4. `required_before_submit` and `required_before_approve` are lifecycle gates.
5. Conditional requiredness must be implemented using ValidationRuleDefinition, not FieldDefinition.
6. Searchable fields must use compatible storage strategy and indexing policy.
7. Fields marked `includeInLookupDisplay` must not be classified as regulated unless masking is applied in lookup views.

---

### 8.7 UI Defaults

| Field | Type | Required | Description |
|---|---:|---:|---|
| defaultControl | enum | Yes | Recommended UI control for normal form entry. |
| allowedControls | array | Yes | Allowed UI controls for this logical type. |
| formatPolicyId | string | No | Format policy for display. |
| placeholder | string | No | Placeholder text. |
| helpText | string | No | Field-level help. |
| displayTemplate | string | Conditional | Used for references and lookup display. |

#### Default UI Control Mapping

| Logical Data Type | Default UI Control | Allowed UI Controls |
|---|---|---|
| text | text_input | text_input, readonly_text, masked_text |
| long_text | textarea | textarea, readonly_text |
| text_identifier | uppercase_text_input | uppercase_text_input, text_input, readonly_text, masked_text |
| integer | integer_input | integer_input, readonly_number |
| decimal | decimal_input | decimal_input, readonly_number |
| currency | currency_input | currency_input, readonly_amount, formatted_amount |
| percentage | percentage_input | percentage_input, readonly_percentage |
| boolean | switch | switch, checkbox, yes_no_radio, readonly_badge |
| date | date_picker | date_picker, readonly_date, date_filter |
| datetime | datetime_picker | datetime_picker, readonly_datetime |
| time | time_picker | time_picker, readonly_time |
| enum | dropdown | dropdown, radio_group, status_chip, readonly_badge |
| multi_enum | multi_select | multi_select, chips, multi_select_filter |
| entity_reference | autocomplete_lookup | autocomplete_lookup, lookup_dialog, readonly_link |
| file_reference | file_uploader | file_uploader, file_link |
| json | json_editor | json_editor, readonly_json |
| auto_number | readonly_text | readonly_text |
| computed | readonly_text | readonly_text, readonly_number, readonly_amount |

Rule: ViewDefinition may override the actual UI control for a field if the selected control is present in allowedControls.

---

### 8.8 Governance

| Field | Type | Required | Description |
|---|---:|---:|---|
| classification | enum | Yes | open, internal, sensitive, regulated. |
| protected | boolean | Yes | Whether field is protected from downstream modification. |
| canDownstreamDecorate | boolean | Yes | Downstream layer may change label, help text, and display-only metadata. |
| canDownstreamConstrain | boolean | Yes | Downstream layer may tighten validation. |
| canDownstreamRelax | boolean | Yes | Downstream layer may loosen validation. Default false. |
| canDownstreamDisable | boolean | Yes | Downstream layer may disable the field. Default false for protected fields. |
| canDownstreamChangeStorage | boolean | Yes | Must default to false. |
| includeInExport | boolean | Yes | Whether field can be exported. |
| allowImport | boolean | Yes | Whether field can be populated during import. |
| allowBulkUpdate | boolean | Yes | Whether field allows bulk update. |
| maskInExport | boolean | Yes | Whether value is masked in export. |
| apiInputAllowed | boolean | Yes | Whether API can accept input for this field. |
| apiOutputAllowed | boolean | Yes | Whether API can return this field. |
| apiOutputMasked | boolean | Yes | Whether API returns masked value. |
| isExternalId | boolean | Yes | Whether field can be used for integration upsert. |

#### Classification Rules

| Classification | Default Governance |
|---|---|
| open | Export allowed, API output allowed, no masking by default. |
| internal | Export allowed, API output allowed for internal APIs, no public exposure by default. |
| sensitive | Mask in export by default, audit access recommended. |
| regulated | Mask in export and API by default unless explicit integration policy allows unmasked output. Full audit required. |

#### Governance Rules

1. `regulated` fields must default `maskInExport = true`.
2. `regulated` fields must default `auditMode = audit_and_mask_values` unless overridden by security-approved policy.
3. `canDownstreamChangeStorage` must default to false for all activated fields.
4. `isExternalId = true` requires field to be unique within the required integration scope.
5. `allowBulkUpdate = true` is not allowed for regulated fields unless an explicit override policy is applied.
6. `apiInputAllowed = false` must block create and update API input for this field.
7. `apiOutputAllowed = false` must omit the field from API response, not only mask it.

---

### 8.9 Integration

| Field | Type | Required | Description |
|---|---:|---:|---|
| apiNameOverride | string | No | Optional external API field alias. |
| importColumnName | string | No | Default import column label. |
| exportColumnName | string | No | Default export column label. |
| externalSystemMappings | array | No | Mappings to third-party fields. |
| idempotencyParticipation | boolean | Yes | Whether field participates in duplicate prevention. |
| upsertParticipation | boolean | Yes | Whether field participates in upsert matching. |

Rule: Integration-specific masking, transformation, and contract variation must belong to IntegrationContractDefinition. FieldDefinition only declares general participation and default policy.

---

### 8.10 Analytics

| Field | Type | Required | Description |
|---|---:|---:|---|
| analyticsEnabled | boolean | Yes | Whether field may be used in analytics. |
| semanticRole | enum | No | dimension, measure, date_dimension, identifier, attribute. |
| defaultAggregation | enum | Conditional | none, sum, count, average, min, max. Required for measures. |
| piiRestricted | boolean | Yes | Whether analytics access is restricted due to sensitive data. |

Rule: Analytics semantic model will be expanded in a later phase. MVP must store basic analytics participation only.

---

### 8.11 Lifecycle

| Field | Type | Required | Description |
|---|---:|---:|---|
| status | enum | Yes | draft, active, disabled, deprecated, retired. |
| version | string | Yes | Field metadata version. |
| activatedAt | datetime | No | Activation timestamp. |
| activatedBy | string | No | User who activated the field. |
| deprecatedAt | datetime | No | Deprecation timestamp. |
| deprecatedBy | string | No | User who deprecated the field. |
| replacementFieldId | string | Conditional | Required when deprecating with replacement. |
| effectiveFrom | date | No | Effective start date. |
| effectiveTo | date | No | Effective end date. |
| lifecycleReason | string | Conditional | Required for disable, deprecate, retire. |

#### Lifecycle States

| State | Meaning |
|---|---|
| draft | Field exists in metadata but is not available at runtime. |
| active | Field is available in compiled schema and runtime contracts. |
| disabled | Field is excluded from runtime but data is retained. |
| deprecated | Field remains available for existing usage but should not be used in new configurations. |
| retired | Field is unavailable for new usage and retained only for historical compatibility. |

#### Allowed Transitions

| From | To | Allowed | Rule |
|---|---|---:|---|
| draft | active | Yes | Compile readiness must pass. |
| draft | disabled | Yes | No runtime impact. |
| active | disabled | Yes | Requires dependency impact check. |
| disabled | active | Yes | Compile readiness must pass. |
| active | deprecated | Yes | Requires reason. |
| deprecated | retired | Yes | Requires dependency migration check. |
| active | draft | No | Active field cannot be unpublished to draft. |
| any | physically_removed | No | Requires external migration-governed process. |

---

### 8.12 Overlay Policy

| Field | Type | Required | Description |
|---|---:|---:|---|
| overlayMode | enum | Yes | original, inherited, extended, decorated, constrained, disabled. |
| parentFieldId | string | Conditional | Required when inherited. |
| overriddenProperties | array | No | List of properties changed by current layer. |
| effectiveLayer | enum | Yes | Platform, Vertical, Tenant, Node. |
| resolvedFromLayers | array | No | Ordered metadata resolution trace. |

#### Overlay Rules

1. Lower layers cannot change `fieldId`, `entityId`, and `apiName`.
2. Lower layers cannot change `storage` unless `canDownstreamChangeStorage = true` and the field is not active.
3. Lower layers may decorate label and help text when `canDownstreamDecorate = true`.
4. Lower layers may tighten validation when `canDownstreamConstrain = true`.
5. Lower layers may not relax requiredness when `canDownstreamRelax = false`.
6. Role must not create schema overlays. Role-specific behavior must be resolved through SecurityDefinition and ViewDefinition.

---

### 8.13 Dependency Summary

| Field | Type | Required | Description |
|---|---:|---:|---|
| usedByViews | number | Yes | Count of views using field. |
| usedByRules | number | Yes | Count of validation and business rules using field. |
| usedByWorkflows | number | Yes | Count of workflows using field. |
| usedByApis | number | Yes | Count of API contracts using field. |
| usedByReports | number | Yes | Count of reports using field. |
| usedByImports | number | Yes | Count of import templates using field. |
| usedByExports | number | Yes | Count of export templates using field. |
| impactSeverity | enum | Yes | none, info, warning, breaking. |

Rule: DependencySummary can be cached, but the source of truth must be the dependency graph service.

---

## 9. Field Creation Flow Requirements

### 9.1 Create Field from Catalog

Steps:

1. User selects Add Field.
2. User selects Source = Catalog.
3. System displays searchable catalog field list.
4. User selects catalog field.
5. System copies catalog metadata into draft FieldDefinition.
6. System retains catalog lineage using `catalogFieldId` and `presetCode`.
7. User reviews identity, typing, storage, behavior, governance, and UI defaults.
8. System validates compile readiness.
9. User saves field as Draft.
10. Field becomes active only after activation.

### 9.2 Create Local Field

Steps:

1. User selects Add Field.
2. User selects Source = Local.
3. User enters label.
4. System generates apiName.
5. User selects business type or logical data type.
6. System derives PostgreSQL storage mapping.
7. System derives allowed UI controls.
8. User configures type-specific settings.
9. User configures behavior.
10. User configures governance.
11. System validates compile readiness.
12. User saves field as Draft.

### 9.3 Create System Field

System fields are created by templates or internal platform processes.

Examples:

- id
- record_no
- status
- created_by
- created_at
- updated_by
- updated_at
- tenant_id
- node_id

Rules:

1. System fields must be protected by default.
2. System fields must be excluded from normal delete and disable actions.
3. Infrastructure fields must default to explicit view participation.
4. System fields must not be editable by business users unless explicitly designed as editable business fields.

---

## 10. PostgreSQL Implementation Guidance

### 10.1 Recommended Table Pattern

The implementation may store FieldDefinition metadata in MongoDB or PostgreSQL depending on the platform metadata store decision. Runtime business data will use PostgreSQL.

The following PostgreSQL data storage strategy is recommended for entity records:

1. Core entity fields use physical columns.
2. Extension fields that are high-value use extension columns or promoted physical fields.
3. Low-risk custom fields may use JSONB extension storage.
4. Financial, compliance, posting, integration-key, search-critical, and report-critical fields must not be stored casually in JSONB.

### 10.2 Recommended Primary Key Pattern

Use internal UUID primary keys for entity records.

Business document numbers must be separate from primary keys.

Example:

```text
id = internal UUID primary key
job_card_no = business document number
```

### 10.3 Numeric and Currency Rules

1. Currency fields must use exact numeric storage.
2. Floating-point storage must not be used for financial values.
3. Currency fields must define precision and scale.
4. The default MVP currency storage is `numeric(18,2)`.
5. Quantity fields may use `numeric(18,3)` unless the domain requires different scale.
6. Percentage storage convention must be frozen by the platform. MVP convention: store 12.5 percent as `12.5`, not as `0.125`.

### 10.4 Date and Timestamp Rules

1. Business date fields must use `date`.
2. System timestamps must use `timestamptz`.
3. Time-only fields must use `time`.
4. The UI must apply locale formatting through format policy and not by changing stored value.

### 10.5 Enum and Picklist Rules

1. Do not use PostgreSQL ENUM for configurable business dropdown values.
2. Use picklist definitions or code master tables.
3. Store stable code values or picklist value IDs.
4. Inactive values may remain on historical records when allowed by field configuration.
5. Active value filtering must be enforced by runtime resolver and validation.

### 10.6 JSONB Rules

JSONB is allowed only for flexible extension data when all conditions below are true:

1. Field is not financially critical.
2. Field is not compliance critical.
3. Field is not used for accounting posting.
4. Field is not an integration key.
5. Field is not frequently used in search.
6. Field is not frequently used in reporting.
7. Field is not required in workflow guards.

If any condition is false, use physical or promoted extension storage.

---

## 11. API Requirements

### 11.1 Create FieldDefinition

**Endpoint**

```http
POST /metadata/entities/{entityId}/fields
```

**Request Body**

```json
{
  "label": "GSTIN Number",
  "apiName": "gstin_number",
  "source": {
    "sourceType": "catalog",
    "presetCode": "INDIA_GSTIN"
  },
  "typing": {
    "businessType": "gstin",
    "logicalDataType": "text_identifier"
  },
  "behavior": {
    "presence": "optional",
    "editability": "always",
    "auditMode": "audit_changes"
  }
}
```

**Response**

```json
{
  "fieldId": "fld_customer_gstin",
  "status": "draft",
  "compileReadiness": {
    "status": "pass",
    "errors": [],
    "warnings": []
  }
}
```

---

### 11.2 Update FieldDefinition

```http
PATCH /metadata/entities/{entityId}/fields/{fieldId}
```

Rules:

1. Draft fields may be updated freely within validation boundaries.
2. Active fields may update only safe metadata such as label, description, help text, default UI control, allowed governance flags, and display metadata.
3. Active fields cannot change apiName, logicalDataType, storage mapping, relationship target, and PostgreSQL physical type without migration workflow.

---

### 11.3 Activate FieldDefinition

```http
POST /metadata/entities/{entityId}/fields/{fieldId}/activate
```

Activation must run compile-readiness checks.

Activation must fail when:

- Required metadata is missing.
- Storage mapping is invalid.
- Field conflicts with existing field.
- Referenced entity does not exist.
- Referenced picklist does not exist.
- Governance rules are violated.
- Required migration is missing.

---

### 11.4 Disable FieldDefinition

```http
POST /metadata/entities/{entityId}/fields/{fieldId}/disable
```

Request:

```json
{
  "reason": "Field replaced by GST Registration Number",
  "replacementFieldId": "fld_customer_gst_registration_no"
}
```

Rules:

1. Dependency impact check is mandatory.
2. Data must be retained.
3. Runtime contracts must exclude disabled field unless needed for historical read-only compatibility.
4. Disable action must be blocked for protected system fields.

---

### 11.5 Get Field Dependencies

```http
GET /metadata/entities/{entityId}/fields/{fieldId}/dependencies
```

Response:

```json
{
  "fieldId": "fld_customer_gstin",
  "impactSeverity": "warning",
  "dependencies": [
    {
      "type": "view",
      "id": "view_customer_form",
      "name": "Customer Form",
      "severity": "info"
    },
    {
      "type": "api_contract",
      "id": "api_customer_v1",
      "name": "Customer API v1",
      "severity": "breaking"
    }
  ]
}
```

---

## 12. Runtime Contract Requirements

The runtime resolver must not return raw FieldDefinition directly to UI.

It must return a resolved field contract based on:

- active metadata version
- tenant
- node
- role
- user permissions
- locale
- channel
- record lifecycle state
- view context

Example runtime field contract:

```json
{
  "fieldId": "fld_customer_gstin",
  "apiName": "gstin_number",
  "label": "GSTIN Number",
  "logicalDataType": "text_identifier",
  "uiControl": "uppercase_text_input",
  "required": false,
  "editable": true,
  "visible": true,
  "masked": false,
  "format": {
    "uppercase": true,
    "trim": true
  },
  "validation": {
    "maxLength": 15,
    "regex": "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
  },
  "messages": {
    "regex": "Enter a valid 15-character GSTIN."
  }
}
```

Rule: The runtime contract must hide or mask fields according to security resolution. UI must not receive sensitive unmasked values when the user lacks permission.

---

## 13. Compile Readiness Checks

Compile readiness must run at field activation and entity activation.

### 13.1 Error Conditions

| Error | Message |
|---|---|
| Missing apiName | Field API name is required. |
| Duplicate apiName | Field API name already exists for this entity. |
| Missing logicalDataType | Logical data type is required. |
| Missing storage for physical field | Storage mapping is required for physical field. |
| Invalid numeric scale | Numeric scale cannot be greater than precision. |
| Missing picklist | Picklist source is required for enum field. |
| Missing relationship | Relationship is required for entity reference field. |
| Missing numbering strategy | Numbering strategy is required for auto number field. |
| Invalid protected override | Protected field cannot be modified by current layer. |
| Invalid API exposure | API output cannot expose regulated field without masking or approved policy. |
| Invalid required field activation | Required active field cannot be introduced without default value or migration plan when existing records are present. |

### 13.2 Warning Conditions

| Warning | Message |
|---|---|
| Searchable without index | Searchable field does not have an index policy. |
| Reportable JSONB field | JSONB field may not perform well in reporting. |
| Sensitive lookup display | Sensitive field is included in lookup display. Ensure masking is configured. |
| Relaxed validation | This change relaxes validation and may reduce data quality. |
| Bulk update sensitive field | Bulk update is enabled for a sensitive field. Review governance policy. |

---

## 14. User Stories and Acceptance Criteria

### Feature: FieldDefinition Metadata Management

#### User Story 1: Create a local field

As a functional consultant, I want to create a local field on an entity so that client-specific data can be captured without changing platform-owned metadata.

**Acceptance Criteria**

1. User can select Add Field and choose Local.
2. User can enter label and apiName.
3. System derives apiName from label when apiName is blank.
4. User can select business type and logical data type.
5. System derives PostgreSQL storage mapping.
6. System derives default UI control and allowed controls.
7. User can configure behavior and governance.
8. System saves the field in Draft state.
9. System does not expose Draft field in runtime UI.

**Negative Scenarios**

| Scenario | Expected Behavior | Message |
|---|---|---|
| Duplicate apiName | Save blocked | Field API name already exists for this entity. |
| Missing logical data type | Save blocked | Logical data type is required. |
| Invalid storage mapping | Save blocked | Storage mapping is invalid for the selected logical data type. |

---

#### User Story 2: Create a field from catalog

As a functional consultant, I want to create a field from the catalog so that predefined compliance and domain attributes can be reused consistently.

**Acceptance Criteria**

1. User can select Catalog as field source.
2. User can search and select a catalog field.
3. System copies preset configuration into the new FieldDefinition.
4. System retains catalog lineage.
5. System applies default classification, masking, validation pattern, and UI default from preset.
6. User can review and save field as Draft.
7. User cannot remove mandatory catalog governance defaults unless allowed by policy.

**Negative Scenarios**

| Scenario | Expected Behavior | Message |
|---|---|---|
| Catalog field missing | Selection blocked | Selected catalog field is no longer available. |
| Governance override not allowed | Save blocked | This governance setting is protected by the catalog preset. |

---

#### User Story 3: Activate a field

As an admin, I want to activate a draft field so that it becomes available in runtime contracts.

**Acceptance Criteria**

1. User can activate a Draft field.
2. System runs compile readiness checks.
3. System blocks activation when errors exist.
4. System allows activation when only warnings exist after user acknowledgement.
5. Active field appears in compiled schema.
6. Active field becomes available for ViewDefinition, ValidationRuleDefinition, and IntegrationContractDefinition.

**Negative Scenarios**

| Scenario | Expected Behavior | Message |
|---|---|---|
| Missing storage mapping | Activation blocked | Storage mapping is required before activation. |
| Required field without migration plan | Activation blocked | Existing records require a default value or migration plan before this field can be activated. |
| Invalid reference | Activation blocked | Target relationship is missing or inactive. |

---

#### User Story 4: Disable an active field

As an admin, I want to disable an active field so that it is no longer available for new runtime use while preserving existing data.

**Acceptance Criteria**

1. User can request disable for an Active field.
2. System runs dependency impact check.
3. User must enter reason.
4. User can optionally select replacement field.
5. Disabled field is excluded from normal runtime contracts.
6. Existing data is preserved.
7. System blocks disabling protected system fields.

**Negative Scenarios**

| Scenario | Expected Behavior | Message |
|---|---|---|
| Field used in breaking dependency | Disable blocked unless dependency resolved | Field cannot be disabled because it is used by active API, rule, workflow, or report dependencies. |
| Reason missing | Disable blocked | Reason is required to disable a field. |
| Protected system field | Disable blocked | Protected system field cannot be disabled. |

---

#### User Story 5: Prevent unsafe physical storage change

As a platform architect, I want the system to block unsafe physical storage changes after activation so that production data and integrations are protected.

**Acceptance Criteria**

1. Active field storage type cannot be changed directly.
2. Active field PostgreSQL type cannot be changed directly.
3. Active field apiName cannot be changed directly.
4. System informs user that migration workflow is required.
5. Draft field storage may be changed before activation if no dependencies exist.

**Negative Scenarios**

| Scenario | Expected Behavior | Message |
|---|---|---|
| Change active numeric scale | Update blocked | Physical storage changes require a migration workflow. |
| Change active apiName | Update blocked | Field API name cannot be changed after activation. |
| Change reference target | Update blocked | Relationship target changes require migration and dependency review. |

---

#### User Story 6: Resolve field runtime contract

As a runtime UI renderer, I want to receive resolved field metadata so that I can render only the fields allowed for the current user and context.

**Acceptance Criteria**

1. Runtime resolver returns only active fields.
2. Runtime resolver applies tenant, node, role, user, locale, channel, and lifecycle state.
3. Runtime resolver masks fields when required.
4. Runtime resolver omits fields when user has no access.
5. Runtime resolver returns view-specific UI control when ViewDefinition overrides default.
6. Runtime resolver does not expose raw governance metadata to frontend unless needed for rendering.

**Negative Scenarios**

| Scenario | Expected Behavior | Message |
|---|---|---|
| User lacks field read permission | Field omitted or masked | Not applicable to UI. |
| View uses disabled field | Runtime warning logged and field excluded | Field is not available in the active runtime contract. |

---

## 15. Standard Validation Messages

| Code | Message |
|---|---|
| FIELD_API_NAME_REQUIRED | Field API name is required. |
| FIELD_API_NAME_INVALID | Field API name must use lowercase letters, numbers, and underscores, and must start with a letter. |
| FIELD_API_NAME_DUPLICATE | Field API name already exists for this entity. |
| FIELD_LABEL_REQUIRED | Field label is required. |
| FIELD_LOGICAL_TYPE_REQUIRED | Logical data type is required. |
| FIELD_STORAGE_REQUIRED | Storage mapping is required for this field. |
| FIELD_STORAGE_CHANGE_REQUIRES_MIGRATION | Physical storage changes require a migration workflow. |
| FIELD_RELATIONSHIP_REQUIRED | Relationship is required for entity reference fields. |
| FIELD_PICKLIST_REQUIRED | Picklist source is required for enum fields. |
| FIELD_NUMERIC_PRECISION_REQUIRED | Numeric precision is required. |
| FIELD_NUMERIC_SCALE_INVALID | Numeric scale cannot be greater than precision. |
| FIELD_PROTECTED_CANNOT_MODIFY | Protected field cannot be modified by the current layer. |
| FIELD_PROTECTED_CANNOT_DISABLE | Protected system field cannot be disabled. |
| FIELD_DISABLE_REASON_REQUIRED | Reason is required to disable a field. |
| FIELD_REQUIRED_EXISTING_DATA_RISK | Existing records require a default value or migration plan before this field can be activated. |
| FIELD_JSONB_NOT_ALLOWED | JSONB extension is not allowed for this field because it is financially, compliance, reporting, search, workflow, or integration critical. |
| FIELD_REGULATED_MASKING_REQUIRED | Regulated field must be masked in export and API unless an approved policy allows unmasked output. |

---

## 16. Non-Functional Requirements

### 16.1 Performance

1. Field metadata resolution must be cacheable by entity, tenant, node, role, locale, channel, and metadata version.
2. Runtime field contract retrieval must not query raw metadata repeatedly for each field.
3. Dependency checks may be asynchronous for large entities but activation must wait for final result.

### 16.2 Security

1. Raw FieldDefinition must not be exposed to normal frontend users.
2. Runtime contracts must apply SecurityDefinition before returning fields.
3. API output must not return regulated unmasked values unless allowed by explicit policy.
4. UI hiding must not be treated as security.

### 16.3 Auditability

1. Every change to FieldDefinition must be audited.
2. Audit must capture old value, new value, changed by, changed at, layer, package, reason, and request source.
3. Regulated field governance changes must be highlighted in audit logs.

### 16.4 Compatibility

1. Active field apiName must remain stable.
2. Active field logicalDataType must remain stable unless migration workflow is used.
3. Active field storage mapping must remain stable unless migration workflow is used.
4. Runtime contracts must include metadata version.

---

## 17. Implementation Phases

### Phase 1: MVP FieldDefinition Foundation

Must implement:

1. Field identity
2. Field source
3. Business type and logical data type
4. PostgreSQL storage mapping
5. Type-specific configuration
6. Behavior settings
7. Governance settings
8. UI default controls
9. Lifecycle
10. Compile-readiness checks
11. Create, update, activate, disable, dependency-check APIs
12. Runtime resolved field contract

### Phase 2: Enterprise Safety

Add:

1. Field version comparison
2. Migration workflow hooks
3. Field deprecation and replacement guidance
4. Advanced dependency graph
5. Package ownership enforcement
6. Layer-by-layer override viewer
7. Field-level audit viewer

### Phase 3: Advanced Capability

Add:

1. Formula and computed field builder
2. Rollup fields
3. Advanced UI reaction integration
4. Advanced analytics semantic role
5. Translation bundle support
6. Field-level encryption policy
7. Physical schema migration automation

---

## 18. Open Decisions for Product Owner

These decisions must be explicitly frozen before development goes beyond MVP.

| Decision | Recommended Baseline |
|---|---|
| Percentage storage convention | Store 12.5 percent as 12.5. |
| Default currency precision | numeric(18,2). |
| Default quantity precision | numeric(18,3). |
| Enum storage | Store code value for simple picklists. Store picklist value ID for highly configurable enterprise picklists. |
| Tenant custom field storage | Use JSONB only for low-risk fields. Promote important fields to extension columns. |
| Role as schema layer | Not allowed. Role affects security and view experience only. |
| API name change after activation | Not allowed without migration workflow. |
| Physical deletion | Not allowed from Entity Designer baseline. |

---

## 19. Sample FieldDefinition JSON Payloads

### 19.1 GSTIN Number

```json
{
  "fieldId": "fld_customer_gstin",
  "entityId": "ent_customer",
  "apiName": "gstin_number",
  "label": "GSTIN Number",
  "description": "Goods and Services Tax Identification Number for registered business customers.",
  "source": {
    "sourceType": "catalog",
    "catalogFieldId": "cat_india_gstin",
    "presetCode": "INDIA_GSTIN",
    "createdByLayer": "Platform"
  },
  "typing": {
    "businessType": "gstin",
    "logicalDataType": "text_identifier",
    "dataSubType": "india_gstin"
  },
  "storage": {
    "storageStrategy": "physical_column",
    "tableName": "mst_customer",
    "columnName": "gstin_number",
    "pgDataType": "varchar",
    "length": 15,
    "nullable": true,
    "indexPolicy": "standard_index"
  },
  "typeConfig": {
    "minLength": 15,
    "maxLength": 15,
    "regex": "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
    "trim": true,
    "uppercase": true
  },
  "behavior": {
    "presence": "optional",
    "editability": "always",
    "defaultSource": "none",
    "auditMode": "audit_changes",
    "searchable": true,
    "filterable": true,
    "sortable": false,
    "includeInDefaultList": false,
    "includeInLookupDisplay": false
  },
  "uiDefaults": {
    "defaultControl": "uppercase_text_input",
    "allowedControls": ["uppercase_text_input", "readonly_text", "masked_text"],
    "placeholder": "Enter 15-character GSTIN"
  },
  "governance": {
    "classification": "regulated",
    "protected": false,
    "canDownstreamDecorate": true,
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false,
    "canDownstreamDisable": false,
    "canDownstreamChangeStorage": false,
    "includeInExport": true,
    "allowImport": true,
    "allowBulkUpdate": false,
    "maskInExport": true,
    "apiInputAllowed": true,
    "apiOutputAllowed": true,
    "apiOutputMasked": true,
    "isExternalId": false
  },
  "lifecycle": {
    "status": "draft",
    "version": "1.0.0"
  }
}
```

### 19.2 Customer Reference on Service Job Card

```json
{
  "fieldId": "fld_sjc_customer",
  "entityId": "ent_service_job_card",
  "apiName": "customer_id",
  "label": "Customer",
  "source": {
    "sourceType": "local",
    "createdByLayer": "Vertical"
  },
  "typing": {
    "businessType": "customer_reference",
    "logicalDataType": "entity_reference",
    "valueSourceType": "entity",
    "valueSourceId": "ent_customer"
  },
  "storage": {
    "storageStrategy": "physical_column",
    "tableName": "txn_service_job_card",
    "columnName": "customer_id",
    "pgDataType": "uuid",
    "nullable": false,
    "indexPolicy": "standard_index"
  },
  "typeConfig": {
    "relationshipId": "rel_sjc_customer",
    "lookupViewId": "view_customer_lookup",
    "displayFieldId": "customer_name",
    "allowCreateFromLookup": false
  },
  "behavior": {
    "presence": "required_before_submit",
    "editability": "until_submit",
    "defaultSource": "none",
    "auditMode": "audit_changes",
    "searchable": false,
    "filterable": true,
    "sortable": false,
    "includeInDefaultList": true,
    "includeInLookupDisplay": false
  },
  "uiDefaults": {
    "defaultControl": "autocomplete_lookup",
    "allowedControls": ["autocomplete_lookup", "lookup_dialog", "readonly_link"],
    "displayTemplate": "{customer_code} - {customer_name}"
  },
  "governance": {
    "classification": "internal",
    "protected": false,
    "canDownstreamDecorate": true,
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false,
    "canDownstreamDisable": false,
    "canDownstreamChangeStorage": false,
    "includeInExport": true,
    "allowImport": true,
    "allowBulkUpdate": false,
    "maskInExport": false,
    "apiInputAllowed": true,
    "apiOutputAllowed": true,
    "apiOutputMasked": false,
    "isExternalId": false
  },
  "lifecycle": {
    "status": "draft",
    "version": "1.0.0"
  }
}
```

### 19.3 Invoice Amount

```json
{
  "fieldId": "fld_invoice_amount",
  "entityId": "ent_sales_invoice",
  "apiName": "invoice_amount",
  "label": "Invoice Amount",
  "source": {
    "sourceType": "system",
    "createdByLayer": "Platform"
  },
  "typing": {
    "businessType": "money_amount",
    "logicalDataType": "currency"
  },
  "storage": {
    "storageStrategy": "physical_column",
    "tableName": "txn_sales_invoice",
    "columnName": "invoice_amount",
    "pgDataType": "numeric",
    "precision": 18,
    "scale": 2,
    "nullable": false,
    "indexPolicy": "standard_index"
  },
  "typeConfig": {
    "allowNegative": false,
    "precision": 18,
    "scale": 2,
    "roundingMode": "half_up",
    "currencySource": "tenant_default"
  },
  "behavior": {
    "presence": "required_before_submit",
    "editability": "system_only",
    "defaultSource": "none",
    "auditMode": "audit_changes",
    "searchable": false,
    "filterable": true,
    "sortable": true,
    "includeInDefaultList": true,
    "includeInLookupDisplay": false
  },
  "uiDefaults": {
    "defaultControl": "currency_input",
    "allowedControls": ["currency_input", "readonly_amount", "formatted_amount"],
    "formatPolicyId": "format_india_currency"
  },
  "governance": {
    "classification": "internal",
    "protected": true,
    "canDownstreamDecorate": true,
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false,
    "canDownstreamDisable": false,
    "canDownstreamChangeStorage": false,
    "includeInExport": true,
    "allowImport": false,
    "allowBulkUpdate": false,
    "maskInExport": false,
    "apiInputAllowed": false,
    "apiOutputAllowed": true,
    "apiOutputMasked": false,
    "isExternalId": false
  },
  "analytics": {
    "analyticsEnabled": true,
    "semanticRole": "measure",
    "defaultAggregation": "sum",
    "piiRestricted": false
  },
  "lifecycle": {
    "status": "draft",
    "version": "1.0.0"
  }
}
```

---

## 20. QA Checklist

### Functional QA

- Create local text field.
- Create catalog GSTIN field.
- Create currency field.
- Create entity reference field.
- Create enum field backed by picklist.
- Validate duplicate apiName blocking.
- Validate active field cannot change apiName.
- Validate active field cannot change storage.
- Validate regulated field masking defaults.
- Validate JSONB restriction rules.
- Validate dependency check before disable.
- Validate runtime contract excludes draft and disabled fields.

### Negative QA

- Try to create field without logicalDataType.
- Try to create field with invalid apiName.
- Try to activate entity_reference without relationshipId.
- Try to activate enum without picklist source.
- Try to make regulated field exportable without masking.
- Try to enable bulk update for regulated field.
- Try to disable protected system field.
- Try to change active field from text to decimal.
- Try to physically remove active field.

### Integration QA

- Confirm field appears in API input contract only when apiInputAllowed is true.
- Confirm field appears in API output contract only when apiOutputAllowed is true.
- Confirm masked API output when apiOutputMasked is true.
- Confirm import template includes field only when allowImport is true.
- Confirm export template includes field only when includeInExport is true.
- Confirm runtime resolver applies role and security rules before returning field contract.

---

## 21. Implementation Notes for AI Developer

1. Implement FieldDefinition as metadata, not as UI-only configuration.
2. Keep raw FieldDefinition separate from runtime-resolved field contract.
3. Do not expose PostgreSQL type selection to business users.
4. Derive PostgreSQL mapping from logicalDataType and typeConfig.
5. Do not use PostgreSQL ENUM for business-configurable values.
6. Do not allow active field physical storage change without migration workflow.
7. Do not treat UI visibility as security.
8. Do not store complex conditional business rules inside FieldDefinition.
9. Do not store full relationship cardinality and delete behavior inside FieldDefinition.
10. Keep UI default control in FieldDefinition and actual UI rendering in ViewDefinition.
11. Use compile-readiness checks before activation.
12. Keep dependency graph integration mandatory before disable and deprecate.

---

## 22. Freeze Summary

The FieldDefinition baseline is frozen with the following decisions:

1. FieldDefinition is a governed metadata object.
2. Business Type, Logical Data Type, PostgreSQL Physical Type, and UI Control Type are separate.
3. FieldDefinition owns data meaning and storage mapping.
4. ViewDefinition owns actual screen-level rendering.
5. SecurityDefinition owns final field access.
6. ValidationRuleDefinition owns complex conditional and cross-field validation.
7. RelationshipDefinition owns relationship cardinality and lifecycle impact.
8. Active fields cannot change API name, logical type, and storage without migration workflow.
9. PostgreSQL ENUM must not be used for configurable business dropdowns.
10. JSONB must be used carefully and not for financial, compliance, reporting, search-critical, workflow-critical, and integration-key fields.
11. Physical deletion is not allowed from Entity Designer baseline.
12. Runtime UI must consume resolved field contracts, not raw FieldDefinition metadata.

---
