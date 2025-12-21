import { DAYS, TIMES, ROUTES, GRID_CONFIG, COLORS } from "../../lib/constants";
import { useStore } from "../../store/useStore";
import { cn, getColumnLayout } from "../../lib/utils";
import { useMemo } from "react";

export const GridBackground = () => {
  const darkMode = useStore((state) => state.darkMode);
  const nodes = useStore((state) => state.nodes);

  const layoutMap = useMemo(() => getColumnLayout(nodes), [nodes]);

  const width = layoutMap.totalWidth;
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
      {ROUTES.map((route, r) => (
        <div
          key={route}
          className={cn(
            "absolute w-full border-b transition-all duration-300 ease-in-out",
            darkMode ? "border-slate-700" : "border-gray-200",
          )}
          style={{
            top: GRID_CONFIG.headerHeight + r * GRID_CONFIG.rowHeight,
            height: GRID_CONFIG.rowHeight,
          }}
        />
      ))}

      {DAYS.map((day) =>
        TIMES.map((time) => {
          const key = `${day}-${time}`;
          const col = layoutMap.columns[key];
          return (
            <div
              key={key}
              className="absolute h-full border-r transition-all duration-300 ease-in-out"
              style={{
                left: col.startX,
                width: col.width,
                top: 0,
                backgroundColor: darkMode
                  ? COLORS.timeSlotsDark[time]
                  : COLORS.timeSlots[time],
                borderColor: darkMode ? "#334155" : COLORS.gridLine,
                opacity: darkMode ? 0.4 : 0.5,
              }}
            />
          );
        }),
      )}

      {DAYS.map((day) => {
        const startKey = `${day}-Morning`;
        const endKey = `${day}-Night`;
        const startCol = layoutMap.columns[startKey];
        const endCol = layoutMap.columns[endKey];
        const dayWidth = endCol.startX + endCol.width - startCol.startX;

        return (
          <div
            key={day}
            className={cn(
              "absolute border-r border-b flex items-center justify-center text-sm font-bold z-10 transition-all duration-300 ease-in-out",
              darkMode
                ? "bg-slate-800 text-white border-slate-600"
                : "bg-gray-100 text-black border-black",
            )}
            style={{
              left: startCol.startX,
              top: 0,
              width: dayWidth,
              height: GRID_CONFIG.headerHeight / 2,
            }}
          >
            {day}
          </div>
        );
      })}

      {DAYS.map((day) =>
        TIMES.map((time) => {
          const key = `${day}-${time}`;
          const col = layoutMap.columns[key];
          return (
            <div
              key={`${day}-header-${time}`}
              className={cn(
                "absolute border-r border-b flex items-center justify-center text-xs font-bold z-10 transition-all duration-300 ease-in-out",
                darkMode
                  ? "bg-slate-800 text-slate-300 border-slate-600"
                  : "bg-gray-50 text-gray-600 border-black",
              )}
              style={{
                left: col.startX,
                top: GRID_CONFIG.headerHeight / 2,
                width: col.width,
                height: GRID_CONFIG.headerHeight / 2,
              }}
            >
              {time}
            </div>
          );
        }),
      )}

      {ROUTES.map((route, i) => (
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
            top: GRID_CONFIG.headerHeight + i * GRID_CONFIG.rowHeight,
            width: GRID_CONFIG.sidebarWidth,
            height: GRID_CONFIG.rowHeight,
          }}
        >
          {route}
        </div>
      ))}

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
