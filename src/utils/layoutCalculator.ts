import type { Edge } from 'reactflow';
import type { InstructionStep } from '../types';

interface LayoutPosition {
  x: number;
  y: number;
  z: number;
  depth: number;
}

// Layout constants
const HORIZONTAL_SPACING = 4;
const DEPTH_SPACING = 5;
const FALLBACK_STEP_SPACING = 4;
const CREATOR_TO_3D_SCALE_FACTOR = 0.02;

/**
 * Calculates a hierarchical layout for steps based on their connections.
 * Steps in parallel branches are positioned side-by-side.
 */
export const calculateHierarchicalLayout = (
  steps: InstructionStep[],
  connections: Edge[]
): Map<string, LayoutPosition> => {
  const positions = new Map<string, LayoutPosition>();
  
  if (steps.length === 0) {
    return positions;
  }

  // Build adjacency lists for graph traversal
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  
  connections.forEach(edge => {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  });

  // Find root nodes (nodes with no incoming edges)
  const roots = steps.filter(step => !incoming.has(step.id) || incoming.get(step.id)!.length === 0);
  
  // If no roots found (cyclic graph or all connected), use first step as root
  if (roots.length === 0) {
    roots.push(steps[0]);
  }

  // Assign depth levels using BFS
  const depths = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [];
  
  roots.forEach(root => {
    queue.push({ id: root.id, depth: 0 });
    depths.set(root.id, 0);
    visited.add(root.id);
  });

  let queueIndex = 0;
  while (queueIndex < queue.length) {
    const { id, depth } = queue[queueIndex++];

    const children = outgoing.get(id) || [];
    children.forEach(childId => {
      const currentDepth = depths.get(childId);
      const newDepth = depth + 1;
      
      if (currentDepth === undefined || newDepth > currentDepth) {
        depths.set(childId, newDepth);
        
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push({ id: childId, depth: newDepth });
        }
      }
    });
  }

  // Assign depths to unvisited nodes (disconnected components)
  steps.forEach(step => {
    if (!depths.has(step.id)) {
      depths.set(step.id, 0);
    }
  });

  // Group nodes by depth level
  const levelGroups = new Map<number, string[]>();
  depths.forEach((depth, id) => {
    if (!levelGroups.has(depth)) {
      levelGroups.set(depth, []);
    }
    levelGroups.get(depth)!.push(id);
  });

  // Calculate positions
  levelGroups.forEach((nodeIds, depth) => {
    const nodeCount = nodeIds.length;
    
    // For nodes at the same depth, position them side by side
    nodeIds.forEach((nodeId, index) => {
      const z = -depth * DEPTH_SPACING; // Depth in z-axis
      
      // Calculate horizontal offset for parallel nodes
      let x = 0;
      if (nodeCount > 1) {
        // Center the group
        const totalWidth = (nodeCount - 1) * HORIZONTAL_SPACING;
        x = index * HORIZONTAL_SPACING - totalWidth / 2;
      }
      
      // Slight vertical variation to avoid complete overlap in some views
      const y = 0;
      
      positions.set(nodeId, { x, y, z, depth });
    });
  });

  return positions;
};

/**
 * Calculates layout for steps based on their actual positions in the creator.
 * This ensures the 3D model matches the visual layout in the creator.
 */
export const calculateCreatorBasedLayout = (
  steps: InstructionStep[],
  nodePositions: Record<string, { x: number; y: number }>
): Map<string, LayoutPosition> => {
  const positions = new Map<string, LayoutPosition>();
  
  if (steps.length === 0) {
    return positions;
  }

  // Find the bounds of the creator layout
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  steps.forEach(step => {
    const pos = nodePositions[step.id];
    if (pos) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }
  });
  
  // If no positions found, fall back to simple layout
  if (!isFinite(minX)) {
    steps.forEach((step, index) => {
      positions.set(step.id, { x: index * FALLBACK_STEP_SPACING, y: 0, z: 0, depth: 0 });
    });
    return positions;
  }
  
  // Calculate center point
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  steps.forEach(step => {
    const pos = nodePositions[step.id];
    if (pos) {
      // Map 2D creator position to 3D:
      // - Creator X becomes 3D X (left-right)
      // - Creator Y becomes 3D Z (depth/forward-back)
      // - 3D Y is 0 (all on same horizontal plane)
      const x = (pos.x - centerX) * CREATOR_TO_3D_SCALE_FACTOR;
      const z = (pos.y - centerY) * CREATOR_TO_3D_SCALE_FACTOR;
      const y = 0;
      
      positions.set(step.id, { x, y, z, depth: 0 });
    } else {
      // If no position found, place at origin
      positions.set(step.id, { x: 0, y: 0, z: 0, depth: 0 });
    }
  });
  
  return positions;
};
