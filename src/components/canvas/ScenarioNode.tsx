import React, { useMemo } from "react";
import { ScenarioNode as NodeType } from "../../types/schema";
import { getCoordinates, getRouteLayout } from "../../lib/utils";
import { GRID_CONFIG } from "../../lib/constants";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import { AlertTriangle, XCircle } from "lucide-react";

interface Props {
  node: NodeType;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string) => void;
  onConnectEnd: (e: React.MouseEvent, id: string) => void;
}

export const ScenarioNode = ({
  node,
  onMouseDown,
  onConnectStart,
  onConnectEnd,
}: Props) => {
  const selectedNodeIds = useStore((state) => state.selectedNodeIds);
  const validationIssues = useStore((state) => state.validationIssues);
  const nodes = useStore((state) => state.nodes);
  const darkMode = useStore((state) => state.darkMode);

  const isSelected = selectedNodeIds.includes(node.id);
  const issues = validationIssues.filter((i) => i.nodeId === node.id);
  const hasError = issues.some((i) => i.type === "error");
  const hasWarning = issues.some((i) => i.type === "warning");

  const siblings = nodes.filter(
    (n) =>
      n.gridPosition.day === node.gridPosition.day &&
      n.gridPosition.time === node.gridPosition.time &&
      n.gridPosition.route === node.gridPosition.route,
  );
  siblings.sort((a, b) => a.id.localeCompare(b.id));
  const stackIndex = siblings.findIndex((n) => n.id === node.id);

  const layoutMap = useMemo(() => getRouteLayout(nodes), [nodes]);

  const coords = getCoordinates(
    node.gridPosition.day,
    node.gridPosition.time,
    node.gridPosition.route,
    stackIndex,
    layoutMap,
  );

  return (
    <div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none flex flex-col border-2 transition-all duration-300 ease-in-out group font-mono rounded-md",
        darkMode
          ? "bg-slate-700 border-slate-400 text-white"
          : "bg-[#ff99aa] border-black text-black",
        isSelected
          ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px] z-30"
          : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20",
        hasError
          ? "border-red-600 bg-red-100 text-black"
          : hasWarning
            ? "border-yellow-600 bg-yellow-100 text-black"
            : "",
      )}
      style={{
        left: coords.x + 10,
        top: coords.y,
        width: GRID_CONFIG.colWidth - 20,
        height: GRID_CONFIG.nodeHeight,
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onMouseUp={(e) => onConnectEnd(e, node.id)}
    >
      <div
        className={cn(
          "px-2 py-1 border-b-2 flex items-center justify-between",
          darkMode
            ? "border-slate-500 bg-white/10"
            : "border-black bg-white/20",
        )}
      >
        <span
          className="text-[10px] font-bold truncate flex-1"
          title={node.scenarioId}
        >
          {node.scenarioId}
        </span>
        <div className="flex gap-1">
          {hasError && <XCircle className="w-3 h-3 text-red-600" />}
          {hasWarning && <AlertTriangle className="w-3 h-3 text-yellow-600" />}
        </div>
      </div>

      <div className="p-2 text-[10px] space-y-1 overflow-hidden leading-tight">
        <div className="flex justify-between">
          <span className="font-bold opacity-70">L:</span>
          <span>{node.loadInfo.immediately ? "NOW" : "WAIT"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold opacity-70">E:</span>
          <span>{node.endInfo.immediately ? "NOW" : "WAIT"}</span>
        </div>
      </div>

      <div
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 cursor-crosshair opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110 transition-none z-40 shadow-sm",
          darkMode ? "bg-slate-800 border-white" : "bg-black border-white",
        )}
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectStart(e, node.id);
        }}
      >
        <div className="w-1.5 h-1.5 bg-white" />
      </div>
    </div>
  );
};
