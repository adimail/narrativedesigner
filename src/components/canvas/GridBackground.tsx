import { DAYS, TIMES, ROUTES, GRID_CONFIG, COLORS } from "../../lib/constants";
import { useStore } from "../../store/useStore";
import { cn, getRouteLayout } from "../../lib/utils";
import { useMemo } from "react";

export const GridBackground = () => {
  const darkMode = useStore((state) => state.darkMode);
  const nodes = useStore((state) => state.nodes);

  // Calculate dynamic layout
  const layoutMap = useMemo(() => getRouteLayout(nodes), [nodes]);

  const totalCols = DAYS.length * 4;
  const width = GRID_CONFIG.sidebarWidth + totalCols * GRID_CONFIG.colWidth;
  const height = layoutMap.totalHeight;

  return (
    <div
      className={cn(
        "absolute top-0 left-0 pointer-events-none select-none font-mono transition-colors",
        darkMode ? "bg-slate-900" : "bg-white",
      )}
      style={{ width, height }}
    >
      {/* Route Rows (Background) */}
      {ROUTES.map((route) => {
        const routeLayout = layoutMap.routes[route];
        return (
          <div
            key={route}
            className={cn(
              "absolute w-full border-b transition-all duration-300 ease-in-out",
              darkMode ? "border-slate-700" : "border-gray-200",
            )}
            style={{
              top: routeLayout.top,
              height: routeLayout.height,
            }}
          />
        );
      })}

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
                // Use specific dark mode colors or light mode colors
                backgroundColor: darkMode
                  ? COLORS.timeSlotsDark[time]
                  : COLORS.timeSlots[time],
                borderColor: darkMode ? "#334155" : COLORS.gridLine,
                // Adjust opacity:
                // Light mode needs 0.5 to look pastel.
                // Dark mode needs 0.4 to blend with the slate-900 background but remain distinct.
                opacity: darkMode ? 0.4 : 0.5,
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
      {ROUTES.map((route) => {
        const routeLayout = layoutMap.routes[route];
        return (
          <div
            key={route}
            className={cn(
              "absolute border-b border-r flex items-center justify-center text-sm font-bold z-20 transition-all duration-300 ease-in-out",
              darkMode
                ? "bg-slate-800 text-white border-slate-600"
                : "bg-gray-100 text-black border-black",
            )}
            style={{
              left: 0,
              top: routeLayout.top,
              width: GRID_CONFIG.sidebarWidth,
              height: routeLayout.height,
            }}
          >
            {route}
          </div>
        );
      })}

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
