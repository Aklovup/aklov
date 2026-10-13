import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { categoryIds } from './data/projectCategories';

const source = z.union([
  z.string().url().refine((value) => /^https?:\/\//.test(value), 'Use an HTTP(S) media URL.'),
  z.string().regex(/^\/(?!\/)/, 'Local media paths must start with a single slash.'),
]);

const media = z.object({
  id: z.string().min(1),
  type: z.enum(['image', 'gif', 'video']),
  url: source.optional(),
  alt: z.string().default(''),
  caption: z.string().optional(),
  poster: source.optional(),
  order: z.number().int().nonnegative().default(0),
  placeholder: z.boolean().default(true),
  width: z.number().int().positive().default(1600),
  height: z.number().int().positive().default(1000),
}).refine((item) => !item.url || item.alt.trim().length > 0, {
  message: 'Provide descriptive alternative text when adding approved media.',
  path: ['alt'],
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    aliases: z.array(z.string()).default([]),
    title: z.string().min(1),
    description: z.string().min(1),
    headline: z.string().min(1),
    projectType: z.enum(['Client Project', 'Independent Concept', 'Live Demo']),
    classificationNote: z.string().optional(),
    primaryCategory: z.enum(categoryIds),
    additionalCategories: z.array(z.enum(categoryIds)).default([]),
    cover: media,
    media: z.array(media).default([]),
    externalUrl: z.string().url().optional(),
    externalLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { projects };
