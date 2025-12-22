import { z } from "zod";

export type ScenarioId = string & { readonly _brand: "ScenarioId" };

export const ScenarioIdSchema = z
  .string()
  .transform((val) => val as ScenarioId);

export type Day = number;
export type Time = number;

export type RouteEnum = "Common" | "Alyssa" | "Rhea" | "Natalie" | "OtherQuest";

export const RouteEnumSchema = z.enum([
  "Common",
  "Alyssa",
  "Rhea",
  "Natalie",
  "OtherQuest",
]);

export const LoadInfoSchema = z.object({
  immediately: z.boolean(),
  afterScenario: ScenarioIdSchema.nullable(),
  atDay: z.number().min(0).max(27),
  atTime: z.number().min(0).max(3),
});

export const EndInfoSchema = z.object({
  immediately: z.boolean(),
  afterScenario: ScenarioIdSchema.nullable(),
  atDay: z.number().min(0).max(27),
  atTime: z.number().min(0).max(3),
});

export const ScenarioNodeSchema = z.object({
  id: z.string().uuid(),
  scenarioId: ScenarioIdSchema,
  sortIndex: z.number(),
  branchIndex: z.number().optional(),
  description: z.string().optional(),
  gridPosition: z.object({
    day: z.number().min(0).max(27),
    time: z.number().min(0).max(3),
    route: RouteEnumSchema,
  }),
  loadInfo: LoadInfoSchema,
  endInfo: EndInfoSchema,
  nextScenarios: z.array(ScenarioIdSchema),
  previousScenarios: z.array(ScenarioIdSchema),
  edgeColors: z.record(z.string(), z.string()).optional(),
});

export type LoadInfo = z.infer<typeof LoadInfoSchema>;
export type EndInfo = z.infer<typeof EndInfoSchema>;
export type ScenarioNode = z.infer<typeof ScenarioNodeSchema>;

export interface ValidationIssue {
  nodeId: string;
  type: "error" | "warning";
  message: string;
}
