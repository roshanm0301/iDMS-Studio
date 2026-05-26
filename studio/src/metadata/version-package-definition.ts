import {
  METADATA_STATUSES,
  type MetadataAudit,
  type MetadataStatus,
  type OwnershipScope,
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

export const VERSION_STATUSES = ['draft', 'compiled', 'published', 'deprecated', 'rolled_back'] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

export const VERSION_CHANGE_TYPES = ['non_breaking', 'breaking', 'migration_required'] as const;
export type VersionChangeType = (typeof VERSION_CHANGE_TYPES)[number];

export const DEPENDENCY_TYPES = [
  'field_reference',
  'relationship_reference',
  'validation_reference',
  'security_reference',
  'view_reference',
  'action_reference',
  'package_dependency',
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export const IMPACT_SEVERITIES = ['safe', 'warning', 'breaking', 'migration_required', 'blocked'] as const;
export type ImpactSeverity = (typeof IMPACT_SEVERITIES)[number];

export const PACKAGE_TYPES = ['platform', 'vertical', 'tenant_solution', 'node_extension'] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export interface VersionDefinition {
  versionId: string;
  metadataObjectId: string;
  metadataObjectType: string;
  version: string;
  status: VersionStatus;
  changeType: VersionChangeType;
  immutable: boolean;
  metadataHash: string;
  publishedAt?: string;
  audit?: MetadataAudit;
}

export interface DependencyDefinition {
  dependencyId: string;
  sourceObjectId: string;
  targetObjectId: string;
  dependencyType: DependencyType;
  impactSeverity: ImpactSeverity;
  required: boolean;
  migrationRequired: boolean;
}

export interface PackageComponent {
  objectId: string;
  objectType: string;
  versionId?: string;
}

export interface PackageDefinition {
  packageId: string;
  apiName: string;
  label: string;
  packageType: PackageType;
  ownership: OwnershipScope;
  contents: PackageComponent[];
  dependencies: DependencyDefinition[];
  status: MetadataStatus;
  version: string;
  publishSafety: ImpactSeverity;
  rollbackSupported: boolean;
  audit?: MetadataAudit;
}

export function validateVersionDefinition(input: unknown): ValidationResult<VersionDefinition> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'VER_INVALID_SHAPE', message: 'VersionDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.versionId, 'versionId', 'VER_ID_REQUIRED', 'Version ID', issues);
  requireString(input.metadataObjectId, 'metadataObjectId', 'VER_OBJECT_REQUIRED', 'Metadata object ID', issues);
  requireString(input.metadataObjectType, 'metadataObjectType', 'VER_OBJECT_TYPE_REQUIRED', 'Metadata object type', issues);
  requireString(input.version, 'version', 'VER_NUMBER_REQUIRED', 'Version number', issues);
  requireString(input.metadataHash, 'metadataHash', 'VER_HASH_REQUIRED', 'Metadata hash', issues);
  requireOneOf(input.status, VERSION_STATUSES, 'status', 'VER_STATUS_INVALID', 'Version status', issues);
  requireOneOf(input.changeType, VERSION_CHANGE_TYPES, 'changeType', 'VER_CHANGE_TYPE_INVALID', 'Version change type', issues);

  if (input.status === 'published' && input.immutable !== true) {
    issues.push({ code: 'VER_PUBLISHED_IMMUTABLE_REQUIRED', message: 'Published metadata versions must be immutable.', path: 'immutable', severity: 'blocking_error' });
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as VersionDefinition, issues);
}

export function validateDependencyDefinition(input: unknown): ValidationResult<DependencyDefinition> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'DEP_INVALID_SHAPE', message: 'DependencyDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.dependencyId, 'dependencyId', 'DEP_ID_REQUIRED', 'Dependency ID', issues);
  requireString(input.sourceObjectId, 'sourceObjectId', 'DEP_SOURCE_REQUIRED', 'Source object ID', issues);
  requireString(input.targetObjectId, 'targetObjectId', 'DEP_TARGET_REQUIRED', 'Target object ID', issues);
  requireOneOf(input.dependencyType, DEPENDENCY_TYPES, 'dependencyType', 'DEP_TYPE_INVALID', 'Dependency type', issues);
  requireOneOf(input.impactSeverity, IMPACT_SEVERITIES, 'impactSeverity', 'DEP_IMPACT_INVALID', 'Impact severity', issues);

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as DependencyDefinition, issues);
}

export function validatePackageDefinition(input: unknown): ValidationResult<PackageDefinition> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'PKG_INVALID_SHAPE', message: 'PackageDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.packageId, 'packageId', 'PKG_ID_REQUIRED', 'Package ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'PKG_LABEL_REQUIRED', 'Package label', issues);
  requireString(input.version, 'version', 'PKG_VERSION_REQUIRED', 'Package version', issues);
  requireOneOf(input.packageType, PACKAGE_TYPES, 'packageType', 'PKG_TYPE_INVALID', 'Package type', issues);
  requireOneOf(input.status, METADATA_STATUSES, 'status', 'PKG_STATUS_INVALID', 'Package status', issues);
  requireOneOf(input.publishSafety, IMPACT_SEVERITIES, 'publishSafety', 'PKG_PUBLISH_SAFETY_INVALID', 'Publish safety', issues);

  if (!Array.isArray(input.contents) || input.contents.length === 0) {
    issues.push({ code: 'PKG_CONTENTS_REQUIRED', message: 'Package must contain at least one metadata component.', path: 'contents', severity: 'error' });
  }

  if (!Array.isArray(input.dependencies)) {
    issues.push({ code: 'PKG_DEPENDENCIES_INVALID', message: 'Package dependencies must be an array.', path: 'dependencies', severity: 'error' });
  }

  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'PKG_OWNERSHIP_REQUIRED', message: 'Package ownership is required.', path: 'ownership', severity: 'error' });
  } else if (input.ownership.owningLayer === 'role') {
    issues.push({ code: 'PKG_ROLE_LAYER_FORBIDDEN', message: 'Role cannot own packages.', path: 'ownership.owningLayer', severity: 'blocking_error' });
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as PackageDefinition, issues);
}
