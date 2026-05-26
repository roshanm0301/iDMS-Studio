import {
  ENTITY_CATEGORIES,
  METADATA_STATUSES,
  STRUCTURAL_LAYERS,
  type EntityCategory,
  type MetadataStatus,
  type StructuralLayer,
} from './shared';
import {
  fail,
  isPlainObject,
  ok,
  rejectKeys,
  type ValidationIssue,
  type ValidationResult,
} from './validation';

const SNAKE_CASE_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const ENTITY_ID_PATTERN = /^ent_[a-z0-9_]+$/;
const ENTITY_CODE_PATTERN = /^[A-Z0-9_]{1,20}$/;

export const ENTITY_DOMAINS = [
  'sales',
  'service',
  'finance',
  'spare_parts',
  'crm',
  'accounting',
  'taxation',
  'inventory',
  'network',
  'system',
  'reference',
] as const;
export type EntityDomain = (typeof ENTITY_DOMAINS)[number];

export const BUSINESS_OBJECT_TYPES = [
  'operational_document',
  'financial_document',
  'party_master',
  'asset_master',
  'product_master',
  'configuration_record',
  'accounting_entry',
  'reference_data',
  'system_object',
] as const;
export type BusinessObjectType = (typeof BUSINESS_OBJECT_TYPES)[number];

export const INDUSTRY_VERTICALS = ['core', 'automobile', 'real_estate', 'fmcg', 'paints', 'system'] as const;
export type IndustryVertical = (typeof INDUSTRY_VERTICALS)[number];

export const ENTITY_STORAGE_STRATEGIES = [
  'physical_table',
  'shared_table',
  'extension_table',
  'jsonb_extension',
  'external_entity',
  'virtual_entity',
] as const;
export type EntityStorageStrategy = (typeof ENTITY_STORAGE_STRATEGIES)[number];

export const PRIMARY_KEY_STRATEGIES = ['uuid', 'bigserial', 'composite'] as const;
export type PrimaryKeyStrategy = (typeof PRIMARY_KEY_STRATEGIES)[number];

export interface EntityClassification {
  domain: EntityDomain;
  module: string;
  entityCategory: EntityCategory;
  businessObjectType: BusinessObjectType;
  industryVertical: IndustryVertical;
  lookupEligible: boolean;
  lookupOverrideReason?: string;
}

export interface EntityOwnership {
  owningLayer: StructuralLayer;
  owningPackageId: string;
  owningModule: string;
  protected: boolean;
  extensionPolicyId: string;
  overridePolicyId: string;
}

export interface EntityStoragePolicy {
  storageStrategy: EntityStorageStrategy;
  tableName?: string | null;
  primaryKeyField: string;
  primaryKeyStrategy: PrimaryKeyStrategy;
  compositePrimaryKeyFields?: string[];
  tenantScoped: boolean;
  nodeScoped: boolean;
  softDeletePolicyId?: string | null;
  partitionPolicyId?: string | null;
  retentionPolicyId?: string | null;
}

export interface EntityDisplayDefaults {
  defaultDisplayFieldId?: string | null;
  defaultListViewId?: string | null;
  defaultFormViewId?: string | null;
  defaultLookupViewId?: string | null;
  titleFormat?: string | null;
  subtitleFormat?: string | null;
}

export interface EntityLifecycle {
  metadataStatus: MetadataStatus;
  recordLifecycleModelId?: string | null;
  activationPolicyId: string;
  versionId: string;
  activatedAt?: string | null;
  deprecatedAt?: string | null;
  retiredAt?: string | null;
}

export interface EntityRuntimePolicies {
  auditPolicyId: string;
  securityPolicyId: string;
  apiExposurePolicyId: string;
  importPolicyId: string;
  exportPolicyId: string;
  analyticsPolicyId: string;
  searchPolicyId: string;
  localizationPolicyId?: string | null;
}

