import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { filterFromUrl, matchesFilter, urlForFilter } from '../src/scripts/projectFilter.ts';
import { resolveProjectSlug, urlForProject } from '../src/scripts/projectState.ts';
import { orderProjects } from '../src/lib/projectOrder.ts';
import { categoryIds } from '../src/data/projectCategories.ts';
import { readProjects } from './project-content.mjs';

const projects = orderProjects(readProjects().map(data => ({ data }))).map(({ data }) => data);

const expectedCounts = {
  all: 10, websites: 5, 'customer-systems': 2, automation: 5, applications: 2, integrations: 7,
};

test('all ten projects have unique slugs, category-local ordering and stable media identifiers', () => {
  assert.equal(projects.length, 10);
  assert.equal(new Set(projects.map((p) => p.slug)).size, 10);
  assert.equal(new Set(projects.map((p) => p.cover.id)).size, 10);
  for (const category of categoryIds) {
    const orders = projects.filter(p => p.primaryCategory === category).map(p => p.order);
    assert.deepEqual(orders, Array.from({ length: orders.length }, (_, i) => i + 1));
  }
  assert.ok(projects.every((p) => p.headline && p.body && (!p.cover.url || (p.cover.alt.trim() && p.cover.url.startsWith('/images/')))));
  assert.equal(projects.filter((p) => p.cover.type === 'gif').length, 2);
  assert.equal(projects.filter((p) => p.projectType === 'Independent Concept').length, 2);
  assert.equal(projects.filter((p) => p.projectType === 'Client Project').length, 8);
  assert.ok(projects.every((p) => !p.classificationNote));
  assert.equal(projects.flatMap((p) => p.media).length, 22);
  assert.equal(new Set(projects.flatMap((p) => p.media.map((media) => media.id))).size, 22);
});

test('case-study structure distinguishes client implementations and independent concepts', () => {
  for (const project of projects) {
    assert.ok(project.body.includes('### Overview'));
    if (project.projectType === 'Client Project') {
      for (const heading of ['The challenge', 'What I built', 'The outcome', 'Technologies']) assert.ok(project.body.includes('### ' + heading));
    } else {
      for (const heading of ['The design direction', 'What the concept explores', 'Outcome', 'Important classification']) assert.ok(project.body.includes('### ' + heading));
      assert.equal(project.externalUrl, undefined);
      assert.ok(!project.body.includes('### The challenge'));
    }
  }
  assert.ok(projects.find((p) => p.slug === 'moving-company-crm').description.startsWith('A completed Zoho CRM implementation'));
  assert.ok(projects.find((p) => p.slug === 'wound-concierge').body.includes('defined manual administrative steps where necessary'));
  assert.ok(projects.find((p) => p.slug === 'instantresidency-booking').body.includes('structured outputs for SMS and WhatsApp communication'));
});

test('project deep links resolve canonical and legacy slugs; unknown values do not open a project', () => {
  for (const project of projects) {
    assert.equal(resolveProjectSlug(project.slug, projects), project.slug);
    for (const alias of project.aliases) assert.equal(resolveProjectSlug(alias, projects), project.slug);
  }
  assert.equal(resolveProjectSlug('unknown-project', projects), undefined);
  assert.equal(resolveProjectSlug(null, projects), undefined);
});

test('project URL changes preserve category, unrelated parameters and hash', () => {
  const current = new URL('https://aklov.example/work/?category=applications&source=solutions#projects');
  const next = urlForProject(current, 'impex-automotive');
  assert.equal(next.searchParams.get('category'), 'applications');
  assert.equal(next.searchParams.get('project'), 'impex-automotive');
  assert.equal(next.searchParams.get('source'), 'solutions');
  assert.equal(next.hash, '#projects');
  assert.equal(urlForProject(next).href, current.href);
  assert.equal(current.searchParams.has('project'), false);
});

test('every filter matches both primary and additional categories', () => {
  for (const [filter, count] of Object.entries(expectedCounts)) {
    assert.equal(projects.filter((p) => matchesFilter([p.primaryCategory, ...p.additionalCategories], filter)).length, count, filter);
  }
});

