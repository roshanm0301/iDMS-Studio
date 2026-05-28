# 02 - Expression and Condition Engine PRD

## 1. Feature Overview

The Expression and Condition Engine provides safe, structured, reusable logic evaluation for iDMS rules. It supports field-based conditions, grouped AND/OR logic, formula expressions, data type validation, operator validation, and runtime evaluation against transaction payloads.

This engine is shared by Validation, Calculation, Charge, Tax, Accounting, Approval Decision, and Workflow Decision features.

## 2. Business Objective

Allow authorized admins to configure business logic without code while preventing unsafe, ambiguous, or invalid expressions from reaching production.

## 3. Scope

### 3.1 In Scope

- Entity schema field binding.
- Condition builder.
- Condition groups.
- Operators by data type.
- Formula builder.
- Safe expression parser.
- Approved functions.
- Field dependency tracking.
- Expression validation.
- Expression compilation/cache readiness.
- Drag-and-drop support for condition/formula building where useful.
- Runtime evaluation against payloads.
- Structured errors.
- Simulation support.

### 3.2 Out of Scope

- Arbitrary programming language execution.
- External script execution.
- Direct database queries by business users.
- Direct transaction commit.
- Full domain-specific tax, charge, or accounting output handling.
- Visual workflow canvas.

## 4. Personas

| Persona | Goal |
|---|---|
| Business Admin | Configure simple conditions using fields and operators. |
| Tax Admin | Configure jurisdiction and product-driven conditions. |
| Finance Admin | Configure posting conditions and amount formulas. |
| Commercial Admin | Configure charge applicability and formula methods. |
| Process Admin | Configure approval routing conditions. |
| Support Engineer | Diagnose failed expression evaluation. |
| AI Developer Agent | Implement safe expression runtime and builder APIs. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Fact | A named field or value from transaction payload, master data, or derived context. |
| Operator | Comparison or logical operation, such as equals, greater than, contains. |
| Literal | Fixed value entered in a condition or formula. |
| Function | Approved reusable function, such as sum, round, dateDiff. |
| Condition | Predicate returning true or false. |
| Condition Group | Nested set of conditions combined with AND/OR. |
| Formula | Expression returning numeric, string, boolean, date, or object value. |
| Field Binding | Link between expression token and schema field. |
| Evaluation Context | Runtime payload and derived values available to the expression. |

## 6. Supported Data Types

EXP-TYPE-001: The engine shall support String.

EXP-TYPE-002: The engine shall support Number/Decimal.

EXP-TYPE-003: The engine shall support Integer.

EXP-TYPE-004: The engine shall support Boolean.

EXP-TYPE-005: The engine shall support Date.

EXP-TYPE-006: The engine shall support DateTime.

EXP-TYPE-007: The engine shall support Enum/Picklist.

EXP-TYPE-008: The engine shall support Lookup Reference.

EXP-TYPE-009: The engine shall support List/Array for approved functions.

EXP-TYPE-010: The engine shall support Money/Amount with currency context where applicable.

EXP-TYPE-011: The engine shall support Quantity with UOM context where applicable.

## 7. Operators

### 7.1 Common Operators

COND-OP-001: The engine shall support equals.

COND-OP-002: The engine shall support not equals.

COND-OP-003: The engine shall support is blank.

COND-OP-004: The engine shall support is not blank.

COND-OP-005: The engine shall support in list.

COND-OP-006: The engine shall support not in list.

### 7.2 Numeric Operators

COND-OP-010: The engine shall support greater than.

COND-OP-011: The engine shall support greater than or equal to.

COND-OP-012: The engine shall support less than.

COND-OP-013: The engine shall support less than or equal to.

COND-OP-014: The engine shall support between.

COND-OP-015: The engine shall support not between.

### 7.3 String Operators

COND-OP-020: The engine shall support contains.

COND-OP-021: The engine shall support does not contain.

COND-OP-022: The engine shall support starts with.

COND-OP-023: The engine shall support ends with.

COND-OP-024: The engine may support regex only for technical users if approved by security.

### 7.4 Date Operators

COND-OP-030: The engine shall support before.

COND-OP-031: The engine shall support after.

COND-OP-032: The engine shall support on.

COND-OP-033: The engine shall support on or before.

COND-OP-034: The engine shall support on or after.

COND-OP-035: The engine shall support within date range.

### 7.5 Lookup Operators

COND-OP-040: The engine shall support lookup id equals.

COND-OP-041: The engine shall support lookup code equals.

COND-OP-042: The engine shall support lookup attribute equals where the attribute is exposed in schema.

COND-OP-043: The engine must not allow unrestricted lookup table querying from expressions.

## 8. Condition Builder Requirements

COND-BLD-001: The system shall provide a condition builder for authorized admins.

COND-BLD-002: The condition builder shall display fields from the selected entity schema.

COND-BLD-003: The condition builder shall filter operators based on selected field data type.

COND-BLD-004: The condition builder shall support nested AND/OR groups.

