# Contact page

## Design and preview

`/contact/` pairs a charcoal editorial introduction with an ivory inquiry form. The established Instrument Serif / DM Sans fonts, palette, shared wrapper and button styles are reused. Ruled direct-contact links and a gold closing note complete the composition. Mobile order is introduction, form, then direct contact.

Approved copy and the delivery flag are in `src/data/contact.ts`; cross-page/direct-contact links are centralized in `src/data/links.ts`. Header/footer Contact navigation now uses `/contact/`, and the existing About CTA picks up the new central destination. Existing approved page layouts, copy and portfolio records are unchanged.

Check out `feat/contact-page`, run `npm install` and `npm run dev`, then open `/contact/`. GitHub Actions uploads desktop, mobile and tablet PNGs in `contact-page-review`. No separate HTML preview is generated.

## Current delivery status — unavailable

The page is safe to preview, but the form does **not** send inquiries. `inquiryDelivery.enabled` remains `false`, Send inquiry is disabled, and a visible notice directs visitors to email. Email and LinkedIn links work independently. Inputs remain available for frontend review. JavaScript-disabled visitors also receive direct-email guidance. No endpoint, email binding, token or credential has been deployed, and no inquiry is silently accepted or stored.

Read-only Cloudflare inspection on 13 October 2026 confirmed:

- Pages project `aklov` connects to `Aklovup/aklov`, builds with `npm run build`, serves `dist`, and deploys production from `main`.
- Preview deployments are enabled for all branches.
- Pages Functions can add server-side routes to this static project and have a Workers Free request allowance; static assets can remain free. No Functions directory or Astro server adapter currently exists, and none was introduced while email prerequisites are blocked.
- The only project domain is `aklov.pages.dev`; the account's Cloudflare zone list is empty.
- The Email Routing destination-address list is empty. `aklovup@gmail.com` is the approved recipient but is **not currently verified as an Email Routing destination**.
- Preview and production have no environment variables or email bindings configured.
- Email Sending limits returned unauthorized, and subscriptions returned an authentication error. This connection cannot independently confirm those settings or the account's subscription plan.

Cloudflare's current documentation says sending to verified destination addresses is free on all plans. However, the sender must belong to a configured sending/routing domain; Cloudflare DNS is required. A `pages.dev` website address and a Gmail recipient do not provide a sender domain under the owner's control. With no domain in this account and no verified destination, this delivery workflow cannot be configured as requested. Backend integration stopped at this prerequisite check. No plans were upgraded, domains purchased, third-party service substituted, or verification emails sent.

Sources:

- [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Sending limits and verified destinations](https://developers.cloudflare.com/email-service/platform/limits/)
- [Domain setup for sending](https://developers.cloudflare.com/email-service/get-started/send-emails/)
- [Destination verification](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)
- [Sender/recipient binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
- [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)

## Prepared frontend and validation

The reusable form has native labels, required attributes, autocomplete, visible focus, per-field errors, loading feedback, request timeout, duplicate-submission prevention, and the exact approved success/failure copy. It retains user input on failure and requires an HTTP-success response with `{ "success": true }` before showing success. Success also locks the submit button to avoid an immediate duplicate.

`src/lib/inquiry.ts` is a pure validator ready to share with a future server handler: name (100 characters), email (254), message (5,000), approved optional service values, and a honeypot flag. It normalizes and validates untrusted input. It is currently used by the client and unit tests; **server-side request validation is not live because there is no handler**.

## Remaining integration requirements

Before enabling online inquiries:

1. Supply an owned domain configured with Cloudflare DNS and configure a valid email sender on it. This task does not authorize buying one.
2. Add and verify `aklovup@gmail.com` as an Email Routing destination (owner action on the verification email).
3. Confirm the free verified-destination sending path and runtime permissions for this account. Inspect Pages Functions binding support before choosing a direct Pages binding or a narrowly scoped Worker/runtime integration. Preserve the static Astro architecture.
4. Implement the server handler for `/api/contact`, reusing the shared validator. Enforce POST/content type, request-body limits, allowed origin, honeypot rejection, server-verified spam protection (such as free Turnstile), and durable rate/duplicate protection. Do not rely on client checks or the honeypot alone. Never place credentials in browser code or project data.
5. Restrict the sender/recipient, keep user input out of mail headers except a validated Reply-To, and return success only after the email service accepts the send. Return clear failures on rejected delivery.
6. Perform a real submission and verify receipt in the intended inbox. Only then enable `inquiryDelivery.enabled` and review production behavior.

## Tests

CI builds all five pages and runs existing Work/About regressions plus Contact validation and browser checks. Contact tests cover approved copy, labels/links, the real unavailable state, no accidental network submission, ten widths, mobile ordering, keyboard focus, reduced motion, no-JavaScript guidance, and the future client's loading/success/failure/duplicate behavior.

Future delivery-state tests use isolated browser response fixtures. The fixtures are not shipped, and they do not send email. A passing fixture is not evidence of real email delivery. No real inbox test can be performed until the domain and destination prerequisites are resolved.
