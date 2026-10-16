# Contact page — Web3Forms

## Scope and preview

The existing `/contact/` editorial layout, approved copy, typography, colors and responsive composition remain intact. Web3Forms now handles inquiries directly from the browser. Cloudflare Pages continues to host the static Astro site; no server adapter, Function, email binding, private credential or paid dependency was added.

The original Contact integration was merged through PR #3 after the owner confirmed it worked. The current Contact refinements are part of `feat/editorial-homepage` in PR #9, alongside the approved sitewide refinements. The owner has authorized merging PR #9 after successful validation.

- Branch preview: https://feat-editorial-homepage.aklov.pages.dev/contact/ (check its deployment commit before testing).
- Production: https://aklov.pages.dev/contact/
- Local preview: `npm install`, `npm run dev`, then `/contact/`.

## Provider and field mapping

`src/data/contact.ts` stores the public Web3Forms access key, endpoint, subject and sender label. The key is intentionally visible in frontend code. The destination associated with that key must be `aklovup@gmail.com`; the inbox association lives in Web3Forms, not in a client-provided recipient field.

The form sends JSON using `POST https://api.web3forms.com/submit` with `Content-Type: application/json` and `Accept: application/json`.

| Form/configuration | API field |
| --- | --- |
| Your name | `name` |
| Email address | `email` and `replyto` |
| What do you need help with? | `project_category` (optional custom field) |
| Tell me about your project | `message` |
| Public form key | `access_key` |
| Aklov website inquiry | `subject` |
| Aklov website | `from_name` |
| Hidden unchecked checkbox | `botcheck` |
| Completed hCaptcha token | `h-captcha-response` |

The optional custom category is supported by Web3Forms' arbitrary-field format. Using `email` already sets Reply-To by default; the explicit `replyto` uses the same validated visitor address. The website URL is descriptive deployment information, not a forged Origin/Referer or an API authorization field.

## Validation and states

Required name/email/message validation and existing limits remain: 100/254/5,000 characters. The optional category accepts only the approved options. Fields are trimmed; malformed addresses and header-control characters are rejected before submission. Web3Forms provides its own server-side checks. Browser length limits are usability checks and must not be mistaken for a private server security boundary.

Send becomes enabled when the required fields are valid. Missing captcha still prevents an API call and produces an accessible message. During a request, Send is disabled and the form announces loading. Requests time out after 20 seconds; the client does not retry automatically, which avoids duplicate sends after uncertain network outcomes.

Only an HTTP-success response **and** `success === true` from Web3Forms reveal the exact approved success copy. An HTTP rejection, `success: false`, malformed response or network failure shows the approved failure message and retains the user's entered fields. A successful submission resets the form and keeps Send disabled to prevent immediate repeat submission. The input region is hidden, the existing form heading becomes the approved success heading, and the confirmation body becomes the panel's main content. The labeled feedback region receives focus. An API rejection or network failure keeps the inputs visible and preserves their values; the heading stays unchanged. Each API attempt resets hCaptcha so retries require a fresh token. Email and LinkedIn links remain usable independently. Without JavaScript, Send stays disabled and a direct-email notice is shown.

API acceptance does not prove inbox delivery. The owner must confirm the message in Gmail, including Spam, Promotions and Updates.

## Free spam protection and dashboard settings

The form uses Web3Forms' supported hidden `botcheck` checkbox, its service-side spam filtering, and the free hCaptcha integration loaded from `https://web3forms.com/client/script.js`. The compact widget fits the existing form at narrow mobile widths and reserves its height. Its verification, expiration and loading errors have accessible feedback. Captcha tokens are never fabricated for real requests.

