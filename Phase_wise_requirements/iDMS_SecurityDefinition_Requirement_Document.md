# iDMS Admin Studio — SecurityDefinition Requirement Document

**Document Type:** Functional + Metadata Architecture Requirement  
**Audience:** AI Developer, Backend Architect, Frontend Architect, Product Owner, QA, Security Reviewer  
**Status:** Frozen for implementation planning  
**Scope Area:** Entity Metadata Architecture → SecurityDefinition  

---

## 1. Objective

SecurityDefinition shall define who can access entity data, fields, views, actions, APIs, exports, imports, related records, and administrative metadata. It must be enforced consistently across UI, API, import, export, reports, workflows, and runtime metadata resolution.

The most important principle: UI hiding is not security. Backend enforcement is mandatory.

---

## 2. Product Position

SecurityDefinition answers:

> Who can see, create, update, delete, submit, approve, export, import, call API, or administer this metadata or record?

SecurityDefinition must be separate from FieldDefinition visibility and ViewDefinition layout.

FieldDefinition may define default visibility and classification. SecurityDefinition decides access.

---

## 3. Security Scope

MVP shall support:

1. Entity/object-level permissions
2. Field-level permissions
3. Action-level permissions
4. View-level permissions
5. API contract permissions
6. Import/export permissions
7. Record-scope permissions by tenant, node, branch, dealer, and ownership
8. Relationship access rules
9. Masking policy resolution
10. Permission sets and role binding
11. Backend authorization service
12. Runtime metadata filtering
13. Audit of denied or sensitive access where configured
14. Compile-time security checks

---

## 4. Security Concepts

| Concept | Meaning |
|---|---|
| Principal | User, role, integration client, service account, API consumer |
| Permission Set | Named collection of permissions assigned to principals or roles |
| Entity Permission | Create/read/update/delete/export/import/administer for an entity |
| Field Permission | Read/edit/mask/hide for a field |
| Action Permission | Execute or see an action |
| View Permission | Access a view or view variant |
| API Permission | Read/write through API contracts |
| Record Scope | Which records are accessible based on tenant, node, dealer, region, ownership, hierarchy |
| Masking Policy | Whether sensitive data is hidden, partially shown, or fully shown |
| Security Resolver | Runtime service that computes effective permissions |

---

## 5. Metadata Model

```json
{
  "securityDefinitionId": "sec_service_job_card_default",
  "entityId": "ent_service_job_card",
  "apiName": "service_job_card_security",
  "label": "Service Job Card Security",
  "permissionSets": [
    {
      "permissionSetId": "ps_service_advisor",
      "code": "SERVICE_ADVISOR",
      "label": "Service Advisor",
      "entityPermissions": {
        "read": true,
        "create": true,
        "update": true,
        "delete": false,
        "submit": true,
        "approve": false,
        "export": false,
        "import": false,
        "administerMetadata": false
      },
      "fieldPermissions": [
        {
          "fieldId": "fld_job_card_customer_mobile",
          "read": true,
          "edit": false,
          "mask": true,
          "export": false
        }
      ],
      "actionPermissions": [
        {
          "actionId": "act_submit_job_card",
          "visible": true,
          "enabled": true,
          "execute": true
        }
      ],
      "viewPermissions": [
        {
          "viewId": "view_job_card_default_form",
          "access": true,
          "default": true
        }
      ],
      "recordScopePolicyId": "scope_same_tenant_node_or_assigned",
      "apiPermissions": {
        "create": false,
        "read": true,
        "update": false
      }
    }
  ],
  "governance": {
    "owningLayer": "Vertical",
    "owningPackageId": "pkg_auto_service_core",
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false
  },
  "lifecycle": {
    "metadataStatus": "draft",
    "version": "1.0.0"
  }
}
```

---

## 6. Permission Dimensions

### 6.1 Entity Permissions

| Permission | Meaning |
|---|---|
| read | Can view records of the entity subject to record scope |
| create | Can create records |
| update | Can update records subject to lifecycle and field permissions |
| delete | Can delete or soft-delete records if entity allows it |
| archive | Can archive if supported |
| submit | Can submit workflow-enabled record |
| approve | Can approve record |
| reject | Can reject record |
| cancel | Can cancel record |
| reverse | Can reverse financial or posted record if allowed |
| export | Can export records |
| import | Can import records |
| administerMetadata | Can configure entity metadata |

### 6.2 Field Permissions

| Permission | Meaning |
|---|---|
| read | Field may be returned or displayed |
| edit | User may change field value |
| mask | Field value must be masked even if readable |
| export | Field can be exported |
| import | Field can be populated through import |
| apiRead | Field can be returned through API |
| apiWrite | Field can be accepted through API |

