import { DAYS, TIMES, GRID_CONFIG, COLORS } from "../../lib/constants";
import { useStore } from "../../store/useStore";
import { cn, getColumnLayout, getRowLayout } from "../../lib/utils";

interface Props {
  layoutMap: ReturnType<typeof getColumnLayout>;
  rowLayoutMap: ReturnType<typeof getRowLayout>;
}

export const GridBackground = ({ layoutMap, rowLayoutMap }: Props) => {
  const darkMode = useStore((state) => state.darkMode);
  const routes = useStore((state) => state.routes);

  return (
    <div
      className={cn(
        "absolute top-0 left-0 pointer-events-none select-none font-mono transition-colors",
        darkMode ? "bg-slate-900" : "bg-white",
      )}
      style={{ width: layoutMap.totalWidth, height: rowLayoutMap.totalHeight }}
    >
      {routes.map((route) => {
        const rowData = rowLayoutMap.rows[route];
        return (
          <div
            key={route}
            className={cn(
              "absolute w-full border-b transition-all duration-300 ease-in-out",
              darkMode ? "border-slate-500" : "border-gray-500",
            )}
            style={{ top: rowData.startY, height: rowData.height }}
          />
        );
      })}
      {Array.from({ length: 28 }).map((_, d) =>
        Array.from({ length: 4 }).map((_, t) => {
          const key = `${d}-${t}`;
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
                  ? COLORS.timeSlotsDark[t]
                  : COLORS.timeSlots[t],
                borderColor: darkMode ? "#475569" : COLORS.gridLine,
                opacity: darkMode ? 0.4 : 0.5,
              }}
            />
          );
        }),
      )}
      {DAYS.map((day, d) => {
        const startKey = `${d}-0`;
        const endKey = `${d}-3`;
        const startCol = layoutMap.columns[startKey];
        const endCol = layoutMap.columns[endKey];
        const dayWidth = endCol.startX + endCol.width - startCol.startX;
        return (
          <div
            key={d}
            className={cn(
              "absolute border-r border-b flex items-center justify-center text-sm font-bold z-10 transition-all duration-300 ease-in-out",
              darkMode
                ? "bg-slate-800 text-white border-slate-500"
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
      {Array.from({ length: 28 }).map((_, d) =>
        TIMES.map((time, t) => {
          const key = `${d}-${t}`;
          const col = layoutMap.columns[key];
          return (
            <div
              key={`${d}-header-${t}`}
              className={cn(
                "absolute border-r border-b flex items-center justify-center text-xs font-bold z-10 transition-all duration-300 ease-in-out",
                darkMode
                  ? "bg-slate-800 text-slate-300 border-slate-500"
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
      {routes.map((route) => {
        const rowData = rowLayoutMap.rows[route];
        return (
          <div
            key={route}
            className={cn(
              "absolute border-b border-r flex items-center justify-center text-sm font-bold z-20 transition-all duration-300 ease-in-out",
              darkMode
                ? "bg-slate-800 text-white border-slate-500"
                : "bg-gray-100 text-black border-black",
            )}
            style={{
              left: 0,
              top: rowData.startY,
              width: GRID_CONFIG.sidebarWidth,
              height: rowData.height,
            }}
          >
            {route}
          </div>
        );
      })}
      <div
        className={cn(
          "absolute top-0 left-0 border-r border-b z-20",
          darkMode
            ? "bg-slate-800 border-slate-500"
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
