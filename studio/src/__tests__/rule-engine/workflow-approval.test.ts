/**
 * Workflow & Approval Engine — Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_CATEGORIES,
  WORKFLOW_NODE_TYPES,
  WORKFLOW_TRIGGERS,
  TASK_STATUSES,
  INSTANCE_STATUSES,
  validateWorkflowDefinition,
  validateWorkflowGraph,
} from '../../metadata/workflow-engine-definition';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../../metadata/workflow-engine-definition';
import {
  APPROVAL_TYPES,
  APPROVAL_ACTIONS,
  validateApprovalPolicy,
} from '../../metadata/approval-engine-definition';
import type { ApprovalPolicy } from '../../metadata/approval-engine-definition';

describe('Workflow Engine Definition', () => {
  describe('Constants', () => {
    it('defines 6 workflow categories', () => {
      expect(WORKFLOW_CATEGORIES).toHaveLength(6);
    });
    it('defines 12 node types', () => {
      expect(WORKFLOW_NODE_TYPES).toHaveLength(12);
    });
    it('defines 6 trigger events', () => {
      expect(WORKFLOW_TRIGGERS).toHaveLength(6);
    });
    it('defines 7 task statuses', () => {
      expect(TASK_STATUSES).toHaveLength(7);
    });
    it('defines 7 instance statuses', () => {
      expect(INSTANCE_STATUSES).toHaveLength(7);
    });
  });

  describe('validateWorkflowDefinition', () => {
    const valid: WorkflowDefinition = {
      id: 'wf-1', code: 'TEST_WF', name: 'Test Workflow',
      category: 'approval', module: 'sales', triggerEvent: 'on_submit',
      status: 'draft', currentVersion: 0, owner: 'admin',
      createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z',
    };

    it('accepts valid definition', () => {
      expect(validateWorkflowDefinition(valid).valid).toBe(true);
    });
    it('rejects missing id', () => {
      expect(validateWorkflowDefinition({ ...valid, id: '' }).valid).toBe(false);
    });
    it('rejects missing code', () => {
      expect(validateWorkflowDefinition({ ...valid, code: '' }).valid).toBe(false);
    });
    it('rejects missing name', () => {
      expect(validateWorkflowDefinition({ ...valid, name: '' }).valid).toBe(false);
    });
    it('rejects missing category', () => {
      expect(validateWorkflowDefinition({ ...valid, category: '' as any }).valid).toBe(false);
    });
    it('rejects missing trigger', () => {
      expect(validateWorkflowDefinition({ ...valid, triggerEvent: '' as any }).valid).toBe(false);
    });
  });

  describe('validateWorkflowGraph', () => {
    const nodes: WorkflowNode[] = [
      { id: 'n1', versionId: 'v1', nodeType: 'start', code: 's', name: 'Start', config: {}, position: { x: 0, y: 0 } },
      { id: 'n2', versionId: 'v1', nodeType: 'human_task', code: 't', name: 'Task', config: {}, position: { x: 100, y: 0 } },
      { id: 'n3', versionId: 'v1', nodeType: 'end', code: 'e', name: 'End', config: {}, position: { x: 200, y: 0 } },
    ];
    const edges: WorkflowEdge[] = [
      { id: 'e1', versionId: 'v1', fromNodeId: 'n1', toNodeId: 'n2', isDefault: true },
      { id: 'e2', versionId: 'v1', fromNodeId: 'n2', toNodeId: 'n3', isDefault: true },
    ];

    it('accepts valid connected graph', () => {
      const result = validateWorkflowGraph(nodes, edges);
      expect(result.valid).toBe(true);
    });

    it('rejects graph with no start node', () => {
      const noStart = nodes.filter(n => n.nodeType !== 'start');
      expect(validateWorkflowGraph(noStart, edges).valid).toBe(false);
    });

    it('rejects graph with no end node', () => {
      const noEnd = nodes.filter(n => n.nodeType !== 'end');
      expect(validateWorkflowGraph(noEnd, edges).valid).toBe(false);
    });

    it('detects unreachable nodes', () => {
      const extra: WorkflowNode = { id: 'n4', versionId: 'v1', nodeType: 'notification', code: 'x', name: 'Orphan', config: {}, position: { x: 300, y: 0 } };
      const result = validateWorkflowGraph([...nodes, extra], edges);
      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('Unreachable');
    });

    it('rejects multiple start nodes', () => {
      const extra: WorkflowNode = { id: 'n5', versionId: 'v1', nodeType: 'start', code: 's2', name: 'Start 2', config: {}, position: { x: 0, y: 100 } };
      const result = validateWorkflowGraph([...nodes, extra], edges);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('exactly one Start'))).toBe(true);
    });
  });
});

describe('Approval Engine Definition', () => {
  describe('Constants', () => {
    it('defines 7 approval types', () => {
      expect(APPROVAL_TYPES).toHaveLength(7);
    });
    it('defines 6 approval actions', () => {
      expect(APPROVAL_ACTIONS).toHaveLength(6);
    });
  });

  describe('validateApprovalPolicy', () => {
    const valid: ApprovalPolicy = {
      id: 'ap-1', code: 'TEST_AP', name: 'Test Policy',
      module: 'sales', documentType: 'sale_invoice', triggerEvent: 'on_submit',
      approvalType: 'single_approver', makerCheckerEnforced: true, status: 'draft', version: 1,
      steps: [{ stepOrder: 1, resolverType: 'reporting_manager', allowedActions: ['approve', 'reject'], requireRemarks: ['reject'], escalateOnBreach: false }],
      createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z',
    };

    it('accepts valid policy', () => {
      expect(validateApprovalPolicy(valid).valid).toBe(true);
    });
    it('rejects missing id', () => {
      expect(validateApprovalPolicy({ ...valid, id: '' }).valid).toBe(false);
    });
    it('rejects missing code', () => {
      expect(validateApprovalPolicy({ ...valid, code: '' }).valid).toBe(false);
    });
    it('rejects missing name', () => {
      expect(validateApprovalPolicy({ ...valid, name: '' }).valid).toBe(false);
    });
    it('rejects empty steps', () => {
      expect(validateApprovalPolicy({ ...valid, steps: [] }).valid).toBe(false);
    });
    it('rejects sequential with only 1 step', () => {
      const result = validateApprovalPolicy({ ...valid, approvalType: 'sequential' });
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('at least 2'))).toBe(true);
    });
  });
});
