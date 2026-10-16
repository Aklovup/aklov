# Aklov website media

Upload approved originals to `Aklovup/aklov/public/images/` in GitHub. Astro includes these files in the static build and Cloudflare Pages serves them directly. No R2 binding, media handler, or private credential is required.

## Who does what

The project owner uploads media and identifies the main/cover image when a particular choice is wanted. Descriptive filenames help, but there is no requirement to enter metadata manually.

Codex reviews the actual media, filename, and approved project content, then maintains the individual entries in `src/content/projects/`: source paths, actual dimensions, media types, alternative text, concise captions, optional posters, and gallery order. Preserve existing cover choices unless the owner requests a replacement. Report any uncertain mapping rather than guessing. Captions describe the interface or sequence shown; they must not invent features, results, or client claims.

Upload first, then ask Codex to integrate the files. An upload alone does not automatically create a portfolio entry or change a cover.

## Upload folders

- `portraits/` — approved personal portraits.
- `solutions/` — approved Solutions imagery.
- `projects/<project-slug>/` — screenshots, GIFs, videos, and optional still posters.

Browser URLs begin with `/images/`, without `public`. For example:

- GitHub file: `public/images/projects/impex-automotive/Impex_Homepage.gif`
- Browser path: `/images/projects/impex-automotive/Impex_Homepage.gif`

Prefer descriptive lowercase filenames with hyphens for new uploads. Existing filenames remain valid and need not be renamed. Keep the extension consistent with the actual file format; renaming a GIF to WebP does not convert it.

## Current portfolio inventory

All 17 supplied gallery items have source paths, actual dimensions, types, alternative text, captions, and display order. Supplied covers also have accurate dimensions, types, and alternative text. Covers intentionally omit separate visible captions.

| Project folder | Uploaded gallery items | Existing cover |
| --- | --- | --- |
| `impex-automotive` | 3 GIFs: homepage, product/cart, review/payment | `Impex_Homepage.gif` |
| `xans-operations-portal` | 4 GIFs: dashboard, order entry, quality control, invoice generation | `Xans_Home.gif` |
| `divine-health-black-onyx` | 4 images: gateway, Divine shop, Black Onyx shop, shared cart | `Gateway.png` |
| `jaycor-commerce` | 2 images: category, product details | `jaycor-shop.png` |
| `wound-concierge` | 2 images: storefront, referral/loyalty widget | `Woundconcierge_Home.png` |
| `vera-skincare-concept` | 1 full-page independent design concept | `vera-concept-overview.jpg` |
| `vortex-gym-concept` | 1 full-page independent design concept | `vortex-gym-overview.jpg` |
| `moving-company-crm` | Pending: workflow and scheduling images | Pending |
| `guideyusuf-ai-support` | Pending: support workflow image | Pending |
| `instantresidency-booking` | Pending: booking workflow image | Pending |

Wound Concierge's customer-processing workflow image is also pending. Missing media retains its stable identifier and planned caption without a fabricated URL. Placeholder dimensions are provisional until the actual file is supplied. The `.gitkeep` files preserve empty upload folders; they are not media assets.

## Presentation and generated previews

Do not upload to `public/images/generated/`. `npm run media` uses Sharp to generate responsive 640/1280/1600px WebP derivatives without upscaling, including first-frame GIF posters. Output is ignored at `public/images/generated/` and `.cache/media-manifest.json`. Both `npm run build` and `npm run dev` run this step automatically. Source-content hashes refresh previews when originals change.

Original uploads remain unchanged. Project entries reference originals; shared components resolve generated previews. GIFs show a still immediately and animate only after Play; Pause retains a visible frame. Card previews use top-center cover cropping.

A single available case-study image keeps its natural full height. In galleries with multiple available media items, tall static images use a bounded preview and offer “View full page” only when cropped. GIFs retain their playback controls.

The Solutions photograph is `public/images/solutions/Solutions_img.jpg`. The supplied portraits remain in `public/images/portraits/`; the Home portrait is retained even though the current homepage review no longer displays it.

## Integration checks

- Redact confidential information before uploading client media.
- Preserve approved project text, stable media identifiers, and selected covers.
- Verify file existence, dimensions, format, alternative text, captions, and order.
- Run the build and relevant media/browser checks; verify crop, paused GIFs, and popup layouts.
- Routine isolated media updates may go directly to main under the owner's standing instruction. Keep work on an existing unmerged feature branch there for review; do not merge unrelated design work automatically.

See `AGENTS.md` for standing project guidance and `docs/static-images.md` for the historical R2 audit.
