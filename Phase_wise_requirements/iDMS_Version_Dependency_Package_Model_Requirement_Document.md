# iDMS Admin Studio — Version, Dependency, and Package Model Requirement Document

**Document Type:** Functional + Metadata Architecture Requirement  
**Audience:** AI Developer, Backend Architect, DevOps Architect, Product Owner, QA  
**Status:** Frozen for implementation planning  
**Scope Area:** Entity Metadata Architecture → Deployment Safety  

---

## 1. Objective

This document defines how iDMS metadata shall be versioned, dependency-aware, packageable, deployable, upgradeable, and rollback-safe. The goal is to prevent Entity Designer from becoming a local configuration screen with no enterprise deployment discipline.

Version, Dependency, and Package are grouped in one document because they must be designed together. Versioning without dependency impact is unsafe. Packaging without versioning is not deployable. Dependency tracking without package ownership is incomplete.

---

## 2. Product Position

The platform must support:

1. Metadata lifecycle safety
2. Version history
3. Dependency impact analysis
4. Package ownership
5. Environment promotion
6. Install and upgrade behavior
7. Rollback planning
8. Release auditability
9. Conflict detection across layers
10. Controlled migration for destructive changes

---

## 3. Core Principles

1. Every active metadata artifact must have a version.
2. Every active metadata artifact must have an owner: platform, vertical, tenant, node, or package.
3. Every deployable artifact must declare dependencies.
4. Breaking changes must require impact analysis and migration plan.
5. Package install and upgrade must be deterministic.
6. Draft metadata must not affect runtime until published.
7. Runtime contracts must include metadata version signature.
8. Rollback must be explicit and safe; not every change is rollbackable.

---

## 4. Metadata Objects Covered

Versioning and dependency tracking shall apply to:

- EntityDefinition
- FieldDefinition
- RelationshipDefinition
- ConstraintDefinition
- ValidationRuleDefinition
- LifecycleModelDefinition
- ViewDefinition
- RelationViewDefinition
- ActionDefinition
- SecurityDefinition
- IntegrationContractDefinition
- RuntimeContractDefinition version output
- PackageDefinition
- TranslationDefinition later
- AnalyticsContractDefinition later

---

## 5. VersionDefinition

### 5.1 Purpose

VersionDefinition tracks the lifecycle and change history of metadata artifacts.

### 5.2 Version Metadata Model

```json
{
  "versionId": "ver_field_customer_gstin_1_1_0",
  "artifactType": "FieldDefinition",
  "artifactId": "fld_customer_gstin",
  "semanticVersion": "1.1.0",
  "changeType": "minor",
  "status": "draft",
  "createdBy": "usr_admin",
  "createdAt": "2026-05-11T10:00:00Z",
  "approvedBy": null,
  "approvedAt": null,
  "activatedAt": null,
  "changeSummary": "Added stricter GSTIN validation and export masking.",
  "compatibility": {
    "backwardCompatible": true,
    "requiresDataMigration": false,
    "requiresRuntimeRestart": false,
    "requiresRecompile": true
  },
  "rollback": {
    "rollbackSupported": true,
    "rollbackTargetVersionId": "ver_field_customer_gstin_1_0_0"
  }
}
```

### 5.3 Version Statuses

| Status | Meaning |
|---|---|
| draft | Being edited; not used by runtime |
| review | Awaiting approval |
| approved | Approved but not active |
| active | Used by runtime |
| deprecated | Still works but should not be used for new references |
| retired | Not available for new runtime usage |
| superseded | Replaced by newer active version |
| failed | Publish or migration failed |
| rolled_back | Version was rolled back |

### 5.4 Version Change Types

| Change Type | Meaning | Example |
|---|---|---|
| patch | Non-breaking correction | Label typo, help text change |
| minor | Backward-compatible addition | Add optional field, add view |
| major | Breaking or behavior-changing | Change field type, remove field, change requiredness |
| hotfix | Urgent production correction | Fix incorrect validation |
| migration | Requires data or metadata migration | Split field, convert enum source |

---

## 6. DependencyDefinition

### 6.1 Purpose

DependencyDefinition tracks direct and reverse relationships between metadata artifacts. It powers impact analysis, activation checks, package validation, deployment preview, and rollback planning.

