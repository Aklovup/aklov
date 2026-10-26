# Spatial Work exhibition

Review branch `experiment/model-showroom`, draft PR #12. Do not merge without owner approval. Production and other page sources remain unchanged.

## Room navigation

The semantic media/story displays remain on perpendicular walls, exposed through depth-tested WebGL apertures and positioned with Three's existing CSS3DRenderer addon. No dependency is added.

Trackpad vertical gestures walk relative to the viewing direction; horizontal gestures turn through the full room. Backing away from the side wall moves away from that wall, rather than pulling toward the doorway. Shift + horizontal wheel strafes. Arrow keys turn/walk; W/S walk and A/D strafe. The floor bounds stop travel through walls. Crossing the physical rear opening exits in either direction. Breadcrumbs, Escape, history and the index remain alternatives.

Camera flights and image lifts use elapsed wall-clock time, while camera damping uses a bounded timestep so a slow renderer cannot stretch the nominal animation duration indefinitely. Camera targets ease continuously; ordinary input does not snap the camera to its target. The renderer can draw at 60 fps rather than the old 30 fps cap; actual frame rate depends on hardware and scene cost. Desktop requests the performance GPU where available. The hidden outer reflection floor is skipped inside rooms, and superseded miniature textures are disposed after swaps. Ambient movement sleeps while reading, with Pause, when hidden or in the index. Reduced motion makes user transitions immediate.

Wheel navigation is handled over thumbnails and buttons as well as the room. A pointer press remains a click until it crosses a movement threshold, after which it becomes camera navigation and suppresses the resulting accidental click. Pointer capture is released on completion/cancellation and input-device changes. Browser pinch/zoom wheel gestures and editable fields are excluded. The readable narrow-screen alternative keeps native scrolling.

Clicking the story display or keyboard-focusing its controls approaches it squarely, without adding visible Approach/Inspect/Read controls. Free movement can reach the same positions. Both HTML surfaces and miniature canvas signs use the existing Instrument Serif/DM Sans design tokens; no global typography is changed.

## Media screen

One main item occupies 75% of the screen; remaining items use equal, explicitly bounded rows in its 25% rail. A single item fills the width. Thumbnail image dimensions, zero intrinsic flex height and constrained grid tracks prevent tall website screenshots from pushing the other thumbnails out of view.

Selecting a thumbnail swaps it with the main item in exactly that rail slot. `mediaSelection.ts` stores each project's selection/rail order in memory until a full document reload. The outside miniature preview updates to match. The rail already exists in the miniature composition before entry.

## Full-image lift

Click or keyboard-activate the primary media itself. A separate CSS3D surface starts at that exact wall region, advances into the room, enlarges and turns squarely toward the current camera. The frame/room remain visible behind it; there are no projected light beams or extra visible inspection buttons.

The lifted display uses the original static image source at natural proportions, with vertical scrolling for its full length. Because CSS3D surfaces are not consistently included in native browser scroll chaining, this display explicitly routes wheel, touch/pen and reading keys to its scroll area; room gestures remain suspended. GIF/video controls retain their existing behavior. While lifted, room navigation is suspended and gestures inside the display belong to its scroll area. Outside click or Escape reverses the same spatial route back to the wall. Clicking inside does not dismiss it. The selected media and camera position are retained.

Semantic dialog labeling, keyboard focus containment/return and a keyboard-only close control support accessibility. On narrow screens or unavailable WebGL the same content uses a readable flat surface. Reduced motion skips the travel animation. This is a focused image view, not a separate project route or project-detail popup.

## Content and safeguards

Approved Astro Markdown remains the source for all ten case studies. Story pages use original headings/paragraph boundaries, preserving copy and links. Other rooms are isolated after entry. The branded arrival state reveals the real rendered scene without the previous static-artwork flash.

`showroomNavigation.ts` contains camera-relative floor movement and input normalization. `roomSurfaces.ts` owns physical displays/lift placement. `projectExhibit.ts` owns gallery/content/focus state. Source assets and metadata, other page sources, shared navigation, hosting configuration and Contact delivery are untouched.

## Validation

Unit checks cover URL/filter state, grouping, exact media swaps, memory/reset, camera-relative movement, wall bounds, door crossing and fine trackpad deltas. Browser review covers real wheel input over controls, repeated gestures, native CDP touch/pen after wheel, all Divine thumbnail permutations, full-image scrolling/dismissal, camera perspective, all ten projects, filters/history, GIF playback, room isolation, five viewport widths, reduced motion, animated entry and renderer/no-JavaScript fallbacks. Existing website regressions remain enabled. See the PR for executed results and the deployed review URL.

Physical trackpad/touchscreen hardware feel must still be reviewed by the owner; emulated browser input cannot establish that subjective result.
