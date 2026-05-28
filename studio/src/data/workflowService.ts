/**
 * Workflow & Approval — Mock Data Service
 */
import type { WorkflowDefinition, WorkflowVersion, WorkflowNode, WorkflowEdge, WorkflowCategory } from '../metadata/workflow-engine-definition';
import type { ApprovalPolicy } from '../metadata/approval-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Seed Workflows
// ═══════════════════════════════════════════════════════════════
const SEED_WORKFLOWS: WorkflowDefinition[] = [
  { id: 'wf-001', code: 'SI_APPROVAL', name: 'Sale Invoice Approval', category: 'approval', module: 'sales', documentType: 'sale_invoice', triggerEvent: 'on_submit', status: 'published', currentVersion: 1, owner: 'sales_head', createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'wf-002', code: 'PO_APPROVAL', name: 'Purchase Order Approval', category: 'approval', module: 'procurement', documentType: 'purchase_order', triggerEvent: 'on_submit', status: 'published', currentVersion: 1, owner: 'procurement_head', createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'wf-003', code: 'SI_POST_COMMIT', name: 'Sale Invoice Post-Commit', category: 'post_commit', module: 'sales', documentType: 'sale_invoice', triggerEvent: 'on_save_completed', status: 'published', currentVersion: 1, owner: 'system', createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'wf-004', code: 'ESCALATION_DEFAULT', name: 'Default Escalation Process', category: 'escalation', module: 'general', triggerEvent: 'on_status_changed', status: 'draft', currentVersion: 0, owner: 'system', createdBy: 'admin', createdAt: '2026-02-01T00:00:00Z' },
];

const SEED_NODES: WorkflowNode[] = [
  { id: 'n-1', versionId: 'wfv-001', nodeType: 'start', code: 'start', name: 'Start', config: {}, position: { x: 50, y: 200 } },
  { id: 'n-2', versionId: 'wfv-001', nodeType: 'approval_task', code: 'mgr_approval', name: 'Manager Approval', config: { resolverType: 'reporting_manager' }, position: { x: 250, y: 200 } },
  { id: 'n-3', versionId: 'wfv-001', nodeType: 'decision_gateway', code: 'check_amount', name: 'Amount Check', config: { condition: 'amount > 100000' }, position: { x: 450, y: 200 } },
  { id: 'n-4', versionId: 'wfv-001', nodeType: 'approval_task', code: 'finance_approval', name: 'Finance Approval', config: { resolverType: 'finance_approver' }, position: { x: 650, y: 100 } },
  { id: 'n-5', versionId: 'wfv-001', nodeType: 'notification', code: 'notify_requester', name: 'Notify Requester', config: { template: 'approval_complete' }, position: { x: 650, y: 300 } },
  { id: 'n-6', versionId: 'wfv-001', nodeType: 'end', code: 'end', name: 'End', config: {}, position: { x: 850, y: 200 } },
];

const SEED_EDGES: WorkflowEdge[] = [
  { id: 'e-1', versionId: 'wfv-001', fromNodeId: 'n-1', toNodeId: 'n-2', isDefault: true },
  { id: 'e-2', versionId: 'wfv-001', fromNodeId: 'n-2', toNodeId: 'n-3', isDefault: true },
  { id: 'e-3', versionId: 'wfv-001', fromNodeId: 'n-3', toNodeId: 'n-4', isDefault: false, label: 'Amount > 1L', conditionRef: 'amount_gt_100k' },
  { id: 'e-4', versionId: 'wfv-001', fromNodeId: 'n-3', toNodeId: 'n-5', isDefault: true, label: 'Otherwise' },
  { id: 'e-5', versionId: 'wfv-001', fromNodeId: 'n-4', toNodeId: 'n-6', isDefault: true },
  { id: 'e-6', versionId: 'wfv-001', fromNodeId: 'n-5', toNodeId: 'n-6', isDefault: true },
];

const SEED_VERSIONS: WorkflowVersion[] = [
  { id: 'wfv-001', workflowId: 'wf-001', versionNo: 1, status: 'published', nodes: SEED_NODES, edges: SEED_EDGES, publishedBy: 'admin', publishedAt: '2026-01-15T00:00:00Z' },
];

// ═══════════════════════════════════════════════════════════════
// Seed Approval Policies
// ═══════════════════════════════════════════════════════════════
let SEED_POLICIES: ApprovalPolicy[] = [
  {
    id: 'ap-001', code: 'SI_AMT_APPROVAL', name: 'Sale Invoice Amount Approval',
    module: 'sales', documentType: 'sale_invoice', triggerEvent: 'on_submit',
    approvalType: 'sequential', makerCheckerEnforced: true, status: 'published', version: 1,
    steps: [
      { stepOrder: 1, resolverType: 'reporting_manager', allowedActions: ['approve', 'reject', 'send_back'], requireRemarks: ['reject', 'send_back'], slaHours: 24, escalateOnBreach: true },
      { stepOrder: 2, resolverType: 'finance_approver', allowedActions: ['approve', 'reject'], requireRemarks: ['reject'], slaHours: 48, escalateOnBreach: true },
    ],
    createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ap-002', code: 'PO_SINGLE', name: 'Purchase Order Single Approval',
    module: 'procurement', documentType: 'purchase_order', triggerEvent: 'on_submit',
    approvalType: 'single_approver', makerCheckerEnforced: true, status: 'published', version: 1,
    steps: [
      { stepOrder: 1, resolverType: 'department_head', allowedActions: ['approve', 'reject', 'send_back'], requireRemarks: ['reject'], slaHours: 24, escalateOnBreach: false },
    ],
    createdBy: 'admin', createdAt: '2026-01-01T00:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════
export function getWorkflows(filters?: { category?: WorkflowCategory; search?: string }): WorkflowDefinition[] {
  let results = SEED_WORKFLOWS;
  if (filters?.category) results = results.filter(w => w.category === filters.category);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(w => w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q));
  }
  return results;
}

