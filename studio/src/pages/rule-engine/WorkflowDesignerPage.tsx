/**
 * Workflow Designer Page — Interactive node editor with palette, canvas, and property panel
 */
import { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge as rfAddEdge,
  applyNodeChanges, applyEdgeChanges,
} from 'reactflow';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { GitBranch, Search, Plus, Trash2, Save, X } from 'lucide-react';
import {
  getWorkflows, getWorkflowVersion, getWorkflowStats,
  saveWorkflow, createWorkflowVersion, saveWorkflowVersion,
  updateNodePosition, updateNodeConfig,
} from '../../data/workflowService';
import {
  WORKFLOW_CATEGORY_LABELS, NODE_TYPE_LABELS, WORKFLOW_NODE_TYPES,
  WORKFLOW_CATEGORIES, WORKFLOW_TRIGGERS,
} from '../../metadata/workflow-engine-definition';
import type {
  WorkflowCategory, WorkflowNodeType, WorkflowTrigger,
  WorkflowNode as WFNode, WorkflowEdge as WFEdge, WorkflowDefinition,
} from '../../metadata/workflow-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Node color map
// ═══════════════════════════════════════════════════════════════
const NODE_COLORS: Record<string, string> = {
  start: '#22C55E', end: '#EF4444', human_task: '#3B82F6',
  approval_task: '#8B5CF6', service_task: '#F59E0B', decision_gateway: '#EC4899',
  timer: '#06B6D4', notification: '#10B981', error_handler: '#F87171',
  parallel_split: '#6366F1', parallel_join: '#6366F1', sub_workflow: '#78716C',
};

// ═══════════════════════════════════════════════════════════════
// Transform helpers
// ═══════════════════════════════════════════════════════════════
function toReactFlowNodes(nodes: WFNode[]): Node[] {
  return nodes.map(n => ({
    id: n.id,
    position: n.position,
    data: { label: n.name, nodeType: n.nodeType, code: n.code, config: n.config },
    style: {
      background: NODE_COLORS[n.nodeType] || '#6B7280',
      color: '#fff', padding: '8px 14px',
      borderRadius: n.nodeType === 'decision_gateway' ? 0 : 8,
      fontSize: 11, fontWeight: 500,
      transform: n.nodeType === 'decision_gateway' ? 'rotate(45deg)' : undefined,
      width: n.nodeType === 'decision_gateway' ? 60 : undefined,
      height: n.nodeType === 'decision_gateway' ? 60 : undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  }));
}

function toReactFlowEdges(edges: WFEdge[]): Edge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.fromNodeId,
    target: e.toNodeId,
    label: e.label || '',
    animated: !e.isDefault,
    style: { stroke: e.isDefault ? '#6B7280' : '#8B5CF6' },
  }));
}

