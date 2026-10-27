# Editorial motion

Motion is assigned in page markup by role; do not apply it to every column or paragraph.

- `data-motion="type"`: selected display headings. Preserves original text, emphasis and line wrapping. A line unfolds over 1.1 seconds once it reaches 68% of the viewport, with a 130ms cadence when multiple lines are exposed together. No opacity animation. Runs once; reading back up never resets it.
- `data-motion="step"`: Home's stair-stepped process and Solutions' process structure. Draws existing rules over a scroll distance; numerals and reading copy remain stationary.
- `data-motion="rule"`: quiet section dividers. `data-motion-edge="bottom"` draws an existing lower rule. Existing borders stay intact without JavaScript.
- `data-motion="photo"`: Solutions' portrait desk photograph. A small, scroll-led scale change stays inside its existing crop/frame. No fade or frame movement.
- `data-motion="quote"`: the About pull quote. A fine underline develops under its emphasized phrases; the quotation stays readable throughout.

Home's stars, reflection scene and supporting-text reveal, About's cellular structures, and the Work showroom retain their established motion. Project screens/captions, body paragraphs and form controls have no generic entrance. Hover effects remain independent.

Content is present without JavaScript. Reduced motion, a fast scroll past content, width changes/rotation, and backgrounding the page settle prepared effects. Mobile browser chrome changing height does not reset them. Scroll schedules one frame to update; there is no idle animation loop. Headline splitting waits for fonts and never hides a heading already visible at initialization.
