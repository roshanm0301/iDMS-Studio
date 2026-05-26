import type { CompileResult } from './compiler';
import {
  canTransitionEntityStatus,
  validateEntityDefinition,
  type EntityDefinitionMetadata,
  type EntityValidationContext,
} from './entity-definition';
import type { MetadataStatus } from './shared';
import {
  fail,
  isPlainObject,
  ok,
  type ValidationIssue,
  type ValidationResult,
  type ValidationSeverity,
} from './validation';

export interface EntityDefinitionMutationContext {
  actor: string;
  now?: string;
  changeReason?: string;
  governanceApproved?: boolean;
  validationContext?: EntityValidationContext;
}

type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends Array<unknown>
    ? T[Key]
    : T[Key] extends object
      ? DeepPartial<T[Key]>
      : T[Key];
};

export type EntityDefinitionPatch = DeepPartial<EntityDefinitionMetadata>;

export class InMemoryEntityDefinitionRepository {
  private readonly entities = new Map<string, EntityDefinitionMetadata>();

  constructor(seed: EntityDefinitionMetadata[] = []) {
    seed.forEach(entity => this.save(entity));
  }

  list(): EntityDefinitionMetadata[] {
    return Array.from(this.entities.values()).map(clone);
  }

  get(entityId: string): EntityDefinitionMetadata | undefined {
    const entity = this.entities.get(entityId);
    return entity ? clone(entity) : undefined;
  }

  has(entityId: string): boolean {
    return this.entities.has(entityId);
  }

  save(entity: EntityDefinitionMetadata): EntityDefinitionMetadata {
    const stored = clone(entity);
    this.entities.set(stored.entityId, stored);
    return clone(stored);
  }
}

const ALWAYS_IMMUTABLE_PATHS = ['entityId'] as const;

const ACTIVATED_IMMUTABLE_PATHS = [
  'apiName',
  'namespace',
  'entityCode',
  'classification.entityCategory',
  'classification.businessObjectType',
  'classification.industryVertical',
  'ownership.owningLayer',
  'ownership.owningPackageId',
  'storage.storageStrategy',
  'storage.tableName',
  'storage.primaryKeyField',
  'storage.primaryKeyStrategy',
] as const;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now(context: EntityDefinitionMutationContext): string {
  return context.now ?? new Date().toISOString();
}

function serviceIssue(code: string, message: string, path?: string, severity: ValidationSeverity = 'error'): ValidationIssue {
  return { code, message, path, severity };
}

function resultFromIssue<T>(code: string, message: string, path?: string, severity: ValidationSeverity = 'error'): ValidationResult<T> {
  return fail([serviceIssue(code, message, path, severity)]);
}

function getAtPath(input: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (!isPlainObject(value)) return undefined;
    return value[segment];
  }, input);
}

function valuesDiffer(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) !== JSON.stringify(right);
}

function mergePatch<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T;

  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      output[key] = [...value];
    } else if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = mergePatch(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output as T;
}

function findChangedImmutablePaths(before: EntityDefinitionMetadata, after: EntityDefinitionMetadata): string[] {
  const paths: string[] = [...ALWAYS_IMMUTABLE_PATHS];
  if (before.lifecycle.metadataStatus !== 'draft') {
    paths.push(...ACTIVATED_IMMUTABLE_PATHS);
  }

  return paths.filter(path => valuesDiffer(getAtPath(before, path), getAtPath(after, path)));
}

function invalidTransitionCode(from: MetadataStatus, to: MetadataStatus): string {
  if (from === 'active' && to === 'retired') return 'ENTITY_RETIRE_ACTIVE_NOT_ALLOWED';
  if (from === 'retired' && to === 'active') return 'ENTITY_REACTIVATE_RETIRED_NOT_ALLOWED';
  return 'ENTITY_LIFECYCLE_TRANSITION_INVALID';
}

function applyAudit(
  entity: EntityDefinitionMetadata,
  context: EntityDefinitionMutationContext,
  statusChange?: MetadataStatus,
): EntityDefinitionMetadata {
  const timestamp = now(context);
  const next = clone(entity);
  next.systemAudit = {
    ...next.systemAudit,
    updatedBy: context.actor,
    updatedAt: timestamp,
    changeReason: context.changeReason ?? next.systemAudit.changeReason,
  };

  if (statusChange === 'active') {
    next.lifecycle.activatedAt = timestamp;
    next.systemAudit.activatedBy = context.actor;
  }
  if (statusChange === 'deprecated') {
    next.lifecycle.deprecatedAt = timestamp;
    next.systemAudit.deprecatedBy = context.actor;
  }
  if (statusChange === 'retired') {
    next.lifecycle.retiredAt = timestamp;
    next.systemAudit.retiredBy = context.actor;
  }

  return next;
}

