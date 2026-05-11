# iDMS Admin Studio — ValidationRuleDefinition Requirement Document

**Document Type:** Functional + Metadata Architecture Requirement  
**Audience:** AI Developer, Backend Architect, Frontend Architect, Product Owner, QA  
**Status:** Frozen for implementation planning  
**Scope Area:** Entity Metadata Architecture → ValidationRuleDefinition  

---

## 1. Objective

ValidationRuleDefinition shall define deterministic rules that decide whether a record can be saved, submitted, approved, posted, cancelled, imported, or processed through an API. It must separate data validation from business rules, UI reactions, workflow execution, and security enforcement.

The goal is to prevent FieldDefinition from becoming overloaded with conditional business logic while still allowing admins and functional consultants to configure enterprise-grade validations.

---

## 2. Product Position

ValidationRuleDefinition answers this question:

> Is this record valid for the requested operation at this moment?

It does not answer:
- Who can access the record? That belongs to SecurityDefinition.
- Which fields are visible or hidden? That belongs to UIReactionRuleDefinition or ViewDefinition.
- Which workflow step executes next? That belongs to LifecycleModelDefinition and workflow engine.
- Which charges, discounts, taxes, or postings are calculated? That belongs to domain-specific rule engines.

---

## 3. Strict Boundary Model

| Concern | Owner |
|---|---|
| Field length, basic format, numeric precision | FieldDefinition |
| Cross-field validation | ValidationRuleDefinition |
| Conditional requiredness | ValidationRuleDefinition |
| Operation eligibility | ValidationRuleDefinition |
| UI show/hide/readonly/default reaction | UIReactionRuleDefinition |
| Approval routing | Workflow or Approval Rule Engine |
| Charge, discount, tax, accounting calculation | Domain Rule Engine |
| Permission to execute action | SecurityDefinition |
| State transition execution | LifecycleModelDefinition + ActionDefinition |

Hard rule: ValidationRuleDefinition may block or warn. It must not mutate data except through explicit, separately governed defaulting or correction engines.

---

## 4. Validation Rule Types

| Type | Purpose | Example |
|---|---|---|
| Field presence rule | Conditional requiredness | GSTIN required when Customer Type = Registered Business |
| Cross-field rule | Compare fields on same record | Delivery Date cannot be before Booking Date |
| Relationship rule | Validate related records | Job Card cannot close if open parts requisition exists |
| Lifecycle gate rule | Validate transition | Invoice cannot be submitted if total amount is zero |
| Import validation rule | Validate imported rows | Imported part number must exist and be active |
| API validation rule | Validate external payload | External ID required for upsert |
| Warning rule | Non-blocking alert | Customer has overdue balance |
| Compliance rule | Legal/compliance blocker | GST invoice requires valid GSTIN when tax type demands it |
| Uniqueness rule | Configured duplicate prevention | Active tax rule cannot overlap date range for state + HSN |

---

## 5. ValidationRuleDefinition Metadata Model

```json
{
  "validationRuleId": "vr_customer_gstin_required_registered",
  "entityId": "ent_customer",
  "apiName": "gstin_required_for_registered_business",
  "label": "GSTIN required for registered business customers",
  "description": "Blocks submit when registered business customer has no GSTIN.",
  "ruleType": "field_presence",
  "triggerPoints": ["before_submit", "before_api_create", "before_api_update"],
  "applicability": {
    "recordStates": ["draft", "active"],
    "channels": ["web", "api", "import"],
    "layers": ["Platform", "Vertical", "Tenant"],
    "tenantScope": "all"
  },
  "condition": {
    "expressionLanguage": "idms_expression_v1",
    "expression": "customer_type == 'REGISTERED_BUSINESS'"
  },
  "assertion": {
    "expressionLanguage": "idms_expression_v1",
    "expression": "isNotBlank(gstin_number)"
  },
  "affectedFields": ["fld_customer_gstin_number"],
  "severity": "error",
  "message": {
    "code": "CUS-GST-001",
    "text": "GSTIN Number is required for registered business customers."
  },
  "bypassPolicy": {
    "allowed": false,
    "permissionCode": null
  },
  "governance": {
    "owningLayer": "Platform",
    "owningPackageId": "pkg_customer_core",
    "canDownstreamConstrain": true,
    "canDownstreamRelax": false,
    "canDownstreamDisable": false
  },
  "lifecycle": {
    "metadataStatus": "draft",
    "version": "1.0.0"
  },
  "testCases": [
    {
      "name": "Registered customer without GSTIN fails",
      "input": {"customer_type": "REGISTERED_BUSINESS", "gstin_number": null},
      "expected": "fail"
    },
    {
      "name": "Individual customer without GSTIN passes",
      "input": {"customer_type": "INDIVIDUAL", "gstin_number": null},
      "expected": "pass"
    }
  ]
}
```

---

## 6. Metadata Field Specification