export interface EntityGovernanceFlags {
  allowExtension: boolean;
  allowFieldAddition: boolean;
  allowRelationshipAddition: boolean;
  allowViewOverride: boolean;
  allowActionAddition: boolean;
  allowRequirednessRelaxation: boolean;
  allowApiExposureOverride: boolean;
}

export interface EntitySystemAudit {
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  activatedBy?: string | null;
  deprecatedBy?: string | null;
  retiredBy?: string | null;
  changeReason?: string | null;
}

export interface EntityReferences {
  fieldIds: string[];
  relationshipIds: string[];
  validationRuleIds: string[];
  securityDefinitionIds: string[];
  viewIds: string[];
  actionIds: string[];
}

export interface EntityDefinitionMetadata {
  entityId: string;
  apiName: string;
  label: string;
  pluralLabel: string;
  description?: string;
  entityCode?: string;
  namespace: string;
  classification: EntityClassification;
  ownership: EntityOwnership;
  storage: EntityStoragePolicy;
  display: EntityDisplayDefaults;
  lifecycle: EntityLifecycle;
  runtimePolicies: EntityRuntimePolicies;
  governanceFlags: EntityGovernanceFlags;
  systemAudit: EntitySystemAudit;
  references: EntityReferences;
}

export interface EntityValidationContext {
  existingEntities?: EntityDefinitionMetadata[];
  existingTableNames?: string[];
  activeFieldIds?: string[];
  activeViewIds?: string[];
  activePackageIds?: string[];
  activePolicyIds?: string[];
}

export const ENTITY_ALLOWED_TRANSITIONS: Record<MetadataStatus, MetadataStatus[]> = {
  draft: ['active', 'archived'],
  active: ['deprecated'],
  deprecated: ['retired', 'active'],
  retired: [],
  archived: [],
};

const CATEGORY_BUSINESS_OBJECTS: Record<EntityCategory, BusinessObjectType[]> = {
  transaction: ['operational_document', 'financial_document'],
  master_data: ['party_master', 'asset_master', 'product_master', 'reference_data'],
  configuration: ['configuration_record', 'reference_data', 'system_object'],
  ledger_like: ['accounting_entry', 'financial_document'],
};

function addIssue(
  issues: ValidationIssue[],
  code: string,
  message: string,
  path?: string,
  severity: ValidationIssue['severity'] = 'error',
): void {
  issues.push({ code, message, path, severity });
}

function requireObject(input: Record<string, unknown>, key: string, issues: ValidationIssue[], code: string, message: string): Record<string, unknown> | null {
  const value = input[key];
  if (isPlainObject(value)) return value;
  addIssue(issues, code, message, key);
  return null;
}

function requireStringField(
  value: unknown,
  path: string,
  code: string,
  message: string,
  issues: ValidationIssue[],
  options: { min?: number; max?: number; tooShortCode?: string; tooLongCode?: string; trim?: boolean } = {},
): value is string {
  if (typeof value !== 'string' || (options.trim !== false && value.trim().length === 0)) {
    addIssue(issues, code, message, path);
    return false;
  }

  const normalized = options.trim === false ? value : value.trim();
  if (options.min !== undefined && normalized.length < options.min) {
    addIssue(issues, options.tooShortCode ?? code, message, path);
    return false;
  }
  if (options.max !== undefined && normalized.length > options.max) {
    addIssue(issues, options.tooLongCode ?? code, message, path);
    return false;
  }
  return true;
}

function requireBoolean(value: unknown, path: string, code: string, message: string, issues: ValidationIssue[]): value is boolean {
  if (typeof value === 'boolean') return true;
  addIssue(issues, code, message, path);
  return false;
}

function requireOneOfValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  code: string,
  message: string,
  issues: ValidationIssue[],
): value is T {
  if (typeof value === 'string' && allowed.includes(value as T)) return true;
  addIssue(issues, code, message, path);
  return false;
}

