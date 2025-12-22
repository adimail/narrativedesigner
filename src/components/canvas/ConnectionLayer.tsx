import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../store/useStore";
import { getCoordinates, cn } from "../../lib/utils";
import {
  GRID_CONFIG,
  PIN_COLORS_DARK,
  PIN_COLORS_LIGHT,
} from "../../lib/constants";
import { Trash2 } from "lucide-react";

const ConnectionPath = React.memo(
  ({
    source,
    target,
    layoutMap,
    rowLayoutMap,
    pinColors,
    modeSuffix,
    onLinkClick,
    onContextMenu,
    isContextMenuOpen,
  }: any) => {
    const start = getCoordinates(
      source.gridPosition.day,
      source.gridPosition.time,
      source.gridPosition.route,
      source.branchIndex || 0,
      source.sortIndex || 0,
      layoutMap,
      rowLayoutMap,
    );
    const end = getCoordinates(
      target.gridPosition.day,
      target.gridPosition.time,
      target.gridPosition.route,
      target.branchIndex || 0,
      target.sortIndex || 0,
      layoutMap,
      rowLayoutMap,
    );
    const pinIndex = source.nextScenarios.indexOf(target.scenarioId);
    const totalPins = source.nextScenarios.length;
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

    const customColor = source.edgeColors?.[target.scenarioId];
    const strokeColor = customColor || pinColors[pinIndex % pinColors.length];

    const markerId = strokeColor.replace("#", "");

    return (
      <g className="pointer-events-auto group">
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          className="cursor-pointer"
          onClick={(e) => onLinkClick(e, source.id, target.id)}
          onContextMenu={(e) => onContextMenu(e, source.id, target.id)}
        />
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          className={cn(
            "transition-opacity duration-200 blur-[3px] pointer-events-none",
            isContextMenuOpen
              ? "opacity-60"
              : "opacity-0 group-hover:opacity-60",
          )}
        />
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          markerEnd={`url(#arrowhead-${modeSuffix}-${markerId})`}
          className="transition-colors opacity-90 pointer-events-none"
        />
      </g>
    );
  },
);

export const ConnectionLayer = () => {
  const nodes = useStore((state) => state.nodes);
  const layoutMap = useStore((state) => state.layoutMap);
  const rowLayoutMap = useStore((state) => state.rowLayoutMap);
  const disconnectNodes = useStore((state) => state.disconnectNodes);
  const setConnectionColor = useStore((state) => state.setConnectionColor);
  const darkMode = useStore((state) => state.darkMode);
  const draggingId = useStore((state) => state.draggingId);
  const viewport = useStore((state) => state.viewport);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sourceId: string;
    targetId: string;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const allConnections = useMemo(() => {
    const nodeMap = new Map();
    nodes.forEach((n) => nodeMap.set(n.scenarioId, n));
    return nodes
      .flatMap((sourceNode) =>
        sourceNode.nextScenarios.map((targetId) => {
          const targetNode = nodeMap.get(targetId);
          if (!targetNode) return null;
          return { source: sourceNode, target: targetNode };
        }),
      )
      .filter(Boolean);
  }, [nodes]);

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
    setContextMenu({ x: e.clientX, y: e.clientY, sourceId, targetId });
  };

  const isVisible = (conn: any) => {
    const start = getCoordinates(
      conn.source.gridPosition.day,
      conn.source.gridPosition.time,
      conn.source.gridPosition.route,
      conn.source.branchIndex || 0,
      conn.source.sortIndex || 0,
      layoutMap,
      rowLayoutMap,
    );
    const end = getCoordinates(
      conn.target.gridPosition.day,
      conn.target.gridPosition.time,
      conn.target.gridPosition.route,
      conn.target.branchIndex || 0,
      conn.target.sortIndex || 0,
      layoutMap,
      rowLayoutMap,
    );
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(
      start.x + GRID_CONFIG.nodeWidth,
      end.x + GRID_CONFIG.nodeWidth,
    );
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(
      start.y + GRID_CONFIG.nodeHeight,
      end.y + GRID_CONFIG.nodeHeight,
    );
    return (
      maxX > viewport.x &&
      minX < viewport.x + viewport.w &&
      maxY > viewport.y &&
      minY < viewport.y + viewport.h
    );
  };

  const staticConnections = allConnections.filter(
    (c) =>
      c.source.id !== draggingId && c.target.id !== draggingId && isVisible(c),
  );
  const activeConnections = allConnections.filter(
    (c) =>
      (c.source.id === draggingId || c.target.id === draggingId) &&
      isVisible(c),
  );

  const sourceNode = contextMenu
    ? nodes.find((n) => n.id === contextMenu.sourceId)
    : null;
  const targetNode = contextMenu
    ? nodes.find((n) => n.id === contextMenu.targetId)
    : null;
  const currentColor =
    sourceNode && targetNode
      ? sourceNode.edgeColors?.[targetNode.scenarioId]
      : null;

  return (
    <>
      <svg
        className="absolute top-0 left-0 pointer-events-none z-10"
        style={{
          width: layoutMap.totalWidth,
          height: rowLayoutMap.totalHeight,
          transform: "translate3d(0,0,0)",
        }}
      >
        <defs>
          {pinColors.map((color) => (
            <marker
              key={`${modeSuffix}-${color}`}
              id={`arrowhead-${modeSuffix}-${color.replace("#", "")}`}
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
        <g id="static-connections">
          {staticConnections.map((conn, idx) => (
            <ConnectionPath
              key={`${conn.source.id}-${conn.target.id}`}
              source={conn.source}
              target={conn.target}
              layoutMap={layoutMap}
              rowLayoutMap={rowLayoutMap}
              pinColors={pinColors}
              modeSuffix={modeSuffix}
              onLinkClick={handleLinkClick}
              onContextMenu={handleContextMenu}
              isContextMenuOpen={
                contextMenu?.sourceId === conn.source.id &&
                contextMenu?.targetId === conn.target.id
              }
            />
          ))}
        </g>
        <g id="active-connections">
          {activeConnections.map((conn, idx) => (
            <ConnectionPath
              key={`${conn.source.id}-${conn.target.id}`}
              source={conn.source}
              target={conn.target}
              layoutMap={layoutMap}
              rowLayoutMap={rowLayoutMap}
              pinColors={pinColors}
              modeSuffix={modeSuffix}
              onLinkClick={handleLinkClick}
              onContextMenu={handleContextMenu}
              isContextMenuOpen={
                contextMenu?.sourceId === conn.source.id &&
                contextMenu?.targetId === conn.target.id
              }
            />
          ))}
        </g>
      </svg>
      {contextMenu &&
        createPortal(
          <div
            className="fixed z-[9999] min-w-[180px] overflow-hidden rounded-md border bg-white shadow-xl dark:bg-slate-800 dark:border-slate-700"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase opacity-50 mb-2 px-1 text-white">
                Link Color
              </div>
              <div className="grid grid-cols-4 gap-2 px-1">
                {pinColors.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      targetNode &&
                      setConnectionColor(
                        contextMenu.sourceId,
                        targetNode.scenarioId,
                        color,
                      )
                    }
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                      currentColor === color
                        ? "border-slate-900 dark:border-white scale-110 shadow-md"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
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
