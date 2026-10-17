# About page

The route is `/about/`. The page-rhythm refinements are reviewed on `feat/about-solutions-rhythm`, created from main after PR #9 merged. Do not merge without owner approval.

## Content and composition

All six approved sections, 39 body paragraphs/statements, four process stages, and original CTA wording remain in `src/data/about.ts`. The page reads this data without hydration or additional page-specific JavaScript.

The charcoal introduction retains its editorial headline and rectangular gold portrait card. The opening sentence sits beneath the headline, including on mobile; the portrait follows it before the remaining opening paragraphs on small screens. The subsequent two introductory paragraphs retain their original sequence.

The body follows the owner's supplied editorial reference: headings align to a consistent left margin, with the longer approved story on the wider right side. Biography, experience and Working Together use this split above 640px and intentionally stack below it. The body is no longer a series of narrow centred essay columns.

The approach narrative sits beneath its heading on the left, paired with four numbered, ruled stages on the right above 1000px. At 1000px and below, the sequence follows the complete narrative. All 39 approved content blocks remain in their original document order. The reference's alternate headings and shorter marketing copy are not substituted for the approved text.

Selective gold italic emphasis uses existing heading words. A centred pull statement is the only intentionally centred body element; its approved text is preserved, with charcoal italic type and restrained gold emphasis. The experience text remains readable prose rather than a service list or project grid. Rules are limited to the approach boundary, actual process stages and Working Together boundary.

The gold invitation is compact, with its headline on the left and approved text and actions on the right. It stacks on mobile. The existing portrait, shared footer, metadata, link destinations and Solutions service catalogue remain unchanged.

Large italic heading accents, process numbers and highlighted quote phrases use a page-local richer gold, `#a5852e`, with 3.13:1 contrast on ivory. This colour is restricted to large text; body copy and small-link feedback retain their darker tones. The portrait background and closing band keep the established `--gold`. The browser contrast check includes the actual nested gold text, not only its parent heading.

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

The refinements do not change approved copy, portrait assets/components, shared styles/navigation, other page source files, portfolio content, hosting configuration, or dependencies. Existing shared destinations remain unchanged. Browser checks additionally verify one portrait, split heading/story alignment, desktop narrative/stage pairing, responsive stacking and selective stage rules.

