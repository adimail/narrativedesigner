import { useStore } from "../../store/useStore";
import { getCoordinates } from "../../lib/utils";
import { GRID_CONFIG, COLORS } from "../../lib/constants";

export const ConnectionLayer = () => {
  const nodes = useStore((state) => state.nodes);

  const connections = nodes
    .flatMap((sourceNode) =>
      sourceNode.nextScenarios.map((targetId) => {
        const targetNode = nodes.find((n) => n.scenarioId === targetId);
        if (!targetNode) return null;
        return { source: sourceNode, target: targetNode };
      }),
    )
    .filter(Boolean);

  const width = GRID_CONFIG.sidebarWidth + 28 * GRID_CONFIG.colWidth;
  const height = GRID_CONFIG.headerHeight + 4 * GRID_CONFIG.rowHeight;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-0"
      style={{ width, height }}
    >
      {connections.map((conn, idx) => {
        if (!conn) return null;

        const start = getCoordinates(
          conn.source.gridPosition.day,
          conn.source.gridPosition.time,
        );
        const end = getCoordinates(
          conn.target.gridPosition.day,
          conn.target.gridPosition.time,
        );

        const startX = start.x + GRID_CONFIG.colWidth - 20;
        const startY = start.y + GRID_CONFIG.rowHeight / 2;
        const endX = end.x + 20;
        const endY = end.y + GRID_CONFIG.rowHeight / 2;

        const controlPointOffset = Math.abs(endX - startX) * 0.5;
        const path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;

        return (
          <g key={`${conn.source.id}-${conn.target.id}-${idx}`}>
            <path
              d={path}
              fill="none"
              stroke={COLORS.connection}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
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
          <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.connection} />
        </marker>
      </defs>
    </svg>
  );
};
