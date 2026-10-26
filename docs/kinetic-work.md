# Spatial Work experiment

An isolated Work-page study on `experiment/kinetic-work`, draft PR #11. Main is unchanged.

The initial floating-object study has been replaced by a complete real-time architectural archive: receding stone frames, an illuminated suspended project screen, mirrored water with shader ripples, studio environment lighting, fog, dust and restrained bloom. Camera movement responds to pointer and natural page scroll. Project navigation changes the actual first-frame preview and opens the corresponding existing case study.

Three.js 0.180.0 is the single added dependency. Its scene graph, PBR materials, reflection camera and post-processing pipeline replace the hand-written isolated-object renderer. No remote 3D assets, paid services or fabricated project images are used. Project previews come from collection metadata and the existing media manifest; missing covers remain explicit placeholders. Textures load on selection and are cached.

Reduced motion starts with a static camera and still reflection. Pause is always available after renderer initialization. Rendering suspends when the scene is offscreen, the tab is hidden, or a project dialog opens. Pixel ratio and reflection resolution are capped. Without WebGL, static architectural artwork and working project-selection controls remain; without JavaScript, the project index still contains all ten projects.

Only Work's page and experiment files change, plus the Three.js dependency. Existing filters, ordering, dialogs, media controls, page copy and other pages' source are retained. The dedicated CI workflow builds Astro and checks scene rendering, project navigation, filters, history, dialogs, focus return, reduced motion and fallback modes at desktop/tablet/mobile widths.

Review the moving scene in the branch preview at `/work/`; still screenshots cannot show camera travel and reflections. This is a procedural design experiment, not a claim to reproduce the custom assets or complete production quality of the reference studios.
