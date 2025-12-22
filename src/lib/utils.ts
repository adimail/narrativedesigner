import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GRID_CONFIG } from "./constants";
import {
  Day,
  RouteEnum,
  ScenarioNode,
  Time,
  ValidationIssue,
} from "../types/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getColumnLayout(nodes: ScenarioNode[], routes: RouteEnum[]) {
  const columnLayout: Record<string, { startX: number; width: number }> = {};
  let currentX = GRID_CONFIG.sidebarWidth;

  const maxDay =
    nodes.length > 0 ? Math.max(...nodes.map((n) => n.gridPosition.day)) : 0;
  const maxTime =
    nodes.length > 0
      ? Math.max(
          ...nodes
            .filter((n) => n.gridPosition.day === maxDay)
            .map((n) => n.gridPosition.time),
        )
      : 0;

  const limitDay = Math.max(maxDay, 0);
  const limitTime = Math.max(maxTime, 0);

  for (let d = 0; d < 28; d++) {
    for (let t = 0; t < 4; t++) {
      let maxNodesInSlot = 0;
      routes.forEach((route) => {
        const cellNodes = nodes.filter(
          (n) =>
            n.gridPosition.day === d &&
            n.gridPosition.time === t &&
            n.gridPosition.route === route,
        );
        const branchCounts: Record<number, number> = {};
        cellNodes.forEach((n) => {
          const bIdx = n.branchIndex || 0;
          branchCounts[bIdx] = (branchCounts[bIdx] || 0) + 1;
        });
        const maxInAnyBranch = Math.max(0, ...Object.values(branchCounts));
        if (maxInAnyBranch > maxNodesInSlot) maxNodesInSlot = maxInAnyBranch;
      });
      const effectiveCount = Math.max(1, maxNodesInSlot);
      const requiredWidth =
        effectiveCount * GRID_CONFIG.nodeWidth +
        (effectiveCount + 1) * GRID_CONFIG.nodeGap;
      const width = Math.max(GRID_CONFIG.minColWidth, requiredWidth);
      columnLayout[`${d}-${t}`] = { startX: currentX, width };
      currentX += width;
    }
  }
  return { columns: columnLayout, totalWidth: currentX };
}

export function getRowLayout(nodes: ScenarioNode[], routes: RouteEnum[]) {
  const rowLayout: Record<
    string,
    { startY: number; height: number; maxBranch: number; hasRoutine: boolean }
  > = {};
  let currentY = GRID_CONFIG.headerHeight;
  routes.forEach((route) => {
    const routeNodes = nodes.filter((n) => n.gridPosition.route === route);
    const hasRoutine = routeNodes.some((n) => n.isRoutine);
    const maxBranch = routeNodes.reduce(
      (max, n) => Math.max(max, n.branchIndex || 0),
      0,
    );
    let height = GRID_CONFIG.rowHeight + maxBranch * GRID_CONFIG.branchHeight;
    if (hasRoutine) height += GRID_CONFIG.routineOffset;

    rowLayout[route] = { startY: currentY, height, maxBranch, hasRoutine };
    currentY += height;
  });
  return { rows: rowLayout, totalHeight: currentY };
}

export function getCoordinates(
  day: Day,
  time: Time,
  route: RouteEnum,
  branchIndex: number = 0,
  indexInSlot: number = 0,
  layoutMap?: ReturnType<typeof getColumnLayout>,
  rowLayoutMap?: ReturnType<typeof getRowLayout>,
  isRoutine: boolean = false,
) {
  let x = 0;
  let y = 0;
  if (rowLayoutMap && rowLayoutMap.rows[route]) {
    const rowData = rowLayoutMap.rows[route];
    y =
      rowData.startY +
      branchIndex * GRID_CONFIG.branchHeight +
      (GRID_CONFIG.rowHeight - GRID_CONFIG.nodeHeight) / 2;
    if (isRoutine) {
      y +=
        rowData.maxBranch * GRID_CONFIG.branchHeight +
        GRID_CONFIG.routineOffset;
    }
  } else {
    y = GRID_CONFIG.headerHeight + 20;
  }
  if (layoutMap) {
    const colKey = `${day}-${time}`;
    const colData = layoutMap.columns[colKey];
    if (colData) {
      x =
        colData.startX +
        GRID_CONFIG.nodeGap +
        indexInSlot * (GRID_CONFIG.nodeWidth + GRID_CONFIG.nodeGap);
    }
  } else {
    const globalColIndex = day * 4 + time;
    x =
      GRID_CONFIG.sidebarWidth +
      globalColIndex * GRID_CONFIG.minColWidth +
      GRID_CONFIG.nodeGap;
  }
  return { x, y };
}

export function getGridPositionFromCoordinates(
  x: number,
  y: number,
  layoutMap: ReturnType<typeof getColumnLayout>,
  rowLayoutMap: ReturnType<typeof getRowLayout>,
  routes: RouteEnum[],
) {
  let foundRoute = routes[0];
  let foundDay = 0;
  let foundTime = 0;
  for (const route of routes) {
    const rowData = rowLayoutMap.rows[route];
    if (y >= rowData.startY && y < rowData.startY + rowData.height) {
      foundRoute = route;
      break;
    }
  }
  const lastRoute = routes[routes.length - 1];
  if (
    y >=
    rowLayoutMap.rows[lastRoute].startY + rowLayoutMap.rows[lastRoute].height
  ) {
    foundRoute = lastRoute;
  }
  for (let d = 0; d < 28; d++) {
    for (let t = 0; t < 4; t++) {
      const key = `${d}-${t}`;
      const col = layoutMap.columns[key];
      if (x >= col.startX && x < col.startX + col.width) {
        foundDay = d;
        foundTime = t;
        break;
      }
    }
  }
  return { day: foundDay, time: foundTime, route: foundRoute };
}

export function validateNode(
  node: ScenarioNode,
  nodeMap: Map<string, ScenarioNode>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const globalTimeIndex = node.gridPosition.day * 4 + node.gridPosition.time;
  if (!node.scenarioId || node.scenarioId.trim() === "") {
    issues.push({
      nodeId: node.id,
      type: "error",
      message: "Missing Scenario ID",
    });
  }
  const existing = nodeMap.get(node.scenarioId);
  if (existing && existing.id !== node.id) {
    issues.push({
      nodeId: node.id,
      type: "error",
      message: "Duplicate Scenario ID",
    });
  }
  node.nextScenarios.forEach((nextId) => {
    const targetNode = nodeMap.get(nextId);
    if (!targetNode) {
      issues.push({
        nodeId: node.id,
        type: "error",
        message: `Target scenario ${nextId} not found`,
      });
      return;
    }
    const targetGlobalTimeIndex =
      targetNode.gridPosition.day * 4 + targetNode.gridPosition.time;
    if (targetGlobalTimeIndex < globalTimeIndex) {
      issues.push({
        nodeId: node.id,
        type: "error",
        message: `Time paradox: connects to past (${nextId})`,
      });
    }
  });
  return issues;
}
