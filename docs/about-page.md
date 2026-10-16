# About page

The route is `/about/`. The page-rhythm refinements are reviewed on `feat/about-solutions-rhythm`, created from main after PR #9 merged. Do not merge without owner approval.

## Content and composition

All six approved sections, 39 body paragraphs/statements, four process stages, and original CTA wording remain in `src/data/about.ts`. The page reads this data without hydration or additional page-specific JavaScript.

The charcoal introduction retains its editorial headline and rectangular gold portrait card. The opening sentence sits beneath the headline, including on mobile; the portrait follows it before the remaining opening paragraphs on small screens. The subsequent two introductory paragraphs retain their original sequence.

The profile uses an uninterrupted ivory reading surface rather than the numbered, ruled catalogue retained on Solutions. Biography and approach form a central essay with a bounded reading measure and 16px body text. There are no chapter numbers, repeated section rules, or parallel heading-and-description rows.

The four real approach stages keep their numbers, appearing as a readable sequence within the essay without row dividers or decorative panels. The approved italic closing statement expands beyond the essay column and supplies the main expressive pause.

Experience changes to a wider magazine-style prose spread, with two balanced text columns on desktop/tablet and a single reading column below 641px. Paragraphs remain in their original document order and do not split across columns. Every approved experience paragraph remains; there is no replacement project grid or invented summary. Working Together returns to a narrower conversational reading column and smaller heading.

The existing gold closing, primary contact button, secondary Work link, and shared footer remain unchanged. The Solutions service catalogue is unchanged by this About revision.

## Portrait

The supplied transparent portrait is `public/images/portraits/Portrait_about.png`, referenced through `profile.portrait` in `src/data/about.ts`. Its actual dimensions are 438 × 570px.

`src/components/about/AboutPortrait.astro` preserves the reserved 4:5 gold frame, ivory name panel, and attached gold contour. It has descriptive alternative text, an eager image, and a typographic fallback used only if no portrait source is configured. Do not add a fade or alter this approved treatment as part of unrelated updates.

A higher-resolution approved transparent original would improve sharpness when the current source is displayed wider than 438px. Upscaling this file cannot restore detail. When a replacement is supplied, update the source path and actual dimensions, check responsive delivery and crop, and preserve the composition.

## Destinations

All cross-page CTAs use `src/data/links.ts`:

- `links.workClients`: `/work/?type=client` for the experience section's “Explore selected projects →”.
- `links.contact`: the implemented `/contact/` route for the primary closing action.
- `links.work`: `/work/` for the secondary closing action.

Shared header/footer navigation is reused. No duplicate navigation component or Contact page is created. The About page does not change the Contact form or its Web3Forms integration.

## Preview and validation

Preview: The branch preview URL will be confirmed from the actual Cloudflare deployment before delivery; open its `/about/` route.

For a local preview, check out the review branch, install the existing dependencies, run `npm run dev`, and open `/about/`. The build is `npm run build`; there is no separate HTML mockup.

The existing validation workflow checks all 39 approved content blocks, metadata, semantic headings, actual portrait, continuous contour, unchanged source media, CTA destinations, visible keyboard focus, reduced motion, rendered text contrast, no-JavaScript rendering, responsive layout, and the grouped Work destination. Desktop, tablet, and mobile review screenshots are uploaded in `about-page-review`.

The refinements do not change approved copy, portrait assets/components, shared styles/navigation, other page source files, portfolio content, hosting configuration, or dependencies. Existing shared destinations remain unchanged. Browser checks additionally verify one portrait and a unruled story surface, bounded reading measure, responsive prose columns and sequential process placement.

