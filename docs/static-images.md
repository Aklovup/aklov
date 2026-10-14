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

The current Solutions photo remains its existing external source until an approved replacement is uploaded. The inline Home silhouette and About fallback are likewise preserved. This task establishes the local-media standard without replacing existing visual assets with missing URLs.

## Validation

The existing GitHub workflow now includes `public/**` and `AGENTS.md` in its PR triggers, so future media-only changes receive build and regression checks. It runs the static Astro build, existing Work/Contact logic tests, and Work/About/Contact browser suites. These checks exercise portfolio popups, responsive layouts and Contact API/captcha handling using isolated fixtures. They do not send real inquiries.

The new Impex browser check verifies the actual uploaded GIF header/dimensions, served bytes and MIME type, card and popup playback, reduced-motion behavior, and desktop/mobile fit. The product/cart and checkout images remain pending. No R2 delivery or binding is used.