| Field | Type | Mandatory | Rules |
|---|---:|---:|---|
| validationRuleId | string | Yes | Immutable internal ID. |
| entityId | entity reference | Yes | Entity to which rule applies. |
| apiName | string | Yes | Unique within entity. Locked after activation unless version migration exists. |
| label | string | Yes | Business-readable name. |
| description | string | No | Must explain business reason, not just technical condition. |
| ruleType | enum | Yes | field_presence, cross_field, relationship, lifecycle_gate, import, api, warning, compliance, uniqueness. |
| triggerPoints | array | Yes | before_save, before_submit, before_approve, before_post, before_cancel, before_import, before_api_create, before_api_update. |
| condition | expression | No | If omitted, assertion always applies. |
| assertion | expression | Yes | Must evaluate true to pass. |
| affectedFields | array | No | Fields to highlight or return in API errors. |
| severity | enum | Yes | error, warning, info. |
| message.code | string | Yes | Stable validation code. |
| message.text | string | Yes | User-facing message. |
| bypassPolicy | object | Yes | Defines whether bypass is allowed. |
| owningLayer | enum | Yes | Platform, Vertical, Tenant, Node. Role cannot own validation schema. |
| metadataStatus | enum | Yes | draft, active, deprecated, retired, disabled. |
| testCases | array | Strongly recommended | Required before production activation for critical rules. |

---

## 7. Trigger Points

| Trigger Point | Meaning |
|---|---|
| before_save | Runs before draft or normal save |
| before_submit | Runs before document submit or workflow transition |
| before_approve | Runs before approval action |
| before_reject | Runs before rejection action if configured |
| before_post | Runs before accounting, inventory, or legal posting |
| before_cancel | Runs before cancellation |
| before_reverse | Runs before reversal |
| before_import | Runs during import validation |
| before_api_create | Runs during API create |
| before_api_update | Runs during API update |
| before_bulk_update | Runs during bulk modification |

Rules must be idempotent and side-effect free.

---

## 8. Expression Standards

REQ-VAL-001: Expression language shall support field references, constants, comparison operators, logical operators, date functions, numeric functions, string functions, null checks, and relationship existence checks.

REQ-VAL-002: Expression language shall not allow arbitrary JavaScript, SQL, shell execution, or direct database access.

REQ-VAL-003: Expression parser shall validate field references at compile time.

REQ-VAL-004: Expression parser shall validate data type compatibility.

REQ-VAL-005: Expressions shall be versioned with the rule.

Recommended MVP functions:

| Function | Example |
|---|---|
| isBlank(value) | `isBlank(gstin_number)` |
| isNotBlank(value) | `isNotBlank(customer_id)` |
| today() | `invoice_date <= today()` |
| daysBetween(a,b) | `daysBetween(booking_date, delivery_date) >= 0` |
| length(value) | `length(pan_number) == 10` |
| matches(value, regexCode) | `matches(gstin_number, 'GSTIN_REGEX')` |
| existsRelated(relationshipCode, filter) | `existsRelated('open_part_requisitions') == false` |
| sumRelated(relationshipCode, field) | `sumRelated('invoice_lines', 'line_amount') > 0` |

---

## 9. Severity Behavior

| Severity | Runtime Behavior |
|---|---|
| Error | Blocks operation. Must return validation code and message. |
| Warning | Allows operation only if operation context supports warnings. User acknowledgment may be required. |
| Info | Does not block. Used for guidance. |

Hard rule: Backend APIs shall enforce error rules. UI-only enforcement is not allowed.

---

## 10. Validation Result Contract

```json
{
  "valid": false,
  "operation": "submit",
  "entityApiName": "customer",
  "recordId": "rec_123",
  "errors": [
    {
      "code": "CUS-GST-001",
      "message": "GSTIN Number is required for registered business customers.",
      "severity": "error",
      "affectedFields": ["gstin_number"],
      "ruleId": "vr_customer_gstin_required_registered"
    }
  ],
  "warnings": []
}
```

---

## 11. Requirements

REQ-VAL-006: System shall allow validation rules to be defined at entity level.

REQ-VAL-007: System shall support conditional validation using condition and assertion expressions.

REQ-VAL-008: System shall allow one validation rule to affect multiple fields.

REQ-VAL-009: System shall support validation execution by operation trigger point.

REQ-VAL-010: System shall return deterministic validation codes and messages.

REQ-VAL-011: System shall support warning rules without blocking save where operation permits warnings.

REQ-VAL-012: System shall support bypass policy only when explicitly configured and permission is granted.

REQ-VAL-013: System shall audit bypass usage if bypass is allowed.

REQ-VAL-014: System shall prevent activation of rule with invalid expression, inactive field reference, inactive relationship reference, invalid trigger point, or missing message.

REQ-VAL-015: System shall expose active validation rules through RuntimeContractDefinition only when relevant to UI pre-validation. Backend shall always enforce active blocking validations independently.

---

## 12. Validation vs UI Reaction

