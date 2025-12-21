import React from "react";
import { ScenarioNode as NodeType } from "../../types/schema";
import { getCoordinates } from "../../lib/utils";
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

  const isSelected = selectedNodeIds.includes(node.id);
  const issues = validationIssues.filter((i) => i.nodeId === node.id);
  const hasError = issues.some((i) => i.type === "error");
  const hasWarning = issues.some((i) => i.type === "warning");

  const coords = getCoordinates(node.gridPosition.day, node.gridPosition.time);

  return (
    <div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none flex flex-col bg-[#ff99aa] border-2 border-black transition-none group font-mono",
        isSelected
          ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px] z-20"
          : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10",
        hasError
          ? "border-red-600 bg-red-100"
          : hasWarning
            ? "border-yellow-600 bg-yellow-100"
            : "",
      )}
      style={{
        left: coords.x + 10,
        top: coords.y + 10,
        width: GRID_CONFIG.colWidth - 20,
        height: GRID_CONFIG.rowHeight - 20,
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onMouseUp={(e) => onConnectEnd(e, node.id)}
    >
      <div className="px-3 py-2 border-b-2 border-black flex items-center justify-between bg-white/20">
        <span
          className="text-xs font-bold truncate flex-1"
          title={node.scenarioId}
        >
          {node.scenarioId}
        </span>
        <div className="flex gap-1">
          {hasError && <XCircle className="w-4 h-4 text-red-600" />}
          {hasWarning && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
        </div>
      </div>

      <div className="p-2 text-xs space-y-1 overflow-hidden">
        <div className="flex justify-between">
          <span className="font-bold">Load:</span>
          <span>{node.loadInfo.immediately ? "NOW" : "WAIT"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">End:</span>
          <span>{node.endInfo.immediately ? "NOW" : "WAIT"}</span>
        </div>
      </div>

      <div
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-black border-2 border-white cursor-crosshair opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110 transition-none z-30 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectStart(e, node.id);
        }}
      >
        <div className="w-2 h-2 bg-white" />
      </div>
    </div>
  );
};
