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
import type { InstructionStep, ConnectionData, ConnectionStyle, ShapeType } from '../../types';

// Custom node component
const StepNode = ({ data, selected }: NodeProps<InstructionStep>) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Right} />
      <div className="font-bold text-sm mb-1">{data.title}</div>
      <div className="text-xs text-gray-600 line-clamp-2">{data.description}</div>
      <div
        className="mt-2 h-2 rounded"
        style={{ backgroundColor: data.highlightColor || '#4299e1' }}
      />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

// Connection edit dialog component
interface ConnectionEditDialogProps {
  description: string;
  shapeType?: ShapeType;
  onSave: (description: string, shapeType?: ShapeType) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const ConnectionEditDialog = ({ 
  description, 
  shapeType, 
  onSave, 
  onCancel,
  position 
}: ConnectionEditDialogProps) => {
  const [tempDescription, setTempDescription] = useState(description);
  const [tempShapeType, setTempShapeType] = useState<ShapeType | undefined>(shapeType);
  
  const handleSave = () => {
    onSave(tempDescription, tempShapeType);
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
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={tempDescription}
          onChange={(e) => setTempDescription(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter connection description..."
        />
      </div>
      
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Shape Marker
        </label>
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
      
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 rounded transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// Custom edge component with style selector
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<ConnectionData>) => {
  const { updateConnections, project } = useAppStore();
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  
  const currentStyle = data?.style || 'standard';
  const currentDescription = data?.description || '';
  const currentShapeType = data?.shapeType;
  
  const styles: { value: ConnectionStyle; label: string; color: string }[] = [
    { value: 'standard', label: 'Standard', color: '#4b5563' },
    { value: 'glass', label: 'Glass', color: '#60a5fa' },
    { value: 'glow', label: 'Glow', color: '#fbbf24' },
    { value: 'neon', label: 'Neon', color: '#ec4899' },
  ];
  
  const handleStyleChange = (newStyle: ConnectionStyle) => {
    if (!project) return;
    
    const updatedConnections = project.connections.map(conn => 
      conn.id === id 
        ? { ...conn, data: { ...conn.data, style: newStyle } }
        : conn
    );
    
    updateConnections(updatedConnections);
    setShowStyleMenu(false);
  };
  
  const handleDescriptionChange = (description: string, shapeType?: ShapeType) => {
    if (!project) return;
    
    const updatedConnections = project.connections.map(conn => 
      conn.id === id 
        ? { ...conn, data: { ...conn.data, description, shapeType } }
        : conn
    );
    
    updateConnections(updatedConnections);
    setShowEditDialog(false);
  };
  
  const handleDelete = () => {
    if (!project) return;
    
    // Show confirmation dialog before deleting
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }
    
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
            style={{ 
              backgroundColor: currentStyleInfo.color,
              color: 'white',
            }}
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
                  style={{
                    backgroundColor: currentStyle === style.value ? '#f3f4f6' : 'white',
                  }}
                >
                  <span 
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: style.color }}
                  />
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
            onSave={handleDescriptionChange}
            onCancel={() => setShowEditDialog(false)}
            position={{ x: labelX, y: labelY }}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = {
  stepNode: StepNode,
};

const edgeTypes = {
  default: CustomEdge,
};

export const StepBuilder = () => {
  const { project, updateConnections, setSelectedStepId, nodePositions, updateNodePosition } = useAppStore();
  
  // Convert project steps to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!project) return [];
    
    return project.steps.map((step, index) => ({
      id: step.id,
      type: 'stepNode',
      position: nodePositions[step.id] || { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
      data: step,
    }));
  }, [project, nodePositions]);

  const initialEdges: Edge[] = useMemo(() => {
    return project?.connections || [];
  }, [project]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when project steps change
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

  // Update edges when connections change
  useEffect(() => {
    if (project) {
      setEdges(project.connections);
    }
  }, [project?.connections, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      const newEdge: Edge<ConnectionData> = {
        id: `e${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      // Don't update the store here - let React Flow handle the UI state
      // The store will be updated by explicit actions like handleDelete or onConnect
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

  // Save node positions when they change
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  return (
    <div className="w-full h-full bg-gray-50">
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
        className="bg-gray-50"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
