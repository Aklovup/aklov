# Editorial homepage

This branch implements the approved typography-led homepage direction. The existing site tokens, fonts, shared header and footer remain the foundation. No dependencies are added.

- The hero retains the approved headline and introduction, replaces the portrait/ring/workflow with static gold joinery linework, and links to selected work.
- Selected work presents Impex Automotive, Divine Health & Wellness / Black Onyx, and VÉRA Skincare. All descriptions and classifications come directly from the existing project collection. VÉRA remains an Independent Concept.
- `SelectedWork.astro` reuses `ProjectMedia.astro`, including generated responsive previews and explicit GIF playback. Original project media are not changed. Case-study links go to the existing Work page and open its existing dialog, including without homepage JavaScript.
- Cross-page destinations live in `src/data/links.ts`. The selected-work anchor is local to Home.
- Capabilities retain all five approved service entries and their destinations, with tighter introduction/row proportions. Approach retains all three approved stages and restores the original stepped “777” composition: oversized outlined numerals, 70px/140px desktop offsets, fine top/vertical rules and subtle background grid. At tablet/mobile widths it returns to the original stacked sequence. The closing invitation retains its wording and gold background at a more restrained scale.
- About retains the portrait introduction. Solutions, Work, About, Contact, shared components, project content, assets, SEO, and form integrations are unchanged.

## Review

Run `npm run build`, then `npm run preview` and open `/`. Run `node tests/home.browser.mjs` with the existing Playwright test tooling installed. The Website validation workflow also runs the existing media, Work, Solutions, About, sitewide and Contact regression suites. The former Home portrait assertions in the media suite are replaced by the new homepage checks; About portrait assertions remain.

Desktop, tablet and mobile screenshots are saved under `artifacts/home-review/` and uploaded as `homepage-review`. This branch requires review before merge; production is unchanged.
