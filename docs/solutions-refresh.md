# Solutions editorial refresh

This change extends the homepage review branch to align Solutions with the approved editorial direction. No approved service copy, inclusions, goals, project destinations or contact destinations are removed or rewritten.

- The original headline is recomposed into three lines. The two introductory paragraphs are retained. The hero’s rings and ivory index container are removed; the five anchor links remain in a transparent ruled index below the introduction.
- Problem framing uses a smaller headline and tighter spacing. The previously approved image-and-heading section remains unchanged, including its 4:5 desktop, 4:3 tablet and square mobile composition, local optimized asset and inset border.
- Services retain their alternating surfaces and varied compositions. Numbers have comparable proportions, integrations uses a positioned heading number instead of a background overlay, automation inclusions become ruled lists, and application inclusions use the same readable body scale as other services.
- Major services use h2 headings; inclusion headings use h3. Existing anchor IDs and the shared links.ts destinations remain intact.
- The four-stage stepped approach is retained. The reassurance section loses its ring and takes a quieter scale; the gold closing invitation has the final visual emphasis. All approved content and CTAs remain.
- The existing browser suite checks all nine widths and image compositions, with additional checks for complete headline visibility, service heading hierarchy, index destinations/keyboard focus and actual anchor navigation.

Preview `/solutions/` on the homepage branch. Review screenshots are saved in the `solutions-page-review` Actions artifact. Home and Solutions remain unmerged until the project owner approves.

## Tablet hero refinement

The Solutions hero now groups the headline, approved introduction and actions in one left column, with a vertically centered CSS tablet on the right. The full black device remains visible; a static perspective and restrained casing/shadow provide depth without WebGL, animation or generated imagery. Tablet/mobile layouts place the device after the text/actions with no rotation or perspective, before the service index. No visible project caption is added, per the owner's direction.

`src/data/solutionsHero.ts` selects the temporary Vortex Gym project and a 3:2 screen crop. `SolutionsTablet.astro` resolves the real cover from the existing project entry and uses existing responsive media previews. CSS crops its full-page image to the opening hero. To replace it with approved workflow imagery, update the configured project slug and crop ratio after that project's cover has been uploaded and connected; no generated screen image is stored. Work-page project classification and content remain untouched.

The Solutions browser audit additionally verifies the actual image loads, the screen crops, the transformed device stays fully within each viewport, actions stay with their text, the desktop stage is centered and mobile order is preserved at all nine widths. The tablet is a static image presentation, not an interactive embedded website.


The gold “connect and grow” line retains a responsive editorial inset. The tablet keeps its desktop angle above 1000px and is completely straight at 1000px and below, with centered casing depth. Browser checks verify those transforms and the indented headline's text-column bounds.