### 6.2 Dependency Metadata Model

```json
{
  "dependencyId": "dep_view_job_card_form_customer_field",
  "sourceArtifactType": "ViewDefinition",
  "sourceArtifactId": "view_job_card_form",
  "targetArtifactType": "FieldDefinition",
  "targetArtifactId": "fld_job_card_customer_id",
  "dependencyType": "uses_field",
  "required": true,
  "impactSeverity": "breaking_if_removed",
  "runtimeImpact": ["ui_form", "api_write"],
  "packageImpact": {
    "sourcePackageId": "pkg_auto_service_core",
    "targetPackageId": "pkg_customer_core"
  },
  "status": "active"
}
```

### 6.3 Dependency Types

| Dependency Type | Example |
|---|---|
| uses_field | View uses field |
| validates_field | Validation rule references field |
| references_relationship | Rule or view references relationship |
| executes_action | View exposes action |
| requires_permission | Action requires permission |
| uses_view | Lookup uses lookup view |
| uses_lifecycle_state | Rule applies to lifecycle state |
| uses_package | Package depends on another package |
| uses_api_contract | Integration depends on API contract |
| uses_picklist | Field uses picklist definition |
| uses_translation | View or field label uses translation bundle |
| uses_storage | Field maps to PostgreSQL column/table |

### 6.4 Impact Severity

| Severity | Meaning |
|---|---|
| info | Safe informational dependency |
| warning | Change may affect behavior but not necessarily break |
| breaking | Runtime break or data loss risk |
| migration_required | Data migration or metadata migration required |
| security_critical | May expose or restrict sensitive access |
| integration_breaking | Breaks external API/import/export contract |

---

## 7. PackageDefinition

### 7.1 Purpose

PackageDefinition is a deployable bundle of metadata and optional seed data. It supports productization, verticalization, tenant rollout, and controlled upgrades.

Package is not just an entity template. A template helps create something. A package installs and manages a governed set of metadata.

### 7.2 Package Types

| Package Type | Purpose |
|---|---|
| platform_core | Base platform metadata |
| vertical_core | Automobile, real estate, etc. |
| module_package | Finance, Service, Parts, CRM |
| oem_extension | Bajaj, TVS, HUL, AkzoNobel-specific capability |
| tenant_extension | Customer/dealer-specific extension |
| localization_pack | Country, state, tax, language, legal format |
| integration_pack | OEM, GST, payment gateway, telephony, accounting integration |
| hotfix_package | Emergency correction |

### 7.3 Package Metadata Model

```json
{
  "packageId": "pkg_auto_service_core",
  "packageCode": "AUTO_SERVICE_CORE",
  "name": "Automobile Service Core",
  "description": "Core service module metadata for automobile DMS.",
  "packageType": "vertical_core",
  "namespace": "auto_service",
  "version": "1.4.0",
  "status": "draft",
  "ownerLayer": "Vertical",
  "components": [
    {"artifactType": "EntityDefinition", "artifactId": "ent_service_job_card", "version": "1.4.0"},
    {"artifactType": "FieldDefinition", "artifactId": "fld_job_card_customer_id", "version": "1.2.0"},
    {"artifactType": "RelationshipDefinition", "artifactId": "rel_job_card_customer", "version": "1.1.0"}
  ],
  "dependencies": [
    {"packageCode": "CUSTOMER_CORE", "minVersion": "1.2.0"},
    {"packageCode": "VEHICLE_CORE", "minVersion": "1.1.0"}
  ],
  "installPolicy": {
    "allowFreshInstall": true,
    "allowUpgrade": true,
    "allowUninstall": false,
    "requiresApproval": true
  },
  "migrationPlanId": "mig_auto_service_core_1_3_to_1_4"
}
```

---

## 8. Package Contents

A package may include:

| Component | Included in MVP? |
|---|---:|
| EntityDefinition | Yes |
| FieldDefinition | Yes |
| RelationshipDefinition | Yes |
| ViewDefinition | Yes |
| ActionDefinition | Yes |
| ValidationRuleDefinition | Yes |
| SecurityDefinition | Yes |
| LifecycleModelDefinition | Yes |
| IntegrationContractDefinition | Yes |
| Seed picklist values | Yes |
| Seed master/config values | Limited |
| TranslationDefinition | Later |
| AnalyticsContractDefinition | Later |
| Workflow definitions | Yes if workflow engine stable |
| Migration scripts | Yes for upgrade packages |
| Test cases | Yes for critical metadata |