### 6.3 Action Permissions

Action permissions must resolve three levels:

| Level | Meaning |
|---|---|
| visible | Action is visible in UI/runtime contract |
| enabled | Action is clickable in current state |
| execute | Backend will execute action |

Hard rule: Execute permission is authoritative. Visible/enabled are experience hints.

### 6.4 View Permissions

| Permission | Meaning |
|---|---|
| access | User can open view |
| default | View is default for principal/context |
| configure | User can modify view if layer ownership allows |
| exportFromView | User can export records from this view |

### 6.5 API Permissions

API permissions must distinguish interactive users from integration clients.

| Permission | Meaning |
|---|---|
| apiRead | Can call read endpoints |
| apiCreate | Can create through API |
| apiUpdate | Can update through API |
| apiDelete | Can delete/archive through API |
| apiBulk | Can use bulk endpoints |
| apiExport | Can pull export dataset |
| apiAdminMetadata | Can manage metadata through admin API |

---

## 7. Record Scope Model

Record access must support DMS hierarchy.

MVP scope policies:

| Scope Policy | Example |
|---|---|
| same_tenant | Dealer group user sees only own tenant |
| same_node | Branch user sees only own branch |
| assigned_to_me | Service advisor sees assigned job cards |
| hierarchy_below | Area manager sees dealers/branches under region |
| all_in_oem | HO user sees all dealers under OEM |
| explicit_share | Record shared to named user/role |
| integration_scope | API client sees records allowed by integration mapping |

Record scope must be enforced in:
- list queries
- lookups
- detail read
- update/delete actions
- exports
- reports
- related lists
- runtime metadata where record context exists

---

## 8. Masking Model

Masking resolution must combine:

1. Field classification from FieldDefinition
2. Field permission from SecurityDefinition
3. Channel: UI, API, export, report, print
4. Context: role, user, integration client, tenant, node
5. Purpose: display, edit, audit, export

Masking types:

| Type | Example |
|---|---|
| none | Full value shown |
| full_mask | `••••••` |
| last4 | `••••••1234` |
| partial_email | `r***@domain.com` |
| partial_phone | `******7890` |
| tokenized | Internal token shown instead of value |
| denied | Field omitted entirely |

Hard rule: If field is denied, RuntimeContractDefinition should omit the field or mark it inaccessible based on API mode. API response must not accidentally include value.

---

## 9. Security Resolution Order

Effective permission must be computed in this order:

1. Platform hard restrictions
2. Entity category restrictions, such as ledger-like no delete
3. Metadata lifecycle status
4. Package and layer governance restrictions
5. Permission set assignments
6. Role and hierarchy scope
7. Tenant and node scope
8. Record ownership and explicit sharing
9. Field classification and masking policy
10. Workflow or record lifecycle state restrictions
11. Action-specific visibility and enablement rules
12. Channel-specific restrictions

Deny must win over allow unless an explicit override policy says otherwise.

---

## 10. Requirements

REQ-SEC-001: System shall define SecurityDefinition as a first-class metadata object linked to EntityDefinition.

REQ-SEC-002: System shall support permission sets with entity, field, action, view, API, import, and export permissions.

REQ-SEC-003: System shall enforce permissions in backend services, not only UI.

REQ-SEC-004: RuntimeContractDefinition shall resolve fields, views, and actions based on effective permissions.

REQ-SEC-005: System shall prevent unauthorized field values from being returned in UI, API, export, report, and print responses.

REQ-SEC-006: System shall support masking of sensitive and regulated data by role/channel.

REQ-SEC-007: System shall enforce record scope for list, lookup, detail, related list, update, delete, export, and API access.

REQ-SEC-008: System shall audit denied access attempts if audit policy requires it.

REQ-SEC-009: System shall audit sensitive field access if policy requires it.

REQ-SEC-010: System shall block activation of a security model that leaves no administrator with metadata recovery access.

REQ-SEC-011: System shall support integration-client permissions separately from human-user permissions.

REQ-SEC-012: System shall support action visibility, enablement, and execution as separate decisions.

---

## 11. Compile-Time Validations

| Code | Scenario | Validation Message |
|---|---|---|
| SEC-COMP-001 | Missing entity | Entity is required. |
| SEC-COMP-002 | Permission set has no code | Permission set code is required. |
| SEC-COMP-003 | Field permission references inactive field | Field permission references unavailable field. |
| SEC-COMP-004 | Action permission references inactive action | Action permission references unavailable action. |
| SEC-COMP-005 | View permission references inactive view | View permission references unavailable view. |
| SEC-COMP-006 | No admin permission remains | At least one administrator must retain metadata access. |
| SEC-COMP-007 | Export allowed but field export denied conflict | Export permission conflicts with field-level export restriction. |
| SEC-COMP-008 | API contract exposes denied field | API contract cannot expose a field denied by security policy. |
| SEC-COMP-009 | Invalid record scope policy | Record scope policy is invalid or inactive. |
| SEC-COMP-010 | Masking policy missing for regulated field | Regulated field requires masking policy. |

