# iDMS Admin Studio — RuntimeContractDefinition Requirement Document

**Document Type:** Functional + Metadata Architecture Requirement  
**Audience:** AI Developer, Backend Architect, Frontend Architect, Product Owner, QA  
**Status:** Frozen for implementation planning  
**Scope Area:** Entity Metadata Architecture → RuntimeContractDefinition  

---

## 1. Objective

RuntimeContractDefinition shall define the resolved metadata payload that UI, API, import, export, and other runtime engines consume after EntityDefinition, FieldDefinition, RelationshipDefinition, ViewDefinition, ActionDefinition, ValidationRuleDefinition, SecurityDefinition, lifecycle, package, version, tenant, node, role, user, channel, and locale have been compiled and resolved.

The goal is to stop frontend and integration teams from reconstructing platform rules manually.

---

## 2. Product Position

RuntimeContractDefinition answers:

> Given this user, tenant, node, role, entity, view, channel, record state, and operation, what exactly is allowed and what metadata should the runtime use?

It is not raw admin metadata.
It is not full schema JSON.
It is the effective runtime contract.

---

## 3. Core Principle

The runtime consumer must not decide:
- Which fields are allowed
- Which actions are available
- Which views can be opened
- Which validations apply
- Which fields are masked
- Which relationship records can be shown
- Which defaults apply
- Which layout sections are visible

The Runtime Metadata Resolver must decide and return the contract.

---

## 4. Inputs to Runtime Resolution

| Input | Example |
|---|---|
| entityApiName | service_job_card |
| viewApiName | default_form |
| operation | create, edit, view, submit, approve, export |
| recordId | optional for existing records |
| recordState | draft, submitted, posted, closed |
| tenantId | tenant_abc |
| nodeId | branch_pune_01 |
| userId | usr_1001 |
| roleCodes | SERVICE_ADVISOR |
| channel | web, mobile, api, import, export, print |
| locale | en-IN, hi-IN, mr-IN |
| packageVersion | active installed package version |
| effectiveDate | for dated configuration and policies |

---

## 5. Resolution Order

Runtime contract must be resolved in deterministic order:

1. Load active package and metadata versions.
2. Load EntityDefinition.
3. Merge metadata layers: Platform → Vertical → Tenant → Node.
4. Apply package installation and upgrade constraints.
5. Load FieldDefinition, RelationshipDefinition, ViewDefinition, ActionDefinition, ValidationRuleDefinition, SecurityDefinition.
6. Apply metadata lifecycle filtering: active only unless admin preview mode.
7. Apply tenant and node overrides.
8. Apply record lifecycle state restrictions.
9. Apply SecurityDefinition.
10. Apply view-specific field and section configuration.
11. Apply UI reaction rules if runtime preview requires them.
12. Apply locale and formatting policy.
13. Apply channel-specific policy.
14. Generate contract with metadataVersion and cache key.

---

## 6. Runtime Contract Types

| Contract Type | Purpose |
|---|---|
| UI Form Contract | Render create/edit/detail form |
| UI List Contract | Render list/grid/search page |
| Lookup Contract | Render lookup/autocomplete/dialog |
| Action Contract | Render and execute actions |
| API Read Contract | Control API response fields |
| API Write Contract | Control accepted API input |
| Import Contract | Validate and map import template |
| Export Contract | Generate export fields and masking |
| Print Contract | Generate print/PDF rendering metadata |
| Validation Contract | Pre-validation hints and backend validation map |
| Related Data Contract | Render related lists/child grids safely |

---

## 7. RuntimeContractDefinition Metadata Model

