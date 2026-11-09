# MrBean site integration points for OpenAI Ads: pixel, Conversions API, product feed and paid UTMs (code study)

Scope and method: this is a read-only study of the local clone `/home/user/mrbean-shop` (repo `DeeAleKt/mrbean-shop`, branch `main`, commit `f9f18769367a8dc893a1871e16b29b50f7c29bb4`, 09.11.2026 15:40 +02:00). I did not build, install, run, commit or push anything. All sources are repo files; links point to GitHub blobs pinned to that commit with line anchors (the repo may be private, but the path and line numbers are exact for the local clone too). Feed statistics come from my own parse of `public/merchant-feed.xml` at that commit. OpenAI-specific API details (pixel snippet and global function name, event names, Conversions API endpoint/auth/payload, click-ID URL parameter, feed spec) were **not** researched here (out of scope: no web research). They appear only as placeholders. No secret values were read or printed; env vars are listed by name only.

## 1. Deploy/CI rules that constrain any tracking change

### Takeaway
Any change to code, data, `scripts/*.mjs` or `public/` deploys to production on push to `main` and costs about 11–12 of ~1,000 monthly Netlify credits. Markdown, `audits/`, `promo/` and `scripts/*.py` changes do not deploy. CI runs `tsc`, the build (which regenerates the feeds), `npm test` and `verify:static` before deploying, so tracking code has to ship together with its test mocks. Otherwise `tests/notifications.mjs` fails and blocks the deploy. Pixel, Conversions API and the `/cookie/` disclosure should go out as one release, and that release should not land near the Black Friday rebuilds on 20.11 and 01.12.

