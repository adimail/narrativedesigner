import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../store/useStore";
import {
  getCoordinates,
  getColumnLayout,
  getRowLayout,
  cn,
} from "../../lib/utils";
import {
  GRID_CONFIG,
  PIN_COLORS_DARK,
  PIN_COLORS_LIGHT,
} from "../../lib/constants";
import { Trash2 } from "lucide-react";

export const ConnectionLayer = () => {
  const nodes = useStore((state) => state.nodes);
  const routes = useStore((state) => state.routes);
  const disconnectNodes = useStore((state) => state.disconnectNodes);
  const darkMode = useStore((state) => state.darkMode);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sourceId: string;
    targetId: string;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    window.addEventListener("contextmenu", (e) => {
      if (contextMenu) setContextMenu(null);
    });
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  const connections = nodes
    .flatMap((sourceNode) =>
      sourceNode.nextScenarios.map((targetId) => {
        const targetNode = nodes.find((n) => n.scenarioId === targetId);
        if (!targetNode) return null;
        return { source: sourceNode, target: targetNode };
      }),
    )
    .filter(Boolean);

  const getStackIndex = (node: (typeof nodes)[0]) => {
    return node.sortIndex || 0;
  };

  const layoutMap = useMemo(
    () => getColumnLayout(nodes, routes),
    [nodes, routes],
  );

  const rowLayoutMap = useMemo(
    () => getRowLayout(nodes, routes),
    [nodes, routes],
  );

  const width = layoutMap.totalWidth;
  const height = rowLayoutMap.totalHeight;

  const pinColors = darkMode ? PIN_COLORS_DARK : PIN_COLORS_LIGHT;
  const modeSuffix = darkMode ? "dark" : "light";

  const handleLinkClick = (
    e: React.MouseEvent,
    sourceId: string,
    targetId: string,
  ) => {
    if (e.ctrlKey) {
      e.stopPropagation();
      disconnectNodes(sourceId, targetId);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    sourceId: string,
    targetId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sourceId,
      targetId,
    });
  };

  return (
    <>
      <svg
        className="absolute top-0 left-0 pointer-events-none z-10 transition-all duration-300 ease-in-out"
        style={{ width, height }}
      >
        {connections.map((conn, idx) => {
          if (!conn) return null;

          const sourceStack = getStackIndex(conn.source);
          const targetStack = getStackIndex(conn.target);

          const start = getCoordinates(
            conn.source.gridPosition.day,
            conn.source.gridPosition.time,
            conn.source.gridPosition.route,
            conn.source.branchIndex || 0,
            sourceStack,
            layoutMap,
            rowLayoutMap,
          );
          const end = getCoordinates(
            conn.target.gridPosition.day,
            conn.target.gridPosition.time,
            conn.target.gridPosition.route,
            conn.target.branchIndex || 0,
            targetStack,
            layoutMap,
            rowLayoutMap,
          );

          const pinIndex = conn.source.nextScenarios.indexOf(
            conn.target.scenarioId,
          );
          const totalPins = conn.source.nextScenarios.length;
          const pinSpacing = 24;
          const startPinY =
            GRID_CONFIG.nodeHeight / 2 - ((totalPins - 1) * pinSpacing) / 2;
          const pinOffsetY = startPinY + pinIndex * pinSpacing;

          const startX = start.x + GRID_CONFIG.nodeWidth;
          const startY = start.y + pinOffsetY;
          const endX = end.x;
          const endY = end.y + GRID_CONFIG.nodeHeight / 2;

          const controlPointOffset = Math.abs(endX - startX) * 0.5;
          const path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;

          const strokeColor = pinColors[pinIndex % pinColors.length];

          const isContextMenuOpenForThis =
            contextMenu?.sourceId === conn.source.id &&
            contextMenu?.targetId === conn.target.id;

          return (
            <g
              key={`${conn.source.id}-${conn.target.id}-${idx}`}
              className="pointer-events-auto group"
            >
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
                className="cursor-pointer"
                onClick={(e) =>
                  handleLinkClick(e, conn.source.id, conn.target.id)
                }
                onContextMenu={(e) =>
                  handleContextMenu(e, conn.source.id, conn.target.id)
                }
              />

              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth="8"
                className={cn(
                  "transition-opacity duration-200 blur-[3px] pointer-events-none",
                  isContextMenuOpenForThis
                    ? "opacity-60"
                    : "opacity-0 group-hover:opacity-60",
                )}
              />

              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                markerEnd={`url(#arrowhead-${modeSuffix}-${pinIndex % pinColors.length})`}
                className="transition-colors opacity-90 pointer-events-none"
              />
            </g>
          );
        })}
        <defs>
          {pinColors.map((color, i) => (
            <marker
              key={`${modeSuffix}-${i}`}
              id={`arrowhead-${modeSuffix}-${i}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={color} />
            </marker>
          ))}
        </defs>
      </svg>

      {contextMenu &&
        createPortal(
          <div
            className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-md border bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:bg-slate-800 dark:border-slate-700"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="p-1">
              <button
                onClick={() => {
                  disconnectNodes(contextMenu.sourceId, contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <Trash2 className="h-4 w-4" />
                Delete Connection
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
