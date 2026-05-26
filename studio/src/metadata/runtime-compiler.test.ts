import { describe, expect, it } from 'vitest';
import { compileMetadataSet } from './compiler';
import { resolveRuntimeContract } from './runtime-resolver';
import { serviceJobCardMetadataSet } from './service-job-card-fixture';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const serviceAdvisorContext = {
  tenantId: 'tenant_bajaj_demo',
  nodeId: 'node_pune_workshop',
  roleCode: 'service_advisor',
  locale: 'en-IN',
  channel: 'web',
  operation: 'read',
  recordState: 'open',
} as const;

describe('metadata compiler and runtime resolver', () => {
  it('compiles the Service Job Card metadata set as publishable', () => {
    const result = compileMetadataSet(serviceJobCardMetadataSet);

    expect(result.compileStatus).toBe('pass');
    expect(result.publishable).toBe(true);
    expect(result.summary.blockingErrors).toBe(0);
  });

  it('blocks active relationships that reference inactive target entities', () => {
    const metadata = clone(serviceJobCardMetadataSet);
    metadata.entities.find(entity => entity.entityId === 'ent_customer')!.lifecycle.metadataStatus = 'retired';

    const result = compileMetadataSet(metadata);

    expect(result.publishable).toBe(false);
    expect(result.issues.some(issue => issue.code === 'COMP_REL_TARGET_INACTIVE')).toBe(true);
  });

  it('omits denied fields from runtime contracts and includes versioned cache keys', () => {
    const result = resolveRuntimeContract(serviceJobCardMetadataSet, 'service_job_card', serviceAdvisorContext);

    expect(result.resolved).toBe(true);
    expect(result.contract?.metadataVersion).toBe('1.0.0');
    expect(result.contract?.cacheKey).toContain('service_advisor');
    expect(result.contract?.fields.some(field => field.fieldId === 'fld_manager_notes')).toBe(false);
    expect(result.contract?.security.omittedFieldIds).toContain('fld_manager_notes');
  });

  it('does not resolve draft metadata in normal runtime', () => {
    const metadata = clone(serviceJobCardMetadataSet);
    metadata.entities.find(entity => entity.apiName === 'service_job_card')!.lifecycle.metadataStatus = 'draft';

    const result = resolveRuntimeContract(metadata, 'service_job_card', serviceAdvisorContext);

    expect(result.resolved).toBe(false);
    expect(result.issues.some(issue => issue.code === 'RTC_ENTITY_NOT_ACTIVE')).toBe(true);
  });

  it('denies runtime resolution when the role has no active security definition', () => {
    const result = resolveRuntimeContract(serviceJobCardMetadataSet, 'service_job_card', {
      ...serviceAdvisorContext,
      roleCode: 'parts_clerk',
    });

    expect(result.resolved).toBe(false);
    expect(result.issues.some(issue => issue.code === 'RTC_SECURITY_DEFINITION_NOT_FOUND')).toBe(true);
  });
});