function validateSnakeCase(value: unknown, path: string, requiredCode: string, invalidCode: string, issues: ValidationIssue[], max = 63): value is string {
  if (!requireStringField(value, path, requiredCode, 'API name is required.', issues, { max, tooLongCode: invalidCode })) return false;
  const str = value.trim();
  if (!SNAKE_CASE_PATTERN.test(str)) {
    addIssue(issues, invalidCode, 'API name must use lowercase letters, numbers, and underscores only.', path);
    return false;
  }
  if (str.length > max) {
    addIssue(issues, invalidCode, `API name cannot exceed ${max} characters.`, path);
    return false;
  }
  return true;
}

function validateIdArray(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) {
    addIssue(issues, 'ENTITY_REFERENCES_INVALID', `${path} must be an array of IDs.`, path);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      addIssue(issues, 'ENTITY_REFERENCE_ID_INVALID', `${path} must contain only non-empty IDs.`, `${path}.${index}`);
    }
  });
}

function validateEntityIdentity(input: Record<string, unknown>, issues: ValidationIssue[], context?: EntityValidationContext): void {
  if (requireStringField(input.entityId, 'entityId', 'ENTITY_ID_REQUIRED', 'Entity ID is required.', issues)) {
    if (!ENTITY_ID_PATTERN.test(input.entityId)) {
      addIssue(issues, 'ENTITY_ID_INVALID', 'Entity ID must start with ent_ and use lowercase letters, numbers, and underscores only.', 'entityId');
    }
  }

  validateSnakeCase(input.apiName, 'apiName', 'ENTITY_API_NAME_REQUIRED', 'ENTITY_API_NAME_INVALID', issues);

  if (requireStringField(input.label, 'label', 'ENTITY_LABEL_REQUIRED', 'Entity label is required.', issues, {
    min: 2,
    max: 100,
    tooShortCode: 'ENTITY_LABEL_TOO_SHORT',
    tooLongCode: 'ENTITY_LABEL_TOO_LONG',
  })) {
    if (input.label.trim().length < 2) addIssue(issues, 'ENTITY_LABEL_TOO_SHORT', 'Entity label must contain at least 2 characters.', 'label');
  }

  requireStringField(input.pluralLabel, 'pluralLabel', 'ENTITY_PLURAL_LABEL_REQUIRED', 'Plural label is required.', issues, {
    min: 2,
    max: 120,
    tooShortCode: 'ENTITY_PLURAL_LABEL_TOO_SHORT',
    tooLongCode: 'ENTITY_PLURAL_LABEL_TOO_LONG',
  });

  if (typeof input.description === 'string' && input.description.length > 1000) {
    addIssue(issues, 'ENTITY_DESCRIPTION_TOO_LONG', 'Entity description cannot exceed 1000 characters.', 'description');
  }

  if (input.entityCode !== undefined && input.entityCode !== null && input.entityCode !== '') {
    if (typeof input.entityCode !== 'string' || !ENTITY_CODE_PATTERN.test(input.entityCode)) {
      addIssue(issues, 'ENTITY_CODE_INVALID', 'Entity code must be uppercase letters, numbers, or underscore and cannot exceed 20 characters.', 'entityCode');
    }
  }

  validateSnakeCase(input.namespace, 'namespace', 'ENTITY_NAMESPACE_REQUIRED', 'ENTITY_NAMESPACE_INVALID', issues);

  if (context?.existingEntities && typeof input.apiName === 'string' && typeof input.namespace === 'string') {
    const duplicate = context.existingEntities.some(entity =>
      entity.entityId !== input.entityId
      && entity.apiName === input.apiName
      && entity.namespace === input.namespace,
    );
    if (duplicate) {
      addIssue(issues, 'ENTITY_API_NAME_DUPLICATE', 'API name already exists in this namespace.', 'apiName');
    }
  }
}

