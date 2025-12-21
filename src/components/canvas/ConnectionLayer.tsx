import React, { useMemo } from "react";
import { useStore } from "../../store/useStore";
import { getCoordinates, getColumnLayout } from "../../lib/utils";
import {
  GRID_CONFIG,
  PIN_COLORS_DARK,
  PIN_COLORS_LIGHT,
} from "../../lib/constants";

export const ConnectionLayer = () => {
  const nodes = useStore((state) => state.nodes);
  const disconnectNodes = useStore((state) => state.disconnectNodes);
  const darkMode = useStore((state) => state.darkMode);

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

  const layoutMap = useMemo(() => getColumnLayout(nodes), [nodes]);

  const width = layoutMap.totalWidth;
  const height = GRID_CONFIG.headerHeight + 5 * GRID_CONFIG.rowHeight;

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

  return (
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
          sourceStack,
          layoutMap,
        );
        const end = getCoordinates(
          conn.target.gridPosition.day,
          conn.target.gridPosition.time,
          conn.target.gridPosition.route,
          targetStack,
          layoutMap,
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

        return (
          <g
            key={`${conn.source.id}-${conn.target.id}-${idx}`}
            className="pointer-events-auto group"
          >
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="15"
              className="cursor-pointer"
              onClick={(e) =>
                handleLinkClick(e, conn.source.id, conn.target.id)
              }
            />
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              markerEnd={`url(#arrowhead-${modeSuffix}-${pinIndex % pinColors.length})`}
              className="transition-colors opacity-90"
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
  );
};
