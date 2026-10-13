import { readFileSync, readdirSync } from 'node:fs';

export function readProjects() {
  return readdirSync(new URL('../src/content/projects/', import.meta.url))
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(new URL('../src/content/projects/' + file, import.meta.url), 'utf8');
      const [, frontmatter, body] = raw.split(/^---\s*$/m);
      return { ...JSON.parse(frontmatter), body: body.trim() };
    })
    .sort((a, b) => a.order - b.order);
}
