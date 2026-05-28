/**
 * Approval Engine — Metadata Types
 *
 * Implements: APR-POL, APR-REQ, APR-TYPE, APR-RES, APR-ACT
 */

// ═══════════════════════════════════════════════════════════════
// Approval Types — APR-TYPE
// ═══════════════════════════════════════════════════════════════
export const APPROVAL_TYPES = [
  'single_approver', 'sequential', 'parallel_all', 'parallel_any',
  'amount_matrix', 'hierarchy', 'committee',
] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  single_approver: 'Single Approver',
  sequential: 'Sequential',
  parallel_all: 'Parallel (All)',
  parallel_any: 'Parallel (Any One)',
  amount_matrix: 'Amount Matrix',
  hierarchy: 'Hierarchy-Based',
  committee: 'Committee',
};

// ═══════════════════════════════════════════════════════════════
// Approver Resolver Types
// ═══════════════════════════════════════════════════════════════
export const APPROVER_RESOLVER_TYPES = [
  'user', 'role', 'reporting_manager', 'branch_manager',
  'finance_approver', 'department_head', 'custom_group',
] as const;
export type ApproverResolverType = (typeof APPROVER_RESOLVER_TYPES)[number];

// ═══════════════════════════════════════════════════════════════
// Approval Actions
// ═══════════════════════════════════════════════════════════════
export const APPROVAL_ACTIONS = [
  'approve', 'reject', 'send_back', 'delegate', 'escalate', 'override',
] as const;
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];

// ═══════════════════════════════════════════════════════════════
// Approval Policy
// ═══════════════════════════════════════════════════════════════
export interface ApprovalStep {
  stepOrder: number;
  resolverType: ApproverResolverType;
  resolverConfig?: Record<string, unknown>;
  allowedActions: ApprovalAction[];
  requireRemarks: ApprovalAction[];
  slaHours?: number;
  escalateOnBreach: boolean;
}

export interface ApprovalPolicy {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  documentType: string;
  triggerEvent: string;
  approvalType: ApprovalType;
  steps: ApprovalStep[];
  applicabilityConditionRef?: string;
  makerCheckerEnforced: boolean;
  status: 'draft' | 'published' | 'retired';
  version: number;
  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════
export function validateApprovalPolicy(policy: ApprovalPolicy): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!policy.id) issues.push('Approval policy ID is required.');
  if (!policy.code || policy.code.trim().length === 0) issues.push('Policy code is required.');
  if (!policy.name || policy.name.trim().length === 0) issues.push('Policy name is required.');
  if (!policy.approvalType) issues.push('Approval type is required.');
  if (!policy.steps || policy.steps.length === 0) issues.push('At least one approval step is required.');
  if (policy.approvalType === 'sequential' && policy.steps.length < 2) {
    issues.push('Sequential approval requires at least 2 steps.');
  }
  return { valid: issues.length === 0, issues };
}
