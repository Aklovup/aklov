# About page

The route is `/about/`. The page-rhythm refinements are reviewed on `feat/about-solutions-rhythm`, created from main after PR #9 merged. Do not merge without owner approval.

## Content and composition

All six approved sections, 39 body paragraphs/statements, four process stages, and original CTA wording remain in `src/data/about.ts`. The page reads this data without hydration or additional page-specific JavaScript.

The charcoal introduction retains its editorial headline and rectangular gold portrait card. The opening sentence sits beneath the headline, including on mobile; the portrait follows it before the remaining opening paragraphs on small screens. The subsequent two introductory paragraphs retain their original sequence.

A continuous ivory `profile-story` surface contains the introduction, biography, approach, experience and Working Together. Thin chapter rules replace alternating dark/grey bands. Chapter headings use a quieter scale than the hero and final invitation. The portrait appears once in the opening; it does not remain pinned beside the full story. The introduction/biography transition uses one clear dividing rule without accumulated outer and inner section padding. Biography retains its readable column. Approach pairs the explanatory narrative with the four ruled stages above 1000px and stacks them at 1000px and below. The complete narrative remains before the sequence in document order. The approved approach closing becomes the single larger italic statement, with a restrained dark-gold treatment and no separate coloured band. Experience retains every approved paragraph rather than replacing the personal narrative with another project grid. Working Together uses a quieter heading beside one continuous reading column, stacking on mobile. The gold closing matches the Home/Solutions headline range, with one primary contact button and a quieter text link to Work.

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

The refinements do not change approved copy, portrait assets/components, shared styles/navigation, other page source files, portfolio content, hosting configuration, or dependencies. Existing shared destinations remain unchanged. Browser checks additionally verify one portrait and a continuous ruled chapter surface.

