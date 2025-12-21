import { DayEnum, RouteEnum, TimeEnum } from "../types/schema";

export const DAYS: DayEnum[] = Array.from(
  { length: 28 },
  (_, i) => `Day${i + 1}` as DayEnum,
);

export const TIMES: TimeEnum[] = ["Morning", "Afternoon", "Evening", "Night"];

export const DEFAULT_ROUTES: RouteEnum[] = [
  "Common",
  "Alyssa",
  "Rhea",
  "Natalie",
  "OtherQuest",
];

export const GRID_CONFIG = {
  minColWidth: 250,
  nodeWidth: 240,
  nodeGap: 50,
  rowHeight: 250,
  branchHeight: 200,
  headerHeight: 60,
  sidebarWidth: 120,
  nodeHeight: 180,
  branchDropZoneHeight: 60,
};

export const COLORS = {
  nodeBg: "#fca5a5",
  nodeBorder: "#000000",
  gridLine: "#9ca3af",
  connection: "#4b5563",
  connectionActive: "#ef4444",
  timeSlots: {
    Morning: "#93c5fd",
    Afternoon: "#86efac",
    Evening: "#fdba74",
    Night: "#cbd5e1",
  },
  timeSlotsDark: {
    Morning: "#1e3a8a",
    Afternoon: "#14532d",
    Evening: "#7c2d12",
    Night: "#334155",
  },
};

export const ROUTE_COLORS: Record<
  string,
  { light: string; dark: string; border: string }
> = {
  Common: { light: "#e5e7eb", dark: "#374151", border: "#6b7280" },

  Alyssa: {
    light: "#c7e89b",
    dark: "#4d7c0f",
    border: "#84cc16",
  },

  Rhea: {
    light: "#fde68a",
    dark: "#92400e",
    border: "#facc15",
  },

  Natalie: {
    light: "#f5b7c2",
    dark: "#9f1239",
    border: "#e11d48",
  },

  OtherQuest: {
    light: "#bae6fd",
    dark: "#0c4a6e",
    border: "#0284c7",
  },
};

export const PIN_COLORS_DARK = [
  "#9cf6f6",
  "#f8b6ce",
  "#f79ca9",
  "#f68385",
  "#f56960",
  "#90a955",
  "#c8cd69",
  "#fff07c",
];

export const PIN_COLORS_LIGHT = [
  "#0284c7",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#16a34a",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
];
