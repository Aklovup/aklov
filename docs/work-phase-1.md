# Work page — Phase 1

The review route is `/work/`. The existing Home and Solutions page markup and styles are unchanged. Shared navigation adds Work, and `src/data/links.ts` points the five Solutions project links to Work category parameters.

## Local preview

Use a Node version supported by the repository's Astro 6 dependency (Node 22.12+).

1. Check out `feat/work-phase-1`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the displayed local URL at `/work/`.

Build with `npm run build` and inspect the static build with `npm run preview`.

The dependency-free logic tests use Node 24:

```sh
node --test --test-isolation=none tests/work.test.mjs
```

These cover category counts, direct URL initialization, secondary-category membership, URL preservation, filter state, layout reassignment and Back/Forward logic. They do not replace rendered browser testing.

## Content and media

Each project has a JSON file in `src/content/projects/`, validated by `src/content.config.ts`. Categories and their display labels live in `src/data/projectCategories.ts`.

To replace a media placeholder, supply its approved `cover.url` and descriptive `cover.alt` in the project's JSON file. Keep the stable `cover.id`. The reusable media component handles `image`, `gif` and `video`; videos use native controls and do not autoplay. Optional `poster` and `caption` fields are supported. Media is framed at 8:5 without cropping; supplied dimensions describe the actual asset.

No media URLs are populated in Phase 1. Cards do not open project details. The two approved external website links are separate, labeled links.

GuideYusuf AI Support Agent and InstantResidency Booking Agent retain their provisional client classification and require confirmation before final publication.

## Review checklist

- All Projects: 10; Websites: 5; Customer & Sales Systems: 2; Workflow Automation: 5; Custom Business Applications: 2; Integrations & Reporting: 6.
- Test all five `?category=` values, an unknown value, reload, and Back/Forward.
- Check keyboard focus, pressed filter state, mobile navigation and reduced motion.
- Review at narrow mobile, tablet, desktop and wide-screen widths.
- Confirm ten labeled placeholders and no broken images.
- With JavaScript disabled, all projects remain readable and filters are hidden.

Full case studies, project popups and standalone project routes are not implemented. Phase 2 requires explicit approval.
