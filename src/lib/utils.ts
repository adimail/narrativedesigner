import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DAYS, TIMES, GRID_CONFIG } from "./constants";
import {
  DayEnum,
  ScenarioNode,
  TimeEnum,
  ValidationIssue,
} from "../types/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCoordinates(day: DayEnum, time: TimeEnum) {
  const colIndex = DAYS.indexOf(day);
  const rowIndex = TIMES.indexOf(time);

  return {
    x: GRID_CONFIG.sidebarWidth + colIndex * GRID_CONFIG.colWidth,
    y: GRID_CONFIG.headerHeight + rowIndex * GRID_CONFIG.rowHeight,
  };
}

export function getGridPositionFromCoordinates(x: number, y: number) {
  const adjustedX = Math.max(0, x - GRID_CONFIG.sidebarWidth);
  const adjustedY = Math.max(0, y - GRID_CONFIG.headerHeight);

  const colIndex = Math.floor(adjustedX / GRID_CONFIG.colWidth);
  const rowIndex = Math.floor(adjustedY / GRID_CONFIG.rowHeight);

  const clampedCol = Math.max(0, Math.min(colIndex, DAYS.length - 1));
  const clampedRow = Math.max(0, Math.min(rowIndex, TIMES.length - 1));

  return {
    day: DAYS[clampedCol],
    time: TIMES[clampedRow],
  };
}

export function validateNode(
  node: ScenarioNode,
  allNodes: ScenarioNode[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dayIndex = DAYS.indexOf(node.gridPosition.day);

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
    if (targetDayIndex < dayIndex) {
      issues.push({
        nodeId: node.id,
        type: "error",
        message: `Cannot connect to earlier day: ${nextId}`,
      });
    } else if (targetDayIndex === dayIndex) {
      const timeIndex = TIMES.indexOf(node.gridPosition.time);
      const targetTimeIndex = TIMES.indexOf(targetNode.gridPosition.time);
      if (targetTimeIndex <= timeIndex) {
        issues.push({
          nodeId: node.id,
          type: "warning",
          message: `Time progression warning: ${nextId}`,
        });
      }
    }
  });

  return issues;
}
