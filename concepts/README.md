# Standalone Aklov design concepts

These are the supplied completed HTML designs, not Astro pages. Each `public/` directory is an independently deployable Cloudflare Pages static site. No framework, database, payment service or build command is required.

| Concept | Pages project | Public URL | Deployment folder |
| --- | --- | --- | --- |
| VÉRA Skincare | aklov-vera-skincare | https://aklov-vera-skincare.pages.dev/ | concepts/vera-skincare/public |
| Vortex Gym | aklov-vortex-gym | https://aklov-vortex-gym.pages.dev/ | concepts/vortex-gym/public |

The original embedded CSS and marketing/design copy are preserved. `demo.css` adds only deployment accessibility, the explicit concept disclosure and a small explanatory dialog. `demo.js` connects unavailable actions to that explanation; it never simulates purchases, subscriptions, bookings or memberships. No customer information is stored or sent. Existing section links are real anchors. The original embedded SVG logos remain in place.

The photos and fonts are the exact external Unsplash and Google Fonts resources already present in the supplied files. No local asset files were attached. `audit.json` records the source hashes and dependency inventory. Tests verify the actual resources rather than replacing them with unrelated photography. These external services remain dependencies; no licenses or availability guarantees beyond the supplied material are inferred.

Both demos carry noindex metadata and headers so the illustrative testimonials, prices and claims are clearly portfolio material rather than live business services. No analytics or third-party application scripts are added.

Hosting: same existing Cloudflare account and authorized GitHub repository, two separate Pages projects. During preparation the deployment branch is `feat/portfolio-concept-demos`; after publication it is `main`. Build command empty, root directory `concepts/<name>`, output directory `public`. Changes to the concept folders trigger their own deployments. Aklov continues to use its existing Astro build and hosting.

To preview one concept locally, serve its `public/` directory with any static server. The root paths `/demo.css` and `/demo.js` are relative to that standalone site's root, not the main Aklov site.

Browser audit: `node tests/concepts.browser.mjs` tests the local standalone copies and original remote assets at 1440, 768, 390 and 320 pixels. `CONCEPT_LIVE=1 node tests/concepts.browser.mjs` targets the actual Pages URLs. Artifacts include screenshots and an HTTP/image/font/interaction report. The main Aklov validation workflow separately checks the Astro build, portfolio interactions and Contact fixtures without sending real inquiries.
