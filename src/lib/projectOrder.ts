import { categoryIds, type ProjectCategory } from '../data/projectCategories.ts';

interface OrderedProject {
  data: { primaryCategory: ProjectCategory; order: number; slug: string };
}

/** One project per primary category per round; empty/exhausted categories are skipped. */
export function orderProjects<T extends OrderedProject>(projects: readonly T[]): T[] {
  const buckets = categoryIds.map((category) => projects
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
