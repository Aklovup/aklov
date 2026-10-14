# Aklov website media

Upload approved website images here in GitHub: `Aklovup/aklov/public/images/`.
Astro copies this directory to the build output, and Cloudflare Pages serves its files directly. No R2 bucket, binding, media handler or private credential is required.

Use these folders:

- `portraits/` — Home and About portraits.
- `solutions/` — approved replacement for the existing Solutions photograph.
- `projects/<project-slug>/` — screenshots, GIFs, videos and optional still posters for each portfolio project. The ten existing projects have matching folders.

## Impex Automotive

Upload the portal-homepage GIF as:

`public/images/projects/impex-automotive/Impex_Homepage.gif`

Its browser URL will be:

`/images/projects/impex-automotive/Impex_Homepage.gif`

Alternatively, an actual static cover image can be uploaded as `cover.webp`; do not rename a GIF's extension to WebP. Use a real converted/exported file with a matching extension.

Once the file is uploaded, set the existing Impex `cover.url` and `impex-homepage` media item's `url` in `src/content/projects/impex-automotive.md` to the matching local URL. Supply descriptive cover alternative text and the file's actual width/height. Keep the media type consistent with the file. This reuses one source for the card and project popup.

The uploaded `Impex_Homepage.gif` is 1280 × 610 pixels and is now used by the existing Impex card and `impex-homepage` popup slot. The product/cart and checkout media remain pending: one of the three planned Impex items is supplied. The GIF loads into a visible still frame and stays paused by default. Play starts animation; Pause retains a visible frame. Reduced-motion visitors also receive the still preview. A static poster is optional and has not been supplied. The `.gitkeep` files preserve upload folders; they are not image assets.

## General rules

- Browser URLs start with `/images/`; omit `public` from the URL.
- Prefer lowercase filenames with hyphens and an extension matching the real format.
- Upload the file before assigning its URL. Preserve a working reference or intentional placeholder while replacement files are absent.
- Keep portfolio references in individual project content files, rather than card markup.
- Preserve stable media identifiers, approved copy and original aspect ratios. Include accurate dimensions and alternative text.
- Use optimized WebP/JPEG/PNG for static images and transparent WebP/PNG for cutout portraits. Existing GIF/video controls remain supported.
- Redact private information before uploading client screenshots.
- Use the feature-branch workflow for review; do not merge media changes without owner approval.

## Build-generated previews

Upload originals to the existing project, portraits or Solutions folders. Do not upload to `public/images/generated/`.

`npm run media` uses Sharp (Astro's image engine) to create 640/1280/1600px WebP derivatives without upscaling, including first-frame GIF posters. Output goes to ignored `public/images/generated/` and `.cache/media-manifest.json`. Both `npm run build` and `npm run dev` run this step automatically. Derived filenames include a source-content hash so replacing an original refreshes its previews.

Original uploads remain unchanged. The existing project entries still hold original source references; components select responsive previews from the build manifest. GIF animation is requested only after Play, with the poster retained during loading and Pause retaining the current frame. Case-study images remain contained; card previews remain top-center covers. Full-size media links have been removed by owner request.

The Solutions source is `public/images/solutions/Solutions_img.jpg`. The Home/About portraits remain their supplied PNGs; higher-resolution originals can be supplied later. Final missing portfolio screenshots remain pending rather than being substituted.
