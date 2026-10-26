# Experimental Work page

Isolated visual exploration on `experiment/kinetic-work`. Main is unchanged.

The Work route uses the existing collection, ordering, filters, cards and accessible project dialogs. Page-scoped styles introduce an ivory opening and dark editorial index. No project copy or media is replaced. The shared header receives overrides only while this page is present.

The sculpture is a locally generated, chamfered parametric knot, rendered with native WebGL and custom studio-lighting shaders. Three forms can be selected. Pointer motion gently changes the view; continuous rotation has an explicit pause control. Pixel density is capped, rendering suspends outside the viewport and on hidden tabs, and reduced-motion users initially receive a still composition. If WebGL is unavailable, a static SVG composition remains visible. All ten projects are available without JavaScript.

No dependencies, remote models, image textures or new hosting services are introduced. The sculpture is abstract brand artwork, not a representation of client functionality.

Validation: the `Experimental Work review` workflow builds Astro, runs the content/validation unit tests, and exercises WebGL, controls, viewport overflow, filters, dialogs, deep links, history, reduced motion and fallback behavior. It saves desktop, tablet and mobile screenshots as `kinetic-work-review`. The existing full-site validation workflow runs separately.

Preview `/work/` on the Cloudflare branch deployment. This is a design experiment for review, not approval to merge or roll out the design to other pages.
