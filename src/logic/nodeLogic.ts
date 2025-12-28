import { v4 as uuidv4 } from "uuid";
import {
  ScenarioNode,
  Day,
  Time,
  RouteEnum,
  ScenarioId,
} from "../types/schema";

export const generateScenarioId = (
  nodes: ScenarioNode[],
  day: Day,
  route: RouteEnum,
): ScenarioId => {
  const dayNum = (day + 1).toString().padStart(2, "0");
  let counter = 1;
  while (true) {
    const id =
      `D${dayNum}_R${route}_Sc${counter.toString().padStart(3, "0")}` as ScenarioId;
    if (!nodes.some((n) => n.scenarioId === id)) return id;
    counter++;
  }
};

export const normalizeBranches = (
  nodes: ScenarioNode[],
  route: RouteEnum,
): ScenarioNode[] => {
  // Only normalize non-routine nodes
  const routeNodes = nodes.filter(
    (n) => n.gridPosition.route === route && !n.isRoutine,
  );
  const otherNodes = nodes.filter(
    (n) => n.gridPosition.route !== route || n.isRoutine,
  );

  if (routeNodes.length === 0) return nodes;

  const usedBranches = Array.from(
    new Set(routeNodes.map((n) => n.branchIndex || 0)),
  ).sort((a, b) => a - b);
  const branchMap = new Map<number, number>();
  usedBranches.forEach((oldIdx, newIdx) => branchMap.set(oldIdx, newIdx));

  const updatedRouteNodes = routeNodes.map((n) => ({
    ...n,
    branchIndex: branchMap.get(n.branchIndex || 0) || 0,
  }));

  return [...otherNodes, ...updatedRouteNodes];
};

export const createNewNode = (
  nodes: ScenarioNode[],
  day: Day,
  time: Time,
  route: RouteEnum,
  isRoutine: boolean = false,
): ScenarioNode => {
  const scenarioId = generateScenarioId(nodes, day, route);
  const existingInCell = nodes.filter(
    (n) =>
      n.gridPosition.day === day &&
      n.gridPosition.time === time &&
      n.gridPosition.route === route &&
      n.isRoutine === isRoutine &&
      (n.branchIndex || 0) === 0,
  );
  const maxSortIndex = existingInCell.reduce(
    (max, n) => Math.max(max, n.sortIndex || 0),
    -1,
  );
  return {
    id: uuidv4(),
    scenarioId,
    isRoutine: isRoutine,
    sortIndex: maxSortIndex + 1,
    branchIndex: 0,
    description: "",
    gridPosition: { day, time, route },
    loadInfo: {
      immediately: true,
      afterScenario: null,
      atDay: day,
      atTime: time,
    },
    endInfo: {
      immediately: true,
      afterScenario: null,
      atDay: day,
      atTime: time,
    },
    nextScenarios: [],
    previousScenarios: [],
  };
};

export const applyNodeUpdate = (
  nodes: ScenarioNode[],
  id: string,
  data: Partial<ScenarioNode>,
): ScenarioNode[] => {
  const nodeToUpdate = nodes.find((n) => n.id === id);
  if (!nodeToUpdate) return nodes;

  const oldId = nodeToUpdate.scenarioId;
  const newId = (data.scenarioId as ScenarioId) || oldId;

  if (data.scenarioId && data.scenarioId !== oldId) {
    const exists = nodes.some(
      (n) => n.scenarioId === data.scenarioId && n.id !== id,
    );
    if (exists) return nodes;
  }

  return nodes.map((n) => {
    let updated = n.id === id ? { ...n, ...data } : { ...n };

    if (oldId !== newId) {
      updated.nextScenarios = updated.nextScenarios.map((sid) =>
        sid === oldId ? newId : sid,
      );
      updated.previousScenarios = updated.previousScenarios.map((sid) =>
        sid === oldId ? newId : sid,
      );

      if (updated.loadInfo.afterScenario === oldId) {
        updated.loadInfo = { ...updated.loadInfo, afterScenario: newId };
      }
      if (updated.endInfo.afterScenario === oldId) {
        updated.endInfo = { ...updated.endInfo, afterScenario: newId };
      }

      if (updated.edgeColors && updated.edgeColors[oldId]) {
        const color = updated.edgeColors[oldId];
        const newEdgeColors = { ...updated.edgeColors };
        delete newEdgeColors[oldId];
        newEdgeColors[newId] = color;
        updated.edgeColors = newEdgeColors;
      }
    }

    return updated;
  });
};

export const calculateMove = (
  nodes: ScenarioNode[],
  id: string,
  day: Day,
  time: Time,
  route: RouteEnum,
  targetIndex: number = 0,
  branchIndex: number = 0,
  isRoutine: boolean = false,
): ScenarioNode[] => {
  const nodeToMove = nodes.find((n) => n.id === id);
  if (!nodeToMove) return nodes;

  let otherNodes = nodes.filter((n) => n.id !== id);

  const collision = otherNodes.some(
    (n) =>
      n.gridPosition.day === day &&
      n.gridPosition.time === time &&
      n.gridPosition.route === route &&
      n.isRoutine === isRoutine &&
      (n.branchIndex || 0) === (isRoutine ? 0 : branchIndex) &&
      (n.sortIndex || 0) === targetIndex,
  );

  if (collision) {
    otherNodes = otherNodes.map((n) => {
      if (
        n.gridPosition.day === day &&
        n.gridPosition.time === time &&
        n.gridPosition.route === route &&
        n.isRoutine === isRoutine &&
        (n.branchIndex || 0) === (isRoutine ? 0 : branchIndex) &&
        (n.sortIndex || 0) >= targetIndex
      ) {
        return { ...n, sortIndex: (n.sortIndex || 0) + 1 };
      }
      return n;
    });
  }

  const updatedNode = {
    ...nodeToMove,
    gridPosition: { day, time, route },
    branchIndex: isRoutine ? 0 : branchIndex,
    sortIndex: targetIndex,
    isRoutine: isRoutine,
    loadInfo:
      nodeToMove.id === id
        ? { ...nodeToMove.loadInfo, atDay: day, atTime: time }
        : nodeToMove.loadInfo,
  };

  const result = [...otherNodes, updatedNode];

  let normalized = normalizeBranches(result, nodeToMove.gridPosition.route);
  if (nodeToMove.gridPosition.route !== route) {
    normalized = normalizeBranches(normalized, route);
  }

  return normalized;
};

export const cleanReferences = (
  nodes: ScenarioNode[],
  id: string,
): ScenarioNode[] => {
  const nodeToDelete = nodes.find((n) => n.id === id);
  if (!nodeToDelete) return nodes;
  const remainingNodes = nodes.filter((n) => n.id !== id);
  const cleaned = remainingNodes.map((n) => ({
    ...n,
    nextScenarios: n.nextScenarios.filter(
      (sid) => sid !== nodeToDelete.scenarioId,
    ),
    previousScenarios: n.previousScenarios.filter(
      (sid) => sid !== nodeToDelete.scenarioId,
    ),
    loadInfo: {
      ...n.loadInfo,
      afterScenario:
        n.loadInfo.afterScenario === nodeToDelete.scenarioId
          ? null
          : n.loadInfo.afterScenario,
    },
    endInfo: {
      ...n.endInfo,
      afterScenario:
        n.endInfo.afterScenario === nodeToDelete.scenarioId
          ? null
          : n.endInfo.afterScenario,
    },
  }));
  return normalizeBranches(cleaned, nodeToDelete.gridPosition.route);
};
