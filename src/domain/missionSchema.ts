import { z } from "zod";

export const componentDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  service: z.string().min(1),
  category: z.enum(["entry", "compute", "queue", "data", "ai"]),
  description: z.string().min(1),
});

export const missionSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  duration: z.string().min(1),
  skills: z.array(z.string()).min(1),
  requirements: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
  components: z.array(componentDefinitionSchema).min(1),
});

export type MissionDefinition = z.infer<typeof missionSchema>;