test('direct category URLs initialize correctly, with graceful unknown-category fallback', () => {
  for (const filter of Object.keys(expectedCounts).filter((id) => id !== 'all')) {
    assert.equal(filterFromUrl(new URL('https://aklov.example/work/?category=' + filter)), filter);
  }
  for (const suffix of ['', '?category=', '?category=unknown', '?category=WEBSITES', '?category=%3Cscript%3E']) {
    assert.equal(filterFromUrl(new URL('https://aklov.example/work/' + suffix)), 'all');
  }
});

test('URL changes preserve unrelated query parameters and hash; All Projects removes category', () => {
  const initial = new URL('https://aklov.example/work/?source=solutions&category=unknown#projects');
  const next = urlForFilter(initial, 'websites');
  assert.equal(next.href, 'https://aklov.example/work/?source=solutions&category=websites#projects');
  assert.equal(urlForFilter(next, 'all').href, 'https://aklov.example/work/?source=solutions#projects');
  assert.equal(initial.searchParams.get('category'), 'unknown');
});

// Execute the actual gallery script against a small DOM/history fixture.
// These are logic tests, not a substitute for a rendered browser review.
function galleryFixture(initialUrl) {
  const labels = {
    all: 'All Projects', websites: 'Websites', 'customer-systems': 'Customer & Sales Systems',
    automation: 'Workflow Automation', applications: 'Custom Business Applications', integrations: 'Integrations & Reporting',
  };
  const buttons = Object.entries(labels).map(([filter, label]) => ({
    dataset: { filter, label }, attributes: {}, listeners: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { this.listeners[name] = listener; },
  }));
  const cards = projects.map((p) => ({
    dataset: { project: p.slug, categories: [p.primaryCategory, ...p.additionalCategories].join(' ') }, hidden: false,
  }));
  const result = { textContent: '' };
  const empty = { hidden: true };
  const filters = { hidden: true, querySelectorAll: () => buttons };
  const gallery = {
    querySelector(selector) {
      return { '[data-filters]': filters, '[data-result-count]': result, '[data-empty-state]': empty }[selector];
    },
    querySelectorAll: () => cards,
  };
  const historyEntries = [initialUrl];
  let historyIndex = 0;
  const window = { location: { href: initialUrl }, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } };
  const history = { pushState(_state, _title, url) {
    historyEntries.splice(historyIndex + 1);
    historyEntries.push(String(url));
    historyIndex++;
    window.location.href = String(url);
  } };
  const source = readFileSync(new URL('../src/components/work/ProjectGallery.astro', import.meta.url), 'utf8')
    .split('<script>')[1].split('</script>')[0]
    .replace(/^\s*import .*;$/gm, '');
  vm.runInNewContext(stripTypeScriptTypes(source), {
    document: { querySelector: () => gallery }, window, history, URL, filterFromUrl, matchesFilter, urlForFilter,
  });
  return {
    cards, buttons, filters, result,
    click(filter) { buttons.find((button) => button.dataset.filter === filter).listeners.click(); },
    travel(delta) {
      historyIndex += delta;
      window.location.href = historyEntries[historyIndex];
      window.listeners.popstate();
    },
    get url() { return window.location.href; },
    get historyLength() { return historyEntries.length; },
    get visibleCount() { return cards.filter((card) => !card.hidden).length; },
  };
}

test('gallery initializes selection and enables controls from each direct URL', () => {
  for (const [filter, count] of Object.entries(expectedCounts)) {
    const fixture = galleryFixture('https://aklov.example/work/?category=' + filter);
    assert.equal(fixture.filters.hidden, false);
    assert.equal(fixture.visibleCount, count);
    assert.equal(fixture.buttons.filter((button) => button.attributes['aria-pressed'] === 'true').length, 1);
    assert.equal(fixture.buttons.find((button) => button.dataset.filter === filter).attributes['aria-pressed'], 'true');
    assert.ok(fixture.result.textContent.startsWith(count + ' projects'));
  }
});

test('filter clicks update cards, recompose their layout and do not duplicate history', () => {
  const fixture = galleryFixture('https://aklov.example/work/');
  for (const [filter, count] of Object.entries(expectedCounts)) {
    fixture.click(filter);
    assert.equal(fixture.visibleCount, count);
    assert.deepEqual(fixture.cards.filter((card) => !card.hidden).map((card) => card.dataset.layout),
      Array.from({ length: count }, (_, index) => String(index % 4)));
    const length = fixture.historyLength;
    fixture.click(filter);
    assert.equal(fixture.historyLength, length);
  }
});