function validateClassification(classification: Record<string, unknown>, issues: ValidationIssue[]): EntityCategory | null {
  requireOneOfValue(classification.domain, ENTITY_DOMAINS, 'classification.domain', 'ENTITY_DOMAIN_INVALID', 'Entity domain is required.', issues);
  requireStringField(classification.module, 'classification.module', 'ENTITY_MODULE_REQUIRED', 'Module is required.', issues, { min: 2, max: 120 });
  let hasCategory = false;
  if (classification.entityCategory === undefined || classification.entityCategory === null || classification.entityCategory === '') {
    addIssue(issues, 'ENTITY_CATEGORY_REQUIRED', 'Entity category is required.', 'classification.entityCategory');
  } else {
    hasCategory = requireOneOfValue(
      classification.entityCategory,
      ENTITY_CATEGORIES,
      'classification.entityCategory',
      'ENTITY_CATEGORY_INVALID',
      'Selected entity category is not supported.',
      issues,
    );
  }
  const hasBusinessObject = requireOneOfValue(
    classification.businessObjectType,
    BUSINESS_OBJECT_TYPES,
    'classification.businessObjectType',
    'ENTITY_BUSINESS_OBJECT_TYPE_REQUIRED',
    'Business object type is required.',
    issues,
  );
  requireOneOfValue(
    classification.industryVertical,
    INDUSTRY_VERTICALS,
    'classification.industryVertical',
    'ENTITY_INDUSTRY_VERTICAL_INVALID',
    'Industry vertical is required.',
    issues,
  );
  requireBoolean(classification.lookupEligible, 'classification.lookupEligible', 'ENTITY_LOOKUP_ELIGIBLE_REQUIRED', 'Lookup eligibility is required.', issues);

  if (hasCategory && hasBusinessObject) {
    const allowed = CATEGORY_BUSINESS_OBJECTS[classification.entityCategory as EntityCategory];
    if (!allowed.includes(classification.businessObjectType as BusinessObjectType)) {
      addIssue(
        issues,
        'ENTITY_BUSINESS_OBJECT_TYPE_INVALID',
        'Business object type is not valid for the selected entity category.',
        'classification.businessObjectType',
      );
    }
  }

  if (classification.entityCategory === 'master_data' && classification.lookupEligible === false && !classification.lookupOverrideReason) {
    addIssue(
      issues,
      'ENTITY_MASTER_LOOKUP_OVERRIDE_REASON_REQUIRED',
      'Master Data entities are lookup eligible by default. Provide an override reason.',
      'classification.lookupOverrideReason',
    );
  }

  return hasCategory ? classification.entityCategory as EntityCategory : null;
}

function validateOwnership(ownership: Record<string, unknown>, issues: ValidationIssue[], context?: EntityValidationContext): void {
  if (ownership.owningLayer === 'role') {
    addIssue(issues, 'ENTITY_LAYER_ROLE_NOT_ALLOWED', 'Role cannot own entity schema. Use security and view permissions for role-specific behavior.', 'ownership.owningLayer', 'blocking_error');
  }
  requireOneOfValue(ownership.owningLayer, STRUCTURAL_LAYERS, 'ownership.owningLayer', 'ENTITY_OWNING_LAYER_INVALID', 'Owning layer is invalid.', issues);
  requireStringField(ownership.owningPackageId, 'ownership.owningPackageId', 'ENTITY_OWNING_PACKAGE_REQUIRED', 'Owning package is required.', issues);
  requireStringField(ownership.owningModule, 'ownership.owningModule', 'ENTITY_OWNING_MODULE_REQUIRED', 'Owning module is required.', issues);
  requireBoolean(ownership.protected, 'ownership.protected', 'ENTITY_PROTECTED_FLAG_REQUIRED', 'Protected flag is required.', issues);
  requireStringField(ownership.extensionPolicyId, 'ownership.extensionPolicyId', 'ENTITY_EXTENSION_POLICY_REQUIRED', 'Extension policy is required.', issues);
  requireStringField(ownership.overridePolicyId, 'ownership.overridePolicyId', 'ENTITY_OVERRIDE_POLICY_REQUIRED', 'Override policy is required.', issues);

  if (context?.activePackageIds && typeof ownership.owningPackageId === 'string' && !context.activePackageIds.includes(ownership.owningPackageId)) {
    addIssue(issues, 'ENTITY_OWNING_PACKAGE_INACTIVE', 'Owning package must reference an active PackageDefinition.', 'ownership.owningPackageId');
  }
}

