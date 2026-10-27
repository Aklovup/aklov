# Editorial motion

Motion is assigned by page and role. Six elements receive additional scroll motion across the standard pages; do not expand these attributes across every heading, column or paragraph.

- `data-motion="type"`: only Home's “Make the moving parts work together” headline. Preserves original text, emphasis and line wrapping. A line unfolds over 1.1 seconds once it reaches 68% of the viewport, with a 130ms cadence when multiple lines are exposed together. No opacity animation. Runs once; reading back up never resets it.
- `data-motion="step"`: only Home's three stair-stepped process frames. Draws existing rules over a scroll distance; numerals and reading copy remain stationary.
- `data-motion="photo"`: Solutions' portrait desk photograph. A small, scroll-led scale change stays inside its existing crop/frame. No fade or frame movement.
- `data-motion="quote"`: only About's pull quote. Its two existing emphasized phrases gain gold ink and a fine underline in reading order. The whole quotation remains visible and stationary throughout. The first phrase completes before the second; progress remains settled on return.

Solutions service headings, service dividers and process rows remain still. About chapter headings and principles remain still. Contact has no scroll entrances; its existing hover, focus and form feedback provide its interaction.

Home's stars, reflection scene and supporting-text reveal, About's cellular structures, and the Work showroom retain their established motion. Project screens/captions, body paragraphs and form controls have no generic entrance. Hover effects remain independent.

Content is present without JavaScript. Reduced motion, a fast scroll past content, width changes/rotation, and backgrounding the page settle prepared effects. Mobile browser chrome changing height does not reset them. Scroll schedules one frame to update; there is no idle animation loop. Headline splitting waits for fonts and never hides a heading already visible at initialization.