```json
{
  "contractId": "rtc_service_job_card_form_edit_usr1001",
  "contractType": "ui_form",
  "entityApiName": "service_job_card",
  "viewApiName": "default_form",
  "operation": "edit",
  "channel": "web",
  "locale": "en-IN",
  "metadataVersion": "auto_service_core@1.4.0+tenant_abc@2.1.0",
  "cacheKey": "service_job_card|default_form|edit|web|en-IN|tenant_abc|node_pune_01|SERVICE_ADVISOR|draft",
  "entity": {
    "label": "Service Job Card",
    "pluralLabel": "Service Job Cards",
    "category": "Transaction",
    "recordLifecycleState": "draft"
  },
  "permissions": {
    "read": true,
    "create": true,
    "update": true,
    "delete": false,
    "submit": true,
    "approve": false,
    "export": false
  },
  "fields": [
    {
      "apiName": "customer_id",
      "label": "Customer",
      "logicalDataType": "entity_reference",
      "uiControl": "autocomplete_lookup",
      "visible": true,
      "editable": true,
      "required": true,
      "masked": false,
      "lookupContractRef": "lookup_customer_active_same_node"
    }
  ],
  "views": {
    "sections": [],
    "columns": []
  },
  "relationships": [],
  "actions": [],
  "validations": [],
  "messages": [],
  "serverEnforced": true
}
```

---

## 8. Contract Field Specification

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| contractId | string | Yes | Generated identifier for traceability. |
| contractType | enum | Yes | ui_form, ui_list, lookup, api_read, api_write, import, export, print, action. |
| entityApiName | string | Yes | Entity being resolved. |
| viewApiName | string | Conditional | Required for UI and view-based contracts. |
| operation | enum | Yes | create, view, edit, submit, approve, cancel, export, import, api_read, api_write. |
| channel | enum | Yes | web, mobile, api, import, export, print. |
| locale | string | Yes | Formatting and translation context. |
| metadataVersion | string | Yes | Composite version of resolved metadata. |
| cacheKey | string | Yes | Deterministic key for cache invalidation. |
| entity | object | Yes | Resolved entity summary. |
| permissions | object | Yes | Effective permissions. |
| fields | array | Conditional | Required when contract exposes fields. |
| views | object | Conditional | Required for UI list/form/print contracts. |
| relationships | array | No | Resolved relationships available in context. |
| actions | array | No | Resolved actions visible/enabled for context. |
| validations | array | No | Client-side pre-validation hints. Backend remains authoritative. |
| messages | array | No | Runtime warnings or configuration notices. |
| serverEnforced | boolean | Yes | Must be true for security/validation-sensitive contracts. |

---

## 9. Field Resolution Rules

Each field returned in a runtime contract must include:

| Property | Meaning |
|---|---|
| apiName | Stable field API name |
| label | Localized label where translation exists |
| logicalDataType | Platform logical type |
| businessType | Business semantic type if relevant |
| uiControl | Resolved UI control for channel/view |
| visible | Whether field appears in this contract |
| editable | Whether user can change value |
| required | Whether operation requires value |
| masked | Whether value must be masked |
| valuePolicy | defaulting or readonly behavior |
| formatPolicy | date, number, currency formatting |
| lookupContractRef | Lookup contract reference for entity references |
| validationHints | Non-authoritative UI validation hints |

Hard rule: If the user has no read access, the field must be omitted or returned as inaccessible without value. Do not return hidden values.

---

## 10. Action Resolution Rules

Each action returned must include:

| Property | Meaning |
|---|---|
| actionCode | Stable action code |
| label | User-facing label |
| placement | Toolbar, row, footer, context menu, action panel |
| visible | Can be shown |
| enabled | Can be clicked now |
| executeAllowed | Backend will execute if invoked |
| disabledReasonCode | Reason if disabled |
| confirmationRequired | Whether confirmation is needed |
| inputSchema | Extra input fields if action requires input |

Hard rule: Action execution endpoint must re-authorize action. Runtime contract is not a security token.

---

## 11. Validation Exposure Rules

Runtime contract may include validation hints for better UX.

Examples:
- Required fields
- Max length
- Regex hints
- Simple cross-field hints

But backend validation remains authoritative.

Do not expose sensitive business rules if doing so leaks restricted logic.

