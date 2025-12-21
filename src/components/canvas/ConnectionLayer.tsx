import { useStore } from "../../store/useStore";
import { getCoordinates } from "../../lib/utils";
import { GRID_CONFIG, COLORS } from "../../lib/constants";

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

  // Calculate stacking index for source and target
  const getStackIndex = (node: (typeof nodes)[0]) => {
    const siblings = nodes.filter(
      (n) =>
        n.gridPosition.day === node.gridPosition.day &&
        n.gridPosition.time === node.gridPosition.time &&
        n.gridPosition.route === node.gridPosition.route,
    );
    // Sort by ID to ensure consistent order
    siblings.sort((a, b) => a.id.localeCompare(b.id));
    return siblings.findIndex((n) => n.id === node.id);
  };

  const totalCols = 28 * 4;
  const width = GRID_CONFIG.sidebarWidth + totalCols * GRID_CONFIG.colWidth;
  const height = GRID_CONFIG.headerHeight + 5 * GRID_CONFIG.rowHeight;

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
      className="absolute top-0 left-0 pointer-events-none z-0"
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
        );
        const end = getCoordinates(
          conn.target.gridPosition.day,
          conn.target.gridPosition.time,
          conn.target.gridPosition.route,
          targetStack,
        );

        const startX = start.x + GRID_CONFIG.colWidth - 20;
        const startY = start.y + 40; // Approximate vertical center of node content
        const endX = end.x + 20;
        const endY = end.y + 40;

        const controlPointOffset = Math.abs(endX - startX) * 0.5;
        const path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;

        const strokeColor = darkMode ? "#94a3b8" : COLORS.connection;

        return (
          <g
            key={`${conn.source.id}-${conn.target.id}-${idx}`}
            className="pointer-events-auto group"
          >
            {/* Invisible wide path for easier clicking */}
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
            {/* Visible path */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="group-hover:stroke-red-500 transition-colors"
            />
          </g>
        );
      })}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={darkMode ? "#94a3b8" : COLORS.connection}
          />
        </marker>
      </defs>
    </svg>
  );
};