test('Back and Forward restore filter, count and pressed state', () => {
  const fixture = galleryFixture('https://aklov.example/work/?source=solutions#projects');
  fixture.click('websites');
  fixture.click('customer-systems');
  fixture.travel(-1);
  assert.equal(fixture.visibleCount, 5);
  assert.equal(fixture.buttons.find((button) => button.dataset.filter === 'websites').attributes['aria-pressed'], 'true');
  fixture.travel(-1);
  assert.equal(fixture.visibleCount, 10);
  fixture.travel(1);
  fixture.travel(1);
  assert.equal(fixture.visibleCount, 2);
  assert.equal(fixture.url, 'https://aklov.example/work/?source=solutions&category=customer-systems#projects');
});

test('unknown category initializes All Projects and can be normalized by its button', () => {
  const fixture = galleryFixture('https://aklov.example/work/?category=unknown&source=solutions');
  assert.equal(fixture.visibleCount, 10);
  fixture.click('all');
  assert.equal(fixture.url, 'https://aklov.example/work/?source=solutions');
});

const entry = (primaryCategory, order, slug = primaryCategory + '-' + order) =>
  ({ data: { primaryCategory, order, slug } });

test('ten projects in every category interleave in ten complete rounds', () => {
  const input = categoryIds.flatMap(category =>
    Array.from({ length: 10 }, (_, i) => entry(category, i + 1))).reverse();
  const result = orderProjects(input);
  assert.equal(result.length, 50);
  assert.equal(new Set(result.map(p => p.data.slug)).size, 50);
  for (let round = 0; round < 10; round++) {
    assert.deepEqual(result.slice(round * 5, round * 5 + 5).map(p => p.data.primaryCategory), categoryIds);
    assert.ok(result.slice(round * 5, round * 5 + 5).every(p => p.data.order === round + 1));
  }
});

test('empty and exhausted categories are skipped without dropping or repeating projects', () => {
  assert.deepEqual(orderProjects([]), []);
  const apps = Array.from({ length: 10 }, (_, i) => entry('applications', i + 1));
  const web = entry('websites', 1), automation = entry('automation', 1);
  const input = [...apps, web, automation];
  const snapshot = structuredClone(input);
  assert.deepEqual(orderProjects(input).map(p => p.data.slug),
    [web.data.slug, automation.data.slug, ...apps.map(p => p.data.slug)]);
  assert.deepEqual(input, snapshot, 'Ordering mutated collection entries or their input array.');
});

test('tied category positions resolve by slug independent of input order or featured/media state', () => {
  const a = entry('applications', 1, 'alpha');
  const z = entry('applications', 1, 'zeta');
  z.data.featured = true;
  z.data.cover = { url: '/images/example.png' };
  const web = entry('websites', 1);
  assert.deepEqual(orderProjects([z, a, web]), [web, a, z]);
  assert.deepEqual(orderProjects([web, a, z]), [web, a, z]);
});

test('new projects enter their category position automatically and secondary categories do not duplicate them', () => {
  const web = entry('websites', 1), app = entry('applications', 1);
  app.data.additionalCategories = ['websites', 'integrations'];
  assert.deepEqual(orderProjects([app, web]), [web, app]);
  const nextWeb = entry('websites', 2), crm = entry('customer-systems', 1);
  assert.deepEqual(orderProjects([app, nextWeb, web, crm]), [web, crm, app, nextWeb]);
});

test('filters preserve the rotated catalog order while including secondary categories', () => {
  const fixture = galleryFixture('https://aklov.example/work/');
  const allSlugs = fixture.cards.map(card => card.dataset.project);
  for (const filter of Object.keys(expectedCounts)) {
    fixture.click(filter);
    const expected = projects.filter(p => matchesFilter([p.primaryCategory, ...p.additionalCategories], filter)).map(p => p.slug);
    assert.deepEqual(fixture.cards.filter(card => !card.hidden).map(card => card.dataset.project), expected);
    assert.deepEqual(fixture.cards.map(card => card.dataset.project), allSlugs);
  }
});
