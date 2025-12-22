import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DAYS, TIMES, GRID_CONFIG } from "./constants";
import {
  DayEnum,
  RouteEnum,
  ScenarioNode,
  TimeEnum,
  ValidationIssue,
} from "../types/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getColumnLayout(nodes: ScenarioNode[], routes: RouteEnum[]) {
  const columnLayout: Record<string, { startX: number; width: number }> = {};
  let currentX = GRID_CONFIG.sidebarWidth;

  DAYS.forEach((day) => {
    TIMES.forEach((time) => {
      let maxNodesInSlot = 0;

      routes.forEach((route) => {
        const cellNodes = nodes.filter(
          (n) =>
            n.gridPosition.day === day &&
            n.gridPosition.time === time &&
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

      columnLayout[`${day}-${time}`] = { startX: currentX, width };
      currentX += width;
    });
  });

  return { columns: columnLayout, totalWidth: currentX };
}

export function getRowLayout(nodes: ScenarioNode[], routes: RouteEnum[]) {
  const rowLayout: Record<
    string,
    { startY: number; height: number; maxBranch: number }
  > = {};
  let currentY = GRID_CONFIG.headerHeight;

  routes.forEach((route) => {
    const routeNodes = nodes.filter((n) => n.gridPosition.route === route);
    const maxBranch = routeNodes.reduce(
      (max, n) => Math.max(max, n.branchIndex || 0),
      0,
    );

    const height = GRID_CONFIG.rowHeight + maxBranch * GRID_CONFIG.branchHeight;

    rowLayout[route] = { startY: currentY, height, maxBranch };
    currentY += height;
  });

  return { rows: rowLayout, totalHeight: currentY };
}

export function getCoordinates(
  day: DayEnum,
  time: TimeEnum,
  route: RouteEnum,
  branchIndex: number = 0,
  indexInSlot: number = 0,
  layoutMap?: ReturnType<typeof getColumnLayout>,
  rowLayoutMap?: ReturnType<typeof getRowLayout>,
) {
  let x = 0;
  let y = 0;

  if (rowLayoutMap && rowLayoutMap.rows[route]) {
    const rowData = rowLayoutMap.rows[route];

    y =
      rowData.startY +
      branchIndex * GRID_CONFIG.branchHeight +
      (GRID_CONFIG.rowHeight - GRID_CONFIG.nodeHeight) / 2;
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
    const dayIndex = DAYS.indexOf(day);
    const timeIndex = TIMES.indexOf(time);
    const globalColIndex = dayIndex * 4 + timeIndex;
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
  let foundDay = DAYS[0];
  let foundTime = TIMES[0];

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

  for (const day of DAYS) {
    for (const time of TIMES) {
      const key = `${day}-${time}`;
      const col = layoutMap.columns[key];
      if (x >= col.startX && x < col.startX + col.width) {
        foundDay = day;
        foundTime = time;
        break;
      }
    }
  }

  const lastDay = DAYS[DAYS.length - 1];
  const lastTime = TIMES[TIMES.length - 1];
  const lastKey = `${lastDay}-${lastTime}`;
  const lastCol = layoutMap.columns[lastKey];

  if (x >= lastCol.startX + lastCol.width) {
    foundDay = lastDay;
    foundTime = lastTime;
  }

  return {
    day: foundDay,
    time: foundTime,
    route: foundRoute,
  };
}

export function validateNode(
  node: ScenarioNode,
  nodeMap: Map<string, ScenarioNode>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dayIndex = DAYS.indexOf(node.gridPosition.day);
  const timeIndex = TIMES.indexOf(node.gridPosition.time);
  const globalTimeIndex = dayIndex * 4 + timeIndex;

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

    const targetDayIndex = DAYS.indexOf(targetNode.gridPosition.day);
    const targetTimeIndex = TIMES.indexOf(targetNode.gridPosition.time);
    const targetGlobalTimeIndex = targetDayIndex * 4 + targetTimeIndex;

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
