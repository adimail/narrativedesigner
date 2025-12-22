import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import {
  ScenarioNode,
  Day,
  Time,
  RouteEnum,
  ValidationIssue,
} from "../types/schema";
import { validateNode } from "../lib/utils";
import { DEFAULT_ROUTES } from "../lib/constants";
import {
  createNewNode,
  applyNodeUpdate,
  calculateMove,
  cleanReferences,
} from "../logic/nodeLogic";

interface StoreState {
  nodes: ScenarioNode[];
  nodeMap: Map<string, ScenarioNode>;
  routes: RouteEnum[];
  selectedNodeIds: string[];
  validationIssues: ValidationIssue[];
  scale: number;
  draggingId: string | null;
  viewport: { x: number; y: number; w: number; h: number };
  isPropertiesPanelOpen: boolean;
  isValidationPanelOpen: boolean;
  darkMode: boolean;
  addNode: (day: Day, time: Time, route: RouteEnum) => void;
  updateNode: (id: string, data: Partial<ScenarioNode>) => void;
  moveNode: (
    id: string,
    day: Day,
    time: Time,
    route: RouteEnum,
    targetIndex?: number,
    branchIndex?: number,
  ) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  disconnectNodes: (sourceId: string, targetId: string) => void;
  setConnectionColor: (
    sourceId: string,
    targetScenarioId: string,
    color: string,
  ) => void;
  validateAll: () => void;
  importData: (data: ScenarioNode[]) => void;
  loadProject: (nodes: ScenarioNode[]) => void;
  loadSampleData: () => void;
  clearAll: () => void;
  setScale: (scale: number) => void;
  setDraggingId: (id: string | null) => void;
  setViewport: (x: number, y: number, w: number, h: number) => void;
  togglePropertiesPanel: () => void;
  toggleValidationPanel: () => void;
  toggleDarkMode: () => void;
  createBranch: (route: string) => number;
}

export const useStore = create<StoreState>()(
  temporal(
    persist(
      (set, get) => ({
        nodes: [],
        nodeMap: new Map(),
        routes: [...DEFAULT_ROUTES],
        selectedNodeIds: [],
        validationIssues: [],
        scale: 1,
        draggingId: null,
        viewport: { x: 0, y: 0, w: 2000, h: 2000 },
        isPropertiesPanelOpen: true,
        isValidationPanelOpen: true,
        darkMode: false,
        setDraggingId: (id) => set({ draggingId: id }),
        setViewport: (x, y, w, h) => set({ viewport: { x, y, w, h } }),
        createBranch: (route) => {
          const { nodes } = get();
          const routeNodes = nodes.filter(
            (n) => n.gridPosition.route === route,
          );
          return (
            routeNodes.reduce(
              (max, n) => Math.max(max, n.branchIndex || 0),
              0,
            ) + 1
          );
        },
        addNode: (day, time, route) => {
          const newNode = createNewNode(get().nodes, day, time, route);
          set((state) => ({ nodes: [...state.nodes, newNode] }));
          get().validateAll();
        },
        updateNode: (id, data) => {
          const updatedNodes = applyNodeUpdate(get().nodes, id, data);
          set({ nodes: updatedNodes });
          get().validateAll();
        },
        moveNode: (id, day, time, route, targetIndex, branchIndex) => {
          const updatedNodes = calculateMove(
            get().nodes,
            id,
            day,
            time,
            route,
            targetIndex,
            branchIndex,
          );
          set({ nodes: updatedNodes });
          if (!get().draggingId) {
            get().validateAll();
          }
        },
        deleteNode: (id) => {
          const updatedNodes = cleanReferences(get().nodes, id);
          set((state) => ({
            nodes: updatedNodes,
            selectedNodeIds: state.selectedNodeIds.filter((sid) => sid !== id),
          }));
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
          if (
            !source ||
            !target ||
            source.id === target.id ||
            source.nextScenarios.includes(target.scenarioId)
          )
            return;
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
                  previousScenarios: [
                    ...n.previousScenarios,
                    source.scenarioId,
                  ],
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
        setConnectionColor: (sourceId, targetScenarioId, color) => {
          set((state) => ({
            nodes: state.nodes.map((n) => {
              if (n.id === sourceId) {
                return {
                  ...n,
                  edgeColors: {
                    ...(n.edgeColors || {}),
                    [targetScenarioId]: color,
                  },
                };
              }
              return n;
            }),
          }));
        },
        validateAll: () => {
          if (get().draggingId) return;
          const { nodes } = get();
          const nodeMap = new Map<string, ScenarioNode>();
          nodes.forEach((n) => nodeMap.set(n.scenarioId, n));
          const issues = nodes.flatMap((n) => validateNode(n, nodeMap));
          set({ nodeMap, validationIssues: issues });
        },
        importData: (data) => {
          set({ nodes: data });
          get().validateAll();
        },
        loadProject: (nodes) => {
          set({ nodes, selectedNodeIds: [], validationIssues: [] });
          get().validateAll();
        },
        loadSampleData: () => {
          get().clearAll();
          get().addNode(0, 0, "Common");
          get().addNode(0, 1, "Common");
          get().addNode(1, 0, "Alyssa");
        },
        clearAll: () => {
          set({
            nodes: [],
            nodeMap: new Map(),
            routes: [...DEFAULT_ROUTES],
            selectedNodeIds: [],
            validationIssues: [],
          });
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
        name: "narrativedesigner-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => {
          const { nodeMap, validationIssues, draggingId, viewport, ...rest } =
            state;
          return rest;
        },
      },
    ),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        routes: state.routes,
      }),
      limit: 50,
      equality: (pastState, currentState) => {
        return (
          JSON.stringify(pastState.nodes) === JSON.stringify(currentState.nodes)
        );
      },
    },
  ),
);
