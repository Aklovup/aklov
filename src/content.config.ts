import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { categoryIds } from './data/projectCategories';

const media = z.object({
  id: z.string().min(1),
  type: z.enum(['image', 'gif', 'video']),
  url: z.string().url().optional(),
  alt: z.string().default(''),
  caption: z.string().optional(),
  poster: z.string().url().optional(),
  width: z.number().int().positive().default(1600),
  height: z.number().int().positive().default(1000),
}).refine((item) => !item.url || item.alt.trim().length > 0, {
  message: 'Provide descriptive alternative text when adding approved media.',
  path: ['alt'],
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    description: z.string().min(1),
    projectType: z.enum(['Client Project', 'Independent Concept', 'Live Demo']),
    classificationNote: z.string().optional(),
    primaryCategory: z.enum(categoryIds),
    additionalCategories: z.array(z.enum(categoryIds)).default([]),
    cover: media,
    externalUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative(),
    // Optional content only; Phase 1 does not render case studies or a popup.
    caseStudy: z.object({
      overview: z.string().optional(),
      challenge: z.string().optional(),
      requirements: z.array(z.string()).optional(),
      implementation: z.string().optional(),
      outcomes: z.string().optional(),
      media: z.array(media).optional(),
    }).optional(),
  }),
});

export const collections = { projects };
