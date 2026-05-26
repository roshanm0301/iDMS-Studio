import { describe, expect, it } from 'vitest';
import {
  serviceJobCardPackage,
  serviceJobCardSecurityDefinitions,
  serviceJobCardValidationRules,
  serviceJobCardVersions,
} from './policy-version-fixtures';
import { validateSecurityDefinition } from './security-definition';
import { validateValidationRuleDefinition } from './validation-rule-definition';
import { validatePackageDefinition, validateVersionDefinition } from './version-package-definition';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('Validation, security, version, dependency, and package contracts', () => {
  it('accepts service job card policy and package fixtures', () => {
    expect(serviceJobCardValidationRules.every(rule => validateValidationRuleDefinition(rule).valid)).toBe(true);
    expect(serviceJobCardSecurityDefinitions.every(rule => validateSecurityDefinition(rule).valid)).toBe(true);
    expect(serviceJobCardVersions.every(version => validateVersionDefinition(version).valid)).toBe(true);
    expect(validatePackageDefinition(serviceJobCardPackage).valid).toBe(true);
  });

  it('rejects arbitrary-code validation expressions', () => {
    const rule = clone(serviceJobCardValidationRules[0]);
    rule.expression = { op: 'eq', script: 'return record.total > 0' } as never;

    const result = validateValidationRuleDefinition(rule);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'VAL_ARBITRARY_CODE_FORBIDDEN')).toBe(true);
  });

  it('requires security definitions to target role subjects without making role a layer', () => {
    const security = clone(serviceJobCardSecurityDefinitions[0]);
    security.subjects.roleCodes = [];
    security.ownership.owningLayer = 'role' as never;

    const result = validateSecurityDefinition(security);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'SEC_SUBJECT_REQUIRED')).toBe(true);
    expect(result.issues.some(issue => issue.code === 'SEC_ROLE_LAYER_FORBIDDEN')).toBe(true);
  });

  it('requires published versions to be immutable', () => {
    const version = clone(serviceJobCardVersions[0]);
    version.immutable = false;

    const result = validateVersionDefinition(version);

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'VER_PUBLISHED_IMMUTABLE_REQUIRED')).toBe(true);
  });
});
