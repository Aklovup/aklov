# Solutions service catalogue

Review branch: `feat/about-solutions-rhythm`, created from main after PR #9 merged. Do not merge without owner approval.

## Composition

The existing dark hero, headline indentation, Vortex tablet and five-service anchor index remain. The problem introduction and local workspace photograph now lead into a continuous ivory service catalogue, rather than a sequence of alternating full-width colour bands. The photograph keeps its approved 4:5 desktop, 4:3 tablet and square mobile crop, optimized source and inset border.

Each service uses a stable two-column reference row: title and approved description on the left; inclusions, goal and actions on the right. Rows share alignment, fine dividing rules and compact service numbers. Below 641px, each row stacks in reading order with comfortable controls. There are no hidden accordion panels and no added page JavaScript.

All five service names, descriptions, 30 inclusion items, goals, CTA labels, anchor IDs and shared destinations remain unchanged. No new problem lists, tool claims or case-study summaries are invented. The old per-service colour/variant settings and duplicated layout rules are removed.

The four-stage process becomes a level horizontal sequence on desktop, two columns on tablet, and a numbered vertical sequence on mobile. It shares one grey surface with the existing reassurance content. The gold closing invitation and shared footer remain the site's familiar final landmarks. The homepage's approved stepped approach is unchanged.

## Validation and preview

The existing browser suite checks ten widths including the 640/641 breakpoint, complete service headings, column alignment and stacking, horizontal process alignment, anchor navigation, focus, image loading and crops, tablet transforms, no-JavaScript navigation and overflow. Review captures are uploaded in the `solutions-page-review` Actions artifact. Use the confirmed Cloudflare branch deployment's `/solutions/` route; no separate HTML mockup is produced.

The changes are scoped to About/Solutions page composition, their existing browser tests and documentation. They do not change Home, Work, Contact, shared navigation/footer, project content, media assets, dependencies or hosting configuration.

## Tablet hero refinement

The Solutions hero now groups the headline, approved introduction and actions in one left column, with a vertically centered CSS tablet on the right. The full black device remains visible; a static perspective and restrained casing/shadow provide depth without WebGL, animation or generated imagery. Tablet/mobile layouts place the device after the text/actions with no rotation or perspective, before the service index. No visible project caption is added, per the owner's direction.

`src/data/solutionsHero.ts` selects the temporary Vortex Gym project and a 3:2 screen crop. `SolutionsTablet.astro` resolves the real cover from the existing project entry and uses existing responsive media previews. CSS crops its full-page image to the opening hero. To replace it with approved workflow imagery, update the configured project slug and crop ratio after that project's cover has been uploaded and connected; no generated screen image is stored. Work-page project classification and content remain untouched.

The Solutions browser audit additionally verifies the actual image loads, the screen crops, the transformed device stays fully within each viewport, actions stay with their text, the desktop stage is centered and mobile order is preserved at all nine widths. The tablet is a static image presentation, not an interactive embedded website.


The gold “connect and grow” line retains a responsive editorial inset. The tablet keeps its desktop angle above 1000px and is completely straight at 1000px and below, with centered casing depth. Browser checks verify those transforms and the indented headline's text-column bounds.

