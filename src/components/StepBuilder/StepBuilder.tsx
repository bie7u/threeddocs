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

interface ConnectionEditDialogProps {
  description: string;
  shapeType?: ShapeType;
  arrowDirection?: ArrowDirection;
  connectionType?: ConnectionType;
  onSave: (description: string, shapeType?: ShapeType, arrowDirection?: ArrowDirection, connectionType?: ConnectionType) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const ConnectionEditDialog = ({ 
  description, 
  shapeType, 
  arrowDirection,
  connectionType,
  onSave, 
  onCancel,
  position 
}: ConnectionEditDialogProps) => {
  const [tempDescription, setTempDescription] = useState(description);
  const [tempShapeType, setTempShapeType] = useState<ShapeType | undefined>(shapeType);
  const [tempArrowDirection, setTempArrowDirection] = useState<ArrowDirection>(arrowDirection || 'none');
  const [tempConnectionType, setTempConnectionType] = useState<ConnectionType>(connectionType || 'tube');
  
  const handleSave = () => {
    onSave(tempDescription, tempShapeType, tempArrowDirection, tempConnectionType);
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${position.x}px,${position.y}px)`,
        pointerEvents: 'all',
      }}
      className="nodrag nopan bg-white rounded-lg shadow-xl border border-gray-300 p-4 min-w-[300px] z-20"
    >
      <h3 className="text-sm font-bold mb-3">Edit Connection</h3>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={tempDescription}
          onChange={(e) => setTempDescription(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter connection description..."
        />
      </div>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Shape Marker</label>
        <select
          value={tempShapeType || ''}
          onChange={(e) => setTempShapeType(e.target.value ? (e.target.value as ShapeType) : undefined)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">None</option>
          <option value="cube">Cube</option>
          <option value="sphere">Sphere</option>
          <option value="cylinder">Cylinder</option>
          <option value="cone">Cone</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Connection Type</label>
        <select
          value={tempConnectionType}
          onChange={(e) => setTempConnectionType(e.target.value as ConnectionType)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="tube">Tube (pipe)</option>
          <option value="arrow">Arrow</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Arrow Direction</label>
        <select
          value={tempArrowDirection}
          onChange={(e) => setTempArrowDirection(e.target.value as ArrowDirection)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None (pipe only)</option>
          <option value="forward">Forward →</option>
          <option value="backward">Backward ←</option>
          <option value="bidirectional">Bidirectional ↔</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 rounded transition">Cancel</button>
        <button onClick={handleSave} className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition">Save</button>
      </div>
    </div>
  );
};

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<ConnectionData>) => {
  const { updateConnections, project } = useAppStore();
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  
  const currentStyle = data?.style || 'standard';
  const currentDescription = data?.description || '';
  const currentShapeType = data?.shapeType;
  const currentArrowDirection = data?.arrowDirection;
  const currentConnectionType = data?.connectionType;
  
  const styles: { value: ConnectionStyle; label: string; color: string }[] = [
    { value: 'standard', label: 'Standard', color: '#4b5563' },
    { value: 'glass', label: 'Glass', color: '#60a5fa' },
    { value: 'glow', label: 'Glow', color: '#fbbf24' },
    { value: 'neon', label: 'Neon', color: '#ec4899' },
  ];
  
  const handleStyleChange = (newStyle: ConnectionStyle) => {
    if (!project) return;
    const updatedConnections = project.connections.map(conn => 
      conn.id === id ? { ...conn, data: { ...conn.data, style: newStyle } } : conn
    );
    updateConnections(updatedConnections);
    setShowStyleMenu(false);
  };
  
  const handleDescriptionChange = (description: string, shapeType?: ShapeType, arrowDirection?: ArrowDirection, connectionType?: ConnectionType) => {
    if (!project) return;
    const updatedConnections = project.connections.map(conn => 
      conn.id === id ? { ...conn, data: { ...conn.data, description, shapeType, arrowDirection, connectionType } } : conn
    );
    updateConnections(updatedConnections);
    setShowEditDialog(false);
  };
  
  const handleDelete = () => {
    if (!project) return;
    if (!window.confirm('Are you sure you want to delete this connection?')) return;
    const updatedConnections = project.connections.filter(conn => conn.id !== id);
    updateConnections(updatedConnections);
  };
  
  const currentStyleInfo = styles.find(s => s.value === currentStyle) || styles[0];
  
  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex gap-1"
        >
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="px-2 py-1 text-xs rounded shadow-md hover:shadow-lg transition"
            style={{ backgroundColor: currentStyleInfo.color, color: 'white' }}
          >
            {currentStyleInfo.label}
          </button>
          <button
            onClick={() => setShowEditDialog(true)}
            className="px-2 py-1 text-xs rounded shadow-md hover:shadow-lg transition bg-blue-500 hover:bg-blue-600 text-white"
            title={currentDescription ? "Edit connection description" : "Add connection description"}
            aria-label={currentDescription ? "Edit connection description" : "Add connection description"}
          >
            {currentDescription ? '📝' : '➕'}
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-xs rounded shadow-md hover:shadow-lg transition bg-red-500 hover:bg-red-600 text-white"
            title="Delete connection"
            aria-label="Delete connection"
          >
            ✕
          </button>
          {showStyleMenu && (
            <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white rounded shadow-lg border border-gray-200 z-10">
              {styles.map(style => (
                <button
                  key={style.value}
                  onClick={() => handleStyleChange(style.value)}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition whitespace-nowrap"
                  style={{ backgroundColor: currentStyle === style.value ? '#f3f4f6' : 'white' }}
                >
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: style.color }} />
                  {style.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {showEditDialog && (
          <ConnectionEditDialog
            description={currentDescription}
            shapeType={currentShapeType}
            arrowDirection={currentArrowDirection}
            connectionType={currentConnectionType}
            onSave={handleDescriptionChange}
            onCancel={() => setShowEditDialog(false)}
            position={{ x: labelX, y: labelY }}
          />
        )}
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
