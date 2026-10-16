import { categoryIds, conceptCategoryIds, type ProjectCategory } from '../data/projectCategories.ts';

interface OrderedProject {
  data: { primaryCategory: ProjectCategory; order: number; slug: string; projectType?: string };
}

function rotate<T extends OrderedProject>(projects: readonly T[], priority: readonly ProjectCategory[]): T[] {
  const buckets = priority.map((category) => projects
    .filter(({ data }) => data.primaryCategory === category)
    .sort((a, b) => a.data.order - b.data.order
      || (a.data.slug < b.data.slug ? -1 : a.data.slug > b.data.slug ? 1 : 0)));
  const ordered: T[] = [];
  const rounds = Math.max(0, ...buckets.map((bucket) => bucket.length));
  for (let round = 0; round < rounds; round++) {
    for (const bucket of buckets) {
      if (bucket[round]) ordered.push(bucket[round]);
    }
  }
  return ordered;
}

/** Client work leads; concepts follow in a separate, website-first rotation. */
export function orderProjects<T extends OrderedProject>(projects: readonly T[]): T[] {
  return [
    ...rotate(projects.filter(({ data }) => data.projectType !== 'Independent Concept'), categoryIds),
    ...rotate(projects.filter(({ data }) => data.projectType === 'Independent Concept'), conceptCategoryIds),
  ];
}
