import { Waypoint } from '../models/types.js';
import { getDb } from '../database.js';

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;

const ENTRANCE: Waypoint = { x: 5, y: 15 };
const EXIT: Waypoint = { x: 25, y: 15 };

const ROAD_NODES: Waypoint[] = [
  { x: 5, y: 15 }, { x: 8, y: 15 }, { x: 12, y: 15 }, { x: 16, y: 15 },
  { x: 20, y: 15 }, { x: 25, y: 15 },
  { x: 5, y: 10 }, { x: 8, y: 10 }, { x: 12, y: 10 }, { x: 16, y: 10 },
  { x: 20, y: 10 }, { x: 25, y: 10 },
  { x: 5, y: 5 }, { x: 8, y: 5 }, { x: 12, y: 5 }, { x: 16, y: 5 },
  { x: 20, y: 5 }, { x: 25, y: 5 },
  { x: 3, y: 8 }, { x: 3, y: 12 }, { x: 3, y: 15 },
  { x: 27, y: 8 }, { x: 27, y: 12 }, { x: 27, y: 15 },
];

function getOccupiedCells(): Set<string> {
  const db = getDb();
  const occupied = new Set<string>();
  const slots = db.prepare(`SELECT positionX, positionY, status FROM parking_slots`).all() as { positionX: number; positionY: number; status: string }[];
  for (const slot of slots) {
    if (slot.status === 'OCCUPIED' || slot.status === 'BLOCKED') {
      occupied.add(`${slot.positionX},${slot.positionY}`);
      occupied.add(`${slot.positionX + 1},${slot.positionY}`);
    }
  }
  return occupied;
}

function getSlotPositions(): Map<string, Waypoint> {
  const db = getDb();
  const slots = db.prepare(`SELECT id, positionX, positionY FROM parking_slots`).all() as { id: string; positionX: number; positionY: number }[];
  const map = new Map<string, Waypoint>();
  for (const slot of slots) {
    map.set(slot.id, { x: slot.positionX, y: slot.positionY });
  }
  return map;
}

function getNearestRoadNode(point: Waypoint): Waypoint {
  let nearest = ROAD_NODES[0];
  let minDist = Infinity;
  for (const node of ROAD_NODES) {
    const dist = Math.abs(node.x - point.x) + Math.abs(node.y - point.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }
  return nearest;
}

function heuristic(a: Waypoint, b: Waypoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(node: Waypoint): Waypoint[] {
  const directions = [
    { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
    { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
  ];
  const neighbors: Waypoint[] = [];
  for (const dir of directions) {
    const nx = node.x + dir.x;
    const ny = node.y + dir.y;
    if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  return neighbors;
}

export class PathfindingService {
  findPath(start: Waypoint, end: Waypoint): Waypoint[] {
    const occupied = getOccupiedCells();
    const openList: AStarNode[] = [];
    const closedSet = new Set<string>();

    const startNode: AStarNode = {
      x: start.x, y: start.y,
      g: 0, h: heuristic(start, end), f: heuristic(start, end),
      parent: null,
    };
    openList.push(startNode);

    while (openList.length > 0) {
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      if (current.x === end.x && current.y === end.y) {
        const path: Waypoint[] = [];
        let node: AStarNode | null = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return this.smoothPath(path);
      }

      closedSet.add(`${current.x},${current.y}`);

      for (const neighbor of getNeighbors(current)) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key)) continue;
        if (occupied.has(key)) continue;

        const isDiagonal = neighbor.x !== current.x && neighbor.y !== current.y;
        const moveCost = isDiagonal ? 1.414 : 1;
        const tentativeG = current.g + moveCost;

        const existing = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
        if (existing) {
          if (tentativeG < existing.g) {
            existing.g = tentativeG;
            existing.f = tentativeG + existing.h;
            existing.parent = current;
          }
        } else {
          const h = heuristic(neighbor, end);
          openList.push({
            x: neighbor.x, y: neighbor.y,
            g: tentativeG, h, f: tentativeG + h,
            parent: current,
          });
        }
      }
    }

    return [start, end];
  }

  findPathToSlot(start: Waypoint, slotId: string): Waypoint[] {
    const slotPositions = getSlotPositions();
    const slotPos = slotPositions.get(slotId);
    if (!slotPos) return [start];

    const nearestRoad = getNearestRoadNode(slotPos);
    const pathToRoad = this.findPath(start, nearestRoad);
    const pathFromRoad = this.findPath(nearestRoad, { x: slotPos.x, y: slotPos.y });

    const combined: Waypoint[] = [...pathToRoad];
    for (const wp of pathFromRoad) {
      const last = combined[combined.length - 1];
      if (last.x !== wp.x || last.y !== wp.y) {
        combined.push(wp);
      }
    }
    return combined;
  }

  findPathToExit(start: Waypoint): Waypoint[] {
    return this.findPath(start, EXIT);
  }

  smoothPath(path: Waypoint[]): Waypoint[] {
    if (path.length <= 2) return path;
    const smoothed: Waypoint[] = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];
      if (!(prev.x === next.x || prev.y === next.y || (Math.abs(prev.x - next.x) === Math.abs(prev.y - next.y)))) {
        smoothed.push(curr);
      }
    }
    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  getEntrance(): Waypoint {
    return { ...ENTRANCE };
  }

  getExit(): Waypoint {
    return { ...EXIT };
  }
}

export const pathfindingService = new PathfindingService();
