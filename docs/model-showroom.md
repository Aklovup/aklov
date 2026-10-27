# Spatial Work exhibition

Implementation developed on `experiment/model-showroom` in PR #12. Merge/deployment follow explicit owner approval; unrelated page sources remain unchanged.

## Room navigation

The semantic media/story displays remain on perpendicular walls, exposed through depth-tested WebGL apertures and positioned with Three's existing CSS3DRenderer addon. No dependency is added.

Trackpad vertical gestures walk relative to the viewing direction; horizontal gestures turn through the full room. Backing away from the side wall moves away from that wall, rather than pulling toward the doorway. Shift + horizontal wheel strafes. Arrow keys turn/walk; W/S walk and A/D strafe. The floor bounds stop travel through walls. Crossing the physical rear opening exits in either direction. Breadcrumbs, Escape, history and the index remain alternatives.

Camera flights and image lifts use elapsed wall-clock time, while camera damping uses a bounded timestep so a slow renderer cannot stretch the nominal animation duration indefinitely. Camera targets ease continuously; ordinary input does not snap the camera to its target. The renderer can draw at 60 fps rather than the old 30 fps cap; actual frame rate depends on hardware and scene cost. Desktop requests the performance GPU where available. The hidden outer reflection floor is skipped inside rooms, and superseded miniature textures are disposed after swaps. Ambient movement sleeps while reading, with Pause, when hidden or in the index. Reduced motion makes user transitions immediate.

Wheel navigation is handled over thumbnails and buttons as well as the room. A pointer press remains a click until it crosses a movement threshold, after which it becomes camera navigation and suppresses the resulting accidental click. Pointer capture is released on completion/cancellation and input-device changes. Browser pinch/zoom wheel gestures and editable fields are excluded. The readable narrow-screen alternative keeps native scrolling.

The story wall is an editorial cover. Clicking or keyboard-activating it lifts the complete case study into a camera-facing reading surface. No Approach/Inspect/Read controls are added; free room movement remains available. Both HTML surfaces and miniature canvas signs use the existing Instrument Serif/DM Sans design tokens; no global typography is changed.

## Media screen

One main item occupies 75% of the screen; remaining items use equal, explicitly bounded rows in its 25% rail. A single item fills the width. Thumbnail image dimensions, zero intrinsic flex height and constrained grid tracks prevent tall website screenshots from pushing the other thumbnails out of view.

Selecting a thumbnail swaps it with the main item in exactly that rail slot. `mediaSelection.ts` stores each project's selection/rail order in memory until a full document reload. The outside miniature preview updates to match. The rail already exists in the miniature composition before entry.

## Shared spatial lift

Click or keyboard-activate the primary media or story cover. Both reuse the same surface, dismissal, scroll and focus handling; the source wall is chosen for each kind. A separate CSS3D surface starts at that exact wall region, advances into the room, enlarges and turns squarely toward the current camera. At arrival, the same DOM surface is positioned in the matching screen rectangle above the scene for crisp text and reliable layering. Dismissal restores its world coordinates and reverses the spatial journey; the room remains visible behind it. The frame/room remain visible behind it; there are no projected light beams or extra visible inspection buttons.

For media, the lifted display uses the original static image source at natural proportions, with vertical scrolling for its full length. Because CSS3D surfaces are not consistently included in native browser scroll chaining, this display explicitly routes wheel, touch/pen and reading keys to its scroll area; room gestures remain suspended. GIF/video controls retain their existing behavior. While lifted, room navigation is suspended and gestures inside the display belong to its scroll area. Outside click or Escape reverses the same spatial route back to the wall. Clicking inside does not dismiss it. The selected media and camera position are retained.

Semantic dialog labeling, keyboard focus containment/return and a keyboard-only close control support accessibility. On narrow screens or unavailable WebGL the same content uses a readable flat surface. Reduced motion skips the travel animation. This is a focused image view, not a separate project route or project-detail popup.

## Content and safeguards

Approved Astro Markdown remains the source for all ten case studies. The full rendered body is cloned into a continuous article with no pagination or chapter tabs, preserving every paragraph and approved external link. Other rooms are isolated after entry. The branded arrival state reveals the real rendered scene without the previous static-artwork flash.

`showroomNavigation.ts` contains camera-relative floor movement and input normalization. `roomSurfaces.ts` owns physical displays/lift placement. `projectExhibit.ts` owns gallery/content/focus state. Source assets and metadata, other page sources, shared navigation, hosting configuration and Contact delivery are untouched.

## Validation

Unit checks cover URL/filter state, grouping, exact media swaps, memory/reset, camera-relative movement, wall bounds, door crossing and fine trackpad deltas. Browser review covers real wheel input over controls, repeated gestures, native CDP touch/pen after wheel, all Divine thumbnail permutations, full-image scrolling/dismissal, camera perspective, all ten projects, filters/history, GIF playback, room isolation, five viewport widths, reduced motion, animated entry and renderer/no-JavaScript fallbacks. Existing website regressions remain enabled. See the PR for executed results and the deployed review URL.

Physical trackpad/touchscreen hardware feel must still be reviewed by the owner; emulated browser input cannot establish that subjective result.

## Editorial treatment and brand palette

The resting story wall shows the existing project type, title, case-study headline and introduction. The lifted ivory article restores the original hierarchy: large Instrument Serif headline, quiet project metadata, readable DM Sans body copy, generous margins, original section headings and fine rules. Categories and approved external links remain available. There are no Next/Previous pages or chapter tabs. Mobile uses the same continuous article with responsive type and padding.

The media wall retains its working 75/25 gallery with quieter metadata, smaller captions and a finer frame. The architecture, backdrop, fog, hemisphere/fill lighting, glass tint, table, canvas previews, loading/fallback artwork and wall surfaces now use neutral charcoal/ivory tones with restrained gold. Supplied project images retain their own original colours. No global site tokens, other pages or content records are changed.

## Detachment and return

An active display has a single visible copy. From opening through the end of return travel, the story cover is absent from its dark recessed mount, or the main media item is absent from its media screen. The physical frame and media thumbnail strip remain in place. The source is restored only when the shared lift finishes closing, preserving the selected media, rail arrangement and camera position. This also applies to the reduced-motion and flat alternatives.



## Compact screens and render quality

Work measures its header and gives the canvas a separate grid row on phones and tablets. In short landscape viewports the stage sits beside the category controls. Camera distance fits the current model bounds and stage aspect ratio; small raster model signs are replaced by HTML numbers tied to the category/room list. Native touch dragging rotates the stage; a tap selects a model or room. UI scrolling does not capture showroom gestures.

Compact devices render directly to the antialiased WebGL framebuffer, using up to 2.5 device pixels per CSS pixel within a 3-million-pixel budget. They skip bloom and the second planar reflection render; static shadows update when the view changes. Wide screens retain bloom and reflection, with a separately multisampled compositor target and a 6-million-pixel budget. Texture anisotropy improves angled preview clarity. DPR and camera framing are recomputed on viewport/orientation changes.

Project covers, media thumbnails and editorial stories use native readable document layouts on compact screens. Readers have a visible 44px close control and native momentum scrolling/pinch zoom. Height-only browser chrome changes preserve an open reader; orientation/width changes return it to its source. Media selection, source detachment, full originals, category filters, project URLs, history, reduced motion and desktop spatial wall flight remain shared. Hidden compact project scenes stop rendering once settled.

`tests/showroom.browser.mjs` covers real touch input and high-DPR drawing buffers at 320px and 390px, tablet portrait/landscape, short landscape, desktop regression, fallback and no-JavaScript access. Browser emulation does not measure a physical phone's GPU frame rate.
