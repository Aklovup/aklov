# Sitewide refinement pass

The owner approved the combined Home/Solutions/Work/About/Contact audit recommendations. The implementation stays on PR #4 and is not merged into main.

## Presentation and journeys

- Preserve approved page and case-study wording, and the approved Home/About portrait compositions.
- Home service rows are real links to the matching Solutions sections. Cross-page destinations live in `src/data/links.ts`.
- Home and Solutions inquiry buttons lead to the existing Contact page. Direct email and LinkedIn remain available on Contact.
- Solutions retains varied editorial service layouts with quieter numerals, shorter transitions, a tighter process sequence and a distinct closing invitation. Static service lists no longer imply interaction through hover movement.
- Solutions uses the owner's uploaded `Solutions_img.jpg`, with actual dimensions and responsive local previews.
- Portfolio popups put the first supplied preview before long-form copy on mobile; remaining media follows the content. Desktop retains side-by-side reading and media.
- Gallery captions use short factual subject labels. Approved alternative text and case-study bodies remain intact. No full-size gallery links are shown.
- Contact's desktop direct-contact information is closer to its introduction. Its working Web3Forms/captcha logic is unchanged.

## Shared behavior

Focus colour follows the surface: charcoal on ivory/gold, gold on charcoal. Navigation and footer links have comfortable hit areas. Mobile Escape restores focus to Menu; navigation remains visible when JavaScript is unavailable. Existing reduced-motion preferences, category filters, popup history, dismissal and focus containment are retained.

## Media and metadata

Sharp is explicitly declared as the build-time image engine. `scripts/prepare-media.mjs` prepares responsive WebP previews and genuine first-frame GIF posters from supplied originals, never generated client imagery. The build manifest and derived images are ignored in Git; both dev/build scripts generate them automatically. Content hashes refresh derived URLs when source files change.

GIFs remain paused initially. Play loads animation while preserving the visible poster, reports loading/failure accessibly, and prevents duplicate requests. Pause captures the current frame. Original media files remain unchanged.

The shared layout adds canonical/social metadata and a favicon. A branded share image is generated from existing Home copy. The sitemap covers the five implemented page routes, with a robots file referencing it. Cloudflare branch previews receive noindex metadata; production uses the approved pages.dev origin.

## Validation and remaining assets

The workflow builds the site, runs 19 content/form/filter logic checks and rendered media, Home, Solutions, Work, About and Contact checks. It verifies real service destinations, theme-aware keyboard focus, nine-width Solutions layout, all five page layouts, first project evidence, zero initial GIF animation requests, duplicate Play prevention, original file delivery and metadata. Screenshots and media byte counts are saved as review artifacts. Contact API tests use fixtures and send no real inquiries.

Chrome DevTools trace tooling is not connected, so no Lighthouse/Core Web Vitals scores are claimed. Verified derivative sizes and browser request behavior substantiate the image-delivery changes.

The current replacement About portrait is 447 × 558px; a larger original would improve high-density display detail. Portfolio media for Moving Company CRM, GuideYusuf, InstantResidency, VÉRA and Vortex, plus Wound Concierge's customer workflow, remains pending. No client screenshots or results are fabricated.

Preview: `https://feat-static-images.aklov.pages.dev/`. Local preview: `npm install`, then `npm run dev`; optimized media is prepared automatically. Publishing/merging still requires the owner's review.