COND-BLD-005: The condition builder shall support drag-and-drop of fields into condition groups.

COND-BLD-006: Dragging a field into a condition group shall create a condition row requiring operator and value selection.

COND-BLD-007: The condition builder shall support reordering conditions within a group.

COND-BLD-008: The condition builder shall support copying a condition group.

COND-BLD-009: The condition builder shall validate required operator and value before save.

COND-BLD-010: The condition builder shall show a human-readable display condition.

COND-BLD-011: The condition builder shall store structured condition JSON as executable metadata.

COND-BLD-012: The condition builder shall prevent unsupported field/operator combinations.

COND-BLD-013: The condition builder shall support read-only display for published versions.

## 9. Formula Builder Requirements

FORM-BLD-001: The system shall provide a formula builder for numeric and supported expression outputs.

FORM-BLD-002: The formula builder shall allow authorized admins to insert fields from the entity schema.

FORM-BLD-003: The formula builder shall allow drag-and-drop insertion of fields into formula editor.

FORM-BLD-004: The formula builder shall provide approved operators such as plus, minus, multiply, divide, parentheses, and comparison operators where applicable.

FORM-BLD-005: The formula builder shall provide approved functions.

FORM-BLD-006: The formula builder shall validate syntax before save.

FORM-BLD-007: The formula builder shall validate field references before publish.

FORM-BLD-008: The formula builder shall prevent division by zero where statically detectable and handle runtime division by zero with structured error.

FORM-BLD-009: The formula builder shall show formula output type.

FORM-BLD-010: The formula builder shall support test execution using sample payload.

FORM-BLD-011: The formula builder shall store formula expression and parsed metadata.

FORM-BLD-012: The formula builder shall not allow arbitrary code, external calls, file access, network calls, or database queries.

## 10. Expression Runtime Requirements

EXP-RUN-001: The engine shall evaluate expressions against a provided evaluation context.

EXP-RUN-002: The evaluation context shall include transaction payload fields approved for the rule type.

EXP-RUN-003: The evaluation context may include derived fields produced by Calculation Engine.

EXP-RUN-004: The evaluation context may include previous engine outputs if execution sequence allows it.

EXP-RUN-005: The engine shall return value, type, success/failure, and error details.

EXP-RUN-006: The engine shall not mutate input payload.

EXP-RUN-007: The engine shall be deterministic for the same input, version, and context.

EXP-RUN-008: The engine shall support null handling rules.

EXP-RUN-009: The engine shall support strict mode where missing field references fail evaluation.

EXP-RUN-010: The engine may support lenient mode where missing optional fields return null only if rule type permits.

EXP-RUN-011: Runtime evaluation shall record referenced fields for trace.

EXP-RUN-012: Runtime evaluation shall support bulk evaluation for line-item payloads.

## 11. Function Library Requirements

EXP-FUNC-001: The engine shall provide a controlled function catalog.

EXP-FUNC-002: Function catalog shall define function name, input types, output type, description, and examples.

EXP-FUNC-003: The engine shall support round(value, precision).

EXP-FUNC-004: The engine shall support abs(value).

EXP-FUNC-005: The engine shall support min(values).

EXP-FUNC-006: The engine shall support max(values).

EXP-FUNC-007: The engine shall support sum(values).

EXP-FUNC-008: The engine shall support coalesce(value1, value2, ...).

EXP-FUNC-009: The engine shall support if(condition, trueValue, falseValue) if product approves formula conditionals.

EXP-FUNC-010: The engine shall support dateDiff(date1, date2, unit) where required.

EXP-FUNC-011: The engine shall support percentage(base, rate).

EXP-FUNC-012: The engine shall support clamp(value, min, max) for deviation controls where useful.

EXP-FUNC-013: User-defined functions shall not be allowed in MVP unless implemented as platform-approved functions.

## 12. Field Binding Requirements

EXP-FLD-001: The engine shall bind expressions to entity schema fields by stable field identifier, not display label.

EXP-FLD-002: The engine shall store display label snapshot for readability.

EXP-FLD-003: If a field label changes, expression binding shall remain valid.

EXP-FLD-004: If a field is deleted or deactivated, publish validation shall detect impacted rules.

EXP-FLD-005: If a field data type changes, publish validation shall detect impacted rules.

EXP-FLD-006: Runtime shall use schema version compatible with the published rule version.

## 13. Security Requirements

EXP-SEC-001: Expressions shall execute in a sandboxed evaluator.

EXP-SEC-002: Expressions must not support arbitrary script execution.

EXP-SEC-003: Expressions must not access file system, network, environment variables, secrets, or database directly.

EXP-SEC-004: Expressions shall have maximum complexity limits.

EXP-SEC-005: Expressions shall have execution timeout limits.

EXP-SEC-006: Expressions shall have maximum nesting depth limits.

EXP-SEC-007: Expression errors shall not expose sensitive system internals.

## 14. Admin UI Requirements