export class EntityDefinitionService {
  private readonly repository: InMemoryEntityDefinitionRepository;
  private readonly baseValidationContext: EntityValidationContext;

  constructor(
    repository = new InMemoryEntityDefinitionRepository(),
    baseValidationContext: EntityValidationContext = {},
  ) {
    this.repository = repository;
    this.baseValidationContext = baseValidationContext;
  }

  list(): EntityDefinitionMetadata[] {
    return this.repository.list();
  }

  read(entityId: string): EntityDefinitionMetadata | undefined {
    return this.repository.get(entityId);
  }

  validate(entityId: string, validationContext: EntityValidationContext = {}): ValidationResult<EntityDefinitionMetadata> {
    const entity = this.repository.get(entityId);
    if (!entity) {
      return resultFromIssue('ENTITY_NOT_FOUND', `Entity '${entityId}' was not found.`, 'entityId');
    }
    return validateEntityDefinition(entity, this.validationContext(validationContext));
  }

  create(input: EntityDefinitionMetadata, context: EntityDefinitionMutationContext): ValidationResult<EntityDefinitionMetadata> {
    if (this.repository.has(input.entityId)) {
      return resultFromIssue('ENTITY_ALREADY_EXISTS', `Entity '${input.entityId}' already exists.`, 'entityId');
    }

    const timestamp = now(context);
    const entity: EntityDefinitionMetadata = {
      ...clone(input),
      lifecycle: {
        ...input.lifecycle,
        metadataStatus: 'draft',
        activatedAt: null,
        deprecatedAt: null,
        retiredAt: null,
      },
      systemAudit: {
        ...input.systemAudit,
        createdBy: context.actor,
        createdAt: input.systemAudit.createdAt || timestamp,
        updatedBy: context.actor,
        updatedAt: timestamp,
        activatedBy: null,
        deprecatedBy: null,
        retiredBy: null,
        changeReason: context.changeReason ?? input.systemAudit.changeReason,
      },
    };

    const validation = validateEntityDefinition(entity, this.validationContext(context.validationContext));
    if (!validation.valid) return validation;

    return ok(this.repository.save(entity), validation.issues);
  }

  update(
    entityId: string,
    patch: EntityDefinitionPatch | ((draft: EntityDefinitionMetadata) => EntityDefinitionMetadata),
    context: EntityDefinitionMutationContext,
  ): ValidationResult<EntityDefinitionMetadata> {
    const current = this.repository.get(entityId);
    if (!current) {
      return resultFromIssue('ENTITY_NOT_FOUND', `Entity '${entityId}' was not found.`, 'entityId');
    }

    const proposed = typeof patch === 'function'
      ? patch(clone(current))
      : mergePatch(current, patch);

    if (proposed.lifecycle.metadataStatus !== current.lifecycle.metadataStatus) {
      return resultFromIssue(
        'ENTITY_LIFECYCLE_SERVICE_REQUIRED',
        'Use activate, deprecate, retire, or archive for EntityDefinition lifecycle transitions.',
        'lifecycle.metadataStatus',
        'blocking_error',
      );
    }

    const immutableChanges = findChangedImmutablePaths(current, proposed);
    if (immutableChanges.length > 0) {
      if (immutableChanges.includes('apiName')) {
        return resultFromIssue(
          'ENTITY_API_NAME_LOCKED',
          'API name cannot be changed after activation.',
          'apiName',
          'blocking_error',
        );
      }

      return resultFromIssue(
        'ENTITY_IMMUTABLE_FIELD_CHANGE',
        `Immutable EntityDefinition fields cannot be changed: ${immutableChanges.join(', ')}.`,
        immutableChanges[0],
        'blocking_error',
      );
    }

    if (current.ownership.protected && current.lifecycle.metadataStatus !== 'draft' && !context.governanceApproved) {
      return resultFromIssue(
        'ENTITY_PROTECTED_MODIFICATION_BLOCKED',
        'This entity is protected and cannot be modified from the current layer.',
        'ownership.protected',
        'blocking_error',
      );
    }

    if (current.lifecycle.metadataStatus !== 'draft' && !context.changeReason) {
      return resultFromIssue(
        'ENTITY_CHANGE_REASON_REQUIRED',
        'A change reason is required when modifying active, deprecated, or retired EntityDefinition metadata.',
        'systemAudit.changeReason',
      );
    }

    const audited = applyAudit(proposed, context);
    const validation = validateEntityDefinition(audited, this.validationContext(context.validationContext));
    if (!validation.valid) return validation;

    return ok(this.repository.save(audited), validation.issues);
  }