**Required dashboard verification:** sign in through [Web3Forms](https://app.web3forms.com/), open the form matching the supplied access key, confirm that its destination inbox is `aklovup@gmail.com`, and enable **hCaptcha** as the preferred captcha / **Block Spam** option in the form settings. Save the setting. The provider documents this switch as necessary to enforce captcha server-side. The connected GitHub/Cloudflare tools cannot read or change this private dashboard, so its current setting is not claimed to be verified.

Domain restriction is a Web3Forms Pro feature; the free plan permits multiple domains. Entering `https://aklov.pages.dev/contact/` as the website URL does not by itself establish a free domain allowlist. No production restrictions are disabled by this implementation.

If this key already has a paid domain allowlist, preserve it and add only the exact preview hostname `feat-editorial-homepage.aklov.pages.dev` alongside `aklov.pages.dev`. The documented setting takes hostnames separated by commas, without protocols or paths. After review, the owner can remove the preview hostname. Do not use wildcards or turn off the existing allowlist to test. Actual paid settings cannot be inferred from the supplied key.

Web3Forms can also block certain hosted subdomains through its anti-abuse policies. If a real preview request is rejected for its origin, retain protection and contact Web3Forms support with the exact hostname and API response. Do not proxy requests through a backend to evade this policy; the official API is intended for browser use.

The old Cloudflare Email Service domain/recipient prerequisites and `/api/contact` placeholder are removed. No Cloudflare email handler or binding had been created, so no hosting resources were deleted or altered.

## Preview test procedure

1. Open the verified current Cloudflare branch preview, not production.
2. Confirm the form, captcha, email and LinkedIn links load. Enter clearly identifiable test copy, a real reply address you control, and an optional category.
3. Solve hCaptcha personally, then press Send inquiry once. Do not repeatedly submit.
4. Confirm the loading state, the API request's status and JSON `success` value in browser DevTools, the success/failure message, and whether the form resets.
5. Check `aklovup@gmail.com` (including Spam/Promotions/Updates) and confirm receipt and the correct Reply-To. API acceptance alone is insufficient.
6. If rejected, record the response message and origin. Verify the key's inbox, hCaptcha setting, and any existing domain allowlist. No dashboard credentials should be committed or shared with the website.

Interactive hCaptcha cannot be solved by this automation. Automated functional tests use isolated captcha/API fixtures and never send them to Web3Forms. The owner previously confirmed the integration worked before PR #3 was merged. The current layout refinements do not send a new inquiry or claim fresh inbox delivery. API acceptance and inbox arrival remain distinct.

## Production verification after approved merge

After the approved merge of PR #9, wait for Cloudflare's production deployment to match the merged commit. A read-only check can verify the new page and actual widget without sending email. If the owner chooses to retest delivery, open `https://aklov.pages.dev/contact/`, solve captcha, and make one identifiable test inquiry. Check API acceptance and independently confirm Gmail receipt and Reply-To. Keep production domain restrictions intact. Watch the provider's free submission quota in the dashboard; do not enable paid features or auto-upgrade.

## Validation

CI builds the Astro site and runs the existing Work/About regressions plus Contact validator, field-mapping and browser tests. Contact coverage includes required/invalid fields, valid-form enablement, correct payload/Reply-To, missing captcha and honeypot rejection, strict API acceptance, loading, success/reset, API/network/malformed failure, retained input and duplicate prevention. Layout, contrast, keyboard, reduced-motion and no-JavaScript checks run at desktop/tablet/mobile widths.

The screenshot artifact `contact-page-review` uses an explicitly labeled isolated captcha fixture. Its normal desktop/tablet/mobile captures show an untouched form; separate captures record successful and rejected submission states. A separate read-only check loads the actual Cloudflare branch preview and real hCaptcha, verifies the endpoint/key and responsive widget, and uploads real screenshots in `contact-preview-review`. On the current review branch the workflow passes `CONTACT_PREVIEW_URL` and `CONTACT_PREVIEW_SHA`. The static page exposes its Cloudflare build SHA in a nonvisual data attribute; the check waits for that exact deployment before inspecting it. It checks real widget fit at 1440/768/390/320px and valid-form enablement without pressing Send. This check never presses Send or transmits an inquiry. Neither check proves API acceptance or inbox delivery.

Sources:

- [Official API reference](https://docs.web3forms.com/getting-started/api-reference)
- [Reply-To behavior](https://docs.web3forms.com/getting-started/customizations/custom-reply-to)
- [Free hCaptcha setup and required dashboard activation](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha)
- [Domain restriction](https://docs.web3forms.com/getting-started/pro-features/restrict-to-domain)
- [Troubleshooting origins and delivery](https://docs.web3forms.com/getting-started/troubleshooting)
- [Web3Forms pricing](https://web3forms.com/pricing)

## Editorial and responsive refinements

The charcoal/ivory/gold design and approved copy are preserved. The page stacks at 1000px and below; desktop retains two columns. A compact email shortcut appears below the introduction on stacked layouts, while the complete direct-contact section remains below the form. Cross-page links continue to come from `src/data/links.ts`.

The form heading, padding and inter-field spacing are more compact. Name/email remain side by side when the panel is wide enough and stack at 640px and below. Inputs retain their readable 16px text and 48px minimum height, and the textarea remains comfortably sized. The reserved CAPTCHA height is preserved.

To inspect another verified deployment without sending an inquiry, run:
```sh
CONTACT_PREVIEW_URL=https://aklov.pages.dev/contact/ CONTACT_PREVIEW_SHA=<actual-cloudflare-commit-sha> node tests/contact.preview.mjs
```
Use the actual deployed SHA. This read-only test does not verify email delivery, dashboard spam settings or domain-allowlist configuration.