export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return SEED_WORKFLOWS.find(w => w.id === id);
}

export function getWorkflowVersion(workflowId: string): WorkflowVersion | undefined {
  return SEED_VERSIONS.find(v => v.workflowId === workflowId);
}

export function getApprovalPolicies(): ApprovalPolicy[] {
  return SEED_POLICIES;
}

export function getApprovalPolicyById(id: string): ApprovalPolicy | undefined {
  return SEED_POLICIES.find(p => p.id === id);
}

export function saveApprovalPolicy(policy: ApprovalPolicy): ApprovalPolicy {
  const idx = SEED_POLICIES.findIndex(p => p.id === policy.id);
  if (idx >= 0) {
    SEED_POLICIES[idx] = policy;
  } else {
    SEED_POLICIES.push({ ...policy, id: policy.id || `ap-${Date.now()}` });
  }
  return policy;
}

export function getWorkflowStats() {
  return {
    totalWorkflows: SEED_WORKFLOWS.length,
    published: SEED_WORKFLOWS.filter(w => w.status === 'published').length,
    draft: SEED_WORKFLOWS.filter(w => w.status === 'draft').length,
    totalPolicies: SEED_POLICIES.length,
    byCategory: Object.fromEntries(
      SEED_WORKFLOWS.reduce((acc, w) => {
        acc.set(w.category, (acc.get(w.category) || 0) + 1);
        return acc;
      }, new Map<string, number>()),
    ),
  };
}

// ═══════════════════════════════════════════════════════════════
// Workflow CRUD — for the Designer
// ═══════════════════════════════════════════════════════════════
export function saveWorkflow(def: WorkflowDefinition): WorkflowDefinition {
  const idx = SEED_WORKFLOWS.findIndex(w => w.id === def.id);
  if (idx >= 0) {
    SEED_WORKFLOWS[idx] = def;
  } else {
    SEED_WORKFLOWS.push(def);
  }
  return def;
}

export function createWorkflowVersion(workflowId: string): WorkflowVersion {
  const versionId = `wfv-${Date.now()}`;
  const version: WorkflowVersion = {
    id: versionId,
    workflowId,
    versionNo: 1,
    status: 'draft',
    nodes: [
      { id: `n-${Date.now()}-1`, versionId, nodeType: 'start', code: 'start', name: 'Start', config: {}, position: { x: 100, y: 250 } },
      { id: `n-${Date.now()}-2`, versionId, nodeType: 'end', code: 'end', name: 'End', config: {}, position: { x: 700, y: 250 } },
    ],
    edges: [],
  };
  SEED_VERSIONS.push(version);
  return version;
}

export function saveWorkflowVersion(version: WorkflowVersion): WorkflowVersion {
  const idx = SEED_VERSIONS.findIndex(v => v.id === version.id);
  if (idx >= 0) {
    SEED_VERSIONS[idx] = version;
  } else {
    SEED_VERSIONS.push(version);
  }
  return version;
}

export function addNodeToVersion(versionId: string, node: WorkflowNode): WorkflowVersion | undefined {
  const version = SEED_VERSIONS.find(v => v.id === versionId);
  if (!version) return undefined;
  version.nodes = [...version.nodes, node];
  return version;
}

export function removeNodeFromVersion(versionId: string, nodeId: string): WorkflowVersion | undefined {
  const version = SEED_VERSIONS.find(v => v.id === versionId);
  if (!version) return undefined;
  version.nodes = version.nodes.filter(n => n.id !== nodeId);
  version.edges = version.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId);
  return version;
}

export function addEdgeToVersion(versionId: string, edge: WorkflowEdge): WorkflowVersion | undefined {
  const version = SEED_VERSIONS.find(v => v.id === versionId);
  if (!version) return undefined;
  version.edges = [...version.edges, edge];
  return version;
}

export function removeEdgeFromVersion(versionId: string, edgeId: string): WorkflowVersion | undefined {
  const version = SEED_VERSIONS.find(v => v.id === versionId);
  if (!version) return undefined;
  version.edges = version.edges.filter(e => e.id !== edgeId);
  return version;
}

export function updateNodePosition(versionId: string, nodeId: string, position: { x: number; y: number }): void {
  const version = SEED_VERSIONS.find(v => v.id === versionId);
  if (!version) return;
  const node = version.nodes.find(n => n.id === nodeId);
  if (node) node.position = position;
}

export function updateNodeConfig(versionId: string, nodeId: string, updates: Partial<WorkflowNode>): void {
  const version = SEED_VERSIONS.find(v => v.id === versionId);
  if (!version) return;
  const idx = version.nodes.findIndex(n => n.id === nodeId);
  if (idx >= 0) {
    version.nodes[idx] = { ...version.nodes[idx], ...updates };
  }
}