---

## 12. Runtime Security Result Contract

```json
{
  "entityApiName": "service_job_card",
  "principal": {
    "userId": "usr_1001",
    "roleCodes": ["SERVICE_ADVISOR"],
    "tenantId": "tenant_abc",
    "nodeId": "node_pune_01"
  },
  "entityPermissions": {
    "read": true,
    "create": true,
    "update": true,
    "delete": false,
    "submit": true,
    "approve": false,
    "export": false
  },
  "fieldPermissions": {
    "customer_mobile": {"read": true, "edit": false, "mask": true},
    "invoice_amount": {"read": true, "edit": false, "mask": false}
  },
  "actions": {
    "submit": {"visible": true, "enabled": true, "execute": true},
    "approve": {"visible": false, "enabled": false, "execute": false}
  },
  "recordScope": "same_tenant_node_or_assigned"
}
```

---

## 13. API Requirements

### 13.1 Create SecurityDefinition

`POST /admin/metadata/security-definitions`

### 13.2 Assign Permission Set

`POST /admin/security/permission-sets/{permissionSetId}/assignments`

### 13.3 Resolve Effective Permissions

`POST /runtime/security/resolve`

Input includes entity, user, tenant, node, role, channel, record ID if available, and operation.

### 13.4 Authorize Operation

`POST /runtime/security/authorize`

Returns allow/deny with reason code.

---

## 14. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| AC-SEC-001 | Given a user lacks entity read permission, when opening list or detail, then records are not returned. |
| AC-SEC-002 | Given a user has read permission but field is masked, when runtime contract is returned, then field value is masked or omitted according to channel policy. |
| AC-SEC-003 | Given UI hides an action but user calls backend endpoint directly without execute permission, then backend blocks action. |
| AC-SEC-004 | Given user has view access but lacks field read access, when opening view, then inaccessible field is omitted or marked inaccessible. |
| AC-SEC-005 | Given user has export permission but field export denied, when exporting, then denied fields are excluded or masked. |
| AC-SEC-006 | Given API client has read but not update permission, when sending update request, then request is blocked. |
| AC-SEC-007 | Given branch-scoped user searches lookup, then records outside node scope are not returned. |
| AC-SEC-008 | Given no admin remains after a security change, when activating security definition, then activation is blocked. |

---

## 15. Negative Scenarios

| Scenario | Expected Behavior | Message |
|---|---|---|
| User opens record outside scope | Block read | You do not have access to this record. |
| User edits read-only field through API | Block update | You do not have permission to edit this field. |
| User exports regulated field without permission | Mask or omit | One or more fields were removed due to security restrictions. |
| Integration client tries unauthorized API write | Block request | API client is not authorized for this operation. |
| Role config hides field but API returns it | Defect; must not happen | Field exposure policy violation. |
| Security definition references deleted view | Block activation | View permission references unavailable view. |
| Approval action visible but execute denied | Runtime must return disabled or hidden based on policy | You do not have permission to execute this action. |

---

## 16. Critical Review and Conflict Checks

1. **No conflict with FieldDefinition:** FieldDefinition may define classification and default visibility; SecurityDefinition decides effective access.
2. **No conflict with ViewDefinition:** ViewDefinition defines layout; SecurityDefinition filters what the user can access within that layout.
3. **No conflict with ActionDefinition:** ActionDefinition defines what the action does; SecurityDefinition decides who can see, enable, and execute it.
4. **No conflict with RuntimeContractDefinition:** Runtime contract must consume SecurityDefinition and never bypass it.
5. **No conflict with ValidationRuleDefinition:** Unauthorized operations must fail even if validation would otherwise pass.
6. **Risk identified:** Permission sprawl can become unmanageable. Permission sets and inheritance must be carefully designed.
7. **Risk identified:** Record scope is the hardest part. It must be centralized and reusable, not coded separately in each module.
8. **Risk identified:** Masking must apply consistently across UI, API, export, reports, print, and audit views.

---

## 17. Next Implementation Tasks

1. Create SecurityDefinition schema.
2. Create PermissionSet metadata and assignment model.
3. Build effective permission resolver.
4. Implement entity, field, action, view, API, export, and import enforcement.
5. Implement record scope policies.
6. Implement masking service.
7. Integrate security resolver with RuntimeContractDefinition.
8. Add audit hooks for denied and sensitive access.
9. Add compile-time security validations.


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
