import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  type Connection,
  useNodesState,
  useEdgesState,
  type NodeProps,
  type EdgeChange,
  type EdgeProps,
  Handle,
  Position,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAppStore } from '../../store';
import type { InstructionStep, ConnectionData, ConnectionStyle, ShapeType, ArrowDirection, ConnectionType } from '../../types';

// Custom node component
const StepNode = ({ data, selected }: NodeProps<InstructionStep>) => {
  const color = data.highlightColor || '#4299e1';
  const shapeIcon: Record<string, string> = {
    cube: '📦', sphere: '🔵', cylinder: '🥫', cone: '🔺', custom: '🗿',
    engravedBlock: '🔲', custom3dElement: '🧩', uploadedModel: '📤',
  };
  const icon = shapeIcon[data.shapeType || 'cube'] || '📦';

  return (
    <div
      className={`rounded-xl bg-white shadow-lg min-w-[190px] max-w-[240px] transition-all duration-150 ${
        selected
          ? 'ring-2 ring-offset-1 ring-blue-500 shadow-blue-200'
          : 'border border-slate-200 hover:shadow-md'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-slate-400 !border-white !border-2" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-400 !border-white !border-2" />
      <Handle type="target" position={Position.Right} className="!w-2.5 !h-2.5 !bg-slate-400 !border-white !border-2" />

      {/* Color accent bar */}
      <div className="h-1 rounded-t-xl" style={{ backgroundColor: color }} />

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base leading-none">{icon}</span>
          <div className="font-semibold text-slate-800 text-sm leading-tight truncate">{data.title}</div>
        </div>
        {data.description && (
          <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {data.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-white !border-2" />
      <Handle type="source" position={Position.Left} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-white !border-2" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-indigo-500 !border-white !border-2" />
    </div>
  );
};

// ─── Connection styles ────────────────────────────────────────────────────────
const CONNECTION_STYLES: { value: ConnectionStyle; label: string; color: string; textColor: string }[] = [
  { value: 'standard', label: 'Standard', color: '#64748b', textColor: '#fff' },
  { value: 'glass',    label: 'Szklane',  color: '#60a5fa', textColor: '#fff' },
  { value: 'glow',     label: 'Złote',    color: '#fbbf24', textColor: '#1e1e1e' },
  { value: 'neon',     label: 'Neonowe',  color: '#ec4899', textColor: '#fff' },
];

const ARROW_DIRS: { value: ArrowDirection; label: string }[] = [
  { value: 'none',          label: '— Brak' },
  { value: 'forward',       label: '→ Naprzód' },
  { value: 'backward',      label: '← Wstecz' },
  { value: 'bidirectional', label: '↔ Dwukierunkowe' },
];

const CONN_TYPES: { value: ConnectionType; label: string }[] = [
  { value: 'tube',  label: '🔩 Rura' },
  { value: 'arrow', label: '➡ Strzałka' },
];

const SHAPE_MARKERS: { value: string; label: string }[] = [
  { value: '',         label: 'Brak' },
  { value: 'cube',     label: '📦 Sześcian' },
  { value: 'sphere',   label: '🔵 Kula' },
  { value: 'cylinder', label: '🥫 Walec' },
  { value: 'cone',     label: '🔺 Stożek' },
];

// ─── Inline connection editor rendered on the edge label ──────────────────────
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<ConnectionData>) => {
  const { updateConnections, project } = useAppStore();
  const [open, setOpen] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const currentStyle       = data?.style          || 'standard';
  const currentDescription = data?.description    || '';
  const currentShapeType   = data?.shapeType;
  const currentArrowDir    = data?.arrowDirection || 'none';
  const currentConnType    = data?.connectionType || 'tube';

  // Local draft state – only committed on Save
  const [draftDesc,     setDraftDesc]     = useState(currentDescription);
  const [draftStyle,    setDraftStyle]    = useState<ConnectionStyle>(currentStyle);
  const [draftShape,    setDraftShape]    = useState<ShapeType | undefined>(currentShapeType);
  const [draftArrow,    setDraftArrow]    = useState<ArrowDirection>(currentArrowDir);
  const [draftConnType, setDraftConnType] = useState<ConnectionType>(currentConnType);

  // Re-sync draft when edge data changes externally
  useEffect(() => {
    setDraftDesc(data?.description    || '');
    setDraftStyle(data?.style          || 'standard');
    setDraftShape(data?.shapeType);
    setDraftArrow(data?.arrowDirection || 'none');
    setDraftConnType(data?.connectionType || 'tube');
  }, [data]);

  const styleInfo = CONNECTION_STYLES.find(s => s.value === currentStyle) || CONNECTION_STYLES[0];

  const handleSave = () => {
    if (!project) return;
    const updated = project.connections.map(conn =>
      conn.id === id
        ? { ...conn, data: { ...conn.data, description: draftDesc, style: draftStyle, shapeType: draftShape, arrowDirection: draftArrow, connectionType: draftConnType } }
        : conn
    );
    updateConnections(updated);
    setOpen(false);
  };

  const handleDelete = () => {
    if (!project) return;
    if (!window.confirm('Usunąć to połączenie?')) return;
    updateConnections(project.connections.filter(conn => conn.id !== id));
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        {/* Collapsed pill – always visible */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              title="Edytuj połączenie"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md hover:scale-105 active:scale-95 transition-transform"
              style={{ backgroundColor: styleInfo.color, color: styleInfo.textColor }}
            >
              <span>{styleInfo.label}</span>
              {currentDescription && (
                <span className="opacity-80" title={currentDescription}>📝</span>
              )}
              <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
              </svg>
            </button>
          ) : (
            /* Expanded editor panel */
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-72 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Edytuj połączenie</span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-3 space-y-3">
                {/* Style swatches */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Styl wizualny</p>
                  <div className="flex gap-1.5">
                    {CONNECTION_STYLES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setDraftStyle(s.value)}
                        title={s.label}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${draftStyle === s.value ? 'ring-2 ring-offset-1 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: s.color, color: s.textColor }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connection type + Arrow direction side by side */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Typ</p>
                    <select
                      value={draftConnType}
                      onChange={e => setDraftConnType(e.target.value as ConnectionType)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CONN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Kierunek</p>
                    <select
                      value={draftArrow}
                      onChange={e => setDraftArrow(e.target.value as ArrowDirection)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ARROW_DIRS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Shape marker */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Znacznik kształtu</p>
                  <select
                    value={draftShape || ''}
                    onChange={e => setDraftShape(e.target.value ? (e.target.value as ShapeType) : undefined)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SHAPE_MARKERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Opis (opcjonalnie)</p>
                  <textarea
                    value={draftDesc}
                    onChange={e => setDraftDesc(e.target.value)}
                    rows={2}
                    placeholder="Opis połączenia…"
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex gap-2 px-3 pb-3">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Zapisz
                </button>
                <button
                  onClick={handleDelete}
                  title="Usuń połączenie"
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-lg border border-red-200 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { stepNode: StepNode };
const edgeTypes = { default: CustomEdge };

export const StepBuilder = () => {
  const { project, updateConnections, setSelectedStepId, nodePositions, updateNodePosition } = useAppStore();
  
  const initialNodes: Node[] = useMemo(() => {
    if (!project) return [];
    return project.steps.map((step, index) => ({
      id: step.id,
      type: 'stepNode',
      position: nodePositions[step.id] || { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
      data: step,
    }));
  }, [project, nodePositions]);

  const initialEdges: Edge[] = useMemo(() => project?.connections || [], [project]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (project) {
      const updatedNodes = project.steps.map((step) => {
        const existingNode = nodes.find(n => n.id === step.id);
        return {
          id: step.id,
          type: 'stepNode',
          position: existingNode?.position || nodePositions[step.id] || { x: 100, y: 100 },
          data: step,
        };
      });
      setNodes(updatedNodes);
    }
  }, [project?.steps, nodePositions, setNodes]);

  useEffect(() => {
    if (project) {
      setEdges(project.connections);
    }
  }, [project?.connections, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const newEdge: Edge<ConnectionData> = {
        id: `e${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: { style: 'standard' as ConnectionStyle },
      };
      const newEdges = [...edges, newEdge];
      setEdges(newEdges);
      updateConnections(newEdges);
    },
    [edges, updateConnections, setEdges]
  );

  const onEdgesChange_ = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedStepId(node.id);
    },
    [setSelectedStepId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedStepId(null);
  }, [setSelectedStepId]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange_}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-slate-50"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls className="shadow-lg border border-slate-200 rounded-lg overflow-hidden" />
      </ReactFlow>
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium text-sm">Brak kroków</p>
            <p className="text-slate-400 text-xs mt-1">Dodaj krok w panelu po lewej</p>
          </div>
        </div>
      )}
    </div>
  );
};