| Scenario | Correct Metadata Owner |
|---|---|
| Hide GSTIN when customer type is Individual | UIReactionRuleDefinition |
| Make GSTIN mandatory when customer type is Registered Business | ValidationRuleDefinition |
| Lock invoice amount after posting | LifecycleModelDefinition + SecurityDefinition |
| Show warning when customer has overdue balance | ValidationRuleDefinition warning or Insight Rule |
| Default invoice date to today | FieldDefinition default or UI Reaction depending timing |
| Recalculate tax when item changes | Domain Rule Engine / Tax Engine |

---

## 13. Compile-Time Validations

System shall block activation when:

| Code | Scenario | Validation Message |
|---|---|---|
| VAL-COMP-001 | Missing entity | Entity is required. |
| VAL-COMP-002 | Missing assertion | Assertion expression is required. |
| VAL-COMP-003 | Invalid field reference | Rule references an unknown or inactive field. |
| VAL-COMP-004 | Invalid relationship reference | Rule references an unknown or inactive relationship. |
| VAL-COMP-005 | Type mismatch | Expression compares incompatible data types. |
| VAL-COMP-006 | Missing message | Validation message is required. |
| VAL-COMP-007 | Duplicate message code | Validation message code must be unique. |
| VAL-COMP-008 | Dangerous expression | Expression uses prohibited function or unsafe syntax. |
| VAL-COMP-009 | Bypass permission missing | Bypass permission code is required when bypass is enabled. |
| VAL-COMP-010 | Error rule has no trigger point | At least one trigger point is required. |

---

## 14. API Requirements

### 14.1 Create Validation Rule

`POST /admin/metadata/validation-rules`

### 14.2 Update Validation Rule

`PATCH /admin/metadata/validation-rules/{validationRuleId}`

Active rule expression, trigger point, severity, or bypass changes must create new version or require controlled publish.

### 14.3 Validate Record

`POST /runtime/entities/{entityApiName}/validate`

Input includes operation, record payload, record ID if update, user/session context, and channel.

### 14.4 Activate Rule

`POST /admin/metadata/validation-rules/{validationRuleId}/activate`

Runs compile and test case checks.

---

## 15. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| AC-VAL-001 | Given a conditional validation rule, when condition is true and assertion is false, then operation is blocked with configured message. |
| AC-VAL-002 | Given condition is false, when operation runs, then assertion is not evaluated as a blocker. |
| AC-VAL-003 | Given a warning rule, when warning condition occurs, then operation returns warning without blocking where operation allows warnings. |
| AC-VAL-004 | Given an API request bypasses UI, when active validation fails, then backend blocks request. |
| AC-VAL-005 | Given a validation references disabled field, when activating rule, then activation is blocked. |
| AC-VAL-006 | Given user has bypass permission and rule allows bypass, when bypass is used, then operation succeeds and bypass is audited. |
| AC-VAL-007 | Given user lacks bypass permission, when validation fails, then operation remains blocked. |
| AC-VAL-008 | Given rule has invalid expression syntax, when saved as draft, then system flags error and prevents activation. |

---

## 16. Negative Scenarios

| Scenario | Expected Behavior | Message |
|---|---|---|
| Rule references deleted field | Block activation | Rule references a field that is not available. |
| Rule compares date to text | Block activation | Expression contains incompatible data types. |
| Rule has no validation message | Block activation | Validation message is required. |
| Blocking rule is UI-only | Not allowed | Blocking validation must execute on backend. |
| Bypass allowed without permission code | Block activation | Bypass permission is required. |
| Relationship rule causes heavy query | Mark as warning or block based on performance policy | Rule exceeds allowed complexity. |
| Circular dependency between computed fields and validation | Block activation | Circular metadata dependency detected. |

---

## 17. Critical Review and Conflict Checks

1. **No conflict with FieldDefinition:** Basic field constraints remain in FieldDefinition; conditional and cross-field logic belongs here.
2. **No conflict with Business Rule Engine:** Validation rules only pass/fail/warn; they do not calculate discounts, taxes, charges, approval routing, or accounting entries.
3. **No conflict with UI Reaction Engine:** UI reactions improve experience; ValidationRuleDefinition is the source of backend truth.
4. **No conflict with SecurityDefinition:** Permission checks are not validation rules. Unauthorized action must be blocked before or alongside validation.
5. **No conflict with Workflow:** Validation gates transitions but does not decide the next workflow assignee or transition path.
6. **Risk identified:** Expression language can become dangerous if it supports arbitrary code. MVP must be sandboxed and deterministic.
7. **Risk identified:** Relationship validations can become expensive. Rule complexity scoring and query budgets are needed.
8. **Risk identified:** Too many validation rules can confuse users. Runtime error grouping and message prioritization are needed.

---

## 18. Next Implementation Tasks

1. Create ValidationRuleDefinition metadata schema.
2. Define expression language grammar and allowed functions.
3. Build expression parser and compiler.
4. Implement backend validation executor by trigger point.
5. Implement validation result contract.
6. Add compile-time validation.
7. Add validation rule dependency tracking.
8. Add test case support for critical validation rules.
9. Add UI preview/test panel for validation simulation.


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
