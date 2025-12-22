import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  ScenarioNode,
  DayEnum,
  TimeEnum,
  RouteEnum,
  ValidationIssue,
} from "../types/schema";
import { validateNode, getColumnLayout, getRowLayout } from "../lib/utils";
import { DEFAULT_ROUTES } from "../lib/constants";

interface StoreState {
  nodes: ScenarioNode[];
  routes: RouteEnum[];
  selectedNodeIds: string[];
  validationIssues: ValidationIssue[];
  scale: number;
  isPropertiesPanelOpen: boolean;
  isValidationPanelOpen: boolean;
  darkMode: boolean;
  layoutMap: ReturnType<typeof getColumnLayout>;
  rowLayoutMap: ReturnType<typeof getRowLayout>;

  addNode: (day: DayEnum, time: TimeEnum, route: RouteEnum) => void;
  updateNode: (id: string, data: Partial<ScenarioNode>) => void;
  moveNode: (
    id: string,
    day: DayEnum,
    time: TimeEnum,
    route: RouteEnum,
    targetIndex?: number,
    branchIndex?: number,
  ) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  disconnectNodes: (sourceId: string, targetId: string) => void;
  validateAll: () => void;
  importData: (data: ScenarioNode[]) => void;
  loadProject: (nodes: ScenarioNode[]) => void;
  loadSampleData: () => void;
  clearAll: () => void;
  setScale: (scale: number) => void;
  togglePropertiesPanel: () => void;
  toggleValidationPanel: () => void;
  toggleDarkMode: () => void;
  createBranch: (route: string) => number;
  refreshLayout: () => void;
}