---

## 9. Deployment Safety Model

### 9.1 Publish Pipeline

1. Save draft metadata.
2. Run metadata compile checks.
3. Generate dependency graph.
4. Generate impact analysis.
5. Run package dependency validation.
6. Run validation rule test cases.
7. Run migration dry-run if required.
8. Run security exposure checks.
9. Generate deployment preview.
10. Approve publish.
11. Activate version.
12. Invalidate runtime contract cache.
13. Audit publish result.

### 9.2 Deployment Preview Must Show

| Area | Required Output |
|---|---|
| Components added | New entities, fields, views, rules, actions |
| Components changed | Before/after summary |
| Components deprecated | Impact and replacement |
| Components removed | Blocked unless migration approved |
| Dependencies | New, changed, missing, breaking |
| Security impact | New access, removed access, masking changes |
| API impact | Added/removed/changed fields |
| Runtime impact | UI contracts affected |
| Migration | Data backfill or transform required |
| Rollback | Supported or not supported |

---

## 10. Breaking Change Rules

The following changes must be treated as breaking or migration-required:

| Change | Classification |
|---|---|
| Remove active field | Breaking + migration required |
| Change field logical data type | Breaking + migration required |
| Reduce text length below existing data | Breaking + migration required |
| Reduce decimal precision/scale | Breaking + migration required |
| Make optional field mandatory | Potentially breaking; data scan required |
| Remove picklist value used by records | Breaking unless value migration exists |
| Change relationship target entity | Breaking + migration required |
| Change lookup to parent-child | Breaking + lifecycle impact |
| Remove view used as default | Breaking for UI runtime |
| Remove action used by workflow | Breaking |
| Loosen security on regulated field | Security critical |
| Change API contract output | Integration impact |

---

## 11. Requirements

REQ-VDP-001: System shall version every active metadata artifact.

REQ-VDP-002: System shall generate dependency graph for metadata artifacts.

REQ-VDP-003: System shall support package definition with components, dependencies, version, install policy, and migration plan.

REQ-VDP-004: System shall block activation when required dependencies are missing, inactive, incompatible, or lower than required version.

REQ-VDP-005: System shall classify changes as patch, minor, major, hotfix, or migration.

REQ-VDP-006: System shall provide impact analysis before activation or package deployment.

REQ-VDP-007: System shall support deployment preview before publish.

REQ-VDP-008: System shall support rollback only when rollbackSupported is true.

REQ-VDP-009: System shall invalidate runtime contract cache after metadata publish, package install, upgrade, rollback, or security change.

REQ-VDP-010: System shall audit all metadata publish, install, upgrade, rollback, and failed deployment attempts.

REQ-VDP-011: System shall prevent destructive changes without migration plan and approval.

REQ-VDP-012: System shall support package dependency order resolution.

REQ-VDP-013: System shall support environment promotion from development to test to production-like tenants where applicable.

---

## 12. APIs

### 12.1 Create Package

`POST /admin/metadata/packages`

### 12.2 Add Component to Package

`POST /admin/metadata/packages/{packageId}/components`

### 12.3 Validate Package

`POST /admin/metadata/packages/{packageId}/validate`

### 12.4 Generate Impact Analysis

`POST /admin/metadata/impact-analysis`

### 12.5 Publish Version

`POST /admin/metadata/versions/{versionId}/publish`

### 12.6 Install Package

`POST /admin/metadata/packages/{packageId}/install`

### 12.7 Upgrade Package

`POST /admin/metadata/packages/{packageId}/upgrade`

### 12.8 Rollback Package

`POST /admin/metadata/packages/{packageId}/rollback`

---

## 13. Compile-Time Validations

