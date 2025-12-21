import { DAYS, TIMES, ROUTES, GRID_CONFIG, COLORS } from "../../lib/constants";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

export const GridBackground = () => {
  const darkMode = useStore((state) => state.darkMode);

  const totalCols = DAYS.length * 4;
  const width = GRID_CONFIG.sidebarWidth + totalCols * GRID_CONFIG.colWidth;
  const height =
    GRID_CONFIG.headerHeight + ROUTES.length * GRID_CONFIG.rowHeight;

  return (
    <div
      className={cn(
        "absolute top-0 left-0 pointer-events-none select-none font-mono transition-colors",
        darkMode ? "bg-slate-900" : "bg-white",
      )}
      style={{ width, height }}
    >
      {/* Route Rows (Background) */}
      {ROUTES.map((route, r) => (
        <div
          key={route}
          className={cn(
            "absolute w-full border-b",
            darkMode ? "border-slate-700" : "border-gray-200",
          )}
          style={{
            top: GRID_CONFIG.headerHeight + r * GRID_CONFIG.rowHeight,
            height: GRID_CONFIG.rowHeight,
          }}
        />
      ))}

      {/* Time Columns (Background Colors) */}
      {DAYS.map((day, d) =>
        TIMES.map((time, t) => {
          const globalCol = d * 4 + t;
          return (
            <div
              key={`${day}-${time}`}
              className="absolute h-full border-r"
              style={{
                left:
                  GRID_CONFIG.sidebarWidth + globalCol * GRID_CONFIG.colWidth,
                width: GRID_CONFIG.colWidth,
                top: 0,
                backgroundColor: darkMode ? undefined : COLORS.timeSlots[time],
                borderColor: darkMode ? "#334155" : COLORS.gridLine,
                opacity: darkMode ? 0.1 : 0.5,
              }}
            />
          );
        }),
      )}

      {/* Day Headers */}
      {DAYS.map((day, i) => (
        <div
          key={day}
          className={cn(
            "absolute border-r border-b flex items-center justify-center text-sm font-bold z-10",
            darkMode
              ? "bg-slate-800 text-white border-slate-600"
              : "bg-gray-100 text-black border-black",
          )}
          style={{
            left: GRID_CONFIG.sidebarWidth + i * (GRID_CONFIG.colWidth * 4),
            top: 0,
            width: GRID_CONFIG.colWidth * 4,
            height: GRID_CONFIG.headerHeight / 2,
          }}
        >
          {day}
        </div>
      ))}

      {/* Time Sub-Headers */}
      {DAYS.map((day, d) =>
        TIMES.map((time, t) => {
          const globalCol = d * 4 + t;
          return (
            <div
              key={`${day}-header-${time}`}
              className={cn(
                "absolute border-r border-b flex items-center justify-center text-xs font-bold z-10",
                darkMode
                  ? "bg-slate-800 text-slate-300 border-slate-600"
                  : "bg-gray-50 text-gray-600 border-black",
              )}
              style={{
                left:
                  GRID_CONFIG.sidebarWidth + globalCol * GRID_CONFIG.colWidth,
                top: GRID_CONFIG.headerHeight / 2,
                width: GRID_CONFIG.colWidth,
                height: GRID_CONFIG.headerHeight / 2,
              }}
            >
              {time}
            </div>
          );
        }),
      )}

      {/* Route Sidebar */}
      {ROUTES.map((route, i) => (
        <div
          key={route}
          className={cn(
            "absolute border-b border-r flex items-center justify-center text-sm font-bold z-20",
            darkMode
              ? "bg-slate-800 text-white border-slate-600"
              : "bg-gray-100 text-black border-black",
          )}
          style={{
            left: 0,
            top: GRID_CONFIG.headerHeight + i * GRID_CONFIG.rowHeight,
            width: GRID_CONFIG.sidebarWidth,
            height: GRID_CONFIG.rowHeight,
          }}
        >
          {route}
        </div>
      ))}

      {/* Top-Left Corner */}
      <div
        className={cn(
          "absolute top-0 left-0 border-r border-b z-20",
          darkMode
            ? "bg-slate-800 border-slate-600"
            : "bg-gray-200 border-black",
        )}
        style={{
          width: GRID_CONFIG.sidebarWidth,
          height: GRID_CONFIG.headerHeight,
        }}
      />
    </div>
  );
};
