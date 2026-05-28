/**
 * Native Workflow Engine — Metadata Types
 *
 * Implements: WF-DEF, WF-NODE, WF-EDGE, WF-TRG, WF-TASK, WF-SVC, WF-TMR, WF-RUN
 */

// ═══════════════════════════════════════════════════════════════
// Workflow Categories — WF-DEF-008
// ═══════════════════════════════════════════════════════════════
export const WORKFLOW_CATEGORIES = [
  'approval', 'post_commit', 'notification', 'escalation', 'integration', 'operational_task',
] as const;
export type WorkflowCategory = (typeof WORKFLOW_CATEGORIES)[number];

export const WORKFLOW_CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  approval: 'Approval',
  post_commit: 'Post Commit Process',
  notification: 'Notification Process',
  escalation: 'Escalation Process',
  integration: 'Integration Process',
  operational_task: 'Operational Task Process',
};

// ═══════════════════════════════════════════════════════════════
// Node Types — WF-NODE
// ═══════════════════════════════════════════════════════════════
export const WORKFLOW_NODE_TYPES = [
  'start', 'end', 'human_task', 'approval_task', 'service_task',
  'decision_gateway', 'timer', 'notification', 'error_handler',
  'parallel_split', 'parallel_join', 'sub_workflow',
] as const;
export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  start: 'Start',
  end: 'End',
  human_task: 'Human Task',
  approval_task: 'Approval Task',
  service_task: 'Service Task',
  decision_gateway: 'Decision Gateway',
  timer: 'Timer',
  notification: 'Notification',
  error_handler: 'Error Handler',
  parallel_split: 'Parallel Split',
  parallel_join: 'Parallel Join',
  sub_workflow: 'Sub-Workflow',
};

// ═══════════════════════════════════════════════════════════════
// Trigger Events — WF-TRG-001
// ═══════════════════════════════════════════════════════════════
export const WORKFLOW_TRIGGERS = [
  'on_submit', 'on_save_completed', 'on_approval_required',
  'on_status_changed', 'on_cancel_requested', 'on_manual_start',
] as const;
export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];

// ═══════════════════════════════════════════════════════════════
// Task Statuses — WF-TASK-002
// ═══════════════════════════════════════════════════════════════
export const TASK_STATUSES = [
  'open', 'claimed', 'completed', 'cancelled', 'escalated', 'expired', 'failed',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// ═══════════════════════════════════════════════════════════════
// Instance Statuses — WF-RUN-004
// ═══════════════════════════════════════════════════════════════
export const INSTANCE_STATUSES = [
  'running', 'waiting', 'completed', 'cancelled', 'failed', 'suspended', 'terminated',
] as const;
export type InstanceStatus = (typeof INSTANCE_STATUSES)[number];

// ═══════════════════════════════════════════════════════════════
// Data Models
// ═══════════════════════════════════════════════════════════════
export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  module: string;
  documentType?: string;
  triggerEvent: WorkflowTrigger;
  status: 'draft' | 'published' | 'retired';
  currentVersion: number;
  owner: string;
  createdBy: string;
  createdAt: string;
}

export interface WorkflowNode {
  id: string;
  versionId: string;
  nodeType: WorkflowNodeType;
  code: string;
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  versionId: string;
  fromNodeId: string;
  toNodeId: string;
  conditionRef?: string;
  isDefault: boolean;
  label?: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNo: number;
  status: 'draft' | 'published' | 'retired';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  publishedBy?: string;
  publishedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════
export function validateWorkflowDefinition(def: WorkflowDefinition): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!def.id) issues.push('Workflow ID is required.');
  if (!def.code || def.code.trim().length === 0) issues.push('Workflow code is required.');
  if (!def.name || def.name.trim().length === 0) issues.push('Workflow name is required.');
  if (!def.category) issues.push('Workflow category is required.');
  if (!def.triggerEvent) issues.push('Trigger event is required.');
  return { valid: issues.length === 0, issues };
}

/**
 * Validates workflow graph connectivity — WF-EDGE-002, WF-EDGE-003
 */
export function validateWorkflowGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const startNodes = nodes.filter(n => n.nodeType === 'start');
  const endNodes = nodes.filter(n => n.nodeType === 'end');

  if (startNodes.length === 0) issues.push('Workflow must have at least one Start node.');
  if (startNodes.length > 1) issues.push('Workflow must have exactly one Start node.');
  if (endNodes.length === 0) issues.push('Workflow must have at least one End node.');

  if (startNodes.length === 1 && endNodes.length >= 1) {
    // BFS reachability from start
    const startId = startNodes[0].id;
    const adjacency = new Map<string, string[]>();
    for (const e of edges) {
      if (!adjacency.has(e.fromNodeId)) adjacency.set(e.fromNodeId, []);
      adjacency.get(e.fromNodeId)!.push(e.toNodeId);
    }
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const next of adjacency.get(cur) || []) queue.push(next);
    }
    const unreachable = nodes.filter(n => !visited.has(n.id));
    if (unreachable.length > 0) {
      issues.push(`Unreachable nodes: ${unreachable.map(n => n.name).join(', ')}`);
    }
    // Check end reachable
    const endReachable = endNodes.some(n => visited.has(n.id));
    if (!endReachable) issues.push('No End node is reachable from Start.');
  }

  return { valid: issues.length === 0, issues };
}
