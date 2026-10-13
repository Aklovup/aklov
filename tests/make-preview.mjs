import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

// Package the actual Astro build as a Work-only HTML review artifact.
// Runtime dependencies and production files are not changed.
let html = await readFile('dist/work/index.html', 'utf8');
for (const match of [...html.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)]) {
  if (!match[1].startsWith('/_astro/') || !match[1].endsWith('.css')) continue;
  const css = await readFile(resolve('dist', '.' + match[1]), 'utf8');
  html = html.replace(match[0], '<style>' + css + '</style>');
}
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  if (!match[1].startsWith('/_astro/')) continue;
  const bundled = await build({
    entryPoints: [resolve('dist', '.' + match[1])],
    bundle: true, write: false, minify: true, format: 'iife', platform: 'browser',
  });
  const script = bundled.outputFiles[0].text.replaceAll('</script', '<\\/script');
  html = html.replace(match[0], '<script>' + script + '</script>');
}
await mkdir('artifacts/work-review', { recursive: true });
await writeFile('artifacts/work-review/aklov-work-preview.html', html);
console.log('Created portable HTML preview from the actual Astro build.');
