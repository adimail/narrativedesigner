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

export function getCoordinates(
  day: DayEnum,
  time: TimeEnum,
  route: RouteEnum,
  indexInSlot: number = 0,
) {
  const dayIndex = DAYS.indexOf(day);
  const timeIndex = TIMES.indexOf(time);
  const routeIndex = ROUTES.indexOf(route);

  // Calculate column index (4 columns per day)
  const globalColIndex = dayIndex * 4 + timeIndex;

  const x = GRID_CONFIG.sidebarWidth + globalColIndex * GRID_CONFIG.colWidth;
  const y = GRID_CONFIG.headerHeight + routeIndex * GRID_CONFIG.rowHeight;

  // Stack offset
  const stackOffsetY = indexInSlot * 30;
  const stackOffsetX = indexInSlot * 5;

  return {
    x: x + stackOffsetX,
    y: y + stackOffsetY,
  };
}

export function getGridPositionFromCoordinates(x: number, y: number) {
  const adjustedX = Math.max(0, x - GRID_CONFIG.sidebarWidth);
  const adjustedY = Math.max(0, y - GRID_CONFIG.headerHeight);

  const globalColIndex = Math.floor(adjustedX / GRID_CONFIG.colWidth);
  const routeIndex = Math.floor(adjustedY / GRID_CONFIG.rowHeight);

  const dayIndex = Math.floor(globalColIndex / 4);
  const timeIndex = globalColIndex % 4;

  const clampedDay = Math.max(0, Math.min(dayIndex, DAYS.length - 1));
  const clampedTime = Math.max(0, Math.min(timeIndex, TIMES.length - 1));
  const clampedRoute = Math.max(0, Math.min(routeIndex, ROUTES.length - 1));

  return {
    day: DAYS[clampedDay],
    time: TIMES[clampedTime],
    route: ROUTES[clampedRoute],
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
