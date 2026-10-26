# Spatial Work experiment

An isolated Work-page study on `experiment/kinetic-work`, draft PR #11. Main is unchanged.

The initial floating-object study has been replaced by a complete real-time architectural archive: receding stone frames, an illuminated suspended project screen, mirrored water with shader ripples, studio environment lighting, fog, dust and restrained bloom. Camera movement responds to pointer and natural page scroll. Project navigation changes the actual first-frame preview and opens the corresponding existing case study.

Three.js 0.180.0 is the single added dependency. Its scene graph, PBR materials, reflection camera and post-processing pipeline replace the hand-written isolated-object renderer. No remote 3D assets, paid services or fabricated project images are used. Project previews come from collection metadata and the existing media manifest; missing covers remain explicit placeholders. Textures load on selection and are cached.

Reduced motion starts with a static camera and still reflection. Pause is always available after renderer initialization. Rendering suspends when the scene is offscreen, the tab is hidden, or a project dialog opens. Pixel ratio and reflection resolution are capped. Without WebGL, static architectural artwork and working project-selection controls remain; without JavaScript, the project index still contains all ten projects.

Only Work's page and experiment files change, plus the Three.js dependency. Existing filters, ordering, dialogs, media controls, page copy and other pages' source are retained. The dedicated CI workflow builds Astro and checks scene rendering, project navigation, filters, history, dialogs, focus return, reduced motion and fallback modes at desktop/tablet/mobile widths.

Review the moving scene in the branch preview at `/work/`; still screenshots cannot show camera travel and reflections. This is a procedural design experiment, not a claim to reproduce the custom assets or complete production quality of the reference studios.

## Circular catalogue interaction

Project previews now occupy a continuous three-dimensional ring inside the existing scene. The front preview is sharp; nearby angled previews soften through a surface shader and fade into depth. The radius derives from the number of collection entries, and only nearby panels render. Current and adjacent cover textures load on demand and are cached; detailed galleries still load only through the existing dialogs.

Horizontal touch swipes and mouse drags move the ring continuously before release. Velocity affects the snap destination, and damped motion settles on a project. Horizontal trackpad gestures work as well. Native vertical scrolling and pinch zoom remain available. Project arrows and keyboard navigation are retained. Tapping an unobstructed neighbouring preview selects it; tapping the selected preview opens its case study. Reduced motion and Pause stop ambient motion and use immediate settling while preserving direct manipulation.

Browser coverage includes real touch events through Chromium's input protocol, drag feedback before release, wheel-axis handling, native vertical touch scrolling, wraparound and opening the selected project after a swipe.

GPU cover textures are cropped at runtime to the same top-center 16:9 preview and capped at 768px on mobile or 1024px on desktop, avoiding full-page image textures on every panel. Original repository assets and full-page case-study inspection remain unchanged.