  activate(entityId: string, context: EntityDefinitionMutationContext, compileResult?: CompileResult): ValidationResult<EntityDefinitionMetadata> {
    if (compileResult && !compileResult.publishable) {
      return resultFromIssue(
        'ENTITY_COMPILE_ERRORS_EXIST',
        'EntityDefinition cannot be activated until compile errors and migration blockers are resolved.',
        'lifecycle.metadataStatus',
        'blocking_error',
      );
    }
    return this.transition(entityId, 'active', context);
  }

  deprecate(entityId: string, context: EntityDefinitionMutationContext): ValidationResult<EntityDefinitionMetadata> {
    if (!context.changeReason) {
      return resultFromIssue('ENTITY_CHANGE_REASON_REQUIRED', 'Deprecating an EntityDefinition requires a change reason.', 'systemAudit.changeReason');
    }
    return this.transition(entityId, 'deprecated', context);
  }

  retire(entityId: string, context: EntityDefinitionMutationContext): ValidationResult<EntityDefinitionMetadata> {
    if (!context.changeReason) {
      return resultFromIssue('ENTITY_CHANGE_REASON_REQUIRED', 'Retiring an EntityDefinition requires a change reason.', 'systemAudit.changeReason');
    }
    return this.transition(entityId, 'retired', context);
  }

  archive(entityId: string, context: EntityDefinitionMutationContext): ValidationResult<EntityDefinitionMetadata> {
    return this.transition(entityId, 'archived', context);
  }

  createExtension(
    parentEntityId: string,
    extension: EntityDefinitionMetadata,
    context: EntityDefinitionMutationContext,
  ): ValidationResult<EntityDefinitionMetadata> {
    const parent = this.repository.get(parentEntityId);
    if (!parent) {
      return resultFromIssue('ENTITY_NOT_FOUND', `Entity '${parentEntityId}' was not found.`, 'entityId');
    }

    if (!parent.governanceFlags.allowExtension || parent.lifecycle.metadataStatus === 'deprecated' || parent.lifecycle.metadataStatus === 'retired') {
      return resultFromIssue(
        'ENTITY_EXTENSION_NOT_ALLOWED',
        'This entity does not allow downstream extension.',
        'governanceFlags.allowExtension',
        'blocking_error',
      );
    }

    return this.create(extension, context);
  }

  private transition(
    entityId: string,
    targetStatus: MetadataStatus,
    context: EntityDefinitionMutationContext,
  ): ValidationResult<EntityDefinitionMetadata> {
    const current = this.repository.get(entityId);
    if (!current) {
      return resultFromIssue('ENTITY_NOT_FOUND', `Entity '${entityId}' was not found.`, 'entityId');
    }

    if (!canTransitionEntityStatus(current.lifecycle.metadataStatus, targetStatus)) {
      return resultFromIssue(
        invalidTransitionCode(current.lifecycle.metadataStatus, targetStatus),
        `EntityDefinition cannot transition from ${current.lifecycle.metadataStatus} to ${targetStatus}.`,
        'lifecycle.metadataStatus',
        'blocking_error',
      );
    }

    const transitioned = applyAudit({
      ...current,
      lifecycle: {
        ...current.lifecycle,
        metadataStatus: targetStatus,
      },
    }, context, targetStatus);

    const validation = validateEntityDefinition(transitioned, this.validationContext(context.validationContext));
    if (!validation.valid) return validation;

    return ok(this.repository.save(transitioned), validation.issues);
  }

  private validationContext(extra: EntityValidationContext = {}): EntityValidationContext {
    return {
      ...this.baseValidationContext,
      ...extra,
      existingEntities: this.repository.list(),
    };
  }
}
