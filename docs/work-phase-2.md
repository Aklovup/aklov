# Work page — Phase 2

All work remains on `feat/work-phase-1`; the existing PR is unmerged.

## Review

The GitHub validation artifact `work-phase-2-review` contains:

- Desktop and mobile Work page screenshots.
- Desktop and mobile project popup screenshots.
- A concept popup screenshot.

Review uses screenshots only. For an optional interactive local preview: check out the branch, run `npm install` and `npm run dev`, then open `/work/`.

## Content

Each project is now a Markdown entry in `src/content/projects/`. The frontmatter uses JSON-compatible YAML so structured metadata is explicit and the dependency-free tests can read it. The body contains the exact approved case-study copy.

The supplied canonical slugs are used. Older Divine, GuideYusuf, InstantResidency and concept identifiers are retained as `aliases` for compatible deep links.

All eight client projects are presented as completed implementations. VÉRA and Vortex Gym remain Independent Concepts; neither has an external demo URL or backend claims.

The approved Moving Company CRM copy adds Integrations & Reporting. Filter counts are now 10 / 5 / 2 / 5 / 2 / 7 for All / Websites / Customer / Automation / Applications / Integrations.

## Media

All 21 approved media identifiers and descriptions are retained. No final media sources or concept screenshots were available in the repository.

Add a media item's `url` in its project frontmatter to replace the placeholder. Sources may be absolute HTTP(S) URLs or root-relative public asset paths, such as `/media/impex-homepage.gif`. Include accurate `alt`, `caption`, `width` and `height`. Optional fields are `poster`, `order` and `placeholder`.

The same source schema applies to `cover` for card previews. Replacing a source does not require component changes.

Available items form an editorial sequence. Pending items are labeled separately. With no available items, at most one intentional preview placeholder is shown, followed by the planned media list. Moving Company CRM uses `placeholder: false` for its two detail slots, so no empty screenshot elements are displayed.

Images retain their aspect ratio and have an explicit full-size link. GIFs load and play only after the user chooses **Play GIF**, and can be paused. Videos use native controls and do not autoplay. Detailed media lives in inert templates until a project is opened and is removed when the popup closes.

Redact sensitive Xans data before adding publication-ready media. Do not substitute proposal diagrams for the Moving Company CRM's implemented screens.

## Popup and routing

One native dialog displays the selected project's rendered Markdown and media. Card clicks and the keyboard-operable **View project** control open it. External website links are separate.

The dialog has labeled content, close-button focus, Tab/Shift+Tab boundaries, Escape, close-control and desktop backdrop dismissal, background scroll locking, and focus restoration. Mobile uses a full-screen viewport with safe-area spacing and a sticky close control.

`?project=impex-automotive` opens the corresponding project. Existing `category`, other query parameters and the hash are preserved. Back closes a newly opened project; Forward reopens it. Closing a directly loaded project removes only the project parameter. Unknown slugs leave the filtered Work page usable.

No standalone project routes, new runtime dependencies, Home/Solutions changes or hosting changes were introduced.

## Validation

The existing GitHub workflow runs `npm run build`, 11 content/filter/URL logic tests and Chromium checks for all ten complete bodies, categories, direct links and aliases, history, keyboard and pointer interactions, focus, scrolling, missing media, external link metadata and seven viewport widths.

Actual asset rendering and video playback against final sources remain pending those assets. The external links are checked for their approved destinations and opening behavior; current client websites are not used as proof of the delivered work.
