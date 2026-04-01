import type { FlowBranch } from './types';

/**
 * DFS-based cycle detection for a flow's branch graph.
 * Pure logic — no Supabase dependency.
 *
 * @param steps - Array of step objects (only id is required)
 * @param branches - All branches connecting steps
 * @returns { hasCycle: false } or { hasCycle: true, cyclePath: string[] }
 */
export function detectCycle(
  steps: { id: string }[],
  branches: FlowBranch[]
): { hasCycle: boolean; cyclePath?: string[] } {
  // Build adjacency list: step_id -> target_step_ids[]
  const adjacency = new Map<string, string[]>();
  for (const step of steps) {
    adjacency.set(step.id, []);
  }
  for (const branch of branches) {
    const targets = adjacency.get(branch.step_id);
    if (targets) {
      targets.push(branch.target_step_id);
    } else {
      adjacency.set(branch.step_id, [branch.target_step_id]);
    }
  }

  const visited = new Set<string>(); // fully processed nodes (black)
  const visiting = new Set<string>(); // nodes on the current DFS path (gray)
  const stack: string[] = []; // recursion path for cycle reconstruction

  function dfs(nodeId: string): string[] | null {
    visiting.add(nodeId);
    stack.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (visiting.has(neighbor)) {
        // Found a cycle — reconstruct the path
        const cycleStart = stack.indexOf(neighbor);
        return [...stack.slice(cycleStart), neighbor];
      }
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result) return result;
      }
    }

    stack.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  }

  for (const step of steps) {
    if (!visited.has(step.id) && !visiting.has(step.id)) {
      const cyclePath = dfs(step.id);
      if (cyclePath) {
        return { hasCycle: true, cyclePath };
      }
    }
  }

  return { hasCycle: false };
}
