import { DAYS, TIMES, GRID_CONFIG } from "../../lib/constants";

export const GridBackground = () => {
  const width = GRID_CONFIG.sidebarWidth + DAYS.length * GRID_CONFIG.colWidth;
  const height =
    GRID_CONFIG.headerHeight + TIMES.length * GRID_CONFIG.rowHeight;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none bg-white font-mono"
      style={{ width, height }}
    >
      <div className="absolute top-0 left-0 w-full h-full border-r-2 border-b-2 border-black" />

      {DAYS.map((day, i) => (
        <div
          key={day}
          className="absolute border-r-2 border-black flex items-center justify-center text-sm font-bold text-black bg-gray-100 z-10"
          style={{
            left: GRID_CONFIG.sidebarWidth + i * GRID_CONFIG.colWidth,
            top: 0,
            width: GRID_CONFIG.colWidth,
            height: GRID_CONFIG.headerHeight,
          }}
        >
          {day}
        </div>
      ))}

      {TIMES.map((time, i) => (
        <div
          key={time}
          className="absolute border-b-2 border-black flex items-center justify-center text-sm font-bold text-black bg-gray-100 z-10"
          style={{
            left: 0,
            top: GRID_CONFIG.headerHeight + i * GRID_CONFIG.rowHeight,
            width: GRID_CONFIG.sidebarWidth,
            height: GRID_CONFIG.rowHeight,
          }}
        >
          <span className="-rotate-90">{time}</span>
        </div>
      ))}

      {DAYS.map((_, d) =>
        TIMES.map((_, t) => (
          <div
            key={`${d}-${t}`}
            className="absolute border-r border-b border-black/10 border-dashed"
            style={{
              left: GRID_CONFIG.sidebarWidth + d * GRID_CONFIG.colWidth,
              top: GRID_CONFIG.headerHeight + t * GRID_CONFIG.rowHeight,
              width: GRID_CONFIG.colWidth,
              height: GRID_CONFIG.rowHeight,
            }}
          />
        )),
      )}
    </div>
  );
};
