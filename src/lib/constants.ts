import { DayEnum, RouteEnum, TimeEnum } from "../types/schema";

export const DAYS: DayEnum[] = Array.from(
  { length: 28 },
  (_, i) => `Day${i + 1}` as DayEnum,
);

export const TIMES: TimeEnum[] = ["Morning", "Afternoon", "Evening", "Night"];

export const ROUTES: RouteEnum[] = [
  "Common",
  "Alyssa",
  "Rhea",
  "Natalie",
  "OtherQuest",
];

export const GRID_CONFIG = {
  colWidth: 140, // Width of a single time slot
  rowHeight: 200, // Height of a route row
  headerHeight: 60,
  sidebarWidth: 120,
};

export const COLORS = {
  nodeBg: "#fca5a5", // Red-300ish
  nodeBorder: "#000000",
  gridLine: "#e5e7eb",
  connection: "#4b5563",
  connectionActive: "#ef4444",
  timeSlots: {
    Morning: "#bfdbfe", // Blue-200
    Afternoon: "#dcfce7", // Green-200
    Evening: "#ffedd5", // Orange-100
    Night: "#e2e8f0", // Slate-200
  },
};
