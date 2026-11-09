# OpenAI Ads (ChatGPT ads) measurement stack: Measurement Pixel, Conversions API, oppref click ID, GA4, privacy (state as of 9 Nov 2026)

## 1. Measurement Pixel (browser): base code, init, events, parameters, user data, consent, cookies, debugging

### Takeaway
The pixel is a queue-based browser SDK. It loads from `https://bzrcdn.openai.com/sdk/oaiq.min.js`, is initialised with `oaiq("init", { pixelId })`, and sends events with `oaiq("measure", eventName, eventData, options)`. Event names are snake_case (`page_viewed`, `contents_viewed`, `items_added`, `checkout_started`, `order_created`, `lead_created`, ...). Amounts are integers in minor currency units. Hashed user data goes on `init`, not on `measure`. Consent defaults to **granted** unless `oaiq("consent", false)` is called before init. I could not retrieve the verbatim official loader snippet (the self-invoking stub). Copy it from Ads Manager or developers.openai.com.

### Cited Findings

#### Source access note (applies to the whole file)
- WebFetch could not resolve `developers.openai.com` or `stape.io` (DNS blocked by this session's network allowlist), so I stopped fetching other sites. The official docs pages (https://developers.openai.com/ads/measurement-pixel, https://developers.openai.com/ads/conversions-api, https://developers.openai.com/ads/supported-events, https://developers.openai.com/ads/conversion-tracking, https://developers.openai.com/ads/multiple-pixels) were **not fetched**. Claims attributed to them come from search-result summaries.
- Two primary/near-primary code sources were **read in full** via `git clone`:
  - OpenAI's own Codex plugin "OpenAI Ads Conversions" (author: OpenAI). Its reference files say they are a fallback copy of the public docs. The repo HEAD is d420d13 (6 Nov 2026), but the plugin folder last changed on **26 Aug 2026** (commit 33bd952) — [openai/plugins – openai-ads-conversions](https://github.com/openai/plugins/tree/main/plugins/openai-ads-conversions)
  - Stape's open-source GTM templates: [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag) (HEAD 14 Oct 2026) and [stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag) (HEAD 9 Sep 2026).

#### Loader / init
- Official SDK pattern (OpenAI plugin text): "insert the loader script near the top of `<head>`, load `https://bzrcdn.openai.com/sdk/oaiq.min.js`, initialize with `oaiq("init", { pixelId: "<YOUR-PIXEL-ID>" })`, and emit events with `oaiq("measure", ...)`. `pixelId` is required. `debug` is optional and should be enabled only for local/test troubleshooting" — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)
- The official docs page provides a self-invoking function that creates the `oaiq` queue and inserts an async script tag pointing to bzrcdn.openai.com/sdk/oaiq.min.js. Per one guide, it inserts the script before the first existing script tag rather than appending to head (search summaries; verbatim snippet not retrieved) — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel); [usehardal.com](https://usehardal.com/blog/openai-measurement-pixel); [searchintel.tech](https://www.searchintel.tech/blog/openai-ads-pixel-oaiq-guide/)
- Stape's web GTM tag builds the global queue as GTM `createArgumentsQueue('oaiq', 'oaiq.q')`. That makes `window.oaiq` a function that pushes `arguments` onto `window.oaiq.q`. It then calls `queue('init', { pixelId, debug, user })` and injects `https://bzrcdn.openai.com/sdk/oaiq.min.js` — [stape-io/openai-pixel-tag template.js](https://github.com/stape-io/openai-pixel-tag)
- Pixel IDs are created in the Conversions tab of Ads Manager (search summary of official docs) — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel). An API path also exists: a web pixel and a Conversions API key can be created through the Ads API at api.ads.openai.com (search snippet) — [developers.openai.com/ads/api-partner-setup](https://developers.openai.com/ads/api-partner-setup)
- Init once, and guard against re-initialisation on client-side navigation. Don't init in both a root layout and a nested page. Pixel code must not sit in server components or SSR-only files — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md); [OpenAI plugin framework-patterns.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/framework-patterns.md)
- Browser-visible Pixel ID may use `NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID` in Next.js. It must be the same logical Pixel ID that server-side CAPI uses — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)
- Multiple pixels: there is an official "Multiple Pixel IDs" page — [developers.openai.com/ads/multiple-pixels](https://developers.openai.com/ads/multiple-pixels). Stape's tag inits each pixel and sends events with `queue('measureSingle', pixelId, eventName, eventParameters, options)` — [stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag)
- The pixel does **not** auto-track page views. The current docs show `page_viewed` as an explicit `oaiq("measure","page_viewed",...)` call. One guide claims otherwise (conflict) — [searchintel.tech](https://www.searchintel.tech/blog/openai-ads-pixel-oaiq-guide/); [gptadsai.com](https://www.gptadsai.com/guides/chatgpt-ads-conversion-tracking)
- The pixel doesn't support `app_installed` / `app_opened`. Those are CAPI-only (search summary of official docs) — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel)

#### measure signature, event names, parameters
- Signature: `oaiq("measure", eventName, eventData, options)` — [searchintel.tech](https://www.searchintel.tech/blog/openai-ads-pixel-oaiq-guide/); consistent with [OpenAI plugin](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)
- Standard events with their `data.type`:

  | Event | `data.type` |
  | --- | --- |
  | `page_viewed` | `contents` |
  | `contents_viewed` | `contents` |
  | `items_added` | `contents` |
  | `checkout_started` | `contents` |
  | `order_created` | `contents` |
  | `lead_created` | `customer_action` |
  | `registration_completed` | `customer_action` |
  | `appointment_scheduled` | `customer_action` |
  | `subscription_created` | `plan_enrollment` |
  | `trial_started` | `plan_enrollment` |
  | `custom` | `custom` |

  CAPI additionally has `app_installed` / `app_opened` (`customer_action`). Sources: [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md); [stape-io/openai-capi-tag README](https://github.com/stape-io/openai-capi-tag); [developers.openai.com/ads/supported-events](https://developers.openai.com/ads/supported-events)
- Mapping from Meta-style names (inference based on Stape's GA4 mapping `page_view→page_viewed`, `view_item→contents_viewed`, `add_to_cart→items_added`, `begin_checkout→checkout_started`, `purchase→order_created`, `generate_lead→lead_created`, `sign_up→registration_completed`). PageView→`page_viewed`, ViewContent→`contents_viewed`, AddToCart→`items_added`, InitiateCheckout→`checkout_started`, Purchase→`order_created`, Lead→`lead_created`. There is no "Purchase" or "Order" event name — [stape-io/openai-capi-tag README](https://github.com/stape-io/openai-capi-tag)
- Recommended e-commerce set: `page_viewed`, `contents_viewed`, `items_added`, `checkout_started`, `order_created`. Fire `order_created` "after payment/order confirmation, not on checkout click". Fire `items_added` after the cart mutation succeeds, on every add path — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)
- `eventData` carries `type` (e.g. `"contents"`) plus optional `amount`, `currency`, `contents` (and `plan_id` for plan events). For example, `order_created` uses the contents data type — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel) (search summary); Stape sets `eventParameters = { type: <data type> }` — [stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag)
- Money: "event amounts use the currency's standard minor unit: 8900 for USD 89.00, or 8900 for JPY 8,900". Use integers for amount and quantity. If amount is present, currency (ISO 4217) is required — [developers.openai.com/ads/conversion-tracking](https://developers.openai.com/ads/conversion-tracking) (search summary); [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md)
- `contents[]` item fields: `id`, `name`, `content_type`, `quantity`, `amount`, `currency`. Put commerce totals in top-level `data.amount`/`data.currency`. "If item-level `contents[].amount` is included, prefer unit price". Removed shapes `checkout_session`, `line_items`, `order` must not be used — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md). Stape requires `content_type` as a string (default `'product'`), adds optional `group_id`, and computes the total as `quantity × amount` (unit price) — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag)
- Options (4th arg): `event_id` (dedup), `opt_out` (boolean), and `custom_event_name` for custom events. Custom event: `oaiq("measure", "custom", { type: "custom" }, { custom_event_name: "<name>" })`. Names are 1–64 chars of letters, digits, `_` or `-`, start and end alphanumeric, and must not equal a standard name — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md); [stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag)
- Don't pass `oppref`, `source_url`, timestamps or batching metadata to the pixel. "The SDK captures `oppref` from the landing page URL, stores it in the first-party `__oppref` cookie, adds `source_url`, timestamps events, and batches `measure` calls" — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)

#### Advanced matching (user data)
- Pixel user fields: `email_sha256`, `external_id_sha256`, `country`, `city`, `zip_code`. Pass them in `oaiq("init", { pixelId, user: {...} })`. If data arrives later (checkout, login), call `oaiq("init", { user })` again **without** `pixelId`. Never attach user data to `measure` calls — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md). The Stape web tag (Sep 2026) uses the same singular names for pixel init — [stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag)
- Email normalisation: trim leading/trailing whitespace and lowercase, then SHA-256. Send hashes as lowercase 64-char hex. The API also "limits each normalized value to 128 characters" (search summary of official docs) — [developers.openai.com/ads/conversions-api](https://developers.openai.com/ads/conversions-api); [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel)
- Automatic advanced matching: "When enabled, the OpenAI Pixel automatically detects supported customer information from your website". One guide says raw detected data isn't sent (it is hashed in the browser) — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel) (search summary); [spaceads.agency](https://www.spaceads.agency/blog/chatgpt-ads-conversion-tracking-measurement-pixel-conversions-api)

#### Consent / opt-out
- "The Pixel initializes consent to true by default unless you set it to false or the Pixel finds a stored denial." While consent is false, the pixel doesn't send measurement pings. Calling `oaiq("consent", false)` removes the pixel's cookies. Order: `oaiq("consent", false)` → `oaiq("init", …)` → `oaiq("consent", true)` after the user agrees. Events blocked during denial are **not replayed** — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel) (search summary); [usehardal.com](https://usehardal.com/blog/openai-measurement-pixel); [kukie.io](https://kukie.io/blog/how-chatgpt-ads-and-cookies-work)
- The documented install snippet contains no consent call. Consent is a separate docs section ("Control measurement consent") — [ciphercue.com](https://ciphercue.com/blog/openai-chatgpt-ad-pixel-european-shops)
- `{ opt_out: true }` in options = measure, but opt this event out of future user-level personalization — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)
- Stape's web tag can gate SDK loading and init on Google Consent Mode `ad_storage` — [stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag)

#### Cookies
- First-party cookies on the advertiser domain:
  - `__oppref` — click ID; 30 days per most third-party sources. One table says 90 days (conflict). Reading the cookie does not extend it.
  - `__obref` — randomly generated browser ID; 365 days.

  Both are set "only when measurement consent is granted". Sources: [advancedtrackingacademy.com](https://advancedtrackingacademy.com/blog/oppref-chatgpt-ad-click-id/); [seresa.io](https://seresa.io/blog/chatgpt-ads-pixel/how-chatgpt-ads-oppref-and-obref-cookies-track-woocommerce-conversions); [filipsteiner.com](https://filipsteiner.com/blog/what-cookies-does-chatgpt-ads-use); [captaincompliance.com](https://captaincompliance.com/education/__obi-cookie-the-architecture-of-openais-ad-tracking-pixel/)
- Stape's server tag defaults are `__oppref` max-age 30 days and `__obref` 365 days (configurable). It sends `__obref` to CAPI as `user.obref` — [stape-io/openai-capi-tag template.js](https://github.com/stape-io/openai-capi-tag)
- `__obi`: a separate cookie on `.openai.com` (OpenAI's own domains, not the advertiser's) set by bzr.openai.com. OpenAI's cookie policy lists it under Analytics with a 1-year duration. A researcher claims it may link pixel activity to ChatGPT accounts (unproven; OpenAI has not answered) — [techaiwire.com](https://techaiwire.com/articles/openai-obi-cookie-ads-pixel-chatgpt-accounts/); [captaincompliance.com](https://captaincompliance.com/education/__obi-cookie-the-architecture-of-openais-ad-tracking-pixel/)

#### CSP
- Allow `https://bzrcdn.openai.com` in script-src and `https://bzr.openai.com` (plus the CDN) in connect-src and img-src (image fallbacks). One guide says OpenAI documents "four required sources across three directives" — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel) (search summary); [usehardal.com](https://usehardal.com/blog/openai-measurement-pixel)

#### Debugging / testing
- `debug: true` in init logs pixel activity to the console, including dropped events. Debug mode does **not** keep test events out of reporting — [help.openai.com troubleshooting](https://help.openai.com/en/articles/20001604-troubleshooting-conversion-tracking-for-chatgpt-ads) (search summary); [ai-advisors.ai](https://www.ai-advisors.ai/blog/how-to-check-chatgpt-ads-pixel-is-working)
- Ads Manager → Conversions tab → **Event Stream** shows recent received events. A practitioner suggests waiting 5–15 min. The pixel's network calls go to `bzr.openai.com/v1/sdk/events` (third-party observation) — [ai-advisors.ai](https://www.ai-advisors.ai/blog/how-to-check-chatgpt-ads-pixel-is-working)
- `validate_only` is CAPI-only; it "should not be used for Pixel/SDK traffic" — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md)

### Inferences
- Implementation sketch for Next.js `output: 'export'` (my construction from the documented commands, **not** the official snippet; replace the stub with the official snippet from Ads Manager/docs if it differs):
  ```tsx
  // app/layout.tsx – in <head>; static export is fine because this is pure client JS
  import Script from "next/script";
  const PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID!;
  // Queue stub equivalent to Stape's createArgumentsQueue('oaiq','oaiq.q') – UNOFFICIAL
  <Script id="oaiq-init" strategy="beforeInteractive">{`
    window.oaiq = window.oaiq || function(){ (window.oaiq.q = window.oaiq.q || []).push(arguments); };
    // oaiq("consent", false);   // add if/when a consent banner gates ads measurement
    oaiq("init", { pixelId: "${PIXEL_ID}" });
    oaiq("measure", "page_viewed", { type: "contents" });
  `}</Script>
  <Script src="https://bzrcdn.openai.com/sdk/oaiq.min.js" strategy="afterInteractive" />
  ```
  On the order-success page (UAH has 2 minor digits, so 1 250.00 UAH = `125000`):
  ```js
  oaiq("init", { user: { email_sha256: "<sha256(trim+lowercase email)>" } }); // optional, no pixelId
  oaiq("measure", "order_created",
    { type: "contents", amount: 125000, currency: "UAH",
      contents: [{ id: "SKU-1", name: "…", content_type: "product", quantity: 1, amount: 125000 }] },
    { event_id: orderId });
  ```
  In the browser, hashing needs `crypto.subtle.digest("SHA-256", …)` and hex encoding.
- `page_viewed` in an SPA: with App Router client navigation, fire `page_viewed` on route change (e.g., `usePathname` effect) rather than only once at load. Avoid double-firing on first render.
- Whether `UAH` is accepted as a currency is not explicitly confirmed. ISO 4217 validity suggests yes. Test with CAPI `validate_only`.

### Gaps
- The verbatim official base code (IIFE stub) and the full CSP table could not be retrieved (developers.openai.com blocked). Copy them from Ads Manager → Conversions or https://developers.openai.com/ads/measurement-pixel.
- Pixel ID format (length/charset) is not documented in anything I could read.
- `__oppref` lifetime: 30 vs 90 days conflict in third-party sources. No official figure was found.
- No official `<noscript>`/image-tag fallback documentation was found. One guide (contexthints) mentions an "image tag", and the CSP mentions "image fallbacks", but neither could be verified.
- Exact list of fields picked up by automatic advanced matching, and how to switch it on or off (Ads Manager toggle?), were not found.

## 2. Conversions API (server-side): endpoint, auth, schema, hashing, dedup, limits, testing

### Takeaway
`POST https://bzr.openai.com/v1/events?pid=<PIXEL-ID>` with `Authorization: Bearer <Conversions API key>` and a JSON body `{ validate_only, events: [...] }`. Per-event fields are `id`, `type`, `timestamp_ms`, `action_source`, `source_url`, `oppref`, `user`, `data`, `opt_out`, and `custom_event_name`. Dedup with the pixel works when Pixel ID, event name and `id` (= pixel `event_id`) match; the first event received wins. Events must be ≤7 days old and ≤10 min in the future. Batches hold ≤1000 events, and one invalid event fails the whole batch. The CAPI `user` object's field names are **in conflict between sources** (singular vs plural list form). Verify with `validate_only: true`.

### Cited Findings
- Endpoint/auth: "Send `POST https://bzr.openai.com/v1/events?pid=<PIXEL-ID>` with `Content-Type: application/json` and `Authorization: Bearer <server-only CAPI key>`" — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md); matches the official docs curl example (search summary) — [developers.openai.com/ads/conversions-api](https://developers.openai.com/ads/conversions-api); Stape builds `'https://bzr.openai.com/' + 'v1' + '/events?pid=' + encodeUriComponent(pixelId)` with `Authorization: 'Bearer ' + apiKey` — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag)
- Body fields: "top-level `validate_only` and `events`, and per-event `id`, `type`, `timestamp_ms`, `oppref`, `source_url`, `action_source`, `user`, and `data`". `custom_event_name` is event-level (not in `data`) when `type` is `custom`; `opt_out` is optional. **Do not use** legacy names `event_name`, `event_time_epoch_ms`, `event_id`, `event_source_url`, `event_data` — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md). Some third-party guides (e.g., Seresa) still show `user_data`/`event_name`; these conflict with the official docs and are probably outdated — [seresa.io](https://seresa.io/seed/platform-integrations/what-is-openai-conversions-api-endpoint)
- Event contract: "Every CAPI event needs a stable non-empty `id`, supported `type`, integer `timestamp_ms`, and `data` object… `timestamp_ms` must represent the event time in milliseconds, be within the last 7 days, and not be more than 10 minutes in the future". `timestamp_ms` is 13-digit Unix ms; a third-party sample using 10-digit seconds is wrong — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md); [pixellint.org](https://pixellint.org/packs/openai-conversions-api/)
- `action_source` values: `web`, `mobile_app`, `offline`, `physical_store`, `phone_call`, `email`, `other`. For `web`, `source_url` is **required**. Send "origin plus pathname only. Strip query strings and fragments", and validate a browser-supplied URL's origin — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md); Stape validation: "Source URL is required when Action Source is web" — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag)
- `oppref`: pass the raw value from the `__oppref` cookie or `oppref` URL param as `events[].oppref`. Do "not parse, URL-decode, cookie-decode, generate, transform, store broadly, or log it". Prefer reading the cookie server-side when the request is same-site — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md). CAPI never reads the cookie for you — [advancedtrackingacademy.com](https://advancedtrackingacademy.com/blog/oppref-chatgpt-ad-click-id/)
- **User data, version A** (OpenAI plugin, last changed 26 Aug 2026). Fields `events[].user` = `email_sha256`, `external_id_sha256`, `country`, `city`, `zip_code`, `ip_address`, `user_agent`. "Do not send raw email, raw external IDs, phone numbers, or phone hashes" — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md)
- **User data, version B** (Stape commit b7fc153, 9 Sep 2026, "Align user data schema with OpenAI's current Conversions API… plural list-field schema documented in docs/capi.md"):
  - hashed lists: `emails_sha256`, `phone_numbers_sha256`, `external_ids_sha256`, `first_names_sha256`, `last_names_sha256`
  - plain lists: `cities`, `postal_codes`, `regions`, `countries`
  - scalars: `ip_address`, `user_agent`, `obref`, `android_advertising_id`

  The commit notes "restored phone support" and that external ID hashing preserves case. Code comments say OpenAI "removed the plain external_id field" and "removed the _sha256 requirement for geographic fields" — [stape-io/openai-capi-tag commit history](https://github.com/stape-io/openai-capi-tag)
- A search summary of the official CAPI page quotes "emails_sha256, a list[string] of SHA-256 hashes of normalized email addresses". It also says "Don't send raw email addresses, phone numbers, external IDs, first names, or last names", which implies hashed phone and names are now accepted. This supports version B as current — [developers.openai.com/ads/conversions-api](https://developers.openai.com/ads/conversions-api)
- Normalisation, as implemented by Stape and not verified against OpenAI's own wording for phone and names:
  - email: trim + lowercase
  - phone: strip non-digits, then strip leading zeros
  - names: strip ASCII whitespace/punctuation, preserve non-ASCII
  - external ID: trim only

  Pre-hashed 64-hex values are not re-hashed — [stape-io/openai-capi-tag template.js](https://github.com/stape-io/openai-capi-tag)
- `ip_address`: a valid IPv4/IPv6 address of the device that generated the event. `user_agent`: a non-empty UA string. Both are sent unhashed. All user fields are optional (search summary of official docs) — [developers.openai.com/ads/conversions-api](https://developers.openai.com/ads/conversions-api); [ceaksan.com](https://ceaksan.com/en/openai-ads-identity-matching-privacy)
- Dedup: OpenAI uses Pixel ID + `event_name` + `id`, "uses the first event it receives for a matching key and ignores later duplicates" (search summary of official docs). The pixel's `event_id` = CAPI `id` under the same Pixel ID — [developers.openai.com/ads/conversions-api](https://developers.openai.com/ads/conversions-api); [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md). A **48-hour** dedup window is claimed only by a third-party blog and is unverified — [matejsandor.sk](https://matejsandor.sk/blog/how-to-track-openai-chatgpt-ads)
- Batching: "cap batches at 1000 events. One invalid event fails the full batch" — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md)
- Test mode: `"validate_only": true` at the request's top level validates without saving. "Validation-only requests do not appear in event monitoring". Must not be the deployed default — [developers.openai.com/ads/conversions-api](https://developers.openai.com/ads/conversions-api) (search summary); [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md)
- Response handling: Stape treats any HTTP 2xx as success and anything else as failure. No documented error-code table was found — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag). Stape's tag adds an undocumented-in-plugin top-level `integration_source: 'stape-sgtm'` (partner attribution; not needed for direct integrations) — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag)
- Failure semantics: reporting failure "must not fail, block, or materially slow checkout". Avoid retry loops that could duplicate conversions; dedup by `id` mitigates this. Never log full payloads, `oppref` or the key — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md)
- Key provisioning:
  - EdgeTag: created in Ads Manager → Conversions → "Conversion keys" — [docs.edgetag.io](https://docs.edgetag.io/channels/open-ai-ads/onboarding.md)
  - CustomerLabs: Tools → Conversions — [customerlabs.com](https://www.customerlabs.com/docs/destinations/ad-platforms/openai-ads/)
  - Stape README (older wording): "provided by the OpenAI Account team" — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag)
  - Help centre (quoted by Soku): either an Ads Manager API key or a Pixel ID + Conversions API key — [soku.ai](https://soku.ai/blog/chatgpt-ads-google-tag-manager)
- Secret handling: use a server-only env name such as `OPENAI_ADS_CONVERSIONS_API_KEY`; never `NEXT_PUBLIC_*`. Don't build a public endpoint that accepts arbitrary browser events — [OpenAI plugin conversions-api.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/conversions-api.md); [OpenAI plugin framework-patterns.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/framework-patterns.md)

### Inferences
- Architecture for static Next.js + Netlify Function:
  1. The pixel stores `__oppref`, a first-party JS-set cookie (not HttpOnly).
  2. The checkout form POSTs to the order Netlify Function on the **same origin** (`/.netlify/functions/...` or a redirect path). The browser therefore sends `__oppref` automatically (fetch default `credentials: 'same-origin'`), and the function reads it from the `Cookie` header. No extra browser plumbing is needed.
  3. The function creates or confirms the order, then sends CAPI `order_created` with `id = orderId`.
  4. It returns `orderId` to the browser, which fires the pixel `order_created` with `{ event_id: orderId }`. This gives a shared dedup key.
- TypeScript sketch (Node 20 global `fetch` + `node:crypto`). Field names follow the documented contract. The `user` block uses version B (plural lists); if `validate_only` rejects it, switch to version A singular names:
  ```ts
  import { createHash } from "node:crypto";
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");
  const body = {
    validate_only: process.env.OPENAI_ADS_VALIDATE_ONLY === "true", // blank/false in prod
    events: [{
      id: orderId,                         // same as pixel options.event_id
      type: "order_created",
      timestamp_ms: Date.now(),            // actual order-confirmation time, ms
      action_source: "web",
      source_url: "https://<site-origin>/checkout/success/", // origin+pathname only
      ...(oppref ? { oppref } : {}),       // raw __oppref cookie value, untouched
      user: {
        emails_sha256: [sha(email.trim().toLowerCase())],
        ip_address: clientIp, user_agent: userAgent,
      },
      data: { type: "contents", amount: totalMinorUnits, currency: "UAH",
              contents: items.map(i => ({ id: i.sku, name: i.title, content_type: "product",
                                          quantity: i.qty, amount: i.unitPriceMinor })) },
    }],
  };
  await fetch(`https://bzr.openai.com/v1/events?pid=${encodeURIComponent(process.env.OPENAI_ADS_PIXEL_ID!)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_ADS_CONVERSIONS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(3000),
  }).catch(() => {/* redacted warn; never fail the order */});
  ```
- Getting IP and UA on Netlify: `context.ip` / `context.cookies.get("__oppref")` in Netlify Functions v2, or the `x-nf-client-connection-ip` header. This is general Netlify knowledge, not researched here; verify against Netlify docs.
- If the site also sends `page_viewed`/`items_added` only from the pixel (recommended: "usually rely on Pixel"), CAPI can be limited to `order_created` (and `lead_created` for any callback/lead form).

### Gaps
- Definitive current CAPI `user` field names (singular vs plural lists, and whether phone/name hashes are accepted) could not be confirmed from the official page. Resolve with a `validate_only` test.
- No documented HTTP response codes, error body format or rate limits for `bzr.openai.com/v1/events` were found. 429/Retry-After guidance in search results refers to the general OpenAI API, not Ads CAPI.
- Dedup time window: undocumented (48 h is a third-party claim).
- Exact Ads Manager UI path for creating the CAPI key: third-party descriptions only.

## 3. Click ID (oppref), UTMs and URL templates; paid vs organic chatgpt.com tagging

### Takeaway
OpenAI appends an opaque `oppref` parameter to ad landing URLs. The pixel stores it as `__oppref` (about 30 days, unofficial), and CAPI must send it back as `events[].oppref`. Advertisers can add their own query parameters ("Landing page query parameters", API `query_string_template`) with macros `{campaign_id}`, `{ad_group_id}`, `{ad_id}`, `{ad_account_id}`; reports conflict on whether this is beta or GA. I found no evidence that ad clicks automatically carry `utm_source=chatgpt.com`. Practitioners advise using a **distinct** utm_source for paid.

### Cited Findings
- `oppref` is an opaque click identifier appended to the landing URL on ad click. It identifies the click, not the person. Example format `?oppref=gAAAAAb123`. Don't overwrite it or strip it in redirects — [matejsandor.sk](https://matejsandor.sk/blog/how-to-track-openai-chatgpt-ads); [help.way2.us](https://help.way2.us/en/guides/chatgpt-ads-oppref-click-id); [advancedtrackingacademy.com](https://advancedtrackingacademy.com/blog/oppref-chatgpt-ad-click-id/)
- The SDK captures `oppref` from the landing URL into the first-party `__oppref` cookie (official plugin text) — [OpenAI plugin measurement-pixel.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md). Stape resolves the click ID from: URL param `oppref` → cookie `__oppref` → event data, and can re-set `__oppref` server-side (default 30 days) — [stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag)
- Custom URL parameters:
  - The Ads Manager field is "Landing page query parameters"; the API field is `query_string_template` — [contexthints.com](https://www.contexthints.com/guide/chatgpt-ads-url-parameters.html)
  - Supported macros are `{campaign_id}`, `{ad_group_id}`, `{ad_id}`, `{ad_account_id}`. Soku dates the help-article change to "supported" to 5 Aug 2026 — [soku.ai](https://soku.ai/blog/chatgpt-ads-dynamic-url-parameters)
  - Adpage calls it beta/account-gated and says the help centre still says unsupported (conflict) — [docs.adpage.io](https://docs.adpage.io/integrations-marketingtools/openai-ads/utm-parameters-and-dynamic-tracking-for-chatgpt-ads)
- Precedence: the most specific level wins (Ad URL > Ad > Ad Group > Campaign). An ad-level template can override the campaign one; a missing template produces "(not set)". Don't put `oppref` in templates — [readme.anytrack.io](https://readme.anytrack.io/docs/chatgpt-ads-utm-parameters); [metrikia.io](https://metrikia.io/en/guides/openai-ads-url-params-tracking-setup)
- Example templates:
  - `utm_source=openai&utm_medium=paid_ai&utm_campaign={campaign_id}&utm_content={ad_id}` — [metrikia.io](https://metrikia.io/en/guides/openai-ads-url-params-tracking-setup)
  - `utm_id={campaign_id}`, `utm_content={ad_id}` — [metricfixer.com](https://metricfixer.com/publications/online-advertising/openai-ads-dynamic-parameters-utm-tracking-guide)
- Organic: ChatGPT had appended `utm_source=chatgpt.com` to links in answers since ~June 2025. One report says that since **9 Oct 2026** links in the new answer interface no longer pass `utm_source=chatgpt.com` or the referrer, so visits land in Direct. Ad clicks with your own UTMs reportedly are unaffected. The attribution to Delante is from a search summary, not verified on the page — [delante.co](https://delante.co/chatgpt-changes-cause-drop-in-ai-traffic-recorded-by-ga4/); [seerinteractive.com](https://www.seerinteractive.com/insights/are-ai-sites-like-chatgpt-sending-your-website-traffic)
- Using `utm_source=chatgpt.com` on ads merges paid and organic under one source. Use a distinct value, e.g. `chatgpt_ads` / `utm_medium=cpc` — [optifeed.com](https://www.optifeed.com/blog/how-to-measure-openai-ads-traffic-in-ga4-utm-reporting-guide); conflicting advice (use `chatgpt.com` + `cpc`) — [paidsync.ai](https://paidsync.ai/blog/measure-chatgpt-ads-in-ga4)

### Inferences
- For MrBean: set a campaign-level template such as `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={ad_id}`. Make sure the static site's redirects (trailing-slash rules in Netlify `_redirects`) preserve the query string, so `oppref` survives.
- `oppref` presence in the landing URL is itself a reliable paid-click signal. A GA4 custom dimension could capture "has_oppref" without storing the value. This is my suggestion; don't log or decode the value.

### Gaps
- No official statement on whether OpenAI auto-appends any UTM parameters to ad clicks.
- Official `__oppref` lifetime and the documented status (GA vs beta) of URL macros are unconfirmed.

## 4. Attribution windows, view-through, optimization (oCPC/oCPM), reporting

### Takeaway
Since 16 Sep 2026, Ads Manager lets advertisers pick a 7/14/30-day click-through window and a 0-day (off) or 1-day view-through window. These settings are reporting-only; when both apply, the click takes precedence. oCPM launched ~16 Sep 2026. No official minimum conversion volume is documented, and I found no OpenAI statement on modeled conversions.

### Cited Findings
- "Ads Manager lets advertisers choose a 7-, 14-, or 30-day click-through reporting window and either 0 Day (disabled) or a 1-day view-through reporting window." With 1-day VT, the Conversions total includes eligible view-through conversions. Separate "Click-through conversions" / "View-through conversions" columns exist. "These settings control attribution in reports; they do not change how campaigns optimize" — [help.openai.com Measure Results](https://help.openai.com/en/articles/20001214-measure-results) (search summary)
- Click and view windows apply independently; if an outcome qualifies for both, the click takes precedence — [developers.openai.com/ads/api-reference/insights](https://developers.openai.com/ads/api-reference/insights) (search summary)
- History: view-through conversions were added in Aug 2026 as a separate metric excluded from the total. This was superseded on 16 Sep 2026 by the selectable windows — [soku.ai](https://soku.ai/blog/chatgpt-ads-view-through-conversions); [ppc.land](https://ppc.land/chatgpt-ads-gains-view-through-conversions-with-a-fixed-1-day-window/); OpenAI blog — [ads.openai.com/blog/more-ways-to-measure](https://ads.openai.com/blog/more-ways-to-measure)
- oCPM rollout is dated 16 Sep 2026. Sources conflict on GA vs eligible accounts. Existing campaigns can't be switched, only cloned — [metricfixer.com](https://metricfixer.com/publications/online-advertising/openai-ads-september-2026-ocpm-attribution-integrations-sponsored-agents); [zeo.org](https://zeo.org/resources/blog/how-to-advertise-on-chatgpt-a-step-by-step-review-of-openai-ads-manager); [ivristech.com](https://ivristech.com/chatgpt-ads-ocpm-view-through-optimization/)
- Custom events aren't supported as goals for conversion-optimized campaigns; pick a standard event with enough signal — [ivristech.com](https://ivristech.com/chatgpt-ads-ocpm-view-through-optimization/); [sprites.ai](https://www.sprites.ai/openai-ads-manager)
- No official minimum conversion volume for oCPC/oCPM was found. The reported minimums are budget floors (e.g., $25/day US) — [metricfixer.com](https://metricfixer.com/publications/online-advertising/openai-ads-september-2026-ocpm-attribution-integrations-sponsored-agents); [sprites.ai](https://www.sprites.ai/openai-ads-manager)
- Ads Manager reporting shows campaign performance, not individual-level activity — [help.openai.com Conversion Measurement](https://help.openai.com/en/articles/20001409-conversion-measurement) (search summary). A Reporting API exists — [developers.openai.com/ads/reporting](https://developers.openai.com/ads/reporting)

### Inferences
- Because custom events can't be optimisation goals, MrBean should use the standard `order_created` (and possibly `checkout_started`/`items_added` as higher-volume proxy goals while volume is low).
- With a 1-day VT window enabled, Ads Manager conversions will exceed GA4 last-click numbers. Document the chosen windows when comparing.

### Gaps
- Default window values, modeled conversions, and conversion-volume thresholds for oCPC/oCPM learning: no official data found.

## 5. GA4 integration (beta) and separating paid vs organic ChatGPT traffic in GA4

### Takeaway
An official help article confirms a **beta** GA4 → Ads Manager connection, available through the account manager. It gives OpenAI read-only access to one GA4 property, is set up in Conversions → Data Sources, and maps GA4 events to Ads Manager events. Its totals cover all property traffic and are not campaign conversions or ROAS. In GA4 itself, separate paid traffic with your own UTMs and a custom channel group.

### Cited Findings
- From the help article:
  - The GA4 integration is in beta; contact your account manager for early access.
  - Setup needs a Google account with at least Viewer access to the GA4 property, and grants OpenAI read-only access.
  - Path: Conversions → Data Sources; one GA4 property per account.
  - You map GA4 events to Ads Manager events.
  - The purpose is "attribution comparisons and, where eligible, campaign optimization".
  - The Events count tracks imported activity, and totals cover all property traffic (not only OpenAI-ad activity). GA4 totals do not represent campaign conversions or ROAS.

  Sources: [help.openai.com – Connect GA4 to OpenAI Ads Manager](https://help.openai.com/en/articles/20001562-connect-google-analytics-4-to-openai-ads-manager) (also indexed as …/20001562-connecting-google-analytics-4-to-openai-ads-manager) (search summary)
- Event mapping was added Oct 2026, per a third party. Ads Manager counts only events set as goals; reported numbers differ — [soku.ai](https://soku.ai/blog/chatgpt-ads-ga4-integration)
- Before this article (Aug 2026), guides said no native GA4 integration existed — [ai-advisors.ai](https://www.ai-advisors.ai/blog/how-to-track-chatgpt-ads-in-ga4)
- Practice: create a distinct utm_source for ads, build a custom channel group "ChatGPT Ads" (source = chatgpt_ads / medium = cpc) above "Referral/AI", and report on session source/campaign + key events — [optifeed.com](https://www.optifeed.com/blog/how-to-measure-openai-ads-traffic-in-ga4-utm-reporting-guide); [ioquery.fr](https://ioquery.fr/en/chatgpt-ads-conversion-tracking); [paidsync.ai](https://paidsync.ai/blog/measure-chatgpt-ads-in-ga4)
- Reported: GA4 rewrites the medium to `ai-assistant` for organic citation clicks (unverified) — search summary covering [rankshift.ai](https://www.rankshift.ai/blog/how-to-track-chatgpt-referrals-in-ga4/) / [paidsync.ai](https://paidsync.ai/blog/measure-chatgpt-ads-in-ga4)

### Inferences
- For MrBean (GA4 already installed): the GA4 connector is optional and account-manager-gated. The pixel + CAPI remain the conversion source of truth for bidding. Use UTMs + channel group for GA4-side reporting.

### Gaps
- Which exact metrics the beta imports (sessions vs events), its latency, and its optimization eligibility were not detailed in what I could read. Whether it's available for non-US/UA accounts is unknown.

## 6. Privacy and consent: OpenAI requirements, EU/ePrivacy, data use, Ukraine

### Takeaway
OpenAI puts the legal burden on the advertiser: send conversion data only after informing users clearly and "obtaining all necessary consents where required by law". The pixel itself defaults to consent **on**. OpenAI says it doesn't currently use pixel data for user-level personalization. For a Ukrainian site, the 2010 data-protection law has no explicit cookie-consent rule, and GDPR-style Draft Law 8153 is (per sources) still not finally adopted. If the site targets EU users, or wants to be safe, disclose the pixel and its cookies and gate the pixel with `oaiq("consent", ...)`.

### Cited Findings
- OpenAI help: "Conversion data should be shared only when permitted and in compliance with applicable laws and OpenAI terms. Only send conversion data after providing clear and comprehensive information to users about the data you collect on your site or app and obtaining all necessary consents where required by law" — [help.openai.com Conversion Measurement](https://help.openai.com/en/articles/20001409-conversion-measurement) (search summary)
- "OpenAI does not currently use data collected via the measurement pixel for user-level personalization" (search summary of official pixel doc). The `opt_out` flag exists for future personalization — [developers.openai.com/ads/measurement-pixel](https://developers.openai.com/ads/measurement-pixel); [OpenAI plugin](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/references/measurement-pixel.md)
- OpenAI's plugin ends every setup with a warning: "before deploying, the advertiser should review that the implementation satisfies their privacy, security, consent, and data handling requirements" — [OpenAI plugin SKILL.md](https://github.com/openai/plugins/blob/main/plugins/openai-ads-conversions/skills/openai-ads-conversions-setup/SKILL.md)
- Critique: the docs don't instruct site owners to obtain consent before deploying — [techaiwire.com](https://techaiwire.com/articles/openai-obi-cookie-ads-pixel-chatgpt-accounts/). A study claims 66% of 341 (mostly European) shops with the pixel send an event before consent — [ciphercue.com](https://ciphercue.com/blog/openai-chatgpt-ad-pixel-european-shops)
- Third-party compliance advice, not an OpenAI requirement:
  - List the pixel, `__oppref` (and `__obref`) and the bzr.openai.com endpoints in the cookie declaration under marketing/advertising.
  - Name OpenAI as a recipient with a US transfer in the privacy notice.
  - Hashed identifiers are still personal data under GDPR; ePrivacy Art. 5(3) applies to the cookie.

  Sources: [captaincompliance.com](https://captaincompliance.com/education/chatgpt-cookies-complete-openai-cookie-list-ads-pixel-tracking-and-privacy-guide/); [seresa.io](https://seresa.io/blog/consent-rates-data-impact/chatgpt-ads-never-see-your-chats-but-hashed-conversions-are-still-regulated); [kukie.io](https://kukie.io/blog/how-chatgpt-ads-and-cookies-work)
- An "Ad Tools Data Processing Addendum" was mentioned only by a secondary guide and is unverified — search summary (no single URL confirmed)
- Ukraine:
  - The 2010 Law on Personal Data Protection doesn't mention cookies by name. General consent provisions apply if cookies process personal data — [kukie.io – Ukraine](https://kukie.io/blog/cookie-consent-ukraine-data-protection); [dlapiperdataprotection.com](https://www.dlapiperdataprotection.com/index.html?t=law&c=UA)
  - Draft Law 8153 (GDPR/Convention 108+ alignment) passed first reading on 20 Nov 2024 and, per 2026 sources, has not been finally adopted. It would add explicit cookie consent and fines up to UAH 150m / 8% of turnover (reported) — [recordinglaw.com](https://www.recordinglaw.com/world-laws/world-data-privacy-laws/ukraine-data-privacy-laws/); [Baker McKenzie](https://resourcehub.bakermckenzie.com/en/resources/global-data-and-cyber-handbook/emea/ukraine/topics/key-data-and-cybersecurity-laws)

### Inferences
- MrBean's current state is GA4 + Google Ads without a banner, plus a /cookie/ page. OpenAI does not technically require a banner (consent defaults to on), but its terms require disclosure and consent "where required by law". Minimum action: add OpenAI (pixel, `__oppref`/`__obref`, bzr.openai.com, US transfer, purpose: ad conversion measurement) to the /cookie/ page and privacy policy.
- If EU visitors are material, or Law 8153 is enacted, add a consent banner wired to `oaiq("consent", false)` before init and `oaiq("consent", true)` on accept, mirroring Google Consent Mode. For CAPI, send hashed email only where the privacy notice covers it. CAPI has no consent switch other than not sending, or `opt_out`.
- Not legal advice; a Ukrainian privacy lawyer should confirm.

### Gaps
- OpenAI's Advertising Terms / data-processing terms text was not retrieved. Whether they mandate specific privacy-policy wording is unknown.
- Current Verkhovna Rada status of Draft Law 8153 as of Nov 2026 is unconfirmed (sources inconsistent).
- Whether ChatGPT ads (and thus the pixel/CAPI) are offered to Ukrainian advertisers/audiences was not researched here.

## 7. Third-party implementations, SDKs/repos, and practitioner-reported problems

### Takeaway
There is no official npm SDK for CAPI. OpenAI publishes a Codex plugin with reference docs and verification scripts. Mature third-party options exist: Stape web and server GTM templates (open source, listed in the GTM gallery), Shopify apps, PixelYourSite, and CDP destinations. Common failures are consent-default leakage, pasting HTML into JS-only fields, silently dropped invalid events, UTM template overrides, seconds-vs-ms timestamps, and confusion between item unit and line amounts.

### Cited Findings
- OpenAI "OpenAI Ads Conversions" Codex plugin (v0.1.2, author OpenAI). Contents:
  - references: measurement-pixel, conversions-api, framework-patterns, verification-checklist
  - scripts: `verify_ads_setup.py` and `verify_capi_secret_not_exposed.py`

  [github.com/openai/plugins](https://github.com/openai/plugins/tree/main/plugins/openai-ads-conversions); listing — [openai.com/business/plugins/openai-ads-conversions](https://openai.com/my-MM/business/plugins/openai-ads-conversions/); [tessl.io](https://tessl.io/registry/skills/github/openai/plugins/openai-ads-conversions-setup)
- Stape:
  - Server GTM tag "OpenAI Ads Conversions API by Stape" (Apache-2.0; renamed from "OpenAI Ads Events API"). It maps GA4 events, hashes PII, manages `__oppref`/`__obref`, and supports Consent Mode `ad_storage`, a `validate_only` UI field, and optional Event ID autogeneration (Sep 2026) — [github.com/stape-io/openai-capi-tag](https://github.com/stape-io/openai-capi-tag); [community.stape.io](https://community.stape.io/t/openai-ads-conversions-api-tag-for-google-tag-manager-server-side/4112)
  - Web GTM tag — [github.com/stape-io/openai-pixel-tag](https://github.com/stape-io/openai-pixel-tag); [community.stape.io](https://community.stape.io/t/new-gtm-templates-openai-ads-conversions-web-and-server-side/4114)
- OpenAI reportedly lists Stape and Datahash for GTM pixel/CAPI. OpenAI publishes no first-party GTM template — [soku.ai](https://soku.ai/blog/chatgpt-ads-google-tag-manager); [ppc.land](https://ppc.land/gtm-template-fills-the-gap-left-by-openais-ads-pixel-launch/); [advancedtrackingacademy.com](https://advancedtrackingacademy.com/blog/chatgpt-ads-server-side-gtm/)
- Other integrations:
  - Shopify: [Shopify app "OpenAI Ads Pixel ChatGPT Ads"](https://apps.shopify.com/pixel-capi-chatgpt-openai-ads), [Zalify](https://zalify.com/help/zalify-pixels/openai-pixel), [WeltPixel guide](https://weltpixel.com/blogs/news/how-to-track-openai-ads-conversions-on-shopify)
  - WordPress/WooCommerce: [PixelYourSite](https://www.pixelyoursite.com/docs/openai-settings-setup)
  - Mobile measurement: [AppsFlyer](https://support.appsflyer.com/hc/en-us/articles/48439655791249-ChatGPT-Ads-OpenAI-integration-setup)
  - CDP/server-side destinations: [MetaRouter](https://metarouter.readme.io/docs/openai-ads-capi), [Commanders Act](https://doc.commandersact.com/features/destinations/destinations-catalog/openai-conversions-api), [CustomerLabs](https://www.customerlabs.com/docs/destinations/ad-platforms/openai-ads/), [EdgeTag](https://docs.edgetag.io/channels/open-ai-ads/onboarding.md), [Adsmurai](https://help.adsmurai.com/openai-ads-conversion-api-with-one-tag), [Extract.to](https://docs.extract.to/reverse-etl-destinations/openai-ads-conversions-api)
- Problems reported:
  - Shopify custom-pixel error from pasting the full HTML snippet (with `<script>` tags) into a JS-only field — [community.shopify.com](https://community.shopify.com/t/openai-ads-pixel/676475)
  - The pixel silently drops rule-breaking events; a GTM "fired" status doesn't prove sending, so use debug mode — [ai-advisors.ai](https://www.ai-advisors.ai/blog/how-to-check-chatgpt-ads-pixel-is-working)
  - A 10-digit timestamp in third-party samples (must be 13-digit ms) — [pixellint.org](https://pixellint.org/packs/openai-conversions-api/)
  - "OpenAI CAPI is not Meta with a new host": different field names than Meta CAPI — [dev.to](https://dev.to/aleksuix/openai-capi-is-not-meta-with-a-new-host-39nj)
  - Unit vs line amount ambiguity — [soku.ai](https://soku.ai/blog/chatgpt-ads-conversion-value-item-amount)
  - UTM "(not set)" and override issues — [readme.anytrack.io](https://readme.anytrack.io/docs/chatgpt-ads-utm-parameters)

### Inferences
- For a hand-coded Next.js + Netlify stack, GTM/Stape isn't needed. The OpenAI plugin's verification checklist is a ready QA list (single init, no `NEXT_PUBLIC_` key, shared `event_id`, sanitized `source_url`, raw `oppref`, `validate_only` off in prod).

### Gaps
- No official Node/TypeScript CAPI SDK was found. No Segment/RudderStack official destination was confirmed in what I could read.
- Reddit r/PPC / r/GoogleTagManager threads were not surfaced by search, and pages couldn't be fetched.
