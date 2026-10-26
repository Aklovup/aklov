# Wall-mounted Work exhibition

Review branch `experiment/model-showroom`, draft PR #12. Production and the earlier kinetic experiment remain unchanged.

## Actual room surfaces

Media and story are CSS3D objects fixed to perpendicular walls. Three's existing CSS3DRenderer addon positions semantic HTML in the camera's world coordinates; no new dependency is added. Depth-tested WebGL alpha apertures expose those HTML surfaces through the real wall frames, so geometry can occlude them. The original media installation remains on the wall throughout entry. Other models/rooms are hidden when the camera is inside the selected room, preventing neighbouring project screens from filling its background.

Desktop has world-mounted surfaces and camera stations for approaching the media or story wall. Horizontal trackpad gestures turn the room view; forward movement stays within the floor bounds. Keyboard focus can approach the relevant display. Narrow viewports use a readable stacked alternative while preserving project navigation and media controls. WebGL loss or unavailability also retains an accessible HTML reading view.

## Media layout and memory

One main item occupies 75% of the media screen; the remaining items occupy its vertical 25% rail. A single item uses the full width. Available sources determine the rail; missing sources retain explicit placeholders. Thumbnail previews use static posters, including for GIFs.

The complete frame/rail composition exists in the miniature preview. From outside, one large image dominates and the recessed small previews are difficult to distinguish; approaching reveals the same installation at a readable scale rather than spawning unrelated UI.

`mediaSelection.ts` keeps a per-project in-memory main ID and ordered rail IDs. Clicking a thumbnail swaps it with the primary item at that exact slot. Leaving/re-entering restores the selection and rail arrangement, and the miniature preview texture updates to match. A full document reload resets this memory. No content files or persistent browser storage are rewritten.

GIFs reuse the intentional play/pause controller. Image inspection stays on the wall: approach the display and scroll the full image inside it, then Return to walk or Escape. No project/image dialogs are mounted.

## Story wall

Approved Markdown is rendered by Astro and paged at its existing headings and paragraph boundaries. The project headline and introduction remain in Overview. Larger pages replace the old tiny text scroller; every paragraph, chapter, technology list and approved external link is retained. Chapter/page controls are part of the physical screen bezel.

## Travel and exits

The entrance camera retains its smooth architectural route. The doorway is now behind the visitor's initial viewing position. Backward movement follows a finite floor route to that threshold; crossing it returns outside. Remaining gesture distance can continue toward the showroom. Outside travel follows arc length of the camera route, commits at its measured endpoint and reverses continuously. There is no timed gesture lock or arbitrary completion threshold. A compact in-world door plaque and category plinth provide clickable alternatives; breadcrumbs, Escape, history and the complete filtered index remain available.

## Arrival and validation

The branded preparation state reveals the first real frame after bounded font readiness. Static artwork is reserved for fallback. Ambient motion respects Pause/reduced motion and sleeps while hidden, in the index or reading.

The dedicated build/unit/browser review checks physical wall matrices and perpendicular placement, 75/25 layout, exact thumbnail swaps, per-project memory/reload reset, matching miniature previews, GIFs, paged text, perspective, room isolation, uninterrupted finite retreat, history, all ten projects and filters, image inspection, animated entrance, five widths and renderer/JavaScript fallbacks. Home, Solutions, About, Contact and sitewide regressions remain enabled. Headless review installs only Chromium's required headless shell to avoid downloading the unused full browser.

No approved project content, source media, shared navigation, hosting configuration or other page source is modified. Do not merge without owner approval.
