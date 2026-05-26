import {
  METADATA_STATUSES,
  type MetadataAudit,
  type MetadataStatus,
  type MetadataVersionRef,
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

export const FIELD_SOURCES = ['catalog', 'local', 'system'] as const;
export type FieldSource = (typeof FIELD_SOURCES)[number];

export const BUSINESS_FIELD_TYPES = [
  'plain_data',
  'identifier',
  'gstin',
  'pan',
  'vin',
  'currency_amount',
  'status',
  'relationship_key',
] as const;
export type BusinessFieldType = (typeof BUSINESS_FIELD_TYPES)[number];

export const LOGICAL_DATA_TYPES = [
  'text',
  'text_identifier',
  'number',
  'decimal',
  'currency',
  'percentage',
  'date',
  'datetime',
  'time',
  'boolean',
  'enum',
  'multi_enum',
  'entity_reference',
  'file_reference',
  'auto_number',
  'computed',
] as const;
export type LogicalDataType = (typeof LOGICAL_DATA_TYPES)[number];

export const POSTGRES_STORAGE_TYPES = [
  'text',
  'varchar',
  'integer',
  'bigint',
  'numeric',
  'boolean',
  'date',
  'timestamptz',
  'time',
  'uuid',
  'jsonb',
  'bytea',
] as const;
export type PostgresStorageType = (typeof POSTGRES_STORAGE_TYPES)[number];

export const UI_CONTROL_TYPES = [
  'text_input',
  'textarea',
  'number_input',
  'currency_input',
  'date_picker',
  'datetime_picker',
  'time_picker',
  'checkbox',
  'dropdown',
  'multi_select',
  'lookup',
  'file_picker',
  'read_only',
] as const;
export type UiControlType = (typeof UI_CONTROL_TYPES)[number];

export const FIELD_LIFECYCLE_STATES = ['draft', 'active', 'disabled', 'deprecated', 'retired'] as const;
export type FieldLifecycleState = (typeof FIELD_LIFECYCLE_STATES)[number];

export interface FieldTyping {
  businessType: BusinessFieldType;
  logicalType: LogicalDataType;
  postgresType: PostgresStorageType;
  uiControl: UiControlType;
}

export interface FieldStoragePolicy {
  strategy: 'physical_column' | 'extension_jsonb' | 'virtual' | 'persisted_computed';
  columnName?: string;
  nullable: boolean;
  indexed?: boolean;
}

export interface FieldBehaviorPolicy {
  required: boolean;
  immutable: boolean;
  searchable: boolean;
  sortable: boolean;
  filterable: boolean;
  defaultValue?: unknown;
}

export interface FieldGovernancePolicy {
  classification: 'open' | 'internal' | 'sensitive' | 'regulated';
  maskByDefault: boolean;
  allowImport: boolean;
  allowExport: boolean;
  apiInputAllowed: boolean;
  apiOutputAllowed: boolean;
}

export interface FieldDefinitionMetadata {
  fieldId: string;
  entityId: string;
  apiName: string;
  label: string;
  description?: string;
  source: FieldSource;
  ownership: OwnershipScope;
  typing: FieldTyping;
  storage: FieldStoragePolicy;
  typeConfig: Record<string, unknown>;
  behavior: FieldBehaviorPolicy;
  governance: FieldGovernancePolicy;
  lifecycle: {
    status: FieldLifecycleState;
    metadataStatus: MetadataStatus;
  };
  version?: MetadataVersionRef;
  audit?: MetadataAudit;
}

function hasOptionList(typeConfig: Record<string, unknown>): boolean {
  return Array.isArray(typeConfig.options) && typeConfig.options.length > 0;
}

export function validateFieldDefinition(input: unknown): ValidationResult<FieldDefinitionMetadata> {
  if (!isPlainObject(input)) {
    return fail([{ code: 'FIELD_INVALID_SHAPE', message: 'FieldDefinition must be an object.', severity: 'error' }]);
  }

  const issues: ValidationIssue[] = [];
  requireString(input.fieldId, 'fieldId', 'FIELD_ID_REQUIRED', 'Field ID', issues);
  requireString(input.entityId, 'entityId', 'FIELD_ENTITY_REQUIRED', 'Entity ID', issues);
  requireApiName(input.apiName, 'apiName', issues);
  requireString(input.label, 'label', 'FIELD_LABEL_REQUIRED', 'Field label', issues);
  requireOneOf(input.source, FIELD_SOURCES, 'source', 'FIELD_SOURCE_INVALID', 'Field source', issues);

  if (!isPlainObject(input.ownership)) {
    issues.push({ code: 'FIELD_OWNERSHIP_REQUIRED', message: 'Field ownership is required.', path: 'ownership', severity: 'error' });
  } else {
    if (input.ownership.owningLayer === 'role') {
      issues.push({
        code: 'FIELD_ROLE_LAYER_FORBIDDEN',
        message: 'Role cannot own field schema.',
        path: 'ownership.owningLayer',
        severity: 'blocking_error',
      });
    }
    requireOneOf(
      input.ownership.owningLayer,
      ['platform', 'vertical', 'tenant', 'node'] as const,
      'ownership.owningLayer',
      'FIELD_OWNING_LAYER_INVALID',
      'Owning layer',
      issues,
    );
  }

  if (!isPlainObject(input.typing)) {
    issues.push({ code: 'FIELD_TYPING_REQUIRED', message: 'Field typing is required.', path: 'typing', severity: 'error' });
  } else {
    requireOneOf(input.typing.businessType, BUSINESS_FIELD_TYPES, 'typing.businessType', 'FIELD_BUSINESS_TYPE_INVALID', 'Business type', issues);
    requireOneOf(input.typing.logicalType, LOGICAL_DATA_TYPES, 'typing.logicalType', 'FIELD_LOGICAL_TYPE_INVALID', 'Logical data type', issues);
    requireOneOf(input.typing.postgresType, POSTGRES_STORAGE_TYPES, 'typing.postgresType', 'FIELD_POSTGRES_TYPE_INVALID', 'PostgreSQL storage type', issues);
    requireOneOf(input.typing.uiControl, UI_CONTROL_TYPES, 'typing.uiControl', 'FIELD_UI_CONTROL_INVALID', 'UI control type', issues);

    if (input.typing.postgresType === 'enum') {
      issues.push({
        code: 'FIELD_POSTGRES_ENUM_FORBIDDEN',
        message: 'PostgreSQL ENUM must not be used for configurable business picklists.',
        path: 'typing.postgresType',
        severity: 'blocking_error',
      });
    }

    if (input.typing.logicalType === 'currency' && input.typing.postgresType !== 'numeric') {
      issues.push({
        code: 'FIELD_CURRENCY_REQUIRES_NUMERIC',
        message: 'Currency fields must use numeric PostgreSQL storage.',
        path: 'typing.postgresType',
        severity: 'error',
      });
    }
  }

  if (!isPlainObject(input.storage)) {
    issues.push({ code: 'FIELD_STORAGE_REQUIRED', message: 'Field storage policy is required.', path: 'storage', severity: 'error' });
  } else if (input.storage.columnName !== undefined) {
    requireApiName(input.storage.columnName, 'storage.columnName', issues);
  }

  const typeConfig = isPlainObject(input.typeConfig) ? input.typeConfig : {};
  const logicalType = isPlainObject(input.typing) ? input.typing.logicalType : undefined;
  if ((logicalType === 'enum' || logicalType === 'multi_enum') && !hasOptionList(typeConfig)) {
    issues.push({ code: 'FIELD_ENUM_OPTIONS_REQUIRED', message: 'Enum fields require a non-empty options list.', path: 'typeConfig.options', severity: 'error' });
  }
  if (logicalType === 'entity_reference' && typeof typeConfig.targetEntityId !== 'string') {
    issues.push({ code: 'FIELD_REFERENCE_TARGET_REQUIRED', message: 'Entity reference fields require targetEntityId.', path: 'typeConfig.targetEntityId', severity: 'error' });
  }

  if (!isPlainObject(input.lifecycle)) {
    issues.push({ code: 'FIELD_LIFECYCLE_REQUIRED', message: 'Field lifecycle is required.', path: 'lifecycle', severity: 'error' });
  } else {
    requireOneOf(input.lifecycle.status, FIELD_LIFECYCLE_STATES, 'lifecycle.status', 'FIELD_LIFECYCLE_INVALID', 'Field lifecycle', issues);
    requireOneOf(input.lifecycle.metadataStatus, METADATA_STATUSES, 'lifecycle.metadataStatus', 'FIELD_METADATA_STATUS_INVALID', 'Metadata status', issues);
  }

  if (issues.some(item => item.severity !== 'warning')) return fail(issues);
  return ok(input as unknown as FieldDefinitionMetadata, issues);
}
