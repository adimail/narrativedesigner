import React, { useMemo } from "react";
import { ScenarioNode as NodeType } from "../../types/schema";
import { getCoordinates, getColumnLayout } from "../../lib/utils";
import {
  GRID_CONFIG,
  PIN_COLORS_DARK,
  PIN_COLORS_LIGHT,
  ROUTE_COLORS,
} from "../../lib/constants";
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

  const stackIndex = node.sortIndex || 0;

  const layoutMap = useMemo(() => getColumnLayout(nodes), [nodes]);

  const coords = getCoordinates(
    node.gridPosition.day,
    node.gridPosition.time,
    node.gridPosition.route,
    stackIndex,
    layoutMap,
  );

  const pinSpacing = 24;
  const totalPins = node.nextScenarios.length;
  const startPinY =
    GRID_CONFIG.nodeHeight / 2 - ((totalPins - 1) * pinSpacing) / 2;

  const pinColors = darkMode ? PIN_COLORS_DARK : PIN_COLORS_LIGHT;

  const routeColor =
    ROUTE_COLORS[node.gridPosition.route] || ROUTE_COLORS.Common;
  const bgColor = darkMode ? routeColor.dark : routeColor.light;
  const borderColor = routeColor.border;

  return (
    <div
      className={cn(
        "absolute cursor-grab active:cursor-grabbing select-none flex flex-col border-2 transition-all duration-300 ease-in-out group font-mono rounded-md pointer-events-auto",
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
        left: coords.x,
        top: coords.y,
        width: GRID_CONFIG.nodeWidth,
        height: GRID_CONFIG.nodeHeight,
        backgroundColor: hasError || hasWarning ? undefined : bgColor,
        borderColor: hasError || hasWarning ? undefined : borderColor,
        color: darkMode ? "white" : "black",
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onMouseUp={(e) => onConnectEnd(e, node.id)}
    >
      <div
        className={cn(
          "px-2 py-1 border-b-2 flex items-center justify-between shrink-0",
          darkMode
            ? "border-slate-500 bg-black/20"
            : "border-black bg-white/40",
        )}
        style={{
          borderColor: hasError || hasWarning ? undefined : borderColor,
        }}
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

      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          className={cn(
            "flex-1 p-2 border-b border-dashed",
            darkMode ? "border-slate-500" : "border-black/30",
          )}
        >
          <div className="text-[9px] font-bold opacity-70 mb-1">LOAD INFO</div>
          <div className="text-[10px] leading-tight">
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="font-bold">
                {node.loadInfo.immediately ? "IMMEDIATE" : "WAIT"}
              </span>
            </div>
            {!node.loadInfo.immediately && (
              <div className="mt-1 pl-1 border-l-2 border-current/30">
                <div className="truncate opacity-80">
                  {node.loadInfo.afterScenario}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-2 bg-black/5">
          <div className="text-[9px] font-bold opacity-70 mb-1">END INFO</div>
          <div className="text-[10px] leading-tight">
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="font-bold">
                {node.endInfo.immediately ? "IMMEDIATE" : "WAIT"}
              </span>
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] opacity-80">
              <span>{node.endInfo.atDay}</span>
              <span>{node.endInfo.atTime}</span>
            </div>
            {!node.endInfo.immediately && (
              <div className="mt-1 pl-1 border-l-2 border-current/30">
                <div className="truncate opacity-80">
                  {node.endInfo.afterScenario}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {node.nextScenarios.map((_, index) => {
        const color = pinColors[index % pinColors.length];
        return (
          <div
            key={index}
            className="absolute -right-1.5 w-3 h-3 rounded-full border border-black/50 z-40"
            style={{
              top: startPinY + index * pinSpacing,
              backgroundColor: color,
            }}
          />
        );
      })}

      <div
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 cursor-crosshair opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110 transition-none z-50 shadow-sm",
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