EXP-UI-001: Condition builder shall provide field search.

EXP-UI-002: Condition builder shall show field type and description.

EXP-UI-003: Formula builder shall provide autocomplete for fields and functions.

EXP-UI-004: Formula builder shall show syntax errors inline.

EXP-UI-005: Formula builder shall show output preview when sample payload is provided.

EXP-UI-006: Published expressions shall display in read-only mode.

EXP-UI-007: The UI shall show both technical expression and business-readable expression where possible.

EXP-UI-008: The UI shall warn when a formula references a field not commonly available at the selected execution point.

## 15. API Requirements

EXP-API-001: The system shall expose internal APIs to validate a condition tree.

EXP-API-002: The system shall expose internal APIs to validate a formula expression.

EXP-API-003: The system shall expose internal APIs to evaluate a condition tree in simulation mode.

EXP-API-004: The system shall expose internal APIs to evaluate a formula in simulation mode.

EXP-API-005: The system shall expose internal APIs to retrieve fields available for a selected entity, document type, and execution point.

EXP-API-006: The system shall expose internal APIs to retrieve function catalog.

EXP-API-007: Runtime evaluation APIs shall be internal-only unless separately approved.

## 16. Error Handling

| Error | Expected Behavior |
|---|---|
| Field not found | Block publish; fail runtime in strict mode. |
| Invalid operator for field type | Block save or publish. |
| Missing value | Block save. |
| Invalid formula syntax | Block save. |
| Division by zero | Return structured runtime error. |
| Function not allowed | Block save/publish. |
| Expression timeout | Fail safely with configured error. |
| Too many nested groups | Block save with complexity error. |

## 17. Audit Requirements

EXP-AUD-001: Expression create/update shall be audited through rule version audit.

EXP-AUD-002: Runtime expression evaluation shall provide trace details when used in a runtime rule.

EXP-AUD-003: Trace shall include expression version/reference, input field references, output, and error if any.

## 18. Examples

### 18.1 Condition Example - Sale Invoice Source Rule

Business condition:

```text
Creation Mode = From Sale Order
AND Source Status = Approved
AND Pending Invoice Quantity > 0
```

Expected output: true or false.

### 18.2 Formula Example - Pending Delivery Quantity

```text
Pending Delivery Quantity = Sale Invoice Quantity - Already Delivered Quantity
```

Expected output: numeric quantity.

### 18.3 Formula Example - Taxable Amount

```text
Taxable Amount = Base Amount - Discount Amount + Pre Tax Charges
```

Expected output: amount.

### 18.4 Approval Condition Example

```text
Invoice Total > 100000
OR Discount Percentage > 5
```

Expected output: approval required decision condition is true.

## 19. Acceptance Criteria

AC-EXP-001: Given a user selects a numeric field, when building condition, then numeric operators shall be available and string-only operators shall be hidden.

AC-EXP-002: Given a formula references an inactive field, when publishing the rule, then publish shall be blocked.

AC-EXP-003: Given a condition tree is valid, when evaluated against payload, then the engine shall return true or false with trace.

AC-EXP-004: Given formula has syntax error, when user saves, then save shall be blocked with exact error location.

AC-EXP-005: Given a published formula is viewed, when opened by admin, then it shall be read-only.

## 20. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| User attempts to use unsupported operator | Block configuration. |
| User references deleted field | Block publish. |
| User enters text value for numeric field | Block save. |
| User creates condition group without conditions | Block publish. |
| User creates formula with circular reference | Block publish. |
| Runtime payload missing required field | Fail strict evaluation. |

## 21. Edge Cases

| Edge Case | Handling |
|---|---|
| Null numeric field in formula | Use configured null behavior; default fail for required numeric fields. |
| Empty list in sum function | Return 0 only if function policy allows; otherwise warning. |
| Date timezone differences | Server timezone/context policy shall apply. |
| Very large line-item list | Bulk evaluation should be optimized and time bounded. |
| Field renamed after publish | Stable field ID keeps expression valid. |

## 22. Dependencies

- Rule Platform Foundation.
- Entity metadata service.
- RBAC.
- Simulation service hooks.
- Audit service.

## 23. Open Questions

EXP-OQ-001: Should MVP include conditional if() function in formulas?

EXP-OQ-002: Should regex be allowed for business admins or only technical admins?

EXP-OQ-003: Should formulas support currency conversion functions in MVP or defer to finance/currency service?

EXP-OQ-004: Should expression language be FEEL-inspired or custom simplified syntax?

## 24. AI Developer Agent Notes

AIDEV-EXP-001: Implement safe parsing and evaluation. Do not use eval-like arbitrary execution.

AIDEV-EXP-002: Store field bindings by stable field IDs.

AIDEV-EXP-003: Do not allow expressions to call APIs or query database directly.

AIDEV-EXP-004: Build expression validation separately from runtime evaluation.

AIDEV-EXP-005: Ensure evaluation output is traceable.
