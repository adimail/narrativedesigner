export type DayEnum =
  | "Day1"
  | "Day2"
  | "Day3"
  | "Day4"
  | "Day5"
  | "Day6"
  | "Day7"
  | "Day8"
  | "Day9"
  | "Day10"
  | "Day11"
  | "Day12"
  | "Day13"
  | "Day14"
  | "Day15"
  | "Day16"
  | "Day17"
  | "Day18"
  | "Day19"
  | "Day20"
  | "Day21"
  | "Day22"
  | "Day23"
  | "Day24"
  | "Day25"
  | "Day26"
  | "Day27"
  | "Day28";

export type TimeEnum = "Morning" | "Afternoon" | "Evening" | "Night";

export interface LoadInfo {
  immediately: boolean;
  afterScenario: string;
  atDay: DayEnum;
  atTime: TimeEnum;
}

export interface EndInfo {
  immediately: boolean;
  afterScenario: string;
  atDay?: DayEnum;
  atTime?: TimeEnum;
}

export interface ScenarioNode {
  id: string;
  scenarioId: string;
  gridPosition: {
    day: DayEnum;
    time: TimeEnum;
  };
  loadInfo: LoadInfo;
  endInfo: EndInfo;
  nextScenarios: string[];
  previousScenarios: string[];
}

export interface ValidationIssue {
  nodeId: string;
  type: "error" | "warning";
  message: string;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}
