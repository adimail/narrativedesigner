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
  colWidth: 220, // Increased width for better visibility
  minRowHeight: 200, // Minimum height if empty
  headerHeight: 60,
  sidebarWidth: 120,
  nodeHeight: 80,
  stackOffset: 50, // Vertical space between stacked nodes
};

export const COLORS = {
  nodeBg: "#fca5a5",
  nodeBorder: "#000000",
  gridLine: "#e5e7eb",
  connection: "#4b5563",
  connectionActive: "#ef4444",
  // Light Mode Colors (Pastels)
  timeSlots: {
    Morning: "#bfdbfe", // Blue-200
    Afternoon: "#dcfce7", // Green-200
    Evening: "#ffedd5", // Orange-100
    Night: "#e2e8f0", // Slate-200
  },
  // Dark Mode Colors (Deep/Muted tones)
  timeSlotsDark: {
    Morning: "#172554", // Blue-950
    Afternoon: "#052e16", // Green-950
    Evening: "#431407", // Orange-950
    Night: "#1e293b", // Slate-800
  },
};
