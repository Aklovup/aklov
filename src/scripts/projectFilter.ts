import { categoryIds, type ProjectCategory, type ProjectFilter } from '../data/projectCategories.ts';

export function filterFromUrl(url: URL): ProjectFilter {
  const category = url.searchParams.get('category');
  return categoryIds.includes(category as ProjectCategory) ? category as ProjectCategory : 'all';
}

export function urlForFilter(url: URL, filter: ProjectFilter): URL {
  const next = new URL(url);
  if (filter === 'all') next.searchParams.delete('category');
  else next.searchParams.set('category', filter);
  return next;
}

export function matchesFilter(categories: readonly string[], filter: ProjectFilter): boolean {
  return filter === 'all' || categories.includes(filter);
}