function validateStorage(storage: Record<string, unknown>, category: EntityCategory | null, issues: ValidationIssue[], context?: EntityValidationContext): void {
  const hasStorageStrategy = requireOneOfValue(
    storage.storageStrategy,
    ENTITY_STORAGE_STRATEGIES,
    'storage.storageStrategy',
    'ENTITY_STORAGE_STRATEGY_REQUIRED',
    'Storage strategy is required.',
    issues,
  );

  if (hasStorageStrategy && ['physical_table', 'shared_table'].includes(storage.storageStrategy as string)) {
    if (!requireStringField(storage.tableName, 'storage.tableName', 'ENTITY_TABLE_NAME_REQUIRED', 'Table name is required for physical table storage.', issues)) {
      // already recorded
    } else if (!SNAKE_CASE_PATTERN.test(storage.tableName)) {
      addIssue(issues, 'ENTITY_TABLE_NAME_INVALID', 'Table name must use lowercase letters, numbers, and underscores only.', 'storage.tableName');
    }
  }

  requireStringField(storage.primaryKeyField, 'storage.primaryKeyField', 'ENTITY_PRIMARY_KEY_FIELD_REQUIRED', 'Primary key field is required.', issues);
  requireOneOfValue(storage.primaryKeyStrategy, PRIMARY_KEY_STRATEGIES, 'storage.primaryKeyStrategy', 'ENTITY_PRIMARY_KEY_STRATEGY_REQUIRED', 'Primary key strategy is required.', issues);
  requireBoolean(storage.tenantScoped, 'storage.tenantScoped', 'ENTITY_TENANT_SCOPED_REQUIRED', 'Tenant scoped flag is required.', issues);
  requireBoolean(storage.nodeScoped, 'storage.nodeScoped', 'ENTITY_NODE_SCOPED_REQUIRED', 'Node scoped flag is required.', issues);

  if (storage.primaryKeyStrategy === 'composite' && (!Array.isArray(storage.compositePrimaryKeyFields) || storage.compositePrimaryKeyFields.length === 0)) {
    addIssue(issues, 'ENTITY_COMPOSITE_PRIMARY_KEY_REQUIRED', 'Composite primary key definition is required.', 'storage.compositePrimaryKeyFields');
  }

  if (category === 'ledger_like' && storage.softDeletePolicyId) {
    addIssue(issues, 'ENTITY_LEDGER_DELETE_NOT_ALLOWED', 'Ledger-like entities cannot allow delete. Use reversal or counter-entry.', 'storage.softDeletePolicyId', 'blocking_error');
  }

  if (category !== 'ledger_like' && !storage.softDeletePolicyId) {
    addIssue(issues, 'ENTITY_SOFT_DELETE_POLICY_REQUIRED', 'Soft delete policy is required except for Ledger-like entities.', 'storage.softDeletePolicyId');
  }

  if (context?.existingTableNames && typeof storage.tableName === 'string' && context.existingTableNames.includes(storage.tableName)) {
    addIssue(issues, 'ENTITY_TABLE_NAME_DUPLICATE', 'Table name already exists.', 'storage.tableName');
  }
}

