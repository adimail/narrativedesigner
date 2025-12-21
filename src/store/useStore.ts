import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  ScenarioNode,
  DayEnum,
  TimeEnum,
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

  addNode: (day: DayEnum, time: TimeEnum) => void;
  updateNode: (id: string, data: Partial<ScenarioNode>) => void;
  moveNode: (id: string, day: DayEnum, time: TimeEnum) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  disconnectNodes: (sourceId: string, targetId: string) => void;
  validateAll: () => void;
  importData: (data: ScenarioNode[]) => void;
  loadSampleData: () => void;
  setScale: (scale: number) => void;
  togglePropertiesPanel: () => void;
  toggleValidationPanel: () => void;
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

      addNode: (day, time) => {
        const newNode: ScenarioNode = {
          id: uuidv4(),
          scenarioId: `D${day.replace("Day", "").padStart(2, "0")}_RCommon_Sc${Math.floor(Math.random() * 999)}`,
          gridPosition: { day, time },
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

        // If node doesn't exist, or we aren't changing the scenarioId, or the new ID is the same
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
          // Handle renaming: update references in all other nodes
          const oldId = nodeToUpdate.scenarioId;
          const newId = data.scenarioId;

          set((state) => ({
            nodes: state.nodes.map((n) => {
              // Update the target node itself
              if (n.id === id) {
                return { ...n, ...data };
              }

              // Update references in other nodes
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

      moveNode: (id, day, time) => {
        set((state) => ({
          nodes: state.nodes.map((n) => {
            if (n.id !== id) return n;
            return {
              ...n,
              gridPosition: { day, time },
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
            gridPosition: { day: "Day1", time: "Morning" },
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
            gridPosition: { day: "Day1", time: "Afternoon" },
            loadInfo: {
              immediately: false,
              afterScenario: "D01_RCommon_Sc001",
              atDay: "Day1",
              atTime: "Afternoon",
            },
            endInfo: { immediately: true, afterScenario: "None" },
            nextScenarios: ["D02_RCommon_Sc001"],
            previousScenarios: ["D01_RCommon_Sc001"],
          },
          {
            id: node3Id,
            scenarioId: "D02_RCommon_Sc001",
            gridPosition: { day: "Day2", time: "Morning" },
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

      setScale: (scale) => set({ scale }),
      togglePropertiesPanel: () =>
        set((state) => ({
          isPropertiesPanelOpen: !state.isPropertiesPanelOpen,
        })),
      toggleValidationPanel: () =>
        set((state) => ({
          isValidationPanelOpen: !state.isValidationPanelOpen,
        })),
    }),
    {
      name: "scenariograph-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
