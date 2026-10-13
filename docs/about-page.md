# About page

The review route is `/about/`, on `feat/about-page`. The feature branch starts from the merged Work implementation on the latest main branch. Do not merge without owner approval.

## Design and content

The page retains Aklov's Instrument Serif / DM Sans typography and charcoal, ivory and muted gold palette. A dark editorial introduction pairs the headline with a rectangular profile composition. The biography uses reading columns; the approach uses a ruled sequence instead of feature cards; experience and collaboration sections use different compositions; the closing invitation uses the established gold surface.

All six approved sections, 39 body paragraphs/statements, four process stages and supplied CTA labels are retained in `src/data/about.ts`. The static page reads that content without hydration or additional page JavaScript.

## Portrait

The photograph has not been supplied. The current fallback is a typographic monogram and name, rather than an invented likeness or unrelated photograph.

Set `profile.portrait.src` in `src/data/about.ts` when the approved image arrives. For optimized local imagery, import an image from `src/assets/` and use the imported value. The component also accepts an approved remote URL; any remote optimization configuration should be assessed once its host is known.

Update the actual width, height and alternative text as necessary. The portrait component uses Astro Image, responsive widths, explicit dimensions and a reserved 4:5 frame. Check the crop at desktop and mobile widths when the photograph is supplied.

## Navigation and contact

The existing Header and Footer add About. Their shared styling and behavior are unchanged.

The repository does not currently contain a Contact page. The primary invitation uses the existing `mailto:aklovup@gmail.com` destination. Both Work CTAs point to `/work/`. Header and footer contact navigation retain their existing homepage contact destination.

## Review and validation

The GitHub validation run uploads desktop, mobile and tablet screenshots in the `about-page-review` artifact. There is no separate HTML preview.

For an optional interactive local preview, check out `feat/about-page`, run `npm install` and `npm run dev`, then open `/about/`.

The existing workflow builds the site, runs the Work logic/browser regressions and validates the About page's complete copy, metadata, headings, portrait fallback, links, keyboard focus, reduced motion, rendered text contrast and nine viewport widths. Existing Home, Solutions, Work and case-study source files remain unchanged.

The final photograph and its crop/optimization review are the only pending asset work. Opening a mail application is represented by a validated mailto destination; actual email sending is not part of the page or its tests.