| Code | Scenario | Validation Message |
|---|---|---|
| VDP-COMP-001 | Missing version | Metadata artifact must have a version. |
| VDP-COMP-002 | Missing package owner | Package-owned artifact must declare package ID. |
| VDP-COMP-003 | Missing dependency | Required dependency is missing. |
| VDP-COMP-004 | Incompatible dependency version | Dependency version is below required minimum. |
| VDP-COMP-005 | Circular package dependency | Circular package dependency is not allowed. |
| VDP-COMP-006 | Breaking change without migration plan | Breaking change requires migration plan. |
| VDP-COMP-007 | Destructive change without approval | Destructive metadata change requires approval. |
| VDP-COMP-008 | Security exposure change | Security-critical change requires security review. |
| VDP-COMP-009 | API breaking change | API contract change requires integration impact approval. |
| VDP-COMP-010 | Rollback unsupported | Rollback cannot be performed for this change. |

---

## 14. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| AC-VDP-001 | Given an active field is used by a view and validation rule, when admin attempts to disable it, then impact analysis shows both dependencies. |
| AC-VDP-002 | Given a package depends on Customer Core 1.2.0, when target tenant has Customer Core 1.1.0, then package install is blocked. |
| AC-VDP-003 | Given optional field becomes mandatory, when existing records have null values, then publish requires migration/backfill decision. |
| AC-VDP-004 | Given metadata is published, when runtime contract is requested, then new metadata version signature is returned. |
| AC-VDP-005 | Given rollback is supported, when rollback is executed, then previous active version is restored and cache invalidated. |
| AC-VDP-006 | Given API output field is removed, when impact analysis runs, then integration-breaking impact is shown. |
| AC-VDP-007 | Given package install succeeds, then all package components are activated in dependency order. |
| AC-VDP-008 | Given package upgrade fails midway, then system must fail safely with clear status and no ambiguous runtime state. |

---

## 15. Negative Scenarios

| Scenario | Expected Behavior | Message |
|---|---|---|
| Circular package dependency | Block package validation | Circular package dependency detected. |
| Remove field used by active API contract | Block publish | Field is used by active API contract. |
| Package upgrade missing migration script | Block upgrade | Migration plan is required. |
| Runtime cache not invalidated after publish | Defect; must not happen | Runtime cache invalidation failed. |
| Rollback attempted after irreversible migration | Block rollback | Rollback is not supported for this version. |
| Security permission widened for regulated field | Require security review | Security-critical change detected. |
| Package uninstall would remove active entity | Block uninstall | Package cannot be uninstalled because active metadata is in use. |

---

## 16. Critical Review and Conflict Checks

1. **No conflict with EntityDefinition:** EntityDefinition references active version and package owner; VersionDefinition manages history.
2. **No conflict with FieldDefinition:** Field lifecycle and storage changes are versioned and dependency-checked here.
3. **No conflict with RelationshipDefinition:** Relationship target/cardinality changes are breaking and must require migration analysis.
4. **No conflict with RuntimeContractDefinition:** Runtime contract consumes active compiled versions and exposes metadataVersion.
5. **No conflict with SecurityDefinition:** Security changes are versioned and may require security review.
6. **Risk identified:** Packaging added late will force rework. Package ownership fields must exist in metadata now even if install UI comes later.
7. **Risk identified:** Rollback is often assumed but not always possible. Irreversible data migrations must mark rollback unsupported.
8. **Risk identified:** Impact analysis can become noisy. Severity classification and recommended action are mandatory.

---

## 17. Recommended MVP Build

Build now:

1. VersionDefinition table/model.
2. DependencyDefinition table/model.
3. PackageDefinition table/model.
4. Package component mapping.
5. Dependency scanner for fields, relationships, views, actions, validations, security, API contracts.
6. Impact analysis endpoint.
7. Publish pipeline with compile checks.
8. Runtime metadata version signature.
9. Cache invalidation after publish.
10. Basic package install/upgrade validation.

Defer:

1. Marketplace UI.
2. Complex semantic version negotiation.
3. Multi-environment visual deployment pipelines.
4. Automated SQL migration generation for every case.
5. Full tenant package marketplace.

---

## 18. Next Implementation Tasks

1. Add ownership and version fields to all metadata artifacts.
2. Build dependency graph generator.
3. Build metadata impact analyzer.
4. Build package manifest schema.
5. Build publish and activation workflow.
6. Build migration-required classifier.
7. Build package install/upgrade preflight checks.
8. Add metadata audit log.
9. Add runtime cache invalidation hooks.
10. Add cross-document test matrix for destructive changes.


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
