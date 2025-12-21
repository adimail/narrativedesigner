import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DAYS, TIMES, ROUTES, GRID_CONFIG } from "./constants";
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

export function getColumnLayout(nodes: ScenarioNode[]) {
  const columnLayout: Record<string, { startX: number; width: number }> = {};
  let currentX = GRID_CONFIG.sidebarWidth;

  DAYS.forEach((day) => {
    TIMES.forEach((time) => {
      let maxNodesInSlot = 0;

      ROUTES.forEach((route) => {
        const count = nodes.filter(
          (n) =>
            n.gridPosition.day === day &&
            n.gridPosition.time === time &&
            n.gridPosition.route === route,
        ).length;
        if (count > maxNodesInSlot) maxNodesInSlot = count;
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

export function getCoordinates(
  day: DayEnum,
  time: TimeEnum,
  route: RouteEnum,
  indexInSlot: number = 0,
  layoutMap?: ReturnType<typeof getColumnLayout>,
) {
  const routeIndex = ROUTES.indexOf(route);
  const y = GRID_CONFIG.headerHeight + routeIndex * GRID_CONFIG.rowHeight + 20;

  let x = 0;

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
) {
  const adjustedY = Math.max(0, y - GRID_CONFIG.headerHeight);
  const routeIndex = Math.floor(adjustedY / GRID_CONFIG.rowHeight);
  const clampedRoute = Math.max(0, Math.min(routeIndex, ROUTES.length - 1));
  const route = ROUTES[clampedRoute];

  let foundDay = DAYS[0];
  let foundTime = TIMES[0];

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
    route,
  };
}

export function validateNode(
  node: ScenarioNode,
  allNodes: ScenarioNode[],
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

  const duplicates = allNodes.filter(
    (n) => n.scenarioId === node.scenarioId && n.id !== node.id,
  );
  if (duplicates.length > 0) {
    issues.push({
      nodeId: node.id,
      type: "error",
      message: "Duplicate Scenario ID",
    });
  }

  node.nextScenarios.forEach((nextId) => {
    const targetNode = allNodes.find((n) => n.scenarioId === nextId);
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
