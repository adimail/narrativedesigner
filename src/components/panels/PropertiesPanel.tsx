import { useStore } from "../../store/useStore";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { DAYS, TIMES } from "../../lib/constants";
import { Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import { ScenarioId } from "../../types/schema";

export const PropertiesPanel = () => {
  const selectedNodeIds = useStore((state) => state.selectedNodeIds);
  const nodes = useStore((state) => state.nodes);
  const updateNode = useStore((state) => state.updateNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const disconnectNodes = useStore((state) => state.disconnectNodes);
  const isOpen = useStore((state) => state.isPropertiesPanelOpen);
  const toggleOpen = useStore((state) => state.togglePropertiesPanel);
  const darkMode = useStore((state) => state.darkMode);

  if (!isOpen) {
    return (
      <div
        className={cn(
          "w-12 border-l-4 flex flex-col items-center py-4",
          darkMode
            ? "bg-slate-800 border-slate-600 text-white"
            : "bg-gray-100 border-black text-black",
        )}
      >
        <Button variant="ghost" size="icon" onClick={toggleOpen}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="mt-8 [writing-mode:vertical-rl] font-mono font-bold text-lg tracking-widest">
          PROPERTIES
        </div>
      </div>
    );
  }

  const content = () => {
    if (selectedNodeIds.length === 0) {
      return (
        <div className="p-6 text-gray-500 text-sm text-center font-mono">
          [NO_SELECTION]
          <br />
          SELECT A NODE TO EDIT
        </div>
      );
    }
    if (selectedNodeIds.length > 1) {
      return (
        <div className="p-6 text-gray-500 text-sm text-center font-mono">
          [{selectedNodeIds.length}_NODES_SELECTED]
        </div>
      );
    }
    const node = nodes.find((n) => n.id === selectedNodeIds[0]);
    if (!node) return null;
    const availableScenarios = nodes
      .filter((n) => n.id !== node.id)
      .map((n) => n.scenarioId)
      .sort();

    return (
      <div className="p-4 space-y-6 font-mono">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase">Scenario ID</label>
          <Input
            value={node.scenarioId}
            onChange={(e) =>
              updateNode(node.id, { scenarioId: e.target.value as ScenarioId })
            }
            className={
              darkMode ? "bg-slate-700 border-slate-500 text-white" : ""
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRoutine"
            className={cn(
              "w-5 h-5 border-2 rounded-none focus:ring-0",
              darkMode
                ? "border-slate-400 bg-slate-700"
                : "border-black text-black",
            )}
            checked={node.isRoutine}
            onChange={(e) =>
              updateNode(node.id, { isRoutine: e.target.checked })
            }
          />
          <label htmlFor="isRoutine" className="text-sm font-bold">
            ROUTINE SCENARIO
          </label>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase">
            Description (Internal)
          </label>
          <textarea
            className={cn(
              "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              darkMode
                ? "bg-slate-700 border-slate-500 text-white"
                : "bg-white",
            )}
            rows={4}
            value={node.description || ""}
            onChange={(e) =>
              updateNode(node.id, { description: e.target.value })
            }
          />
        </div>
        <div
          className={cn(
            "space-y-4 border-t-2 border-dashed pt-4",
            darkMode ? "border-slate-600" : "border-black",
          )}
        >
          <h3
            className={cn(
              "font-bold text-sm inline-block px-2",
              darkMode ? "bg-slate-600 text-white" : "bg-black text-white",
            )}
          >
            LOAD AT THE START OF
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="loadImmediate"
              className={cn(
                "w-5 h-5 border-2 rounded-none focus:ring-0",
                darkMode
                  ? "border-slate-400 bg-slate-700"
                  : "border-black text-black",
              )}
              checked={node.loadInfo.immediately}
              onChange={(e) =>
                updateNode(node.id, {
                  loadInfo: { ...node.loadInfo, immediately: e.target.checked },
                })
              }
            />
            <label htmlFor="loadImmediate" className="text-sm font-bold">
              IMMEDIATE
            </label>
          </div>
          {!node.loadInfo.immediately && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase">
                After Scenario
              </label>
              <Select
                value={node.loadInfo.afterScenario || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    loadInfo: {
                      ...node.loadInfo,
                      afterScenario: (e.target.value as ScenarioId) || null,
                    },
                  })
                }
                className={
                  darkMode ? "bg-slate-700 border-slate-500 text-white" : ""
                }
              >
                <option value="">None</option>
                {availableScenarios.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">At Day</label>
              <Select
                disabled
                value={node.loadInfo.atDay}
                className={cn(
                  "opacity-70",
                  darkMode
                    ? "bg-slate-700 border-slate-500 text-white"
                    : "bg-gray-100",
                )}
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">At Time</label>
              <Select
                disabled
                value={node.loadInfo.atTime}
                className={cn(
                  "opacity-70",
                  darkMode
                    ? "bg-slate-700 border-slate-500 text-white"
                    : "bg-gray-100",
                )}
              >
                {TIMES.map((t, i) => (
                  <option key={i} value={i}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "space-y-4 border-t-2 border-dashed pt-4",
            darkMode ? "border-slate-600" : "border-black",
          )}
        >
          <h3
            className={cn(
              "font-bold text-sm inline-block px-2",
              darkMode ? "bg-slate-600 text-white" : "bg-black text-white",
            )}
          >
            UNLOAD AT THE END OF
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="endImmediate"
              className={cn(
                "w-5 h-5 border-2 rounded-none focus:ring-0",
                darkMode
                  ? "border-slate-400 bg-slate-700"
                  : "border-black text-black",
              )}
              checked={node.endInfo.immediately}
              onChange={(e) =>
                updateNode(node.id, {
                  endInfo: { ...node.endInfo, immediately: e.target.checked },
                })
              }
            />
            <label htmlFor="endImmediate" className="text-sm font-bold">
              IMMEDIATE
            </label>
          </div>
          {!node.endInfo.immediately && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase">
                After Scenario
              </label>
              <Select
                value={node.endInfo.afterScenario || ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    endInfo: {
                      ...node.endInfo,
                      afterScenario: (e.target.value as ScenarioId) || null,
                    },
                  })
                }
                className={
                  darkMode ? "bg-slate-700 border-slate-500 text-white" : ""
                }
              >
                <option value="">None</option>
                {availableScenarios.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">At Day</label>
              <Select
                value={node.endInfo.atDay}
                onChange={(e) =>
                  updateNode(node.id, {
                    endInfo: {
                      ...node.endInfo,
                      atDay: parseInt(e.target.value),
                    },
                  })
                }
                className={
                  darkMode ? "bg-slate-700 border-slate-500 text-white" : ""
                }
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">At Time</label>
              <Select
                value={node.endInfo.atTime}
                onChange={(e) =>
                  updateNode(node.id, {
                    endInfo: {
                      ...node.endInfo,
                      atTime: parseInt(e.target.value),
                    },
                  })
                }
                className={
                  darkMode ? "bg-slate-700 border-slate-500 text-white" : ""
                }
              >
                {TIMES.map((t, i) => (
                  <option key={i} value={i}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "space-y-4 border-t-2 border-dashed pt-4",
            darkMode ? "border-slate-600" : "border-black",
          )}
        >
          <h3
            className={cn(
              "font-bold text-sm inline-block px-2",
              darkMode ? "bg-slate-600 text-white" : "bg-black text-white",
            )}
          >
            LINKS
          </h3>
          <div className="space-y-2">
            {node.nextScenarios.length === 0 && (
              <p className="text-xs text-gray-400">[NO_LINKS]</p>
            )}
            {node.nextScenarios.map((targetId) => {
              const targetNode = nodes.find((n) => n.scenarioId === targetId);
              return (
                <div
                  key={targetId}
                  className={cn(
                    "flex items-center justify-between text-xs border-2 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                    darkMode
                      ? "border-slate-500 bg-slate-700"
                      : "border-black bg-white",
                  )}
                >
                  <span className="truncate flex-1 font-bold">{targetId}</span>
                  <button
                    onClick={() =>
                      targetNode && disconnectNodes(node.id, targetNode.id)
                    }
                    className="text-red-500 hover:text-red-700 ml-2 hover:bg-red-100 p-1 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pt-6 mt-auto">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => deleteNode(node.id)}
          >
            DELETE_NODE
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "w-80 border-l-4 flex flex-col h-full overflow-y-auto transition-all",
        darkMode
          ? "bg-slate-800 border-slate-600 text-white"
          : "bg-white border-black text-black",
      )}
    >
      <div
        className={cn(
          "p-2 border-b-4 flex items-center justify-between",
          darkMode
            ? "border-slate-600 bg-slate-700"
            : "border-black bg-gray-100",
        )}
      >
        <h2 className="font-bold text-lg font-mono pl-2">PROPERTIES</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleOpen}
          className="h-8 w-8"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      {content()}
    </div>
  );
};
