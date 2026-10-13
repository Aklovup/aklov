interface ProjectReference { slug: string; aliases: readonly string[]; }

export function resolveProjectSlug(value: string | null, projects: readonly ProjectReference[]): string | undefined {
  return projects.find((project) => project.slug === value || (value !== null && project.aliases.includes(value)))?.slug;
}

export function urlForProject(url: URL, slug?: string): URL {
  const next = new URL(url);
  if (slug) next.searchParams.set('project', slug);
  else next.searchParams.delete('project');
  return next;
}