---

## 12. Caching and Invalidation

Runtime contract may be cached only if cache key includes:

- entity API name
- view API name
- operation
- channel
- locale
- tenant
- node
- role or permission signature
- record lifecycle state
- metadata version
- package version

Invalidate cache when:
- metadata version changes
- package installed/upgraded/rolled back
- permission set changes
- role assignment changes
- field/view/action/security/validation changes
- locale translation changes
- lifecycle model changes

---

## 13. Requirements

REQ-RTC-001: System shall generate runtime contracts from compiled metadata, not raw draft metadata.

REQ-RTC-002: System shall resolve runtime contract using tenant, node, user, role, channel, operation, locale, package version, and record state.

REQ-RTC-003: Runtime contract shall never expose fields denied by SecurityDefinition.

REQ-RTC-004: Runtime contract shall include only actions visible or relevant to the user and context.

REQ-RTC-005: Runtime contract shall include disabled reasons for actions and fields where helpful.

REQ-RTC-006: Runtime contract shall support lookup contracts with target filters and display configuration.

REQ-RTC-007: Runtime contract shall support related data contracts for child grids and related lists.

REQ-RTC-008: Runtime contract shall support API read and API write variants separately.

REQ-RTC-009: Runtime contract shall return metadataVersion and cacheKey.

REQ-RTC-010: Runtime contract shall not be treated as authorization proof by backend execution services.

REQ-RTC-011: Runtime contract shall support admin preview mode for testing role, tenant, node, channel, and lifecycle combinations.

REQ-RTC-012: System shall provide diagnostics explaining why a field/action/view is hidden, disabled, required, masked, or readonly.

---

## 14. Runtime APIs

### 14.1 Resolve Form Contract

`GET /runtime/entities/{entityApiName}/views/{viewApiName}/contract?operation=edit&recordId={recordId}`

### 14.2 Resolve List Contract

`GET /runtime/entities/{entityApiName}/list-contract?view={viewApiName}`

### 14.3 Resolve Lookup Contract

`GET /runtime/entities/{entityApiName}/fields/{fieldApiName}/lookup-contract`

### 14.4 Resolve API Contract

`GET /runtime/entities/{entityApiName}/api-contract?operation=create`

### 14.5 Explain Contract Decision

`POST /runtime/contracts/explain`

Input: entity, field/action/view, user/session context, operation.

Output: reason chain.

---

## 15. Example Explain Output

```json
{
  "target": "field.customer_mobile",
  "decision": "masked",
  "reasons": [
    "Field classification is Sensitive.",
    "Role SERVICE_ADVISOR has read permission but not unmask permission.",
    "Channel web allows partial mask.",
    "Export permission is false."
  ]
}
```

---

## 16. Compile-Time Validations

| Code | Scenario | Validation Message |
|---|---|---|
| RTC-COMP-001 | Contract references inactive entity | Runtime contract cannot be generated for inactive entity. |
| RTC-COMP-002 | View references inaccessible field without fallback | View contains fields that cannot be resolved. |
| RTC-COMP-003 | Action lacks backend handler | Runtime action cannot be resolved because handler is missing. |
| RTC-COMP-004 | API contract exposes denied field | API contract conflicts with security policy. |
| RTC-COMP-005 | Lookup contract has inactive relationship | Lookup contract references inactive relationship. |
| RTC-COMP-006 | Cache key missing security signature | Runtime cache key must include permission signature. |
| RTC-COMP-007 | Locale format missing | Required locale formatting policy is missing. |
| RTC-COMP-008 | Required field hidden by security | Required field is not accessible to the user context. |

---

