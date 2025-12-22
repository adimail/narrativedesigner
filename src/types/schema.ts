export type ScenarioId = string & { readonly _brand: "ScenarioId" };

export type Day = number;
export type Time = number;

export type RouteEnum = "Common" | "Alyssa" | "Rhea" | "Natalie" | "OtherQuest";

export interface LoadInfo {
  immediately: boolean;
  afterScenario: ScenarioId | null;
  atDay: Day;
  atTime: Time;
}

export interface EndInfo {
  immediately: boolean;
  afterScenario: ScenarioId | null;
  atDay: Day;
  atTime: Time;
}

export interface ScenarioNode {
  id: string;
  scenarioId: ScenarioId;
  sortIndex: number;
  branchIndex?: number;
  description?: string;
  gridPosition: {
    day: Day;
    time: Time;
    route: RouteEnum;
  };
  loadInfo: LoadInfo;
  endInfo: EndInfo;
  nextScenarios: ScenarioId[];
  previousScenarios: ScenarioId[];
}

export interface ValidationIssue {
  nodeId: string;
  type: "error" | "warning";
  message: string;
}