const normalizeBranches = (
  nodes: ScenarioNode[],
  route: RouteEnum,
): ScenarioNode[] => {
  const routeNodes = nodes.filter((n) => n.gridPosition.route === route);
  const otherNodes = nodes.filter((n) => n.gridPosition.route !== route);

  if (routeNodes.length === 0) return nodes;

  const usedBranches = Array.from(
    new Set(routeNodes.map((n) => n.branchIndex || 0)),
  ).sort((a, b) => a - b);

  const branchMap = new Map<number, number>();
  usedBranches.forEach((oldIdx, newIdx) => {
    branchMap.set(oldIdx, newIdx);
  });

  const updatedRouteNodes = routeNodes.map((n) => ({
    ...n,
    branchIndex: branchMap.get(n.branchIndex || 0) || 0,
  }));

  return [...otherNodes, ...updatedRouteNodes];
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      nodes: [],
      routes: [...DEFAULT_ROUTES],
      selectedNodeIds: [],
      validationIssues: [],
      scale: 1,
      isPropertiesPanelOpen: true,
      isValidationPanelOpen: true,
      darkMode: false,
      layoutMap: getColumnLayout([], [...DEFAULT_ROUTES]),
      rowLayoutMap: getRowLayout([], [...DEFAULT_ROUTES]),

      refreshLayout: () => {
        const { nodes, routes } = get();
        set({
          layoutMap: getColumnLayout(nodes, routes),
          rowLayoutMap: getRowLayout(nodes, routes),
        });
      },

      createBranch: (route) => {
        const { nodes } = get();
        const routeNodes = nodes.filter((n) => n.gridPosition.route === route);
        const maxBranch = routeNodes.reduce(
          (max, n) => Math.max(max, n.branchIndex || 0),
          0,
        );
        return maxBranch + 1;
      },

      addNode: (day, time, route) => {
        const { nodes } = get();
        const dayNum = day.replace("Day", "").padStart(2, "0");
        const routePrefix = route;

        let counter = 1;
        let scenarioId = "";
        while (true) {
          scenarioId = `D${dayNum}_R${routePrefix}_Sc${counter
            .toString()
            .padStart(3, "0")}`;
          const exists = nodes.some((n) => n.scenarioId === scenarioId);
          if (!exists) break;
          counter++;
        }

        const existingInCell = nodes.filter(
          (n) =>
            n.gridPosition.day === day &&
            n.gridPosition.time === time &&
            n.gridPosition.route === route &&
            (n.branchIndex || 0) === 0,
        );

        const maxSortIndex = existingInCell.reduce(
          (max, n) => Math.max(max, n.sortIndex || 0),
          -1,
        );

        const newNode: ScenarioNode = {
          id: uuidv4(),
          scenarioId,
          sortIndex: maxSortIndex + 1,
          branchIndex: 0,
          description: "",
          gridPosition: { day, time, route },
          loadInfo: {
            immediately: true,
            afterScenario: "None",
            atDay: day,
            atTime: time,
          },
          endInfo: {
            immediately: true,
            afterScenario: "None",
            atDay: day,
            atTime: time,
          },
          nextScenarios: [],
          previousScenarios: [],
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
        get().refreshLayout();
        get().validateAll();
      },

      updateNode: (id, data) => {
        const { nodes } = get();
        const nodeToUpdate = nodes.find((n) => n.id === id);
        if (!nodeToUpdate) return;

        const isStructuralChange =
          data.gridPosition !== undefined ||
          data.branchIndex !== undefined ||
          data.sortIndex !== undefined;

        if (!data.scenarioId || data.scenarioId === nodeToUpdate.scenarioId) {
          set((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === id ? { ...n, ...data } : n,
            ),
          }));
        } else {
          const oldId = nodeToUpdate.scenarioId;
          const newId = data.scenarioId;
          set((state) => ({
            nodes: state.nodes.map((n) => {
              if (n.id === id) return { ...n, ...data };
              return {
                ...n,
                nextScenarios: n.nextScenarios.map((sid) =>
                  sid === oldId ? newId : sid,
                ),
                previousScenarios: n.previousScenarios.map((sid) =>
                  sid === oldId ? newId : sid,
                ),
                loadInfo: {
                  ...n.loadInfo,
                  afterScenario:
                    n.loadInfo.afterScenario === oldId
                      ? newId
                      : n.loadInfo.afterScenario,
                },
                endInfo: {
                  ...n.endInfo,
                  afterScenario:
                    n.endInfo.afterScenario === oldId
                      ? newId
                      : n.endInfo.afterScenario,
                },
              };
            }),
          }));
        }

        if (isStructuralChange) get().refreshLayout();
        get().validateAll();
      },

      moveNode: (id, day, time, route, targetIndex, branchIndex) => {
        const { nodes } = get();
        const nodeToMove = nodes.find((n) => n.id === id);
        if (!nodeToMove) return;

        const oldDay = nodeToMove.gridPosition.day;
        const oldTime = nodeToMove.gridPosition.time;
        const oldRoute = nodeToMove.gridPosition.route;
        const oldBranch = nodeToMove.branchIndex || 0;

        let targetBranch = branchIndex;
        if (targetBranch === undefined) {
          targetBranch = route === oldRoute ? oldBranch : 0;
        }

        const isSameSlot =
          oldDay === day &&
          oldTime === time &&
          oldRoute === route &&
          oldBranch === targetBranch;

        const targetSiblings = nodes
          .filter(
            (n) =>
              n.id !== id &&
              n.gridPosition.day === day &&
              n.gridPosition.time === time &&
              n.gridPosition.route === route &&
              (n.branchIndex || 0) === targetBranch,
          )
          .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));

        let finalIndex = targetIndex;
        if (finalIndex === undefined || finalIndex < 0) {
          finalIndex = targetSiblings.length;
        }
        finalIndex = Math.min(finalIndex, targetSiblings.length);

        const newTargetOrder = [
          ...targetSiblings.slice(0, finalIndex),
          {
            ...nodeToMove,
            gridPosition: { day, time, route },
            branchIndex: targetBranch,
            loadInfo: { ...nodeToMove.loadInfo, atDay: day, atTime: time },
          },
          ...targetSiblings.slice(finalIndex),
        ];

        let newSourceOrder: ScenarioNode[] = [];
        if (!isSameSlot) {
          newSourceOrder = nodes
            .filter(
              (n) =>
                n.id !== id &&
                n.gridPosition.day === oldDay &&
                n.gridPosition.time === oldTime &&
                n.gridPosition.route === oldRoute &&
                (n.branchIndex || 0) === oldBranch,
            )
            .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
        }

        set((state) => {
          const updatedNodes = state.nodes.map((n) => {
            const targetIdx = newTargetOrder.findIndex((x) => x.id === n.id);
            if (targetIdx !== -1) {
              return {
                ...n,
                sortIndex: targetIdx,
                branchIndex: targetBranch,
                gridPosition: { day, time, route },
                loadInfo:
                  n.id === id
                    ? { ...n.loadInfo, atDay: day, atTime: time }
                    : n.loadInfo,
              };
            }
            if (!isSameSlot) {
              const sourceIdx = newSourceOrder.findIndex((x) => x.id === n.id);
              if (sourceIdx !== -1) return { ...n, sortIndex: sourceIdx };
            }
            return n;
          });

          let normalized = normalizeBranches(updatedNodes, oldRoute);
          if (oldRoute !== route)
            normalized = normalizeBranches(normalized, route);
          return { nodes: normalized };
        });
        get().refreshLayout();
        get().validateAll();
      },

      deleteNode: (id) => {
        const nodeToDelete = get().nodes.find((n) => n.id === id);
        if (!nodeToDelete) return;
        const { route } = nodeToDelete.gridPosition;

        set((state) => {
          const remainingNodes = state.nodes.filter((n) => n.id !== id);
          const cleanedNodes = remainingNodes.map((n) => ({
            ...n,
            nextScenarios: n.nextScenarios.filter(
              (sid) => sid !== nodeToDelete.scenarioId,
            ),
            previousScenarios: n.previousScenarios.filter(
              (sid) => sid !== nodeToDelete.scenarioId,
            ),
          }));
          const normalized = normalizeBranches(cleanedNodes, route);
          return {
            nodes: normalized,
            selectedNodeIds: state.selectedNodeIds.filter((sid) => sid !== id),
          };
        });
        get().refreshLayout();
        get().validateAll();
      },

      selectNode: (id, multi) => {
        set((state) => ({
          selectedNodeIds: multi
            ? state.selectedNodeIds.includes(id)
              ? state.selectedNodeIds.filter((sid) => sid !== id)
              : [...state.selectedNodeIds, id]
            : [id],
          isPropertiesPanelOpen: true,
        }));
      },

      clearSelection: () => set({ selectedNodeIds: [] }),

      connectNodes: (sourceId, targetId) => {
        const { nodes } = get();
        const source = nodes.find((n) => n.id === sourceId);
        const target = nodes.find((n) => n.id === targetId);
        if (!source || !target || source.id === target.id) return;
        if (source.nextScenarios.includes(target.scenarioId)) return;

        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id === source.id)
              return {
                ...n,
                nextScenarios: [...n.nextScenarios, target.scenarioId],
              };
            if (n.id === target.id)
              return {
                ...n,
                previousScenarios: [...n.previousScenarios, source.scenarioId],
              };
            return n;
          }),
        }));
        get().validateAll();
      },

      disconnectNodes: (sourceId, targetId) => {
        const { nodes } = get();
        const source = nodes.find((n) => n.id === sourceId);
        const target = nodes.find((n) => n.id === targetId);
        if (!source || !target) return;

        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id === source.id)
              return {
                ...n,
                nextScenarios: n.nextScenarios.filter(
                  (id) => id !== target.scenarioId,
                ),
              };
            if (n.id === target.id)
              return {
                ...n,
                previousScenarios: n.previousScenarios.filter(
                  (id) => id !== source.scenarioId,
                ),
              };
            return n;
          }),
        }));
        get().validateAll();
      },

      validateAll: () => {
        const { nodes } = get();
        const issues = nodes.flatMap((n) => validateNode(n, nodes));
        set({ validationIssues: issues });
      },

      importData: (data) => {
        set({ nodes: data });
        get().refreshLayout();
        get().validateAll();
      },

      loadProject: (nodes) => {
        set({ nodes, selectedNodeIds: [], validationIssues: [] });
        get().refreshLayout();
        get().validateAll();
      },

      loadSampleData: () => {
        const node1Id = uuidv4();
        const node2Id = uuidv4();
        const node3Id = uuidv4();
        const sampleNodes: ScenarioNode[] = [
          {
            id: node1Id,
            scenarioId: "D01_RCommon_Sc001",
            sortIndex: 0,
            branchIndex: 0,
            description: "Start of the game",
            gridPosition: { day: "Day1", time: "Morning", route: "Common" },
            loadInfo: {
              immediately: true,
              afterScenario: "None",
              atDay: "Day1",
              atTime: "Morning",
            },
            endInfo: {
              immediately: true,
              afterScenario: "None",
              atDay: "Day1",
              atTime: "Morning",
            },
            nextScenarios: ["D01_RCommon_Sc002"],
            previousScenarios: [],
          },
          {
            id: node2Id,
            scenarioId: "D01_RCommon_Sc002",
            sortIndex: 0,
            branchIndex: 0,
            description: "Second scene",
            gridPosition: { day: "Day1", time: "Afternoon", route: "Common" },
            loadInfo: {
              immediately: false,
              afterScenario: "D01_RCommon_Sc001",
              atDay: "Day1",
              atTime: "Afternoon",
            },
            endInfo: {
              immediately: true,
              afterScenario: "None",
              atDay: "Day1",
              atTime: "Afternoon",
            },
            nextScenarios: ["D02_RAlyssa_Sc001"],
            previousScenarios: ["D01_RCommon_Sc001"],
          },
          {
            id: node3Id,
            scenarioId: "D02_RAlyssa_Sc001",
            sortIndex: 0,
            branchIndex: 0,
            description: "Alyssa route start",
            gridPosition: { day: "Day2", time: "Morning", route: "Alyssa" },
            loadInfo: {
              immediately: false,
              afterScenario: "D01_RCommon_Sc002",
              atDay: "Day2",
              atTime: "Morning",
            },
            endInfo: {
              immediately: true,
              afterScenario: "None",
              atDay: "Day2",
              atTime: "Morning",
            },
            nextScenarios: [],
            previousScenarios: ["D01_RCommon_Sc002"],
          },
        ];
        set({ nodes: sampleNodes, selectedNodeIds: [], validationIssues: [] });
        get().refreshLayout();
        get().validateAll();
      },

      clearAll: () => {
        set({
          nodes: [],
          routes: [...DEFAULT_ROUTES],
          selectedNodeIds: [],
          validationIssues: [],
        });
        get().refreshLayout();
      },

      setScale: (scale) => set({ scale }),
      togglePropertiesPanel: () =>
        set((state) => ({
          isPropertiesPanelOpen: !state.isPropertiesPanelOpen,
        })),
      toggleValidationPanel: () =>
        set((state) => ({
          isValidationPanelOpen: !state.isValidationPanelOpen,
        })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: "scenariograph-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
