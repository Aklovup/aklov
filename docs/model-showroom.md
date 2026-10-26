# Architectural Work exhibition

Review branch: `experiment/model-showroom`, draft PR #12. Main and the previous kinetic experiment remain unchanged.

## Spatial navigation

The table exposes populated primary-category models, with client work and concepts separate. Select a model to open its roof, then a room to enter its exhibition. Every project has one physical home. The original index retains complete primary/additional-category filtering.

Pointer movement gives bounded camera parallax without a held button. Horizontal trackpad gestures orbit the table. Vertical gestures over architecture advance or retreat along a guided route, with proportional preview before committing a location. Reversing a partial gesture reverses travel. A gesture must end before momentum can commit another level. Browser pinch zoom remains native.

Project-room camera routes pass through a side doorway. The physical doorway and its projected Leave room control return to the category; Leave building returns to the table. Breadcrumbs, Escape, index links and browser history offer parallel routes. Reading/media surfaces consume their own scroll rather than triggering travel.

## Integrated projects

`ProjectExhibit.astro` renders all existing approved Markdown and media into hidden semantic content containers. `projectExhibit.ts` divides that rendered content at existing headings, preserving every paragraph. The selected room presents an ivory/gold-on-charcoal glass-like media installation and readable HTML story wall. Chapters, media, captions, external URLs and explicit pending slots come from collection entries. GIFs reuse the existing intentional play/pause controller; images scroll within the installation at their natural ratio. Expand display enlarges that installation within the same room; Escape restores the story before leaving the room. No project or image dialogs are mounted on this Work route. The original shared dialog components remain unchanged for other uses.

The index is a full-page alternate view, not a modal. The background stage is inert while it is shown. Category/project URLs remain compatible; `model` and `room` encode spatial locations. Unknown locations fall back gracefully.

## Arrival, life and performance

The static SVG is reserved for unavailable/lost WebGL. JavaScript-capable visitors first see a charcoal branded preparation state. It reveals the actual first rendered frame after font readiness (bounded wait), then starts the entrance camera. No artificial percentage or forced Enter click. A delayed rescue link opens the usable index if scene startup fails.

Subtle camera drift, architectural light breathing and sparse exhibition dust keep the idle scene alive. Pointer parallax is bounded. Rendering is capped at 30fps, suspends in hidden tabs/index, and settles while the user reads. Pause and reduced motion stop ambient movement and use immediate travel. Covers are cached and loaded when inspected; detailed media only enter live DOM for the selected project.

No new dependencies, paid services, remote imagery or invented client content. Models are procedural exhibition artwork, not client buildings.

## Validation

The dedicated review builds Astro and runs content/contact unit checks plus grouping, URL and trackpad-state tests. Browser coverage checks direct model/room picking, unclicked pointer response, horizontal/vertical wheel behavior, proportional reverse travel, doorway exits, all ten case studies, chapters/media, GIF controls, no modals, filter preservation, history, deep links, reduced motion, touch, fallback and 320–1440px overflow. Screenshot capture uses isolated GPU sessions; the animated check uses a smaller drawing buffer for the software renderer.

Existing Home, Solutions, About, Contact and sitewide browser checks remain enabled. Legacy direct-gallery browser checks are replaced only on this experiment branch by the showroom/index/exhibition tests.

Do not merge without the owner's review and approval.