function validateDisplay(display: Record<string, unknown>, classification: Record<string, unknown> | null, lifecycle: Record<string, unknown> | null, issues: ValidationIssue[], context?: EntityValidationContext): void {
  const isActive = lifecycle?.metadataStatus === 'active';
  const lookupEligible = classification?.lookupEligible === true;

  if (isActive && !display.defaultDisplayFieldId) {
    addIssue(issues, 'ENTITY_DISPLAY_FIELD_REQUIRED', 'Default display field is required before activation.', 'display.defaultDisplayFieldId', 'blocking_error');
  }

  if (isActive && !display.defaultListViewId) {
    addIssue(issues, 'ENTITY_DEFAULT_LIST_VIEW_REQUIRED', 'Default list view is required before activation.', 'display.defaultListViewId', 'blocking_error');
  }

  if (isActive && !display.defaultFormViewId) {
    addIssue(issues, 'ENTITY_DEFAULT_FORM_VIEW_REQUIRED', 'Default form view is required before activation.', 'display.defaultFormViewId', 'blocking_error');
  }

  if (lookupEligible && !display.defaultLookupViewId) {
    addIssue(issues, 'ENTITY_LOOKUP_VIEW_REQUIRED', 'Default lookup view is required for lookup eligible entities.', 'display.defaultLookupViewId', 'blocking_error');
  }

  if (context?.activeFieldIds && typeof display.defaultDisplayFieldId === 'string' && !context.activeFieldIds.includes(display.defaultDisplayFieldId)) {
    addIssue(issues, 'ENTITY_DISPLAY_FIELD_INACTIVE', 'Default display field must reference an active field.', 'display.defaultDisplayFieldId');
  }

  if (context?.activeViewIds) {
    for (const [path, value] of [
      ['display.defaultListViewId', display.defaultListViewId],
      ['display.defaultFormViewId', display.defaultFormViewId],
      ['display.defaultLookupViewId', display.defaultLookupViewId],
    ] as const) {
      if (typeof value === 'string' && !context.activeViewIds.includes(value)) {
        addIssue(issues, 'ENTITY_DEFAULT_VIEW_INACTIVE', `${path} must reference an active view.`, path);
      }
    }
  }
}

function validateLifecycle(lifecycle: Record<string, unknown>, category: EntityCategory | null, issues: ValidationIssue[]): void {
  requireOneOfValue(lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'ENTITY_METADATA_STATUS_INVALID', 'Metadata status is invalid.', issues);
  if ((category === 'transaction' || category === 'ledger_like') && !lifecycle.recordLifecycleModelId) {
    addIssue(issues, 'ENTITY_LIFECYCLE_REQUIRED', 'Record lifecycle model is required for this entity category.', 'lifecycle.recordLifecycleModelId', 'blocking_error');
  }
  requireStringField(lifecycle.activationPolicyId, 'lifecycle.activationPolicyId', 'ENTITY_ACTIVATION_POLICY_REQUIRED', 'Activation policy is required.', issues);
  requireStringField(lifecycle.versionId, 'lifecycle.versionId', 'ENTITY_VERSION_REQUIRED', 'Version ID is required.', issues);
}

function validateRuntimePolicies(runtimePolicies: Record<string, unknown>, issues: ValidationIssue[]): void {
  for (const [key, code] of [
    ['auditPolicyId', 'ENTITY_AUDIT_POLICY_REQUIRED'],
    ['securityPolicyId', 'ENTITY_SECURITY_POLICY_REQUIRED'],
    ['apiExposurePolicyId', 'ENTITY_API_EXPOSURE_POLICY_REQUIRED'],
    ['importPolicyId', 'ENTITY_IMPORT_POLICY_REQUIRED'],
    ['exportPolicyId', 'ENTITY_EXPORT_POLICY_REQUIRED'],
    ['analyticsPolicyId', 'ENTITY_ANALYTICS_POLICY_REQUIRED'],
    ['searchPolicyId', 'ENTITY_SEARCH_POLICY_REQUIRED'],
  ] as const) {
    requireStringField(runtimePolicies[key], `runtimePolicies.${key}`, code, `${key} is required.`, issues);
  }
}

function validateGovernanceFlags(governanceFlags: Record<string, unknown>, issues: ValidationIssue[]): void {
  for (const key of [
    'allowExtension',
    'allowFieldAddition',
    'allowRelationshipAddition',
    'allowViewOverride',
    'allowActionAddition',
    'allowRequirednessRelaxation',
    'allowApiExposureOverride',
  ]) {
    requireBoolean(governanceFlags[key], `governanceFlags.${key}`, 'ENTITY_GOVERNANCE_FLAG_REQUIRED', `${key} is required.`, issues);
  }
}

