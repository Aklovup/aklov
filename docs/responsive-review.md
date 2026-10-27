# Responsive page review

Home, Solutions, About and Contact share a 12-viewport regression audit in `tests/responsiveness.browser.mjs`. Work's spatial interactions remain covered separately by `tests/showroom.browser.mjs`.

The matrix covers 320×568, 375×667, 390×844, 640×360, 641×900, 768×1024, 820×1180, 844×390, 1000×768, 1001×768, 1024×768 and 1440×1000. It checks actual text ranges, so the site's horizontal-overflow rule cannot hide clipping. It also measures composition overlap, reachable controls and at least 44px target heights with 24px minimum widths. Inline prose links and intentional decorative clipping, including the footer wordmark, are excluded from target and text-bound checks.

The audit found the existing page compositions already fit these sizes. Responsive fixes increase the shared header/footer logo links and Home's project-title links to full 44px tap areas. The approved palette, copy, page structure, portrait/card shape and Work tap-through protection are preserved.

Native touch checks cover all mobile menu destinations on a short screen, Home's selected-work jump, Solutions' five service anchors and the moving-sky pause/resume control. Contact values and text-field focus are checked across height/orientation changes; inputs retain 16px type. The captcha is a layout fixture and outgoing contact requests are intercepted. No inquiry is sent by this review. Existing Contact tests cover validation and delivery states separately.

CI saves full-page phone/tablet captures and a JSON report under the `responsiveness-review` artifact. Its dedicated job fails on any recorded layout/target issue. Chromium emulation checks browser behavior and layout; it does not establish physical-device frame rate or substitute for hardware testing in every browser.
