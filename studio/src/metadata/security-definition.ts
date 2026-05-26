import {
  METADATA_STATUSES,
  type MetadataAudit,
  type MetadataStatus,
  type MetadataVersionRef,
  type OwnershipScope,
  type RuntimeContext,
} from './shared';
import {
  fail,
  isPlainObject,
  ok,
  requireApiName,
  requireOneOf,
  requireString,
  type ValidationIssue,
  type ValidationResult,
} from './validation';

export const PERMISSION_EFFECTS = ['allow', 'deny'] as const;
export type PermissionEffect = (typeof PERMISSION_EFFECTS)[number];

export const FIELD_ACCESS_LEVELS = ['read', 'edit', 'hidden', 'masked'] as const;
export type FieldAccessLevel = (typeof FIELD_ACCESS_LEVELS)[number];

export const MASKING_STRATEGIES = ['none', 'full', 'last_four', 'partial', 'hash'] as const;
export type MaskingStrategy = (typeof MASKING_STRATEGIES)[number];

export interface SecuritySubject {
  roleCodes: string[];
  userIds?: string[];
}

export interface EntityPermission {
  operation: RuntimeContext['operation'];
  effect: PermissionEffect;
}

export interface FieldPermission {
  fieldId: string;
  access: FieldAccessLevel;
  maskStrategy?: MaskingStrategy;
}

export interface ActionPermission {
  actionId: string;
  effect: PermissionEffect;
  disabledReason?: string;
}

export interface ViewPermission {
  viewId: string;
  effect: PermissionEffect;
}

export interface ApiPermission {
  apiScope: 'read' | 'write' | 'import' | 'export';
  effect: PermissionEffect;
}

export interface RecordScopePolicy {
  scopeType: 'all_records' | 'own_records' | 'tenant_records' | 'node_records' | 'expression';
  expression?: string;
}

export interface SecurityDefinitionMetadata {
  securityDefinitionId: string;
  entityId: string;
  apiName: string;
  label: string;
  subjects: SecuritySubject;
  objectPermissions: EntityPermission[];
  fieldPermissions: FieldPermission[];
  actionPermissions: ActionPermission[];
  viewPermissions: ViewPermission[];
  apiPermissions: ApiPermission[];
  recordScope: RecordScopePolicy;
  ownership: OwnershipScope;
  lifecycle: {
    metadataStatus: MetadataStatus;
  };
  version?: MetadataVersionRef;
  audit?: MetadataAudit;
}

export function validateSecurityDefinition(input: unknown): ValidationResult<SecurityDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'SEC_INVALID_SHAPE', message: 'SecurityDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.securityDefinitionId, 'securityDefinitionId', 'SEC_ID_REQUIRED', 'Security definition ID', issues);
  requireString(input.entityId, 'entityId', 'SEC_ENTITY_REQUIRED', 'Entity ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'SEC_LABEL_REQUIRED', 'Security definition label', issues);

  if (!isPlainObject(input.subjects) || !Array.isArray(input.subjects.roleCodes) || input.subjects.roleCodes.length === 0) {
    issues.push({ code: 'SEC_SUBJECT_REQUIRED', message: 'SecurityDefinition requires at least one role subject.', path: 'subjects.roleCodes', severity: 'error' });
  }

  if (!Array.isArray(input.objectPermissions) || input.objectPermissions.length === 0) {
    issues.push({ code: 'SEC_OBJECT_PERMISSION_REQUIRED', message: 'At least one object permission is required.', path: 'objectPermissions', severity: 'error' });
  } else {
    input.objectPermissions.forEach((permission, index) => {
      if (!isPlainObject(permission)) return;
      requireOneOf(permission.effect, PERMISSION_EFFECTS, `objectPermissions.${index}.effect`, 'SEC_EFFECT_INVALID', 'Permission effect', issues);
    });
  }

  if (Array.isArray(input.fieldPermissions)) {
    input.fieldPermissions.forEach((permission, index) => {
      if (!isPlainObject(permission)) return;
      requireString(permission.fieldId, `fieldPermissions.${index}.fieldId`, 'SEC_FIELD_PERMISSION_FIELD_REQUIRED', 'Field permission field ID', issues);
      requireOneOf(permission.access, FIELD_ACCESS_LEVELS, `fieldPermissions.${index}.access`, 'SEC_FIELD_ACCESS_INVALID', 'Field access', issues);
      if (permission.maskStrategy !== undefined) {
        requireOneOf(permission.maskStrategy, MASKING_STRATEGIES, `fieldPermissions.${index}.maskStrategy`, 'SEC_MASK_INVALID', 'Masking strategy', issues);
      }
    });
  }

  if (!isPlainObject(input.recordScope)) {
    issues.push({ code: 'SEC_RECORD_SCOPE_REQUIRED', message: 'Record scope policy is required.', path: 'recordScope', severity: 'error' });
  }

  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'SEC_OWNERSHIP_REQUIRED', message: 'Security ownership is required.', path: 'ownership', severity: 'error' });
  } else if (input.ownership.owningLayer === 'role') {
    issues.push({ code: 'SEC_ROLE_LAYER_FORBIDDEN', message: 'Role is a subject, not a schema-owning layer.', path: 'ownership.owningLayer', severity: 'blocking_error' });
  }

  if (!isPlainObject(input.lifecycle)) {
    issues.push({ code: 'SEC_LIFECYCLE_REQUIRED', message: 'Security lifecycle is required.', path: 'lifecycle', severity: 'error' });
  } else {
    requireOneOf(input.lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'SEC_STATUS_INVALID', 'Metadata status', issues);
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as SecurityDefinitionMetadata, issues);
}

export function roleMatchesSecurityDefinition(definition: SecurityDefinitionMetadata, roleCode: string): boolean {
  return definition.subjects.roleCodes.includes(roleCode);
}
