import { DayEnum, TimeEnum } from "../types/schema";

export const DAYS: DayEnum[] = Array.from(
  { length: 28 },
  (_, i) => `Day${i + 1}` as DayEnum,
);
export const TIMES: TimeEnum[] = ["Morning", "Afternoon", "Evening", "Night"];

export const GRID_CONFIG = {
  colWidth: 280,
  rowHeight: 160,
  headerHeight: 40,
  sidebarWidth: 80,
};

export const COLORS = {
  nodeBg: "#ff99aa",
  nodeBorder: "#000000",
  gridLine: "#000000",
  connection: "#000000",
  connectionActive: "#ff0000",
};
