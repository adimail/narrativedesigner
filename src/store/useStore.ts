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
import { validateNode } from "../lib/utils";

interface StoreState {
  nodes: ScenarioNode[];
  selectedNodeIds: string[];
  validationIssues: ValidationIssue[];
  scale: number;
  isPropertiesPanelOpen: boolean;
  isValidationPanelOpen: boolean;
  darkMode: boolean;

  addNode: (day: DayEnum, time: TimeEnum, route: RouteEnum) => void;
  updateNode: (id: string, data: Partial<ScenarioNode>) => void;
  moveNode: (
    id: string,
    day: DayEnum,
    time: TimeEnum,
    route: RouteEnum,
  ) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  disconnectNodes: (sourceId: string, targetId: string) => void;
  validateAll: () => void;
  importData: (data: ScenarioNode[]) => void;
  loadSampleData: () => void;
  clearAll: () => void; // New action
  setScale: (scale: number) => void;
  togglePropertiesPanel: () => void;
  toggleValidationPanel: () => void;
  toggleDarkMode: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      nodes: [],
      selectedNodeIds: [],
      validationIssues: [],
      scale: 1,
      isPropertiesPanelOpen: true,
      isValidationPanelOpen: true,
      darkMode: false,

      addNode: (day, time, route) => {
        const { nodes } = get();

        // Generate ID based on convention: D{Day}_R{Route}_Sc{Index}
        const dayNum = day.replace("Day", "").padStart(2, "0");
        const routePrefix = route;

        // Find existing nodes in this route/day to increment index
        const existingInRoute = nodes.filter(
          (n) => n.gridPosition.day === day && n.gridPosition.route === route,
        );
        const nextIndex = (existingInRoute.length + 1)
          .toString()
          .padStart(3, "0");

        const scenarioId = `D${dayNum}_R${routePrefix}_Sc${nextIndex}`;

        const newNode: ScenarioNode = {
          id: uuidv4(),
          scenarioId,
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
          },
          nextScenarios: [],
          previousScenarios: [],
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
        get().validateAll();
      },

      updateNode: (id, data) => {
        const { nodes } = get();
        const nodeToUpdate = nodes.find((n) => n.id === id);

        if (
          !nodeToUpdate ||
          !data.scenarioId ||
          data.scenarioId === nodeToUpdate.scenarioId
        ) {
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
              if (n.id === id) {
                return { ...n, ...data };
              }
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
        get().validateAll();
      },

      moveNode: (id, day, time, route) => {
        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id !== id) return n;
            return {
              ...n,
              gridPosition: { day, time, route },
              loadInfo: { ...n.loadInfo, atDay: day, atTime: time },
            };
          }),
        }));
        get().validateAll();
      },

      deleteNode: (id) => {
        const nodeToDelete = get().nodes.find((n) => n.id === id);
        if (!nodeToDelete) return;

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

          return {
            nodes: cleanedNodes,
            selectedNodeIds: state.selectedNodeIds.filter((sid) => sid !== id),
          };
        });
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
            if (n.id === source.id) {
              return {
                ...n,
                nextScenarios: [...n.nextScenarios, target.scenarioId],
              };
            }
            if (n.id === target.id) {
              return {
                ...n,
                previousScenarios: [...n.previousScenarios, source.scenarioId],
              };
            }
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
            if (n.id === source.id) {
              return {
                ...n,
                nextScenarios: n.nextScenarios.filter(
                  (id) => id !== target.scenarioId,
                ),
              };
            }
            if (n.id === target.id) {
              return {
                ...n,
                previousScenarios: n.previousScenarios.filter(
                  (id) => id !== source.scenarioId,
                ),
              };
            }
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
        set({ nodes: data, selectedNodeIds: [], validationIssues: [] });
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
            gridPosition: { day: "Day1", time: "Morning", route: "Common" },
            loadInfo: {
              immediately: true,
              afterScenario: "None",
              atDay: "Day1",
              atTime: "Morning",
            },
            endInfo: { immediately: true, afterScenario: "None" },
            nextScenarios: ["D01_RCommon_Sc002"],
            previousScenarios: [],
          },
          {
            id: node2Id,
            scenarioId: "D01_RCommon_Sc002",
            gridPosition: { day: "Day1", time: "Afternoon", route: "Common" },
            loadInfo: {
              immediately: false,
              afterScenario: "D01_RCommon_Sc001",
              atDay: "Day1",
              atTime: "Afternoon",
            },
            endInfo: { immediately: true, afterScenario: "None" },
            nextScenarios: ["D02_RAlyssa_Sc001"],
            previousScenarios: ["D01_RCommon_Sc001"],
          },
          {
            id: node3Id,
            scenarioId: "D02_RAlyssa_Sc001",
            gridPosition: { day: "Day2", time: "Morning", route: "Alyssa" },
            loadInfo: {
              immediately: false,
              afterScenario: "D01_RCommon_Sc002",
              atDay: "Day2",
              atTime: "Morning",
            },
            endInfo: { immediately: true, afterScenario: "None" },
            nextScenarios: [],
            previousScenarios: ["D01_RCommon_Sc002"],
          },
        ];

        set({
          nodes: sampleNodes,
          selectedNodeIds: [],
          validationIssues: [],
        });
        get().validateAll();
      },

      clearAll: () => {
        set({
          nodes: [],
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
      name: "scenariograph-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
