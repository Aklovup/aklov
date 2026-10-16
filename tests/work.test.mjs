import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesFilter, matchesSelection, selectionFromUrl, urlForSelection, categoryFilters, normalizeSelection } from '../src/scripts/projectFilter.ts';
import { resolveProjectSlug, urlForProject } from '../src/scripts/projectState.ts';
import { orderProjects } from '../src/lib/projectOrder.ts';
import { categoryIds } from '../src/data/projectCategories.ts';
import { readProjects } from './project-content.mjs';

const projects = orderProjects(readProjects().map(data => ({ data }))).map(({ data }) => data);

const expectedCounts = {
  all: 8, websites: 3, 'customer-systems': 2, automation: 5, applications: 2, integrations: 7,
};

test('all ten projects have unique slugs, category-local ordering and stable media identifiers', () => {
  assert.equal(projects.length, 10);
  assert.equal(new Set(projects.map((p) => p.slug)).size, 10);
  assert.equal(new Set(projects.map((p) => p.cover.id)).size, 10);
  for (const type of ['Client Project', 'Independent Concept']) {
    for (const category of categoryIds) {
      const orders = projects.filter(p => p.projectType === type && p.primaryCategory === category).map(p => p.order);
      assert.deepEqual(orders, Array.from({ length: orders.length }, (_, i) => i + 1));
    }
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


test('group membership separates eight client projects and two concepts without duplicates', () => {
  for (const [group, count] of [['all', 10], ['client', 8], ['concepts', 2]]) {
    assert.equal(projects.filter(p => matchesSelection(p, { group, category: 'all' })).length, count);
  }
  for (const [category, count] of Object.entries(expectedCounts)) {
    assert.equal(projects.filter(p => matchesSelection(p, { group: 'client', category })).length, count);
  }
  assert.deepEqual(projects.map(p => p.slug), [
    'impex-automotive', 'divine-health-black-onyx', 'moving-company-crm', 'guideyusuf-ai-support',
    'xans-operations-portal', 'jaycor-commerce', 'instantresidency-booking', 'wound-concierge',
    'vera-skincare-concept', 'vortex-gym-concept',
  ]);
});

test('group URLs, legacy category links, and unknown parameters initialize predictably', () => {
  const parse = suffix => selectionFromUrl(new URL('https://aklov.example/work/' + suffix));
  assert.deepEqual(parse(''), { group: 'all', category: 'all' });
  for (const category of categoryIds) {
    assert.deepEqual(parse('?category=' + category), { group: 'client', category });
    assert.deepEqual(parse('?type=client&category=' + category), { group: 'client', category });
    assert.deepEqual(parse('?type=concepts&category=' + category), { group: 'concepts', category });
  }
  assert.deepEqual(parse('?type=concepts'), { group: 'concepts', category: 'all' });
  assert.deepEqual(parse('?type=client&category=unknown'), { group: 'client', category: 'all' });
  assert.deepEqual(parse('?type=all&category=websites'), { group: 'all', category: 'all' });
  for (const suffix of ['?category=unknown', '?type=unknown', '?category=WEBSITES', '?type=%3Cscript%3E']) {
    assert.deepEqual(parse(suffix), { group: 'all', category: 'all' });
  }
});

test('group/category URL transitions preserve project, source and hash without mutating input', () => {
  const initial = new URL('https://aklov.example/work/?source=home&project=impex-automotive#projects');
  const client = urlForSelection(initial, { group: 'client', category: 'applications' });
  assert.equal(client.searchParams.get('type'), 'client');
  assert.equal(client.searchParams.get('category'), 'applications');
  const concepts = urlForSelection(client, { group: 'concepts', category: 'all' });
  assert.equal(concepts.searchParams.get('type'), 'concepts');
  assert.equal(concepts.searchParams.has('category'), false);
  const all = urlForSelection(concepts, { group: 'all', category: 'all' });
  assert.equal(all.href, initial.href);
  assert.equal(initial.searchParams.has('type'), false);
  assert.equal(concepts.searchParams.get('project'), 'impex-automotive');
  assert.equal(concepts.hash, '#projects');
});

test('category controls hide empty options and show only All for zero or one primary category', () => {
  assert.deepEqual(categoryFilters(projects, 'all'), []);
  assert.deepEqual(categoryFilters([], 'concepts'), [{ id: 'all', label: 'All', count: 0 }]);
  assert.deepEqual(categoryFilters(projects, 'concepts'), [{ id: 'all', label: 'All', count: 2 }]);
  const taggedConcept = { projectType: 'Independent Concept', primaryCategory: 'websites', additionalCategories: ['automation'] };
  assert.deepEqual(categoryFilters([taggedConcept], 'concepts'), [{ id: 'all', label: 'All', count: 1 }]);
  const next = { projectType: 'Independent Concept', primaryCategory: 'applications', additionalCategories: ['integrations'] };
  const options = categoryFilters([taggedConcept, next], 'concepts');
  assert.deepEqual(options.map(o => o.id), ['all', 'websites', 'applications', 'automation', 'integrations']);
  assert.deepEqual(options.map(o => o.count), [2, 1, 1, 1, 1]);
  assert.equal(options.some(o => o.id === 'customer-systems'), false);
});

test('client category counts include additional tags and follow the client priority', () => {
  const options = categoryFilters(projects, 'client');
  assert.deepEqual(options.map(o => o.id), ['all', ...categoryIds]);
  for (const option of options) assert.equal(option.count, expectedCounts[option.id]);
});

test('unavailable group categories fall back to that group All', () => {
  assert.deepEqual(normalizeSelection(projects, { group: 'concepts', category: 'websites' }), { group: 'concepts', category: 'all' });
  const empty = [{ projectType: 'Client Project', primaryCategory: 'applications', additionalCategories: [] }];
  assert.deepEqual(normalizeSelection(empty, { group: 'client', category: 'automation' }), { group: 'client', category: 'all' });
  assert.deepEqual(normalizeSelection(projects, { group: 'all', category: 'websites' }), { group: 'all', category: 'all' });
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
    [apps[0].data.slug, web.data.slug, automation.data.slug, ...apps.slice(1).map(p => p.data.slug)]);
  assert.deepEqual(input, snapshot, 'Ordering mutated collection entries or their input array.');
});

test('tied category positions resolve by slug independent of input order or featured/media state', () => {
  const a = entry('applications', 1, 'alpha');
  const z = entry('applications', 1, 'zeta');
  z.data.featured = true;
  z.data.cover = { url: '/images/example.png' };
  const web = entry('websites', 1);
  assert.deepEqual(orderProjects([z, a, web]), [a, web, z]);
  assert.deepEqual(orderProjects([a, web, z]), [a, web, z]);
});

test('new projects enter their category position automatically and secondary categories do not duplicate them', () => {
  const web = entry('websites', 1), app = entry('applications', 1);
  app.data.additionalCategories = ['websites', 'integrations'];
  assert.deepEqual(orderProjects([app, web]), [app, web]);
  const nextWeb = entry('websites', 2), crm = entry('customer-systems', 1);
  assert.deepEqual(orderProjects([app, nextWeb, web, crm]), [app, web, crm, nextWeb]);
});


test('client rotations stay ahead of concepts; concept capability order starts with Websites', () => {
  const typed = (category, type, order = 1) => {
    const item = entry(category, order, type + '-' + category + '-' + order);
    item.data.projectType = type;
    return item;
  };
  const input = [
    typed('applications', 'Independent Concept'), typed('automation', 'Independent Concept'),
    typed('websites', 'Independent Concept'), typed('integrations', 'Client Project'),
    typed('applications', 'Client Project'), typed('websites', 'Client Project'),
    typed('websites', 'Independent Concept', 2),
  ];
  const result = orderProjects(input);
  assert.deepEqual(result.map(p => [p.data.projectType, p.data.primaryCategory]), [
    ['Client Project', 'applications'], ['Client Project', 'websites'], ['Client Project', 'integrations'],
    ['Independent Concept', 'websites'], ['Independent Concept', 'applications'],
    ['Independent Concept', 'automation'], ['Independent Concept', 'websites'],
  ]);
  assert.equal(result.length, input.length);
  assert.equal(new Set(result.map(p => p.data.slug)).size, input.length);
});

test('filtering either group retains the catalog order and includes secondary category matches', () => {
  for (const group of ['client', 'concepts']) {
    for (const option of categoryFilters(projects, group)) {
      const visible = projects.filter(p => matchesSelection(p, { group, category: option.id }));
      assert.equal(visible.length, option.count);
      assert.deepEqual(visible.map(p => projects.indexOf(p)), visible.map(p => projects.indexOf(p)).sort((a,b) => a-b));
      assert.ok(visible.every(p => p.projectType === (group === 'client' ? 'Client Project' : 'Independent Concept')));
    }
  }
});
