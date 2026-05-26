import { describe, expect, it } from 'vitest';
import { compileMetadataSet, type CompileResult } from './compiler';
import { customerVehicleFields, serviceJobCardEntity, serviceJobCardFields } from './core-fixtures';
import { EntityDefinitionService, InMemoryEntityDefinitionRepository } from './entity-definition-service';
import { serviceJobCardMetadataSet } from './service-job-card-fixture';

const mutationContext = {
  actor: 'usr_metadata_admin',
  now: '2026-05-11T12:00:00+05:30',
  changeReason: 'Requirement implementation coverage.',
};

const validationContext = {
  activeFieldIds: [...customerVehicleFields, ...serviceJobCardFields].map(field => field.fieldId),
  activeViewIds: serviceJobCardMetadataSet.entities.flatMap(entity => entity.references.viewIds),
  activePackageIds: ['pkg_automotive_service'],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('EntityDefinitionService lifecycle semantics', () => {
  it('creates new EntityDefinition metadata as draft even when a template starts active', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository(), validationContext);

    const result = service.create(clone(serviceJobCardEntity), mutationContext);

    expect(result.valid).toBe(true);
    expect(result.data?.lifecycle.metadataStatus).toBe('draft');
    expect(result.data?.systemAudit.createdBy).toBe('usr_metadata_admin');
  });

  it('blocks activation when compile has errors', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository(), validationContext);
    service.create(clone(serviceJobCardEntity), mutationContext);
    const compileResult = { publishable: false } as CompileResult;

    const result = service.activate('ent_service_job_card', mutationContext, compileResult);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_COMPILE_ERRORS_EXIST')).toBe(true);
  });

  it('activates draft metadata when compile is publishable', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository(), validationContext);
    service.create(clone(serviceJobCardEntity), mutationContext);
    const compileResult = compileMetadataSet(serviceJobCardMetadataSet);

    const result = service.activate('ent_service_job_card', mutationContext, compileResult);

    expect(result.valid).toBe(true);
    expect(result.data?.lifecycle.metadataStatus).toBe('active');
    expect(result.data?.systemAudit.activatedBy).toBe('usr_metadata_admin');
  });

  it('blocks direct lifecycle edits through generic update', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository([serviceJobCardEntity]), validationContext);

    const result = service.update('ent_service_job_card', { lifecycle: { metadataStatus: 'deprecated' } }, mutationContext);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_LIFECYCLE_SERVICE_REQUIRED')).toBe(true);
  });

  it('blocks immutable identity and storage changes after activation', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository([serviceJobCardEntity]), validationContext);

    const result = service.update('ent_service_job_card', { apiName: 'service_job_card_v2' }, mutationContext);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_API_NAME_LOCKED')).toBe(true);
  });

  it('blocks protected active metadata changes without governance approval', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository([serviceJobCardEntity]), validationContext);

    const result = service.update('ent_service_job_card', { label: 'Service Repair Order' }, mutationContext);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_PROTECTED_MODIFICATION_BLOCKED')).toBe(true);
  });

  it('requires deprecation before retirement', () => {
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository([serviceJobCardEntity]), validationContext);

    const result = service.retire('ent_service_job_card', mutationContext);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_RETIRE_ACTIVE_NOT_ALLOWED')).toBe(true);
  });

  it('blocks extension when the parent entity does not allow downstream extension', () => {
    const parent = clone(serviceJobCardEntity);
    parent.governanceFlags.allowExtension = false;
    const extension = clone(serviceJobCardEntity);
    extension.entityId = 'ent_service_job_card_tenant_ext';
    extension.apiName = 'service_job_card_tenant_ext';
    const service = new EntityDefinitionService(new InMemoryEntityDefinitionRepository([parent]), validationContext);

    const result = service.createExtension('ent_service_job_card', extension, mutationContext);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'ENTITY_EXTENSION_NOT_ALLOWED')).toBe(true);
  });
});
