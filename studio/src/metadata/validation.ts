export type ValidationSeverity = 'warning' | 'error' | 'blocking_error';

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  issues: ValidationIssue[];
}

export const API_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function issue(
  code: string,
  message: string,
  path?: string,
  severity: ValidationSeverity = 'error',
): ValidationIssue {
  return { code, message, path, severity };
}

export function ok<T>(data: T, issues: ValidationIssue[] = []): ValidationResult<T> {
  return { valid: issues.every(item => item.severity === 'warning'), data, issues };
}

export function fail<T>(issues: ValidationIssue[]): ValidationResult<T> {
  return { valid: false, issues };
}

export function hasBlockingIssue(issues: ValidationIssue[]): boolean {
  return issues.some(item => item.severity === 'error' || item.severity === 'blocking_error');
}

export function requireString(
  value: unknown,
  path: string,
  code: string,
  label: string,
  issues: ValidationIssue[],
): value is string {
  if (typeof value === 'string' && value.trim().length > 0) return true;
  issues.push(issue(code, `${label} is required.`, path));
  return false;
}

export function requireApiName(value: unknown, path: string, issues: ValidationIssue[]): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push(issue('API_NAME_REQUIRED', 'API name is required.', path));
    return false;
  }

  if (!API_NAME_PATTERN.test(value)) {
    issues.push(issue('API_NAME_INVALID', 'API name must use snake_case and start with a lowercase letter.', path));
    return false;
  }

  return true;
}

export function requireOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  code: string,
  label: string,
  issues: ValidationIssue[],
): value is T {
  if (typeof value === 'string' && allowed.includes(value as T)) return true;
  issues.push(issue(code, `${label} must be one of: ${allowed.join(', ')}.`, path));
  return false;
}

export function rejectKeys(
  input: Record<string, unknown>,
  keys: readonly string[],
  code: string,
  issues: ValidationIssue[],
): void {
  for (const key of keys) {
    if (key in input) {
      issues.push(issue(code, `${key} is not allowed here.`, key));
    }
  }
}