### Cited Findings
- Deploy trigger: `push` to `main`, with `paths-ignore`: `'**.md'`, `'audits/**'`, `'promo/**'`, `'imports/**'`, `'config/**'`, `'tsconfig.tsbuildinfo'`, `'.gitignore'`, `'.github/**'`, `'scripts/*.py'`, `'migration/**'`. Manual `workflow_dispatch` is available. — [.github/workflows/deploy.yml:7-30](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/.github/workflows/deploy.yml#L7-L30)
- The workflow comment says Netlify bills every deploy at about 11–12 credits of 1,000 per month. The brief repeats this (cycle starts on the 9th). — [deploy.yml:10-14](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/.github/workflows/deploy.yml#L10-L14); [docs/OPENAI-ADS-BRIEF-2026-11.md:106-110](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L106-L110)
- Black Friday price rebuilds are scheduled by cron at `3 22 19 11 *`, `3 23 19 11 *`, `3 22 30 11 *` and `3 23 30 11 *` (UTC), i.e. 00:03 and 01:03 Kyiv time on 20.11 and 01.12. A `schedule-guard` skips a duplicate rebuild of the same commit. — [deploy.yml:31-39, 46-62](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/.github/workflows/deploy.yml#L31-L62)
- `concurrency: group: netlify-prod, cancel-in-progress: true` — [deploy.yml:41-43](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/.github/workflows/deploy.yml#L41-L43)
- CI steps in order: `npm ci`, fix `MB_BUILD_TIME`, `node tests/sharp-native.mjs`, `npm audit --audit-level=low` (blocking on push), `npx tsc --noEmit --incremental false`, `npm run build`, `npm test`, `npm run verify:static`, `netlify-cli@17 deploy --prod --dir=out` (secrets `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`), then IndexNow with `continue-on-error`. — [deploy.yml:77-110](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/.github/workflows/deploy.yml#L77-L110)
- `prebuild` = `build-release.mjs && build-image-widths.mjs && build-merchant-feed.mjs && build-hotline-feed.mjs`. `test` = `tests/shop.mjs`, `home-motion.mjs`, `notifications.mjs`, `attribution.mjs`, `ads.mjs`. `verify:static` = `python3 tests/static-site.py`. — [package.json:7-13](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/package.json#L7-L13)
- The build regenerates feeds that Git tracks, and TypeScript rewrites `tsconfig.tsbuildinfo`. Developers should check the diff and not commit these artifacts automatically. — [AGENTS.md:31](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L31); [DEPLOY.md:60](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/DEPLOY.md#L60)
- One production release per finished, verified task, and only when publishing is part of the authorized task. — [AGENTS.md:33-35](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L33-L35); [DEPLOY.md:92](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/DEPLOY.md#L92)
- Secrets live in GitHub Secrets (CI) and Netlify env vars (Functions). They must never appear in code, docs, chat or logs. — [AGENTS.md:40](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L40)
- Do not send orders, forms, manager messages or payment requests without an instruction. A preview domain does not isolate external integrations. Netlify Preview (`.netlify.app`) is accepted by the handlers and can create real CRM records and messages. — [AGENTS.md:41](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L41); [DEPLOY.md:117](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/DEPLOY.md#L117)
- Keep `public/_redirects` and the host-guard in `app/layout.tsx`. Build new notifications through `netlify/telegram.ts` and `netlify/crm.ts`. — [AGENTS.md:43-44](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L43-L44)
- Checkout, Functions or payment changes need tests with mocked external requests covering errors, retries and partial success of channels. — [DEPLOY.md:69](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/DEPLOY.md#L69)
- Each deploy uses the env values present when it was created. — [DEPLOY.md:107](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/DEPLOY.md#L107)
- Brief boundaries: the pixel and new scripts go through site code with a build check, `/cookie/` gets an OpenAI disclosure, and the offer terms (оферта) stay unchanged. The owner does the account, business verification, payment and launch. — [docs/OPENAI-ADS-BRIEF-2026-11.md:104-125](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L104-L125)
- Test loader: `load()` in `tests/notifications.mjs` asserts `Unexpected dependency: ${id}` for any import that has no mock. `netlify/functions/order.ts` is loaded with mocks for exactly `'../../lib/attribution'`, `'../../lib/checkout-payment'`, `'../crm'`, `'../order-message'`, `'../store'` and `'../telegram'`. — [tests/notifications.mjs:5-14, 70-96](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/tests/notifications.mjs#L5-L96)

### Inferences
- A new import in `order.ts`, for example `import { sendOpenAiOrder } from '../openai'`, makes `npm test` fail with "Unexpected dependency" until a mock is added at `tests/notifications.mjs:72-79`. That failure blocks the production deploy.
- The new server module should do nothing when its env key is absent, like `crmConfigured()` and `telegramConfigured()` do. CI has no OpenAI key, so the tests then make no real network calls. The order test runs after the real `fetch` is restored at line 45.
- Avoid pushing to `main` from roughly 21:30 to 23:30 UTC on 19.11 and 30.11. `cancel-in-progress` would cancel a running scheduled price rebuild, and the backup cron at 01:03 Kyiv is the only fallback.
- Report files (`docs/OPENAI-ADS-*.md`, `audits/OPENAI-ADS-*.md`) do not trigger deploys.

### Gaps
- Whether OpenAI requires a pixel or domain verification file in `public/`. If it does, adding the file triggers a deploy.
- Whether changing a Netlify env var alone, such as a new OpenAI CAPI key, takes effect without a redeploy. DEPLOY.md:107 suggests env is fixed per deploy, so a redeploy may be needed after setting the key.

## 2. Client-side tracking today and where the OpenAI pixel events would plug in

### Takeaway
GA4 `G-LVKH1484PT` and Google Ads `AW-616714215` load from a single inline `<Script id="ga4" strategy="afterInteractive">` in `app/layout.tsx`, and only when `location.hostname === 'mrbean.com.ua'`. Every event call uses `window.gtag?.(...)`, so all tracking is a no-op on localhost and previews. The site already fires a full funnel at well-defined spots: `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info` and `order_submitted` + Ads conversion, plus lead and phone events. Each spot is where the matching OpenAI pixel call belongs. The order event has to be awaited together with the existing Ads conversion before the card-payment redirect.

### Cited Findings
- Constants: `GA_ID = 'G-LVKH1484PT'`, `ADS_ID = 'AW-616714215'`, `ADS_COVER_LEAD = \`${ADS_ID}/BP3ICJm2__AcEOefiaYC\``, `ADS_ORDER = \`${ADS_ID}/f9qoCNyakY8dEOefiaYC\``. The `ADS_ORDER` comment reads: "замовлення прийняте сайтом (CRM або резервний лист), з сумою та номером. Не оплата". — [lib/site.ts:54-63](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/site.ts#L54-L63)
- Host guard: `<Script id="host-guard" strategy="beforeInteractive">`. It allows `mrbean.com.ua`, `localhost`, `127.0.0.1` and `*.netlify.app`; any other host gets `location.replace('https://mrbean.com.ua'+location.pathname+location.search)`, so query strings and UTMs survive the redirect. — [app/layout.tsx:58-68](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/layout.tsx#L58-L68)
- GA4/Ads tag: `{GA_ID && (<Script id="ga4" strategy="afterInteractive">…)}`. Inside it, `if (location.hostname === 'mrbean.com.ua')` appends an async `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, defines `window.dataLayer` and `window.gtag`, then calls `gtag('js', new Date()); gtag('config', GA_ID); gtag('config', ADS_ID)`. The tag has no consent-mode calls. Remarketing was enabled on 03.11. — [app/layout.tsx:69-88](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/layout.tsx#L69-L88); [docs/BLACK-FRIDAY-2026.md:36-42](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/BLACK-FRIDAY-2026.md#L36-L42)
- `<PhoneClickTracker />` and `<AttributionCapture />` are mounted in `<body>` before `<CartProvider>`. — [app/layout.tsx:90-91](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/layout.tsx#L90-L91)
- `lib/ads.ts` helpers:
  - `trackAcceptedCoverLead()` checks the hostname and sends `conversion` to `ADS_COVER_LEAD` inside try/catch.
  - `trackOrderConversion(orderNo, value): Promise<void>` sends `conversion` with `{send_to: ADS_ORDER, value, currency: 'UAH', transaction_id: orderNo, event_callback}` and resolves on the callback or after 1,200 ms. It resolves at once off production or when `gtag` is missing.
  - [lib/ads.ts:1-38](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/ads.ts#L1-L38). Tests stub `window`/`gtag` and check production-only behavior, the 1.2 s timeout and missing `gtag`. — [tests/ads.mjs:1-42](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/tests/ads.mjs#L1-L42)
- `view_item`: a `useEffect` on `[configured]` fires once after the inbound `?f=&s=&c=` selection is applied. It sends `{currency:'UAH', value: price, items:[{item_id: slug(+'-kit'), item_name, price, ...adsItem}]}`, where `adsItem = { id: feedItemId(product, fabricId, size.id, kitOn), google_business_vertical: 'retail' }`. — [components/ProductClient.tsx:136-137, 233-241](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L233-L241)
- `add_to_cart` lives in `addToCart()`: it fires `gtag('event','add_to_cart',{currency, value: price, items:[{…, quantity:1, ...adsItem}]})`, then calls `add({key, slug, name, fabricName, colorName, sizeLabel, price, img, prepay, accessory, kit, bulky})` and `openDrawer(key)`. — [components/ProductClient.tsx:273-299](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L273-L299). This is the only add-to-cart call site: `useCart().add` is only used in ProductClient (line 67), and the cart page only has inc/dec/remove. — [components/CartClient.tsx:15](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CartClient.tsx#L15)
- Other ProductClient events: `cover_help_open` and `select_kit`. — [components/ProductClient.tsx:335, 474](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L335)
- Both product pages and cover pages render `ProductClient`, so its hooks cover ready chairs and covers alike. The cover page also renders `CoverRequestForm`. — [app/product/[slug]/page.tsx:75](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/product/%5Bslug%5D/page.tsx#L75); [app/chokhly/[slug]/page.tsx:34-36](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/chokhly/%5Bslug%5D/page.tsx#L34-L36)
- `begin_checkout` fires once (guarded by a ref) when the checkout opens with a non-empty cart. Items include `...adsItemFields(it.key)`. — [components/CheckoutClient.tsx:76-92](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L76-L92)
- Checkout state: `name`, `phone`, `email` ("Email · необов'язково") and `note`. — [CheckoutClient.tsx:68-71, 414-416](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L68-L71). Totals: `discount = promo ? round(subtotal*PROMO_CODES[promo]) : 0` and `total = subtotal - discount`. Delivery is not included, and sale prices are already in the item prices. Payment comes from `checkoutPayment(selectedPay, needsPrepay, delivery, total)`. — [CheckoutClient.tsx:207-216](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L207-L216)
- `submit()` sequence:
  1. Validation (name/phone, 10–12 digits, address, offer acceptance), lines 237-256.
  2. `add_payment_info` with `payment_type: pay`, lines 258-261.
  3. **`const orderNo = 'MB-' + Date.now().toString().slice(-6)`** (line 268) and `acceptedAt = new Date().toISOString()` (line 269).
  4. For card payments the mono invoice is created first, and an error stops the order (lines 271-288). For "parts" the mono parts request is created first (lines 290-306).
  5. Fallback text `payload` (lines 307-338), then the `structured` order `{orderNo, marketing: captureAttribution(), customer:{name, phone, email, newsletter:false}, delivery, payment, items[…], totals, custom}` (lines 341-353).
  6. `orderOk = await submitOrder(structured)`; if not ok, `await notifyOwner(subject, payload)` (lines 354-358).
  7. **`gtag('event','order_submitted',{payment_type, payment_policy:'oxford_cod_v1', transaction_id: orderNo, currency:'UAH', value: total, items:[…adsItemFields]})`** (lines 359-372), then `const adsSent = trackOrderConversion(orderNo, total)` (line 373).
  8. Clear the cart, line 379.
  9. Card: `await adsSent; window.location.href = payPageUrl`. Other methods: `router.push('/checkout/success/?n=…&pay=…')`. Lines 380-387.
  10. Any thrown error shows an error message and fires no conversion, lines 388-391.
  - [components/CheckoutClient.tsx:237-392](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L237-L392)
- `submitOrder()` POSTs `{order, 'bot-field': ''}` to `/.netlify/functions/order` and returns `{ok: res.ok && data.ok, crmId}`. `notifyOwner()` adds `attributionFields()`, posts to `/.netlify/functions/notify`, then falls back to formsubmit. — [lib/notify.ts:7-36](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/notify.ts#L7-L36)
- Lead: after the server accepts a cover request, `trackAcceptedCoverLead()` runs, then `gtag('event','generate_lead', coverLeadEvent(model, request))`. — [components/CoverRequestForm.tsx:42-44](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CoverRequestForm.tsx#L42-L44)
- Phone: a capture-phase document click listener sends `phone_click` for any `a[href^="tel:"]`. — [components/PhoneClickTracker.tsx:8-21](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/PhoneClickTracker.tsx#L8-L21)
- The success page reads only the `n` and `pay` params and fires no analytics. — [components/SuccessClient.tsx:8-13](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/SuccessClient.tsx#L8-L13)
- Event item IDs equal Merchant feed IDs: `feedItemId()` and `adsItemFields(key)`, enforced by a test. — [data/products.ts:890-909](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L890-L909); [tests/shop.mjs:227, 295-296](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/tests/shop.mjs#L227)
- No CSP header is set ("CSP поки не додаємо — інлайн-скрипти Next + gtag…"), so a third-party pixel script is not blocked by headers. — [public/_headers:1-3](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/_headers#L1-L3)
- Static export (`output: 'export'`, `trailingSlash: true`): there are no runtime server env vars for pages. The only build-time env is `MB_BUILD_TIME`. — [next.config.mjs:1-15](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/next.config.mjs#L1-L15)
- The brief names GA4 `order_submitted` as the key event, `trackOrderConversion` as the Ads tag (sum without delivery plus order number), tags in `app/layout.tsx`, and `order.ts` as the "natural place" for the Conversions API, with the key only in Netlify env. — [docs/OPENAI-ADS-BRIEF-2026-11.md:92-97](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L92-L97)

### Inferences
- **Pixel base code:**
  - Add it as a separate `<Script id="openai-pixel" strategy="afterInteractive">` next to `ga4` in `app/layout.tsx` (after line 88), behind the same inline `if (location.hostname === 'mrbean.com.ua')` gate.
  - Keep the pixel ID as a public constant in `lib/site.ts` next to `GA_ID`/`ADS_ID`. It is not a secret, and a static export cannot read runtime env.
  - Do not touch `window.gtag` or `dataLayer`, and keep `host-guard` first.
- **Wrapper helpers:** add them to `lib/ads.ts` (or a new `lib/openai-ads.ts`) using the `trackOrderConversion` pattern: hostname gate, optional global, try/catch, and a Promise capped at about 1.2 s. Extend `tests/ads.mjs` the same way.
- **Event-to-code mapping** (OpenAI event names to be confirmed):
  - Page view: pixel base code. App Router client-side navigation may need a manual page view on pathname change, using the same `usePathname` + `useEffect` pattern as `components/AttributionCapture.tsx:6-10`.
  - View content: `ProductClient.tsx:233-241`, together with `view_item`. Pass `adsItem.id` (feed ID), price and UAH.
  - Add to cart: `ProductClient.tsx:273-279`, inside `addToCart()`.
  - Initiate checkout: `CheckoutClient.tsx:78-92`.
  - Add payment info (optional): `CheckoutClient.tsx:258-261`.
  - Purchase / order accepted: right after `CheckoutClient.tsx:359-373`, with the same value `total` and currency UAH, content IDs from `adsItemFields(it.key).id`, and an `event_id` shared with the server event (see section 3).
  - Lead: `CoverRequestForm.tsx:42`.
  - Contact/phone: `PhoneClickTracker.tsx:13`.
- For card payments, line 383 awaits only `adsSent` before a full-page navigation to mono. The OpenAI order call must join that wait, e.g. `await Promise.all([adsSent, openAiSent])`, each capped at about 1.2 s. Otherwise the navigation can drop the request.
- Using the existing `value: total` (no delivery, after promo, sale price included) keeps GA4, Google Ads and OpenAI values comparable.
- Customer contact fields (name, phone, email) are available client-side at submit, but section 4 explains why advanced matching with them conflicts with current disclosures.

### Gaps
- OpenAI pixel snippet, global function name, event taxonomy and advanced-matching parameter format were not studied (no web research).
- Whether GA4 enhanced measurement already counts SPA history page views is configured in GA admin, not in code.

## 3. Server side: `order.ts`, payment flows and the right place for a Conversions API event

### Takeaway
The conversion should be "order accepted", fired from `netlify/functions/order.ts` once `ok` is known (line 87) and before the response (line 88). It should be production-only (`host === 'mrbean.com.ua'`), non-blocking, wrapped in try/catch, with an AbortController timeout of about 2–3 s, and it must never change `ok` or the status. Payment is not a usable primary conversion: the default method is cash on delivery with no online payment, and the existing Google primary conversion is explicitly "order accepted, not payment". For dedup, the client should generate an `eventId` next to `orderNo`, because `orderNo` repeats roughly every 16.7 minutes. Both the pixel and the `structured` order body should carry it. The OpenAI click ID should be added to the existing attribution whitelist so it reaches the server in `order.marketing`.

### Cited Findings
- Header comment: the function creates a KeepinCRM agreement and a Telegram card with buttons; `POST { order: SiteOrder } → { ok, crmId, telegram }`; Origin must be the own site. If CRM is down, the Telegram card still goes out marked "внести вручну". Env vars mentioned: `KEEPINCRM_API_KEY`, `TELEGRAM_*`. — [netlify/functions/order.ts:4-8](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L4-L8)
- Origin gate: `ALLOWED_HOSTS = ['mrbean.com.ua', 'localhost']` plus `/\.netlify\.app$/`, taken from the `origin` or `referer` header, otherwise 403 `forbidden`. The handler uses the Functions v2 signature `export default async (req: Request)`. — [order.ts:15, 29, 34-37](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L15-L37)
- Request schema `validOrder()`:
  - `orderNo` matches `/^MB-\d{4,10}$/`;
  - `customer.name` and `customer.phone` are strings;
  - `delivery.label` and `payment.label` are strings;
  - 1–40 items, each with string `name`, number `price` and `qty` between 1 and 99;
  - `totals.total` is a number in [0, 10,000,000).
  - [order.ts:17-27](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L17-L27)
- Responses:
  - non-POST → 405 `{error:'POST only', v:5, crm, telegram}`;
  - bad JSON → 400;
  - honeypot `bot-field` → `{ok:true}` without processing;
  - invalid order → 400 `bad order`;
  - invalid COD terms (`validCodPayment`) → 400.
  - [order.ts:32, 39-44](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L32-L44)
- Sanitizing: `order.marketing = cleanAttribution(order.marketing)`, and name, phone, email, address and note are trimmed to 120, 30, 120, 300 and 1,000 characters. — [order.ts:45-51](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L45-L51)
- CRM: `if (crmConfigured()) try { crmId = (await createAgreement(order)).id } catch { crmError … console.error }`. — [order.ts:53-62](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L53-L62)
- Telegram: if configured, photos and the card go to `orderChatIds()` via `Promise.allSettled`, and `saveCard()` stores the state in Netlify Blobs when `crmId` exists and a send succeeded. — [order.ts:64-84](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L64-L84)
- Result: `const ok = Boolean(crmId) || telegram;` then `return json({ ok, crmId, telegram, ...(crmError ? { crmError } : {}) }, ok ? 200 : 502)`. — [order.ts:86-88](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L86-L88)
- `SiteOrder` type: `orderNo; marketing?: Attribution; customer {name, phone, email?, newsletter?}; delivery {id, label, address, bulky?}; payment {id, label, prepayShare, prepayAmount, restAmount, partsOrderId?}; items: OrderItem[] {slug, name, fabricName?, colorName?, sizeLabel, price, qty, kit?, accessory?, bulky?, img?}; totals {subtotal, discount, promo?, total, gift?, salePercent?}; custom {needsPrepay, deposit?, note?, acceptedAt?, offerVersion?}`. — [netlify/crm.ts:95-99, 113-122](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/crm.ts#L113-L122)
- Existing outbound-call patterns: `crm()` uses an AbortController with `timeoutMs = 12000` and an `X-Auth-Token` from env (lines 38-59). `tg()` uses an 8,000 ms timeout and returns null on error (`netlify/telegram.ts:30-49`). — [netlify/crm.ts:38-59](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/crm.ts#L38-L59); [netlify/telegram.ts:30-49](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/telegram.ts#L30-L49)
- **Env var names used in code** (names only):
  - CRM: `KEEPINCRM_API_KEY`, `CRM_OFFICE_HASH`, `CRM_RESPONSIBLE_ID`, `CRM_PURSE_ID`, `CRM_PAYMENT_CATEGORY_ID` ([netlify/crm.ts:4-8, 31, 39-42, 166, 208-209](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/crm.ts#L4-L8));
  - Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` ([netlify/telegram.ts:1-3, 10-16](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/telegram.ts#L1-L16));
  - mono: `MONO_TOKEN` ([netlify/functions/mono-invoice.ts:14](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-invoice.ts#L14), [mono-webhook.ts:79](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-webhook.ts#L79)); `MONO_PARTS_API`, `MONO_PARTS_STORE_ID`, `MONO_PARTS_SECRET` ([netlify/functions/mono-parts-create.ts:12, 27-28](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-parts-create.ts#L12-L28));
  - Nova Poshta: `NP_API_KEY` ([netlify/functions/np.ts:28](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/np.ts#L28));
  - build time: `MB_BUILD_TIME`;
  - CI only: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.
  - No OpenAI env var exists yet (grep of `app components lib netlify data scripts` found no OpenAI code).
- The server does not recompute prices; amounts come from the client catalog and the manager checks them. — [netlify/functions/mono-invoice.ts:21-22](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-invoice.ts#L21-L22)
- **Payment flows:**
  - Card: the browser first calls `mono-invoice` with `{amount (kopecks), orderNo}`. It creates the invoice with `reference: orderNo`, `redirectUrl: …/checkout/success/?n=${orderNo}&pay=card` and `webHookUrl: …/mono-webhook`, and returns `{pageUrl, invoiceId}` ([mono-invoice.ts:3-4, 28-47](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-invoice.ts#L28-L47)). Card and parts are 100% prepaid; COD is 0% prepaid ([lib/checkout-payment.ts:3-12](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/checkout-payment.ts#L3-L12)).
  - `mono-webhook`: verifies the ECDSA `X-Sign`. On `success` or `reversed` it calls `findAgreementByOrderNo(inv.reference)`, `addPayment`, `addComment`, updates the Telegram card through `loadCardByOrderNo`, and notifies the owner. The amount is the invoice amount, i.e. the prepayment. — [netlify/functions/mono-webhook.ts:92-114, 124-164](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-webhook.ts#L124-L164)
  - Parts: `state === 'SUCCESS'` leads to `addPayment` in CRM. — [netlify/functions/mono-parts-callback.ts:77-85](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/mono-parts-callback.ts#L77-L85)
  - COD: the default selection is `useState('cod')` ([CheckoutClient.tsx:97](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L97)). COD is allowed only for standard (non-custom, i.e. Oxford) orders with Nova Poshta or pickup ([lib/checkout-payment.ts:3-5, 16-28](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/checkout-payment.ts#L16-L28)).
- The docs confirm that "GA4-подія `order_submitted` відправляється після прийняття замовлення, до перенаправлення на оплату mono. Серверний `purchase` після перевіреної оплати ще не реалізовано". — [docs/CRM-TELEGRAM.md:88](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/CRM-TELEGRAM.md#L88)
- Paid Google conversions go through a manual or offline CRM import: action `7778916851`, "MrBean | Оплачене замовлення CRM", Purchase / import from clicks, **SECONDARY**, keyed on GCLID + order_id + value + payment time, with contacts-based enhanced conversions **off**. — [docs/CRM-ADS-IMPORT-2026-09-19.md:26, 34, 69](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/CRM-ADS-IMPORT-2026-09-19.md#L26)
- Netlify Blobs `CardState` holds the full `order`, including `marketing`, keyed `card:<crmId>` and `no:<orderNo>`. — [netlify/store.ts:8-20, 24-47](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/store.ts#L8-L47)

### Inferences
- **Recommended placement:**
  - Create a new `netlify/openai.ts`, modeled on `crm.ts` and `telegram.ts`: `openaiConfigured()` checks a new env var (name TBD, e.g. `OPENAI_ADS_CAPI_KEY`), and `sendOrderEvent(order, meta)` runs with an AbortController of about 2–3 s and returns a boolean without throwing.
  - In `order.ts`, after line 87, add `if (ok && host === 'mrbean.com.ua' && openaiConfigured()) { await sendOrderEvent(order, …).catch(e => console.error('OpenAI CAPI failed', …)) }`.
  - Leave `ok` and the HTTP status unchanged. Never log the key, and never log the payload if it contains contacts.
  - Add a `'../openai'` mock in `tests/notifications.mjs:72-79`.
- **Why gate on `host`:** the function accepts `localhost` and `*.netlify.app` origins (line 37), so previews and local tests would otherwise send real conversions. The `host` variable from lines 34-36 is already computed.
- **Latency:** the client waits for `/order` before firing its own events. CRM (up to 12 s) and Telegram (8 s) are already awaited, so an awaited CAPI call adds at most its timeout. Netlify Functions v2 may offer `context.waitUntil` to send after the response, but its availability in this runtime needs verification.
- **Fallback path:** if `/order` fails (502) and the browser fallback `notifyOwner` succeeds, the client-side pixel still fires but no server event is sent. That is acceptable, since the shared `event_id` lets the pixel event count on its own.
- **`event_id`:**
  - `orderNo` is already Google's `transaction_id`, but it is `'MB-' + last 6 digits of Date.now()` in milliseconds. It wraps every 1,000,000 ms (about 16.7 minutes), so equal order numbers can recur over time. This is an inference from `CheckoutClient.tsx:268`.
  - Recommendation: generate `eventId` in `CheckoutClient` next to lines 268-269, e.g. `crypto.randomUUID()` or `${orderNo}-${acceptedAt}`.
  - Put it in `structured` (lines 341-353) and pass it to the pixel order call. Add an optional `eventId?: string` to `SiteOrder` (`crm.ts:113-122`) and validate it in `order.ts` with a strict regex, keeping it optional so older or cached clients still validate.
  - CRM and Telegram ignore unknown fields: `orderComment` and `orderCardHtml` read only named fields. `saveCard` would store it, which is harmless.
- **Click ID:**
  - Add OpenAI's click parameter (name TBD) to `CLICK_KEYS` in `lib/attribution.ts:3`. It then flows automatically: `AttributionCapture` → sessionStorage → `structured.marketing` (`CheckoutClient.tsx:343`) → `cleanAttribution` (`order.ts:45`) → available to CAPI as `order.marketing[...]`. It also appears in the CRM comment and the fallback notify fields (section 8).
  - The validation regex `/^[a-zA-Z0-9_-]{1,256}$/` (`lib/attribution.ts:18`) silently drops IDs with other characters, so the real format must be checked.
- **Optional secondary "paid" event:**
  - It could come from the `mono-webhook` success branch (lines 124-152), using `inv.reference`, the amount and `card.order.marketing`.
  - The card exists only when CRM and Telegram both succeeded (`order.ts:80-83`), amounts are prepayments, webhooks can repeat, and COD orders never produce one. It would need its own idempotent event ID (e.g. `paid-<invoiceId>`) and should not be the optimization target.
- **Data minimization:** sending hashed email or phone through CAPI would contradict the `/cookie/` statement and offer clause 9.3 (section 4). The first version should send only the event ID, click ID, value, currency, order number and item IDs, plus the technical request data OpenAI requires, which needs a privacy check.

### Gaps
- OpenAI Conversions API endpoint, auth scheme, required fields (IP, user agent, click ID, timestamp), dedup window and test mode were not studied.
- Whether Netlify Functions v2 `context.waitUntil` and `context.ip` are available in this deployment was not verified. The code only uses `req`.
- Real-world share of COD versus card orders (CRM data) was not examined.

## 4. Cookie and privacy page, consent

### Takeaway
`/cookie/` is a Google-only disclosure built from a `SECTIONS` array, so OpenAI paragraphs or a new "Що отримує OpenAI" card can be added without touching layout code. The title, meta description, intro line and `UPDATED` date also need updating. There is no cookie consent banner and no Google consent mode. The page and offer clause 9.3 promise that contact data is not shared with Google or other third parties, so OpenAI advanced matching with hashed contacts would require changing those promises, which needs the owner's decision.

### Cited Findings
- The file comment calls it the Google Ads remarketing disclosure, "Не частина оферти". `UPDATED = '3 листопада 2026'`. The metadata title is "Файли cookie та реклама Google", and the description mentions only Google analytics, order measurement and remarketing. — [app/cookie/page.tsx:8-24](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/cookie/page.tsx#L8-L24)
- `SECTIONS: [string, ReactNode[]][]` has four cards:
  - "Що працює на сайті": GA4; Google Ads including remarketing; local storage of cart, promo and ad tags (lines 27-31).
  - "Що отримує Google": a browser ID cookie, pages, product codes viewed or added, order number and sum (line 33), and **"Ім'я, телефон, адресу та e-mail із форми замовлення ми Google не передаємо"** (line 34), plus a Google partner-sites link (line 35).
  - "Як відмовитися": adssettings, the GA opt-out add-on, browser settings (lines 37-41).
  - "Строки й контакти": cookie lifetime 90 days to 2 years, set by Google; contact email (lines 42-45).
  - [app/cookie/page.tsx:26-46](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/cookie/page.tsx#L26-L46)
- The cards render generically through `SECTIONS.map`. The intro reads "Що збирають аналітика й реклама Google на mrbean.com.ua…". — [app/cookie/page.tsx:65-80](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/cookie/page.tsx#L65-L80)
- The footer links to `'/cookie/'` as "Cookie та реклама". — [components/Footer.tsx:19](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/Footer.tsx#L19)
- No consent banner or consent mode: the only "consent" code is newsletter double opt-in (`SubscriptionForm.tsx`, `lib/subscription.ts`), and `layout.tsx` has no `gtag('consent', …)`. — [components/SubscriptionForm.tsx:11-19](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/SubscriptionForm.tsx#L11-L19); [app/layout.tsx:74-87](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/layout.tsx#L74-L87)
- Offer section 9:
  - 9.1: consent to processing name, phone, address and email.
  - 9.2: the purpose is performing the contract.
  - **9.3: "Дані передаються перевізнику виключно в обсязі, необхідному для доставки, і не передаються третім особам для інших цілей."**
  - 9.4: access and deletion via email.
  - [app/oferta/page.tsx:86-90](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/oferta/page.tsx#L86-L90)
- Changing the offer requires bumping `OFFER.version` (currently `'1.1'`) and archiving the previous edition. The brief says the offer must not be changed. — [lib/site.ts:42-52](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/site.ts#L42-L52); [AGENTS.md:25](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L25); [docs/OPENAI-ADS-BRIEF-2026-11.md:124-125](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L124-L125)
- Precedent: the Google remarketing launch on 03.11 added the `/cookie/` disclosure and left the offer and `OFFER.version` 1.1 unchanged. — [docs/BLACK-FRIDAY-2026.md:42](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/BLACK-FRIDAY-2026.md#L42)

### Inferences
- Where the OpenAI text goes:
  - (a) one bullet in "Що працює на сайті" (line 28-30 area): the OpenAI pixel measures which ChatGPT ads bring orders;
  - (b) a new card "Що отримує OpenAI" after line 36, mirroring the Google card: browser identifier, pages, product codes, order number and sum, and a server-side order event;
  - (c) OpenAI opt-out instructions in "Як відмовитися" (the URL needs verifying);
  - (d) a generalized metadata title and description at lines 13-15 and 18-21, e.g. "Файли cookie та реклама Google і OpenAI", plus the intro at line 66 and `UPDATED` at line 10.
- As long as no contact data goes to OpenAI, the "contacts are not passed" sentence can be extended to cover OpenAI, and the offer stays untouched, which matches the brief.
- Enabling OpenAI advanced matching with hashed email or phone would conflict with offer 9.3 and the cookie statement. That is an owner and legal decision and would mean changing the offer version.

### Gaps
- Whether OpenAI's advertiser terms require a consent banner or specific notice wording for Ukraine. The opt-out URL is also unknown. Both are outside this code study.

## 5. Product feed: current Google Merchant feed and reuse for OpenAI

### Takeaway
`public/merchant-feed.xml` is a Google RSS 2.0 feed in the `g:` namespace, generated at prebuild from `data/products.ts`. It has 214 unique items and no UTMs. Ready products use `g:structured_title` with sizes, liters and the brand; plain `g:title` appears only on 95 cover items. All 97 covers lack `google_product_category`. Nothing has GTIN/MPN, color or custom labels. Availability is hardcoded to `in_stock`. An OpenAI feed can reuse the same IDs and fields through a new prebuild script and its own test.

### Cited Findings
- Format: `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">` with a channel title, link and description. The generator transpiles `data/products.ts` and `data/color-photos.ts` with the existing `typescript` package. — [scripts/build-merchant-feed.mjs:1-33, 284-296](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L284-L296)
- Size and item counts from my parse of the committed file: **214 `<item>`s, 214 unique `g:id`s, 761,088 bytes**. — [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml). The brief also says 214 items. — [docs/OPENAI-ADS-BRIEF-2026-11.md:98-99](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L98-L99)
- `product_type` distribution: Груші 44; Лежаки 18; Пуфи 18; Крісла-подушки 6; М'ячі 6; Дивани 6; Комплекти 18; Наповнювач 1; "Чохли для безкаркасних меблів" 97. — [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml)
- Field presence (out of 214 items):
  - every item: `g:id`, `g:link`, `g:image_link`, `g:description`, `g:brand` (MrBean), `g:condition` (new), `g:availability` (`in_stock`), `g:identifier_exists` (`no`), `g:shipping_label`, `g:product_type`, `g:price`;
  - 213 items (all except filler): `g:sale_price` + `g:sale_price_effective_date`, `g:material`, `g:size`, `g:item_group_id`;
  - 119 items: `g:structured_title` (`digital_source_type` + `content`); 95 items: plain `g:title`;
  - 117 items: `g:google_product_category` (all 97 covers lack it);
  - multi-value fields: 950 `g:product_highlight` values, 1,065 `g:product_detail` blocks;
  - only 9 items: `g:shipping`; 2 items: `g:additional_image_link` (4 URLs);
  - **absent**: gtin, mpn, color, custom_label_0–4, shipping_weight, return policy.
  - [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml)
- Titles: `readyTitle()` builds "Крісло-мішок " (for the pear category) + name + `sizeInTitle()` + " — " + fabric + ", з наповнювачем N л | MrBean". It is wrapped in `structuredTitle()` with `digital_source_type: 'trained_algorithmic_media'`. — [build-merchant-feed.mjs:67-68, 114-126](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L114-L126). A test asserts that no plain `g:title` appears when `structured_title` is present ("Plain title would override structured title") and that titles are at most 150 characters. — [tests/shop.mjs:236-243](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/tests/shop.mjs#L236-L243)
- Five sample titles from the file, with regular price / Black Friday `sale_price`:
  1. `grusha-oxford`: "Крісло-мішок Груша M 115 × 75 см — Оксфорд 600D, з наповнювачем 180 л | MrBean", 1595 / 1435 UAH
  2. `grusha-oxford-l`: "Крісло-мішок Груша L 135 × 90 см — Оксфорд 600D, з наповнювачем 300 л | MrBean", 2095 / 1885
  3. `grusha-oxford-xl`: "Крісло-мішок Груша XL · Гігант 150 × 110 см — Оксфорд 600D, з наповнювачем 600 л | MrBean", 2995 / 2695
  4. `kreslo-monaco-oxford`: "Крісло Monaco 80 × 80 × 90 см — Оксфорд 600D, з наповнювачем 300 л | MrBean", 2500 / 2250
  5. `grusha-kit-oxford`: "Комплект чохлів для крісла-мішка «Груша» M — Оксфорд 600D, без наповнювача", 890 / 800
  - Plain-title cover example: `dyvan-kit-oxford` "Чохол для «Безкаркасний диван» S — Оксфорд 600D, без наповнювача", 1250 / 1125.
  - Filler: `napovniuvach-eps` "Наповнювач для крісел-мішків EPS — 100 л", 495, no sale price.
  - [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml)
- Links have no UTMs (0 occurrences of `utm_`):
  - ready items: `${SITE_URL}/product/${slug}/?f=${fabricId}&s=${size}`;
  - covers: `${SITE_URL}/chokhly/${slug}/?f=${fid}&s=${size}`;
  - filler: `/product/napovniuvach-eps/?s=l100`.
  - [build-merchant-feed.mjs:198, 229, 265](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L229)
- Item selection: one item per fabric at the first (smallest) size. Exceptions: Груша Oxford gets separate M, L and XL items (lines 214-218), and Груша Oxford cover kits get M and L (line 252). Filler is a single 100 л item, so 50 л / 300 UAH is not in the feed (lines 188-207). — [build-merchant-feed.mjs:186-282](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L186-L282)
- `availability: 'in_stock'`, `condition: 'new'`, `brand: 'MrBean'` and `identifier_exists: 'no'` are hardcoded. — [build-merchant-feed.mjs:201-204, 235-238, 276-277](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L235-L238). AGENTS.md, by contrast, says only part of the range (usually Oxford) is in stock and the rest is sewn in 2–3 days. — [AGENTS.md:22](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L22)
- Sale handling: `g:price` keeps the regular price. `g:sale_price` and `g:sale_price_effective_date = 2026-11-20T00:00+02:00/2026-11-30T23:59+02:00` appear while `priceTime() <= SALE.end`. — [build-merchant-feed.mjs:179-184](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L179-L184); [docs/BLACK-FRIDAY-2026.md:20-22](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/BLACK-FRIDAY-2026.md#L20-L22)
- Description and highlights:
  - Description: product desc + "Тип / Матеріал покриття / Розмір / Наповнювач … уже в ціні" + construction + "Пошиття 2–3 робочі дні у власному цеху MrBean (Україна)."
  - Highlights for ready items include "Пошиття 2–3 робочі дні у власному цеху в Києві" and "Гарантія 24 місяці на шви й фурнітуру".
  - `product_detail` includes "Країна виробництва: Україна".
  - [build-merchant-feed.mjs:112, 128-171](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L128-L171)
- Categories: `GOOGLE_CATEGORY` maps grusha, myach, lezhak and podushka to 438 (Bean Bag Chairs), puf to 458, dyvan to 460, komplekt to 6348 and aksesuar to 505406. Covers use only `g:product_type: 'Чохли для безкаркасних меблів'`. — [build-merchant-feed.mjs:54-79, 263](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L54-L79)
- Shipping:
  - Ready Груша items with `filledShippingRange` get `g:shipping` "Нова пошта — вантажне відділення" at the upper bound, 400 or 500 UAH.
  - Oxford Груша kits get "Нова пошта — до відділення" at 125 or 171 UAH.
  - Others carry only `shipping_label` (standard, bulky or covers).
  - [build-merchant-feed.mjs:66, 240, 278](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L240); [data/products.ts:231-232](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L231-L232)
- Images: `imageLink()` picks the first existing file among `-1-1200.jpg`, `-1-600.jpg` and `-1.jpg` under `public/assets/`. — [build-merchant-feed.mjs:38-48](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/build-merchant-feed.mjs#L38-L48)
- Build and serving: the prebuild step (package.json:7) writes `public/merchant-feed.xml` (build-merchant-feed.mjs:294-296), served at `https://mrbean.com.ua/merchant-feed.xml`. — [GOOGLE-ADS-PLAN.md:27-28](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/GOOGLE-ADS-PLAN.md#L27-L28). The helpers are module-private (only `main()` runs), and nothing is exported.
- Tests: `tests/shop.mjs` checks every merchant and hotline item's price against the variant its URL selects, `g:id === feedItemId(...)`, sale price math, the effective date, duplicates and title length. The loop is hardcoded to `['merchant-feed.xml','hotline-feed.xml']`. — [tests/shop.mjs:205-249](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/tests/shop.mjs#L205-L249)
- Context: the free ChatGPT merchant catalog (`chatgpt.com/merchants`) works only for US shoppers, and product ad formats are "для України не підтверджено". The audit plans to convert the feed to OpenAI format once Ukraine opens. Titles were enriched with cm, liters and the brand on 09.11, and `grusha-oxford-xl` was added. — [docs/OPENAI-ADS-BRIEF-2026-11.md:47-53](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L47-L53); [audits/CHATGPT-VISIBILITY-2026-11-09.md:135-142, 215-224](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/audits/CHATGPT-VISIBILITY-2026-11-09.md#L215-L224)

### Inferences
- **Reuse path:** add `scripts/build-openai-feed.mjs`, either reusing the `loadProducts()` pattern with shared helpers factored out of `build-merchant-feed.mjs`, or transforming the generated `merchant-feed.xml`. Append it to `prebuild` after the merchant feed, output a new file in `public/`, and add a dedicated test modeled on `tests/shop.mjs:205-249`, since that loop only covers two files.
- **Field mapping:** keep the same `g:id`s so pixel content IDs, the feed and Google remarketing all match. Take `title` from `g:structured_title/g:content`, or `g:title` for covers. Carry over link, image (+additional), price, sale_price with its window, availability, brand, condition, item_group_id, product_type, google_product_category, material, size, description and highlights.
- **Gaps to fill for OpenAI:**
  - category for covers;
  - color, since items are per fabric and per-color items lack their own photos (the audit warns against fake per-color items);
  - real availability or lead-time semantics for made-to-order;
  - possibly a filler 50 л item.
- **Feed links:** do not add UTMs to `merchant-feed.xml` links, because that would mix Google Shopping traffic. If OpenAI does not auto-tag feed clicks, the OpenAI feed could carry its own `utm_source=chatgpt_ads`-style parameters. The extra parameters do not break URL-variant selection: ProductClient reads only `f`, `s`, `c`, `a`, `d` and `kit`.
- A change to `scripts/*.mjs` or `public/` triggers a deploy (section 1).

### Gaps
- OpenAI product feed spec (format such as TSV/CSV/JSON/XML, required fields, delivery by URL fetch or upload, refresh cadence) and whether UA merchants and UAH prices are accepted were not studied.

## 6. Landing pages useful for ads

### Takeaway
The best ad landings are product URLs with a preselected fabric and size. They show the price (with the struck-through regular price during the sale), "Шиємо 2–3 робочі дні · відправка до <date>", "Нова пошта по Україні — 1–3 дні після пошиття", COD for Oxford, card/Apple/Google Pay and parts, and a "Гарантія 24 місяці" row in the spec table. Category landings under `/catalog/<slug>/` show prices on cards and "від" prices in titles. The Kyiv page carries the local facts (Гатне, pickup by arrangement, courier). URLs should use a trailing slash.

### Cited Findings
- Product URL parameters: `?f=` (fabric), `?s=` (size), `?c=`/`?a=` (color/accent), `?d=` (design) and `?kit=1` (covers) are applied on load. The selection is mirrored back into the URL with `history.replaceState`. — [components/ProductClient.tsx:205-231, 243-250](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L205-L250); [DEPLOY.md §4](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/DEPLOY.md)
- Product page facts:
  - heading meta: "Шиємо 2–3 робочі дні" + "відправка до {shipBy}" (line 328);
  - buybox ETA: "…до {shipBy} · Нова пошта 1–3 дні" (line 611);
  - perks: "Нова пошта по Україні — 1–3 дні після пошиття"; COD "Без передоплати — оплатіть при отриманні Новою поштою або самовивозі" for non-prepay fabrics; card/Apple Pay/Google Pay/Частинами (lines 650-667);
  - links to `/dostavka/` and `/oplata-povernennya/` (lines 670-673);
  - spec rows: "Термін пошиття 2–3 робочі дні" and "Гарантія 24 місяці на шви й фурнітуру" (lines 726-727).
  - [components/ProductClient.tsx:328, 611, 650-673, 726-727](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L650-L673)
- Concrete product landings, using feed links and products.ts:
  - `/product/grusha/?f=oxford&s=m` (1,595), `&s=l` (2,095), `&s=xl` (2,995);
  - `/product/kreslo-monaco/?f=oxford` (2,500);
  - `/product/dyvan/?f=oxford&s=s` (2,345), plus M 2,995 and L 4,195;
  - `/product/napovniuvach-eps/?s=l100` (495) and `?s=l50` (300);
  - covers: `/chokhly/grusha/?f=oxford&s=m` (890) and `&s=l` (1,145).
  - [data/products.ts:231-233, 312, 485-487, 661-662](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L231-L233); [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml)
- The cover hub `/chokhly/` has the title "Чохли для крісел-мішків — Груша від {pearKit} ₴" and shows prices, a delivery mention and a guarantee mention. Cover pages also embed `CoverRequestForm` (lead conversion). — [app/chokhly/page.tsx:24-31, 114](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/chokhly/page.tsx#L24-L31)
- 15 category or intent landings at `/catalog/<slug>/`: `grushi`, `lezhaky`, `pufy`, `podushky`, `dyvany`, `miachi`, `komplekty`, `oksford`, `velur`, `ekoshkira`, `dlya-dytyny`, `dlya-heimera`, `dlya-dachi`, `dlya-ofisu`, `podarunky` (data/landings.ts:50-1045). Their canonical is `/catalog/${slug}/` (`app/catalog/[landing]/page.tsx:33-35`). Example title: "Крісла-груші від виробника — моделі й ціни від {GRUSHI_FROM}" (data/landings.ts:53). The page template prints prices but has no delivery or guarantee strings (my grep). — [data/landings.ts:43-53](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/landings.ts#L43-L53); [app/catalog/[landing]/page.tsx:33-35](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/catalog/%5Blanding%5D/page.tsx#L33-L35)
- `/krisla-mishky/` is the city hub ("Крісла-мішки по містах України — доставка від виробника"). It mentions delivery, 2–3 days and Гатне but shows no prices. There are 14 city pages at `/krisla-mishky/<city>/` (kharkiv, lviv, odesa, dnipro, zaporizhzhia, vinnytsia, poltava, ivano-frankivsk, …) with prices and delivery. — [app/krisla-mishky/page.tsx:9-14](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/krisla-mishky/page.tsx#L9-L14); [app/krisla-mishky/[city]/page.tsx:29](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/krisla-mishky/%5Bcity%5D/page.tsx#L29); [data/cities.ts](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/cities.ts)
- `/krisla-mishky-kyiv/`: title "Крісло-мішок Київ — купити від {CHAIR_FROM} у виробника". Description: "склад у Гатному за 15 хв від міста, самовивіз за домовленістю, кур'єр, пошиття 2–3 дні". FAQ: "цех у Києві, а склад і самовивіз — у Гатному"; in-stock Oxford items ("Зателефонуйте перед візитом"); courier price set by the manager. — [app/krisla-mishky-kyiv/page.tsx:10-40](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/krisla-mishky-kyiv/page.tsx#L10-L40)
- Trust pages:
  - `/dostavka/`: "Нова пошта 1–3 дні … Від 3 000 ₴ — наповнювач у подарунок", and "Після відправлення — 1–3 дні залежно від міста" — [app/dostavka/page.tsx:14-22](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/dostavka/page.tsx#L14-L22)
  - `/oplata-povernennya/`: "Гарантія 24 місяці на шви та фурнітуру з моменту отримання" — [app/oplata-povernennya/page.tsx:94](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/oplata-povernennya/page.tsx#L94)
  - `/pro-tsekh/`: "виробник … з 2017 року. Власний цех у Києві, склад і самовивіз — у Гатному" — [app/pro-tsekh/page.tsx:10-12](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/pro-tsekh/page.tsx#L10-L12)
- `robots` disallows `/cart/` and `/checkout/`, and `trailingSlash: true`. — [app/robots.ts:10](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/robots.ts#L10); [next.config.mjs:4](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/next.config.mjs#L4)
- The audit found ChatGPT organic already recommends MrBean for "where to buy / manufacturer" prompts but rarely for specific-product prompts. — [audits/CHATGPT-VISIBILITY-2026-11-09.md:8-20](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/audits/CHATGPT-VISIBILITY-2026-11-09.md#L8-L20)

### Inferences
- Map ad groups to landings:
  - product-size intent ("груша XL / XXL для двох", "оксфорд до 2500") → `/product/grusha/?f=oxford&s=xl|l` or `/product/kreslo-monaco/?f=oxford`;
  - covers → `/chokhly/grusha/?f=oxford&s=m`;
  - sofas → `/product/dyvan/?f=oxford&s=s` or `/catalog/dyvany/`;
  - Kyiv or local → `/krisla-mishky-kyiv/`;
  - gifts → `/catalog/podarunky/`; kids → `/catalog/dlya-dytyny/`; gamers → `/catalog/dlya-heimera/`.
- Always use the trailing-slash form so no redirect hop is needed. The host guard and the product params keep UTMs intact.

### Gaps
- I did not render pages or check mobile above-the-fold content. Delivery and guarantee visibility was inferred from source strings only.

## 7. Business facts and current prices allowed in ad copy (with discrepancies)

### Takeaway
The prices in the brief match `data/products.ts` exactly:
- Груша M 1,595, L 2,095, XL · Гігант 2,995;
- Monaco 2,500;
- Oxford pear cover kit from 890 (L 1,145);
- filler 300 / 495.

During Black Friday (20–30.11), everything except filler is −10%. The fact list in the brief matches the site code, but three items ("з 2017", "Нова пошта 1–3 дні", "гарантія 24 місяці") are not in AGENTS.md, despite the brief saying "лише ті, що в AGENTS.md". They come from the site code. Two wording details matter for ad copy: delivery takes 1–3 days *after dispatch*, and same-day dispatch applies only to in-stock (usually Oxford) items.

### Cited Findings
- AGENTS.md owner facts (24.09.2026):
  - the sewing workshop is in Kyiv and closed to outsiders (no visits or filming);
  - Гатне, вул. Шевченка, 56 is a warehouse, filling point and pickup point, not the workshop;
  - "частина виробів, зазвичай з оксфорду, є в наявності — самовивіз і відправка можливі в день замовлення, решту шиють під замовлення за 2–3 дні";
  - "+38 (067) 347-45-67 — телефон менеджера".
  - Also: fabric samples are not sent; pickup only by arrangement; texts in Ukrainian; don't invent stats, reviews, savings, delivery tariffs or cover compatibility.
  - [AGENTS.md:17-23](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L17-L23)
- Brief fact list: власний цех у Києві з 2017 року; Гатне — склад, наповнення й самовивіз; частина виробів з оксфорду в наявності; решту шиємо 2–3 робочі дні; Нова пошта — 1–3 дні; гарантія 24 місяці на шви й фурнітуру; the phone. Copy rules: Ukrainian only, only listed facts, no invented reviews, ratings or delivery prices, no compatibility promises. — [docs/OPENAI-ADS-BRIEF-2026-11.md:66-75, 119-123](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L66-L75)
- Site constants: `phoneHuman: '+38 (067) 347-45-67'`, `email: 'ask.mister.bean@gmail.com'`, address "вул. Шевченка, 56, Гатне, Київська область, 08160", opening hours Mo–Fr 09–18 / Sa 10–17 / Su 10–16, `foundingDate: '2017'` ("Перше крісло продали на початку 2017-го"). — [lib/site.ts:7-30](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/site.ts#L7-L30)
- Site-wide meta description: "власний цех у Києві, 6 тканин, 140+ кольорів, пошиття за 2–3 дні, Нова пошта 1–3 дні. Знімні чохли, гарантія 24 місяці." — [app/layout.tsx:37-38](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/layout.tsx#L37-L38)
- Regular prices in `data/products.ts`:
  - Груша M "115 × 75 см" 1595, 180 л; L "135 × 90 см" 2095, 300 л; XL · Гігант "150 × 110 см" 2995, 600 л (lines 231-233);
  - Груша Premium M 1695 / L 2195 (lines 256-257);
  - Крісло Monaco "Стандарт 80 × 80 × 90 см" 2500, 300 л (line 312);
  - Безкаркасний диван S/M/L 2345/2995/4195 (lines 485-487);
  - Наповнювач EPS 100 л 495, 50 л 300 (lines 661-662).
  - [data/products.ts:231-233, 256-257, 312, 485-487, 661-662](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L231-L233)
- Cover kit prices are formula-derived (`regularKitPrice`, margin 0.6) and appear in the feed: Груша Oxford kit M 890, L 1145; Monaco cover 1395. — [data/products.ts:216-223, 740-748](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L740-L748); [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml)
- Black Friday: `SALE = {label 'Чорна п'ятниця', percent 10, start '2026-11-20T00:00:00+02:00', end '2026-11-30T23:59:59+02:00'}`. `saleOf()` rounds down to a multiple of 5, filler is excluded, and promo codes don't work during the sale. Sale prices: Груша 1435 / 1885 / 2695, Monaco 2250, kits 800 / 1030. — [data/products.ts:692-720](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L692-L720); [docs/BLACK-FRIDAY-2026.md:3](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/BLACK-FRIDAY-2026.md#L3); [public/merchant-feed.xml](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/public/merchant-feed.xml)
- Gift: filler EPS 100 л from 3,000 UAH (`GIFT_FROM = 3000`). Promo `bean10` is 10%. — [data/products.ts:828-833](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/data/products.ts#L828-L833)
- Sewing time is "2–3 робочі дні" on product pages. Delivery is "Нова пошта по Україні — 1–3 дні після пошиття", and checkout says "1–3 дні після відправлення". — [components/ProductClient.tsx:328, 652, 726](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L652); [components/CheckoutClient.tsx:18](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L18)
- Guarantee: "24 місяці на шви та фурнітуру з моменту отримання" and "діє однаково для всіх виробів". — [app/oplata-povernennya/page.tsx:94, 109](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/app/oplata-povernennya/page.tsx#L94)
- COD without prepayment applies only to standard Oxford orders. Other fabrics need 100% prepayment as custom sewing. — [components/ProductClient.tsx:654-658](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/ProductClient.tsx#L654-L658); [lib/checkout-payment.ts:3-7](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/checkout-payment.ts#L3-L7)
- Owner economics cap: 300–350 UAH per order from ads. — [docs/OPENAI-ADS-BRIEF-2026-11.md:22](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L22)
- **Discrepancies:**
  1. The brief limits facts to "Лише ті, що в AGENTS.md", but AGENTS.md lines 19-23 do not contain "з 2017 року", "Нова пошта — 1–3 дні" or "гарантія 24 місяці". They are confirmed only by site code: `lib/site.ts:27-28`, `app/layout.tsx:38`, `app/pro-tsekh/page.tsx:10`, `app/oplata-povernennya/page.tsx:94`. — [AGENTS.md:19-23](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/AGENTS.md#L19-L23)
  2. AGENTS says "за 2–3 дні"; the site and brief say "2–3 робочі дні". The site wording is the safer one.
  3. The brief's "Нова пошта — 1–3 дні" drops the site's qualifier "після пошиття / після відправлення".
  4. Same-day dispatch or pickup is only for items in stock (usually Oxford), per AGENTS:22, and the Kyiv page says to call first.
  5. "6 тканин, 140+ кольорів" is on the site (layout.tsx:38) but not on the brief's allowed list.
  6. The feed carries shipping prices (400 / 500 / 125 / 171 UAH) that the brief forbids in ad copy.
  7. `GOOGLE-ADS-PLAN.md` (13.07) describes a GA4 `purchase` event, but the current code fires `order_submitted` and has no `purchase` event. — [GOOGLE-ADS-PLAN.md:25, 71-74](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/GOOGLE-ADS-PLAN.md#L71-L74); [components/CheckoutClient.tsx:359](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L359)
  - Prices in the brief: no discrepancy with code.

### Inferences
- Safe copy elements:
  - "Власний цех у Києві з 2017 року";
  - "Шиємо за 2–3 робочі дні";
  - "Нова пошта 1–3 дні після відправлення";
  - "Гарантія 24 місяці на шви й фурнітуру";
  - "Оксфорд — оплата при отриманні";
  - "Самовивіз у Гатному за домовленістю";
  - exact prices "від 1 595 грн", "Груша XL · Гігант 150 × 110 см — 2 995 грн", "Monaco — 2 500 грн", "Комплект чохлів від 890 грн";
  - during 20–30.11, "−10% до 30 листопада" (not on filler).
- Copy should not promise in-stock status, same-day dispatch, fabric samples, or delivery prices.

### Gaps
- Owner confirmation of "140+ кольорів" and "6 тканин" for ad use, which the brief omits.

## 8. Existing UTM and click-ID handling

### Takeaway
The site already captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid` and `wbraid` (last tagged visit, per tab, in sessionStorage). It forwards them with every order to `/order`, into the CRM comment and the Telegram card. Paid ChatGPT traffic tagged e.g. `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign=…` therefore needs no code change to be visible. Adding an OpenAI click-ID key to the whitelist requires matching updates to the Python CRM exporter regex and the tests.

### Cited Findings
- Whitelist: `UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']`, `CLICK_KEYS = ['gclid','gbraid','wbraid']`, sessionStorage key `'mrbean-attribution-v1'`. — [lib/attribution.ts:1-5](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/attribution.ts#L1-L5)
- `cleanAttribution`:
  - UTM values are stripped of control characters and `<>`, trimmed and capped at 80 characters;
  - click IDs must match `/^[a-zA-Z0-9_-]{1,256}$/`;
  - the record is kept only if at least one UTM or click ID exists, plus `landing_path` (path only, ≤160 characters) and `captured_at` (ISO);
  - output order: UTMs → click IDs → `landing_path` → `captured_at`.
  - [lib/attribution.ts:7-24](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/attribution.ts#L7-L24)
- `attributionFromUrl` reads only the whitelisted params. `captureAttribution` replaces the whole record on any new tagged visit ("never mix old click IDs with a new campaign") and otherwise reads sessionStorage. — [lib/attribution.ts:26-47](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/attribution.ts#L26-L47). It is per-tab, not cross-session or cross-device. — [docs/CRM-TELEGRAM.md:104-112](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/CRM-TELEGRAM.md#L104-L112)
- Capture runs on every route change: `useEffect(() => { captureAttribution(); }, [pathname])`. — [components/AttributionCapture.tsx:6-10](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/AttributionCapture.tsx#L6-L10)
- Forwarding:
  - `structured.marketing = captureAttribution()` ([CheckoutClient.tsx:343](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/components/CheckoutClient.tsx#L343));
  - the server re-cleans it ([order.ts:45](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/order.ts#L45));
  - the CRM comment gets "Джерело рекламного переходу (мітки браузера):" + `key=value` lines ([netlify/crm.ts:132-133](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/crm.ts#L132-L133));
  - the Telegram card gets "📍 Джерело: source / medium / campaign" ([netlify/order-message.ts:54-55](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/order-message.ts#L54-L55));
  - the fallback adds `Реклама_<key>` fields ([lib/attribution.ts:54-59](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/attribution.ts#L54-L59), [lib/notify.ts:8](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/lib/notify.ts#L8)).
  - The notify function rejects more than 40 fields and caps values at 1,000 characters. — [netlify/functions/notify.ts:27-29](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/netlify/functions/notify.ts#L27-L29)
- Google offline-import exporter `attribution()`: it matches the CRM block line by line with `re.fullmatch(r'(utm_source|utm_medium|utm_campaign|gclid|gbraid|wbraid|captured_at|landing_path|utm_content|utm_term)=(.*)')` and **`break`s at the first non-matching line**. `conversion()` requires `utm_source == 'google'`, `utm_medium == 'cpc'`, the campaign, a `gclid`, and `captured_at` within 90 days. — [scripts/crm_ads_export.py:45-59, 68-75](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/scripts/crm_ads_export.py#L45-L75)
- Existing naming conventions:
  - Search: `utm_source=google&utm_medium=cpc&utm_campaign=covers_test_01&utm_content={creative}&utm_term={keyword}` — [docs/ADS-LAUNCH-751-2026-09-08.md:22](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/ADS-LAUNCH-751-2026-09-08.md#L22)
  - Shopping: `utm_source=google&utm_medium=cpc&utm_campaign=shopping_mebli_01&utm_content={product_id}` — [audits/ADS-AUDIT-CLAUDE-2026-10-03.md:38](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/audits/ADS-AUDIT-CLAUDE-2026-10-03.md#L38)
  - Email: `utm_source=sendpulse&utm_medium=email…`
- ChatGPT organic links already carry `utm_source=chatgpt.com`. AI assistants gave 38 sessions and 2 key events in the week 03–09.11. The brief recommends a distinct paid tag such as `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign=…`. — [audits/CHATGPT-VISIBILITY-2026-11-09.md:177-181](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/audits/CHATGPT-VISIBILITY-2026-11-09.md#L177-L181); [docs/OPENAI-ADS-BRIEF-2026-11.md:100-102](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/docs/OPENAI-ADS-BRIEF-2026-11.md#L100-L102)
- Tests cover sanitizing, SSR safety, "New campaign cannot inherit an old click ID" and storage failures. — [tests/attribution.mjs:15-30](https://github.com/DeeAleKt/mrbean-shop/blob/f9f18769367a8dc893a1871e16b29b50f7c29bb4/tests/attribution.mjs#L15-L30)

### Inferences
- **No code needed for paid UTMs.** Use a convention parallel to Google's, e.g. `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign=chatgpt_<theme>_01&utm_content=<ad_or_group>`, keeping each value under 80 characters. These show up in GA4 through the standard gtag config, in the CRM comment and in the Telegram card, separate from organic `chatgpt.com`.
- **If an OpenAI click-ID key is added to `CLICK_KEYS`:**
  - Add the same key to the regex at `scripts/crm_ads_export.py:52` and to its unit tests. Otherwise, for a URL that carries both `gclid` and the new key, the exporter stops parsing at the new line, which comes before `landing_path`/`captured_at`. The Google order is then rejected for a missing time.
  - Extend `tests/attribution.mjs`.
  - Mind the notify cap of 40 fields: the checkout fallback can already carry about 24 payload fields plus up to 10 attribution fields.
- Attribution is last-click per tab. A later Google click in the same tab overwrites ChatGPT tags, and a new tab or a later visit without tags loses them unless the OpenAI pixel keeps its own first-party identifier.

### Gaps
- The exact URL parameter OpenAI appends to ad clicks (if any), its character set and length, and whether OpenAI auto-appends UTMs were not researched.
- How GA4 default channel grouping classifies `utm_source=chatgpt_ads` with `utm_medium=cpc` was not verified in the GA4 property.
