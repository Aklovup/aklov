import { categoryIds, categoryLabel, conceptCategoryIds, type ProjectCategory, type ProjectFilter } from '../data/projectCategories.ts';

export const projectGroups = [
  { id: 'all', label: 'All Projects' },
  { id: 'client', label: 'Client Projects' },
  { id: 'concepts', label: 'Independent Concepts' },
] as const;
export type ProjectGroup = (typeof projectGroups)[number]['id'];
export interface ProjectSelection { group: ProjectGroup; category: ProjectFilter; }
export interface FilterableProject {
  projectType: string;
  primaryCategory: ProjectCategory;
  additionalCategories: readonly ProjectCategory[];
}
export interface CategoryOption { id: ProjectFilter; label: string; count: number; }

export function matchesFilter(categories: readonly string[], filter: ProjectFilter): boolean {
  return filter === 'all' || categories.includes(filter);
}

export function matchesSelection(project: FilterableProject, selection: ProjectSelection): boolean {
  const inGroup = selection.group === 'all'
    || (selection.group === 'client' && project.projectType === 'Client Project')
    || (selection.group === 'concepts' && project.projectType === 'Independent Concept');
  return inGroup && (selection.group === 'all'
    || matchesFilter([project.primaryCategory, ...project.additionalCategories], selection.category));
}

/** Category-only links retain their meaning and now select client work. */
export function selectionFromUrl(url: URL): ProjectSelection {
  const value = url.searchParams.get('category');
  const category = categoryIds.includes(value as ProjectCategory) ? value as ProjectCategory : 'all';
  const type = url.searchParams.get('type');
  const group: ProjectGroup = type === 'all' || type === 'client' || type === 'concepts'
    ? type : category !== 'all' ? 'client' : 'all';
  return { group, category: group === 'all' ? 'all' : category };
}

export function categoryFilters(projects: readonly FilterableProject[], group: ProjectGroup): CategoryOption[] {
  if (group === 'all') return [];
  const members = projects.filter(project => matchesSelection(project, { group, category: 'all' }));
  const all: CategoryOption = { id: 'all', label: 'All', count: members.length };
  // One primary capability does not need a redundant category selector.
  if (new Set(members.map(project => project.primaryCategory)).size < 2) return [all];
  const priority = group === 'concepts' ? conceptCategoryIds : categoryIds;
  return [all, ...priority.map(id => ({
    id, label: categoryLabel(id),
    count: members.filter(project => matchesFilter([project.primaryCategory, ...project.additionalCategories], id)).length,
  })).filter(option => option.count > 0)];
}

export function normalizeSelection(projects: readonly FilterableProject[], selection: ProjectSelection): ProjectSelection {
  const available = categoryFilters(projects, selection.group);
  return { group: selection.group, category: available.some(option => option.id === selection.category) ? selection.category : 'all' };
}

export function urlForSelection(url: URL, selection: ProjectSelection): URL {
  const next = new URL(url);
  if (selection.group === 'all') next.searchParams.delete('type');
  else next.searchParams.set('type', selection.group);
  if (selection.group === 'all' || selection.category === 'all') next.searchParams.delete('category');
  else next.searchParams.set('category', selection.category);
  return next;
}