// ═══════════════════════════════════════════════════════════════
// New Workflow Dialog
// ═══════════════════════════════════════════════════════════════
function NewWorkflowDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (wf: WorkflowDefinition) => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<WorkflowCategory>('approval');
  const [module, setModule] = useState('');
  const [trigger, setTrigger] = useState<WorkflowTrigger>('on_submit');

  const submit = () => {
    if (!name || !code) return;
    const wf: WorkflowDefinition = {
      id: `wf-${Date.now()}`, code, name, category, module: module || 'general',
      triggerEvent: trigger, status: 'draft', currentVersion: 0,
      owner: 'admin', createdBy: 'admin', createdAt: new Date().toISOString(),
    };
    onCreate(wf);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>New Workflow</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>Code *</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. SI_POST_APPROVAL" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sale Invoice Post-Approval" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as WorkflowCategory)} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                {WORKFLOW_CATEGORIES.map(c => <option key={c} value={c}>{WORKFLOW_CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>Module</label>
              <input value={module} onChange={e => setModule(e.target.value)} placeholder="sales" style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>Trigger Event</label>
            <select value={trigger} onChange={e => setTrigger(e.target.value as WorkflowTrigger)} style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {WORKFLOW_TRIGGERS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <button onClick={submit} className="btn btn-primary btn-sm" disabled={!name || !code}>Create Workflow</button>
            <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Node Palette
// ═══════════════════════════════════════════════════════════════
function NodePalette({ onAddNode }: { onAddNode: (type: WorkflowNodeType) => void }) {
  return (
    <div style={{ width: 160, borderRight: '1px solid var(--border)', padding: 8, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.5px' }}>
        Node Palette
      </div>
      {WORKFLOW_NODE_TYPES.map(type => (
        <button
          key={type}
          onClick={() => onAddNode(type)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            width: '100%', padding: '6px 8px', marginBottom: 3,
            fontSize: 11, border: '1px solid var(--border)', borderRadius: 5,
            cursor: 'pointer', textAlign: 'left', background: 'var(--bg)',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: type === 'decision_gateway' ? 0 : '50%', background: NODE_COLORS[type], display: 'inline-block', flexShrink: 0, transform: type === 'decision_gateway' ? 'rotate(45deg)' : undefined }} />
          {NODE_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Property Panel
// ═══════════════════════════════════════════════════════════════
function PropertyPanel({ node, onUpdate, onDelete }: {
  node: Node;
  onUpdate: (nodeId: string, name: string, code: string, config: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}) {
  const [name, setName] = useState(node.data.label || '');
  const [code, setCode] = useState(node.data.code || '');
  const [configJson, setConfigJson] = useState(JSON.stringify(node.data.config || {}, null, 2));

  const save = () => {
    let config: Record<string, unknown> = {};
    try { config = JSON.parse(configJson); } catch { /* keep empty */ }
    onUpdate(node.id, name, code, config);
  };

  return (
    <div style={{ width: 240, borderLeft: '1px solid var(--border)', padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.5px' }}>
        Node Properties
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ width: 10, height: 10, borderRadius: node.data.nodeType === 'decision_gateway' ? 0 : '50%', background: NODE_COLORS[node.data.nodeType] || '#6B7280', display: 'inline-block' }} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>{NODE_TYPE_LABELS[node.data.nodeType as WorkflowNodeType] || node.data.nodeType}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', fontSize: 11, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Code</label>
          <input value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', fontSize: 11, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Config (JSON)</label>
          <textarea
            value={configJson} onChange={e => setConfigJson(e.target.value)}
            rows={5}
            style={{ width: '100%', fontSize: 10, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={save} className="btn btn-primary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Save size={12} /> Save
          </button>
          {node.data.nodeType !== 'start' && node.data.nodeType !== 'end' && (
            <button onClick={() => onDelete(node.id)} className="btn btn-ghost btn-sm" style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
export default function WorkflowDesignerPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WorkflowCategory | ''>('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>('wf-001');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = useMemo(() => getWorkflowStats(), [refreshKey]);
  const workflows = useMemo(
    () => getWorkflows({ category: categoryFilter || undefined, search: search || undefined }),
    [search, categoryFilter, refreshKey],
  );

  const version = useMemo(
    () => selectedWorkflowId ? getWorkflowVersion(selectedWorkflowId) : undefined,
    [selectedWorkflowId, refreshKey],
  );

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Sync when version changes
  useMemo(() => {
    if (version) {
      setNodes(toReactFlowNodes(version.nodes));
      setEdges(toReactFlowEdges(version.edges));
      setSelectedNodeId(null);
    } else {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
    }
  }, [version]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
    if (version) {
      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          updateNodePosition(version.id, c.id, c.position);
        }
      }
    }
  }, [version]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!version || !connection.source || !connection.target) return;
    const edgeId = `e-${Date.now()}`;
    const newEdge: WFEdge = {
      id: edgeId, versionId: version.id,
      fromNodeId: connection.source, toNodeId: connection.target, isDefault: true,
    };
    version.edges = [...version.edges, newEdge];
    setEdges(eds => rfAddEdge({ ...connection, id: edgeId, style: { stroke: '#6B7280' } }, eds));
  }, [version]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleAddNode = useCallback((type: WorkflowNodeType) => {
    if (!version) return;
    const id = `n-${Date.now()}`;
    const newNode: WFNode = {
      id, versionId: version.id, nodeType: type,
      code: type, name: NODE_TYPE_LABELS[type], config: {},
      position: { x: 300 + Math.random() * 200, y: 150 + Math.random() * 200 },
    };
    version.nodes = [...version.nodes, newNode];
    setNodes(nds => [...nds, ...toReactFlowNodes([newNode])]);
  }, [version]);

  const handleUpdateNode = useCallback((nodeId: string, name: string, code: string, config: Record<string, unknown>) => {
    if (!version) return;
    updateNodeConfig(version.id, nodeId, { name, code, config });
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: name, code, config } } : n));
  }, [version]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!version) return;
    version.nodes = version.nodes.filter(n => n.id !== nodeId);
    version.edges = version.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId);
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [version]);

  const handleCreateWorkflow = useCallback((wf: WorkflowDefinition) => {
    saveWorkflow(wf);
    createWorkflowVersion(wf.id);
    setShowNewDialog(false);
    setSelectedWorkflowId(wf.id);
    setRefreshKey(k => k + 1);
  }, []);

  const handleSaveVersion = useCallback(() => {
    if (!version) return;
    saveWorkflowVersion(version);
    setRefreshKey(k => k + 1);
  }, [version]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return (
    <div className="content" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={20} />
            Workflow Designer
          </h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
            {stats.totalWorkflows} workflows · {stats.published} published · {stats.totalPolicies} approval policies
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {version && (
            <button className="btn btn-ghost btn-sm" onClick={handleSaveVersion} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Save size={14} /> Save Version
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewDialog(true)}>
            <Plus size={14} /> New Workflow
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows…"
            style={{ width: '100%', padding: '6px 8px 6px 28px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as WorkflowCategory | '')}
          style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
        >
          <option value="">All Categories</option>
          {Object.entries(WORKFLOW_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Split: list + palette + canvas + property panel */}
      <div style={{ display: 'flex', flex: 1, gap: 0, minHeight: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Workflow list */}
        <div style={{ width: 220, overflowY: 'auto', borderRight: '1px solid var(--border)', padding: 8 }}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              onClick={() => setSelectedWorkflowId(wf.id)}
              style={{
                padding: '8px 10px', borderRadius: 6, marginBottom: 4, cursor: 'pointer',
                backgroundColor: wf.id === selectedWorkflowId ? 'var(--accent-subtle)' : 'transparent',
                border: `1px solid ${wf.id === selectedWorkflowId ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 500 }}>{wf.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                <span>{WORKFLOW_CATEGORY_LABELS[wf.category]}</span>
                <span style={{ padding: '0 4px', borderRadius: 3, backgroundColor: wf.status === 'published' ? '#D1FAE5' : '#FEF3C7', color: wf.status === 'published' ? '#065F46' : '#92400E' }}>
                  {wf.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Node palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Canvas */}
        <div style={{ flex: 1, minHeight: 400 }}>
          {version ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', fontSize: 13 }}>
              Select a workflow or create a new one
            </div>
          )}
        </div>

        {/* Property panel */}
        {selectedNode && version && (
          <PropertyPanel
            key={selectedNode.id}
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
          />
        )}
      </div>

      {/* New Workflow Dialog */}
      {showNewDialog && (
        <NewWorkflowDialog onClose={() => setShowNewDialog(false)} onCreate={handleCreateWorkflow} />
      )}
    </div>
  );
}