function validateSystemAudit(systemAudit: Record<string, unknown>, issues: ValidationIssue[]): void {
  requireStringField(systemAudit.createdBy, 'systemAudit.createdBy', 'ENTITY_AUDIT_CREATED_BY_REQUIRED', 'Created by is required.', issues);
  requireStringField(systemAudit.createdAt, 'systemAudit.createdAt', 'ENTITY_AUDIT_CREATED_AT_REQUIRED', 'Created at is required.', issues);
  requireStringField(systemAudit.updatedBy, 'systemAudit.updatedBy', 'ENTITY_AUDIT_UPDATED_BY_REQUIRED', 'Updated by is required.', issues);
  requireStringField(systemAudit.updatedAt, 'systemAudit.updatedAt', 'ENTITY_AUDIT_UPDATED_AT_REQUIRED', 'Updated at is required.', issues);
}

export function validateEntityDefinition(input: unknown, context: EntityValidationContext = {}): ValidationResult<EntityDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{
      code: 'ENTITY_INVALID_SHAPE',
      message: 'EntityDefinition must be an object.',
      severity: 'error',
    }]);
  }

  const issues: ValidationIssue[] = [];
  rejectKeys(input, ['fields', 'fieldDefinitions', 'inlineFields'], 'ENTITY_FIELDS_INLINE_FORBIDDEN', issues);

  validateEntityIdentity(input, issues, context);

  const classification = requireObject(input, 'classification', issues, 'ENTITY_CLASSIFICATION_REQUIRED', 'Classification is required.');
  const category = classification ? validateClassification(classification, issues) : null;

  const ownership = requireObject(input, 'ownership', issues, 'ENTITY_OWNERSHIP_REQUIRED', 'Entity ownership is required.');
  if (ownership) validateOwnership(ownership, issues, context);

  const storage = requireObject(input, 'storage', issues, 'ENTITY_STORAGE_REQUIRED', 'Entity storage policy is required.');
  if (storage) validateStorage(storage, category, issues, context);

  const display = requireObject(input, 'display', issues, 'ENTITY_DISPLAY_REQUIRED', 'Entity display defaults are required.');
  const lifecycle = requireObject(input, 'lifecycle', issues, 'ENTITY_METADATA_LIFECYCLE_REQUIRED', 'Metadata lifecycle is required.');
  if (lifecycle) validateLifecycle(lifecycle, category, issues);
  if (display) validateDisplay(display, classification, lifecycle, issues, context);

  const runtimePolicies = requireObject(input, 'runtimePolicies', issues, 'ENTITY_RUNTIME_POLICIES_REQUIRED', 'Runtime policies are required.');
  if (runtimePolicies) validateRuntimePolicies(runtimePolicies, issues);

  const governanceFlags = requireObject(input, 'governanceFlags', issues, 'ENTITY_GOVERNANCE_FLAGS_REQUIRED', 'Governance flags are required.');
  if (governanceFlags) validateGovernanceFlags(governanceFlags, issues);

  const systemAudit = requireObject(input, 'systemAudit', issues, 'ENTITY_SYSTEM_AUDIT_REQUIRED', 'System audit is required.');
  if (systemAudit) validateSystemAudit(systemAudit, issues);

  const references = requireObject(input, 'references', issues, 'ENTITY_REFERENCES_REQUIRED', 'Entity references are required.');
  if (references) {
    for (const key of ['fieldIds', 'relationshipIds', 'validationRuleIds', 'securityDefinitionIds', 'viewIds', 'actionIds']) {
      validateIdArray(references[key], `references.${key}`, issues);
    }
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as EntityDefinitionMetadata, issues);
}

export function canTransitionEntityStatus(from: MetadataStatus, to: MetadataStatus): boolean {
  return ENTITY_ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
