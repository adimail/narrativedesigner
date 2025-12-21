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
  colWidth: 220,
  minRowHeight: 200,
  headerHeight: 60,
  sidebarWidth: 120,
  nodeHeight: 80,
  stackOffset: 50,
};

export const COLORS = {
  nodeBg: "#fca5a5",
  nodeBorder: "#000000",
  gridLine: "#e5e7eb",
  connection: "#4b5563",
  connectionActive: "#ef4444",

  timeSlots: {
    Morning: "#bfdbfe",
    Afternoon: "#dcfce7",
    Evening: "#ffedd5",
    Night: "#e2e8f0",
  },

  timeSlotsDark: {
    Morning: "#172554",
    Afternoon: "#052e16",
    Evening: "#431407",
    Night: "#1e293b",
  },
};
