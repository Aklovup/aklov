# Repository-hosted image standard and interrupted R2 audit

## Audit findings

The audit checked local Git status/log, the current GitHub `main` and `feat/impex-media` refs, source files, and Cloudflare configuration. Both GitHub branches pointed to `4a73db9cca1e7cda58e17f99345e80190d5b942c`; no R2 implementation commit or PR had been published. The local branch was clean, and its source files matched that main commit. Local snapshot commits contain already-merged About/Contact work, not an R2 implementation, and were preserved.

The interrupted task created an empty feature branch and enabled the existing managed `r2.dev` domain for `aklov-media`. A subsequent network-read command was interrupted. It did not download an asset, change image references, create routes/Pages Functions, add bindings or modify Astro/hosting configuration.

Aklov's homepage has its original inline founder silhouette. Impex's portal-homepage media belongs to the existing Work project entry; its cover and all three detail slots still have no URLs. At that audit point, no corresponding image existed in the repository, so the placeholders were preserved. The owner has subsequently uploaded `Impex_Homepage.gif`; the card and first popup media item now reference its local path.

## Reversal performed

Only the interrupted task's public-access change was reversed: `aklov-media` now has managed `r2.dev` access disabled again. The bucket, directory marker, and `projects/impex-automotive/Impex_Homepage.gif` were retained. No bucket/object was deleted. No history was rewritten or unrelated commit reverted.

The Pages project still has no R2 bindings, and the unrelated Worker binding to `hubgrid-assets` was not changed. Cloudflare Pages hosting, approved pages/copy/layouts, project filtering/popups, navigation, and Web3Forms Contact integration remain unchanged.

## New image location

The standard GitHub folder is:

`Aklovup/aklov/public/images/`

Project media belongs in `public/images/projects/<project-slug>/`. Portraits belong in `public/images/portraits/`; Solutions imagery belongs in `public/images/solutions/`. Empty folders are tracked with `.gitkeep` files. See `public/images/README.md` for upload/reference instructions.

For the Impex portal homepage, upload the real GIF to:

`public/images/projects/impex-automotive/Impex_Homepage.gif`

Then reference `/images/projects/impex-automotive/Impex_Homepage.gif` from its existing card cover and `impex-homepage` detail entry. If supplying a genuine static WebP cover, use `public/images/projects/impex-automotive/cover.webp` instead and update the media type accordingly. No URL is inserted before the actual file exists.

Existing media components already accept root-relative public URLs, so no runtime, schema, component, routing or dependency change is needed. Files in `public` are served as supplied; optimize them before uploading, provide actual dimensions, and check their crop/loading behavior when wiring them in.

The current Solutions photo remains its existing external source until an approved replacement is uploaded. The owner subsequently supplied Home and About portraits; their existing portrait areas now reference the actual repository files without changing page copy or layout.

## Validation

The existing GitHub workflow now includes `public/**` and `AGENTS.md` in its PR triggers, so future media-only changes receive build and regression checks. It runs the static Astro build, existing Work/Contact logic tests, and Work/About/Contact browser suites. These checks exercise portfolio popups, responsive layouts and Contact API/captcha handling using isolated fixtures. They do not send real inquiries.

The new Impex browser check verifies the actual uploaded GIF header/dimensions, served bytes and MIME type, card and popup playback, immediate display, visible paused/reduced-motion frames, and desktop/mobile fit. All three Impex media items are now supplied. No R2 delivery or binding is used.

## Uploaded media integration

The Home and About pages use `public/images/portraits/Portrait_home.png` and `Portrait_about.png` respectively. Original files are preserved.

Project media is mapped in the individual Markdown entries, with dimensions read from the actual GIF/PNG headers:

- Impex: `Impex_Homepage.gif`, `Impex_Product_Cart.gif`, `Impex_Review_Payment.gif` (3/3).
- XANS: `Xans_Home.gif`, `Xans_add_order.gif`, `Xans_logQC.gif`, `Xans_Invoice.gif` (4/4). Dashboard comes first and is the card cover. Invoice media is a GIF, not a static screenshot.
- Divine/Black Onyx: `Gateway.png`, `Dhw_shop.png`, `BO_shop.png`, `shared_cart.png` (4/4). Gateway is the card cover.
- JAYCOR: `Jaycor_shop.png`, `Jaycor_PDP.png` (2/2).
- Wound Concierge: `Woundconcierge_Home.png`, `Woundconcierge_thrive.png` (2/3). Customer-workflow media is still pending.

All GIFs remain paused with a visible frame until Play is activated. No schema changes, image-hosting changes, generated imagery or new dependencies are needed. Media for Moving Company CRM, GuideYusuf, InstantResidency, VÉRA and Vortex is not yet uploaded; retain their existing pending states.

`tests/media-assets.browser.mjs` verifies file availability, actual dimensions, card/detail data, all sourced project galleries, play/pause and portrait rendering. The existing build and regression suites continue to cover filtering, popup history/accessibility, approved About copy, and Contact form behavior without sending inquiries.