## 17. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| AC-RTC-001 | Given a service advisor opens Job Card form, when runtime contract is requested, then only permitted fields, views, actions, validations, and relationships are returned. |
| AC-RTC-002 | Given a field is denied by security, when contract is resolved, then field value is not returned. |
| AC-RTC-003 | Given an action is visible but not enabled due to record state, when contract is resolved, then action includes disabled reason. |
| AC-RTC-004 | Given a lookup field, when lookup contract is requested, then target filter and lookup view are returned based on user scope. |
| AC-RTC-005 | Given metadata version changes, when contract is requested, then cache is invalidated and new contract version is returned. |
| AC-RTC-006 | Given API write contract is requested, then only writable API fields are returned. |
| AC-RTC-007 | Given admin preview mode, when role/node/channel are changed, then contract output changes accordingly. |
| AC-RTC-008 | Given backend action execution is attempted using old contract, then backend re-authorizes and blocks if permissions changed. |

---

## 18. Negative Scenarios

| Scenario | Expected Behavior | Message |
|---|---|---|
| Frontend requests draft metadata in normal runtime | Block or return active only | Runtime can use only active metadata. |
| Contract cache ignores permission change | Must invalidate | Runtime contract cache invalidation failure. |
| API contract returns masked field raw value | Defect; block release | Security policy violation. |
| Required field hidden by permissions | Return compile/runtime conflict | Required field is inaccessible in this context. |
| Action visible but backend permission missing | Return disabled or hidden | Action is not available for this user. |
| Lookup contract returns cross-node records | Block and log | Lookup scope policy violation. |

---

## 19. Critical Review and Conflict Checks

1. **No conflict with SecurityDefinition:** SecurityDefinition is authoritative; RuntimeContractDefinition only presents effective result.
2. **No conflict with ValidationRuleDefinition:** Runtime may expose hints, but backend validation remains authoritative.
3. **No conflict with ViewDefinition:** ViewDefinition is authoring metadata; runtime contract is resolved output.
4. **No conflict with ActionDefinition:** ActionDefinition defines command; runtime contract defines whether it is visible/enabled/executable now.
5. **No conflict with RelationshipDefinition:** Relationship metadata defines structure; runtime contract filters relationships by context.
6. **Risk identified:** Cache leakage is a serious security risk. Cache key must include permission and context signature.
7. **Risk identified:** Runtime contract can become too large. Use contract types and lazy lookup/related contracts.
8. **Risk identified:** Frontend teams may treat contract as security proof. Backend must re-authorize every mutation/action.

---

## 20. Next Implementation Tasks

1. Define RuntimeContract schema.
2. Build metadata resolver pipeline.
3. Integrate security resolver.
4. Integrate lifecycle state resolver.
5. Integrate view and field renderer mapping.
6. Add lookup contract endpoint.
7. Add API read/write contract endpoint.
8. Add explainability endpoint.
9. Implement cache key and invalidation strategy.
10. Add contract test matrix by role, node, lifecycle state, channel, and locale.


## Reference Inputs Used
- Current iDMS Entity Designer implementation extract: entity creation, field management, views, actions, compile readiness, diff, governance, layer system, dependencies, and planned package pattern.
- Salesforce Metadata API principle: Salesforce metadata describes schema, process, presentation, authorization, and general configuration.
- Salesforce CustomObject and CustomField docs: object and field metadata are distinct metadata types.
- Salesforce ValidationRule docs: validation rules are separate metadata used to verify that record data is valid and can be saved.
- Salesforce UI API principle: runtime UI consumers should receive data plus metadata resolved against layouts, picklists, field-level security, and sharing.
- Salesforce FieldPermissions, ObjectPermissions, and PermissionSet docs: access control is represented as explicit permission metadata, not just UI visibility.
- Salesforce MetadataComponentDependency and packaging/source tracking docs: enterprise metadata platforms need dependency visibility, packageability, source tracking, and deployment safety.

Official reference URLs:
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_intro.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/customobject.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/customfield.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_validationformulas.htm
- https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_get_started.htm
- https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_fieldpermissions.htm
- https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_objectpermissions.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_metadatacomponentdependency.htm
- https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_intro.htm
- https://developer.salesforce.com/docs/metadata-coverage
