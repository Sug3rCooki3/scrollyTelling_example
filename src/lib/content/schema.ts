import { z } from "zod";

export const PageFrontmatterSchema = z.object({
  title: z.string().min(1),
  layout: z.enum(["standard", "presentation"]),
  summary: z.string().optional(),
  heroImage: z.string().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;
