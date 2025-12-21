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

/**
 * Calculates the dynamic height and Y-position for each route
 * based on how many nodes are stacked in them.
 */
export function getRouteLayout(nodes: ScenarioNode[]) {
  const layout: Record<string, { top: number; height: number }> = {};
  let currentY = GRID_CONFIG.headerHeight;

  ROUTES.forEach((route) => {
    // 1. Find the maximum stack depth for this route across all days/times
    let maxStack = 0;

    // Optimization: Filter nodes for this route once
    const routeNodes = nodes.filter((n) => n.gridPosition.route === route);

    DAYS.forEach((day) => {
      TIMES.forEach((time) => {
        const count = routeNodes.filter(
          (n) => n.gridPosition.day === day && n.gridPosition.time === time,
        ).length;
        if (count > maxStack) maxStack = count;
      });
    });

    // 2. Calculate required height
    // Base padding + (StackDepth * Offset) + NodeHeight
    // We ensure at least minRowHeight
    const effectiveStack = Math.max(1, maxStack);
    const requiredHeight =
      40 + // Top/Bottom padding
      (effectiveStack - 1) * GRID_CONFIG.stackOffset +
      GRID_CONFIG.nodeHeight;

    const height = Math.max(GRID_CONFIG.minRowHeight, requiredHeight);

    layout[route] = { top: currentY, height };
    currentY += height;
  });

  return { routes: layout, totalHeight: currentY };
}

export function getCoordinates(
  day: DayEnum,
  time: TimeEnum,
  route: RouteEnum,
  indexInSlot: number = 0,
  layoutMap?: ReturnType<typeof getRouteLayout>,
) {
  const dayIndex = DAYS.indexOf(day);
  const timeIndex = TIMES.indexOf(time);

  // Calculate column index (4 columns per day)
  const globalColIndex = dayIndex * 4 + timeIndex;
  const x = GRID_CONFIG.sidebarWidth + globalColIndex * GRID_CONFIG.colWidth;

  // Calculate Y based on dynamic layout
  // If layoutMap isn't provided (edge case), fallback to static math
  let y = GRID_CONFIG.headerHeight;
  if (layoutMap && layoutMap.routes[route]) {
    y = layoutMap.routes[route].top;
  } else {
    const routeIndex = ROUTES.indexOf(route);
    y = GRID_CONFIG.headerHeight + routeIndex * GRID_CONFIG.minRowHeight;
  }

  // Stack offset
  const stackOffsetY = indexInSlot * GRID_CONFIG.stackOffset;
  const stackOffsetX = indexInSlot * 5; // Slight horizontal shift for depth effect

  return {
    x: x + stackOffsetX,
    y: y + 20 + stackOffsetY, // +20 for top padding inside the row
  };
}

export function getGridPositionFromCoordinates(
  x: number,
  y: number,
  layoutMap: ReturnType<typeof getRouteLayout>,
) {
  const adjustedX = Math.max(0, x - GRID_CONFIG.sidebarWidth);

  // 1. Determine Column (Day/Time)
  const globalColIndex = Math.floor(adjustedX / GRID_CONFIG.colWidth);
  const dayIndex = Math.floor(globalColIndex / 4);
  const timeIndex = globalColIndex % 4;

  const clampedDay = Math.max(0, Math.min(dayIndex, DAYS.length - 1));
  const clampedTime = Math.max(0, Math.min(timeIndex, TIMES.length - 1));

  // 2. Determine Row (Route) using dynamic heights
  let foundRoute = ROUTES[0];

  // Iterate through layout to find which Y range matches
  for (const route of ROUTES) {
    const layout = layoutMap.routes[route];
    if (y >= layout.top && y < layout.top + layout.height) {
      foundRoute = route;
      break;
    }
  }

  // Edge case: if below the last row, snap to last route
  const lastRoute = ROUTES[ROUTES.length - 1];
  const lastLayout = layoutMap.routes[lastRoute];
  if (y >= lastLayout.top + lastLayout.height) {
    foundRoute = lastRoute;
  }

  return {
    day: DAYS[clampedDay],
    time: TIMES[clampedTime],
    route: foundRoute,
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
