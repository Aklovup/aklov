# Model showroom experiment

Branch `experiment/model-showroom` starts from the verified circular-catalogue experiment, which remains unchanged on its own branch. This branch replaces only Work's presentation with a single-viewport architectural showroom.

## Experience

- A model table exhibits nonempty primary-category buildings, with client projects and independent concepts kept separate.
- Selecting a building moves the camera and lifts its roof to reveal project rooms.
- Selecting a room focuses its interior and shows the approved project description. View project opens the existing complete case study, including original media controls and image inspection.
- A project-index overlay retains the original filters and offers direct access to every project. Secondary categories remain index filters rather than duplicated physical rooms.
- Model and room buttons provide keyboard/touch access alongside physical model picking and drag-to-orbit viewing. Browser history restores the scene.

The data is derived from content entries. Each project has one physical home under its primary category; empty categories create no model. `model` and `room` parameters encode spatial navigation, while existing `type`, `category` and `project` links remain supported. Invalid model/room parameters fall back to the showroom. Direct case-study links focus the matching room behind the existing dialog.

## Implementation

Three.js, introduced on the parent experiment, supplies lighting, geometry, planar reflection and post-processing. Models are procedural exhibition artwork, not representations of client buildings. Actual approved project images appear only in room displays and case studies; textures load when a category is inspected and use bounded GPU crops. No new dependencies or paid services are added here.

The gallery's new optional `renderDialog` prop defaults to true. This page mounts its case-study dialog outside the index overlay, avoiding hidden-ancestor and nested-focus problems. Shared header/footer source and other page source remain unchanged; page-scoped styles give Work a full-viewport shell.

Reduced motion uses immediate poses; Pause stops animated transitions. Once motion settles, the renderer becomes idle until interaction or resizing. The static fallback retains category/room selection and case studies without WebGL. Without JavaScript, the complete original project index is available.

## Validation

The new Model showroom review builds Astro, runs original unit tests plus showroom grouping/URL tests, and tests physical model picking, roof opening, room selection, original case studies and GIF playback, focus return, history, concepts, all index categories, deep links, viewport overflow, animated transitions, native mobile taps and fallback modes. Screenshots cover showroom/category/room states at desktop, tablet and mobile widths.

The original kinetic-world browser workflow is skipped on this branch because its circular-catalogue UI is deliberately replaced. Four direct-gallery browser steps in the existing site workflow are likewise replaced by the showroom/index/case-study checks. Home, Solutions, About, Contact and sitewide checks still run; the sitewide dialog selector is made explicit now that Work contains an index dialog as well as its project dialog. These exceptions are limited to this experiment branch.

This is a procedural prototype for review. Do not merge without the owner's approval.
