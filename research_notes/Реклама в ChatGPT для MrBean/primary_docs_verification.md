# Verifying OpenAI Ads (ChatGPT ads) facts against primary documentation (as of 9 November 2026)

**How this was checked.** On 2026-11-09 I downloaded the OpenAI developer docs for Ads directly. I used the index https://developers.openai.com/ads/llms.txt and the single-file export https://developers.openai.com/ads/llms-full.txt (428 KB, 8,821 lines). I also downloaded four individual `.md` pages (measurement-pixel, conversions-api, bidding-and-budgets, campaign-targeting), and they match the export. Every page has a Markdown twin at `https://developers.openai.com/ads/<slug>.md`. The individual developer-doc pages show no "last updated" date. The only dated content is the changelog on the API Overview page, whose latest entry is **26 Oct 2026**. I also read two Agentic Commerce spec pages (products and file-upload overview), and PPC Land articles fetched directly.

**Pages I could not read:**
- **help.openai.com:** WebFetch failed with `getaddrinfo ENOTFOUND`, so the host is outside this session's allowed network. I did not try mirrors.
- **openai.com, ads.openai.com, platform.openai.com:** each returned **HTTP 403 "Just a moment..."**, a Cloudflare challenge.
- **https://ads.openai.com/assets/openai-geotargets.csv:** the location catalog. https://developers.openai.com/ads/openai-geotargets.csv redirects there, so it was also unreachable.

**What this means:** anything that exists only in the help center (minimum-budget table, the 9 Nov Target CPC/CPA article, recommended headline lengths, the creative-enhancements article, the context-hint writing article) **could not be verified from a primary source** today. Where PPC Land quotes those pages, that is marked [TRADE].

**Main corrections to the earlier notes** (details in each section):
1. The Pixel `user` field is `postal_code`, not `zip_code`. The Pixel also now accepts `phone_number_sha256`, `first_name_sha256`, `last_name_sha256` and `region`.
2. The Conversions API (CAPI) `user` object uses the **plural list fields** (`emails_sha256`, ...). Hashed phone numbers are allowed. The singular names in OpenAI's Codex plugin are outdated.
3. The `__oppref` cookie lasts **30 days** (official), which settles the 30 vs 90 days conflict.
4. An official **Image Tag / `<noscript>` fallback** exists.
5. The official URL-template example uses **`{oppref}`** as a macro (`click_id={oppref}`), which contradicts the third-party advice not to put oppref in templates.
6. The developer docs do **not** yet list Target CPC/CPA, and do **not** list oCPM: conversion campaigns bill per click.
7. The developer docs contradict themselves on whether view-through conversions are included in "Conversions".
8. Product-feed files: CSV via SFTP in the Ads guide, and Parquet/JSONL/CSV/TSV (gzipped) in the Commerce spec. The standard feed format "currently targets the US".
9. Custom audiences are **not supported for campaigns targeting the EEA/Switzerland** (new). Phone normalization for audiences (E.164 *with* "+") differs from Pixel/CAPI (strip "+").
10. Location targeting is no longer described as "US-only state/DMA/ZIP". It uses country, region and market IDs plus `excluded_locations`.
11. PPC Land has **no article** on the 9 Nov Target CPC/CPA change.

---

## 1. Measurement Pixel: base code, script URL, init/measure, events, eventData, event_id, user matching and hashing, consent, cookies

### Takeaway
All of the Pixel facts are now confirmed verbatim from https://developers.openai.com/ads/measurement-pixel.
- The loader is a short self-invoking stub that loads `https://bzrcdn.openai.com/sdk/oaiq.min.js`, followed by `oaiq("init", { pixelId })`.
- Events are sent with `oaiq("measure", eventName, eventData, options)`. Amounts are integers in minor units, and `event_id` goes in the options argument.
- Hashed user data goes only on `init`. The user fields are now **`email_sha256`, `phone_number_sha256`, `external_id_sha256`, `first_name_sha256`, `last_name_sha256`, `country`, `city`, `region`, `postal_code`**.
- Consent is on by default, and `oaiq("consent", false)` removes the cookies.
- Cookies: `__oppref` lasts 30 days and is reset on each new capture; `__obref` lasts 365 days.

### Cited Findings
**Official base code (verbatim)**, introduced by the docs as: "Add the following snippet to the `<head>` section every page where you want to capture conversions. Put the script near the top of your `<head>`…" — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel) ([.md](https://developers.openai.com/ads/measurement-pixel.md))
```html
<script>
  (function (w, d, s, u) {
    if (w.oaiq) return;
    var q = function () {
      q.q.push(arguments);
    };
    q.q = [];
    w.oaiq = q;
    var js = d.createElement(s);
    js.async = true;
    js.src = u;
    var f = d.getElementsByTagName(s)[0];
    f.parentNode.insertBefore(js, f);
  })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");

  oaiq("init", {
    pixelId: "<YOUR-PIXEL-ID>",
  });
</script>
```

**Init options**
- "`pixelId` is required. Create a new Pixel ID in the conversions tab of Ads Manager. `debug` is optional and logs SDK activity to the browser console" — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- The install snippet contains **no `page_viewed` call**. Supported Events says: "Use `page_viewed` for page loads. Use `contents_viewed` when a user views a specific product". No page says the Pixel tracks page views automatically. — [Supported Events](https://developers.openai.com/ads/supported-events)

**`measure` call**
- A `measure` call takes up to four arguments: Command (`"measure"`), Event name, Event data (an object whose `type` matches the event's data shape), and Options. Options are "Optional for standard events. Required for custom events to pass `custom_event_name`." — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- Options fields:
  - `event_id`: "Set a unique ID to identify the same event sent from the browser and server."
  - `custom_event_name`
  - `opt_out`: "OpenAI does not currently use data collected via the measurement pixel for user-level personalization."
  
  — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**Standard events and data types**
| Event | Data type |
|---|---|
| `page_viewed` | `contents` |
| `contents_viewed` | `contents` |
| `items_added` | `contents` |
| `checkout_started` | `contents` |
| `order_created` ("A purchase is completed") | `contents` |
| `lead_created` | `customer_action` |
| `registration_completed` | `customer_action` |
| `appointment_scheduled` | `customer_action` |
| `subscription_created` | `plan_enrollment` |
| `trial_started` | `plan_enrollment` |
| `custom` | `custom` |
| `app_installed`, `app_opened` | `customer_action` (CAPI only; "not supported by the JavaScript Pixel currently") |

— [Supported Events](https://developers.openai.com/ads/supported-events)

**eventData fields**
- `contents` shape: `type` (required), `amount` (integer, "Event-level monetary value in the currency's standard minor unit"), `currency` ("Required when `amount` is present"), `contents` (array). — [Supported Events](https://developers.openai.com/ads/supported-events)
- `contents[]` item fields:
  - `id`, `name`, `content_type`, `quantity` (integer), `amount` ("Per-unit price in the currency's standard minor unit"), `currency`
  - `group_id` and `variant_dict` are marked "**Conversions API only**", so they are not for the Pixel
  - "Use only the documented fields inside `contents[]`."
  
  — [Supported Events](https://developers.openai.com/ads/supported-events); [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- Amount semantics are the same for the Pixel and CAPI: "`contents[].amount` is the price of one unit. The event-level `amount` represents the value of the whole event". Worked example: 2 × TRY 799.00 gives item `amount: 79900`, `quantity: 2`, event `amount: 159800`. — [Supported Events](https://developers.openai.com/ads/supported-events)
- "Event amounts use the currency's standard minor unit: `8900` for USD 89.00, or `8900` for JPY 8,900." — [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)

**Custom events**
- Names must be 1–64 characters, use only letters, numbers, underscores or dashes, start and end with a letter or number, and not match a standard name. "Use lowercase names for consistency." — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**User data / advanced matching**
- "Add an optional `user` object to `oaiq("init", ...)` … User data is request-scoped, so don't add it to individual `oaiq("measure", ...)` calls." If data arrives later, "call `init` again with the complete `user` object". With one pixel per page, `pixelId` can be omitted after the first init. — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- Pixel user fields (exact names): `email_sha256`, `phone_number_sha256`, `external_id_sha256`, `first_name_sha256`, `last_name_sha256`, `country` (ISO 3166-1 alpha-2), `city` (max 128), `region` (max 128), `postal_code` (max 32). — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- The changelog dates this: "August 19th, 2026 – Added phone, first name, last name, region, and postal code matching fields to the JavaScript Pixel." — [API Overview changelog](https://developers.openai.com/ads/api-overview)
- Normalization rules (identical on the Pixel and CAPI pages):
  - Email: "trim leading and trailing whitespace and convert the value to lowercase."
  - Phone: "keep the country calling code. Remove all whitespace, parentheses, periods, and hyphens, then remove a leading `+` and any leading zeroes. Hash the resulting 8–15 digits." Example: `+1 (415) 555-2671` → `14155552671`.
  - External ID: "trim … Preserve case and all other characters."
  - First and last name: "convert the value to lowercase and remove all whitespace and ASCII punctuation … preserve non-ASCII characters; don't strip accents or transliterate". Examples: `O'Connor` → `oconnor`, `José` → `josé`.
  - Encoding: "Encode each normalized value as UTF-8, compute its SHA-256 digest, and send the digest as a lowercase, 64-character hexadecimal string."
  
  — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel); [Conversions API](https://developers.openai.com/ads/conversions-api)
- Automatic advanced matching: "When enabled, the OpenAI Pixel automatically detects supported customer information from your website … normalizes and securely hashes this information in the browser using SHA-256 … Raw customer information is not sent". The page does not say where to switch it on or off. — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**Consent**
- Order of calls: `oaiq("consent", false);` → `oaiq("init", {pixelId})` → `oaiq("consent", true)` "after the user grants measurement consent". — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- "The Pixel initializes consent to `true` by default unless you set it to `false` or the Pixel finds a stored denial. When consent is `false`, the Pixel doesn't send measurement-event pings … blocked events aren't replayed." — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**Cookies (official)**
| Cookie | Expiry |
|---|---|
| `__oppref` | "30 days after the Pixel writes the cookie" |
| `__obref` | "365 days after creation" |

- Every capture of a non-empty `oppref` URL parameter, including the same value again, resets the expiry to 30 days. Reading the stored cookie does not extend it.
- `__obref` is "a randomly generated browser reference".
- Both cookies are used "When measurement consent is granted". "Calling `oaiq("consent", false)` removes both cookies."

— [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**What the SDK does automatically**
- "It captures `oppref` from the landing page URL … stores `oppref` in a first-party `__oppref` cookie … adds the current page origin as `source_url` … timestamps each event and batches closely grouped `measure` calls." — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**Deduplication**
- "Duplicate-event matching uses your Pixel ID, the event name, and `event_id` … OpenAI uses the first event it receives for a matching key and ignores later duplicates." For custom events, `custom_event_name` replaces the event name in the key. — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**CSP (official table)**
- `script-src https://bzrcdn.openai.com`
- `connect-src https://bzr.openai.com` and `https://bzrcdn.openai.com` (per-pixel configuration)
- `img-src https://bzr.openai.com` ("image request fallback")

"Don't add `'unsafe-inline'` solely for the Measurement Pixel." — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)

**Image tag (official, new to these notes)**
- Endpoint: `https://bzr.openai.com/v1/sdk/events?pid=<PIXEL-ID>&event=<name>&data[type]=…`, plus optional `event_id` and `oppref`.
- It can serve as a `<noscript>` fallback for the JS Pixel.
- "The image tag doesn't capture or store `oppref` for you."
- An accepted request returns `200 image/gif`.
- "OpenAI rejects unknown fields."

— [Image Tag](https://developers.openai.com/ads/image-tag)

**Monitoring**
- `GET https://api.ads.openai.com/v1/conversions/events?pid=…` returns "a sample of recent events from roughly the last 15 minutes". Browser events are labeled `pixel_sdk` and server events `server_to_server`. — [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)

**Corrections to earlier notes (pixel_capi_measurement.md §1)**
- WRONG/OUTDATED: "Pixel user fields: `email_sha256`, `external_id_sha256`, `country`, `city`, `zip_code`" (from the Codex plugin, last changed 26 Aug 2026). The official field is **`postal_code`**, and phone, name and region fields now exist. — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- RESOLVED: the `__oppref` lifetime is officially **30 days**, so the 90-day claim is wrong. — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- RESOLVED: the verbatim base code and the full CSP table are now captured above.
- WRONG: "No official `<noscript>`/image-tag fallback documentation was found." The official [Image Tag](https://developers.openai.com/ads/image-tag) page documents one.
- The Next.js sketch in the earlier notes used a hand-written queue stub. Replace it with the official snippet above, which also guards against double-loading with `if (w.oaiq) return;`.
- `contents[].content_type` is optional in the official docs ("Optional non-empty category"). Stape's "required" rule is the tag's own rule. — [Supported Events](https://developers.openai.com/ads/supported-events)

### Inferences
- For UAH (2 minor digits under ISO 4217), 1 250.00 UAH is sent as `amount: 125000, currency: "UAH"`. The docs accept "a valid three-letter ISO 4217 currency code", so UAH should be syntactically valid. Neither doc confirms how UAH values are converted for ROAS in a USD or EUR account.
- Ukrainian phone example under the official rule: `+380 (67) 123-45-67` becomes `380671234567` (12 digits, inside 8–15), then is SHA-256 hashed.
- Cyrillic names: lowercase and keep the Cyrillic letters, with no transliteration (e.g. `Олена` → `олена`). The doc's rule "preserve non-ASCII characters" supports this.

### Gaps
- Where automatic advanced matching is switched on or off in Ads Manager is not documented in the developer docs.
- The Pixel ID format is not documented.
- No dedup time window is documented.

---

## 2. Conversions API (CAPI): endpoint, auth, key creation, schema, user fields, validate_only, limits, dedup, responses

### Takeaway
Confirmed from https://developers.openai.com/ads/conversions-api:
- The call is `POST https://bzr.openai.com/v1/events?pid=<PIXEL-ID>` with `Authorization: Bearer <Conversions API key>`.
- The key is created in the Ads Manager **conversions tab**, or via `POST https://api.ads.openai.com/v1/conversions/api_keys` with an Advertiser API key.
- The request body is `{validate_only?, integration_source?, events[]}`. Batches hold up to 1,000 events, and one bad event fails the batch. Events must be no more than 7 days old and no more than 10 minutes in the future.
- `user` uses **plural list fields** with at most 3 values each. Hashed phone numbers are allowed. `obref`, `ip_address` and `user_agent` are raw strings.
- Deduplication with the Pixel uses Pixel ID + event name + `id`, and the first event received wins.
- No CAPI response body or error schema is documented.

### Cited Findings
**Endpoint, auth and keys**
- Endpoint: `curl -X POST "https://bzr.openai.com/v1/events?pid=<PIXEL-ID>" -H "Authorization: Bearer <API-KEY>" -H "Content-Type: application/json"`. "Send events to the Conversions API from your server only." — [Conversions API](https://developers.openai.com/ads/conversions-api)
- "You can provision a Pixel ID and Conversions API key from the conversions tab in Ads Manager. Approved API partners can use the Ads API key associated with a client account to provision both resources with the conversion setup endpoints." — [Conversions API](https://developers.openai.com/ads/conversions-api)
- The API route is `POST https://api.ads.openai.com/v1/conversions/api_keys`, which returns `api_key`. "This key authenticates event requests to `bzr.openai.com`; continue using your Advertiser API key for setup and management requests to `api.ads.openai.com`." — [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)
- The Advertiser API key is created "within the Settings page in Ads Manager" (ads.openai.com/settings). — [API Overview](https://developers.openai.com/ads/api-overview)

**Request top level**
| Field | Required | Notes |
|---|---|---|
| `pid` | Yes | Query parameter |
| `validate_only` | No | "Validates events without saving them when `true`" |
| `integration_source` | No | 1–64 ASCII characters, for partners |
| `events` | Yes | |

- "The API accepts batches of up to 1,000 events. If one event in the batch fails, the full batch fails." — [Conversions API](https://developers.openai.com/ads/conversions-api)

**Event fields (exact names)**
- `id`: required. "Reuse the same ID when retrying or sending the same conversion through another integration."
- `type`: required. One of the 11 standard or custom names, plus `app_installed`/`app_opened` for apps.
- `timestamp_ms`: required. An integer Unix timestamp in milliseconds; "must be within the last 7 days and no more than 10 minutes in the future".
- `custom_event_name`: required when `type` is `custom`.
- `oppref`: optional. "Pass the original string without modification."
- `source_url`: "Required for web events when `action_source` is `web` … Use a URL with a scheme and host".
- `action_source`: one of `web`, `mobile_app`, `offline`, `physical_store`, `phone_call`, `email`, `other`.
- `user`: optional.
- `opt_out`: optional.
- `data`: required. Same shapes as the Pixel, plus `contents[].group_id` and `contents[].variant_dict`.

— [Conversions API](https://developers.openai.com/ads/conversions-api)

- "We recommend sending all conversion events, not just those with an `oppref`, to incorporate view-through conversions". "Unlike the pixel, the API does not capture `oppref` for you." — [Conversions API](https://developers.openai.com/ads/conversions-api)

**User object (exact names)**
- List fields: `phone_numbers_sha256`, `emails_sha256`, `external_ids_sha256`, `first_names_sha256`, `last_names_sha256`, `regions`, `postal_codes`, `cities`, `countries`.
- Scalar fields: `android_advertising_id`, `obref`, `ip_address` ("Send without hashing"), `user_agent`.
- "Use the plural list fields below. Each submitted list must contain at most three values. When you supply both singular and plural forms, each merged field must contain at most three unique values. Exceeding either limit returns HTTP 400; the API does not truncate values."
- "Send geographic values as raw strings."
- "Unlike `oppref`, which is an event-level field, `obref` belongs inside `user`." For hybrid setups, read the `__obref` cookie in the browser, send it to your server and include it "unchanged".

— [Conversions API](https://developers.openai.com/ads/conversions-api)

- Changelog: "August 19th, 2026 – Added plural customer-information fields and Android GAID support to the Conversions API"; "July 16th, 2026 – Added support for passing the Pixel browser reference as `events[].user.obref`". — [API Overview changelog](https://developers.openai.com/ads/api-overview)
- Normalization and hashing rules are identical to the Pixel's (section 1), including phone hashing. — [Conversions API](https://developers.openai.com/ads/conversions-api)

**Test mode**
- "add `"validate_only": true` at the request's top level. Validation-only requests do not appear in event monitoring." — [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)

**Dedup**
- "reuse the same value as the API `id` and pixel `event_id`. Send both events with the same Pixel ID … OpenAI uses your Pixel ID, `event_name`, and `id`. OpenAI uses the first event it receives for a matching key and ignores later duplicates." — [Conversions API](https://developers.openai.com/ads/conversions-api)

**Responses and errors**
- The CAPI page documents only "HTTP 400" for the list-size limit.
- The general Troubleshooting page lists error categories (authentication failure, access denied, validation error, not found, conflict, request too large, rate limited) without a CAPI body schema. — [Conversions API](https://developers.openai.com/ads/conversions-api); [Troubleshooting](https://developers.openai.com/ads/troubleshooting)

**Corrections to earlier notes (pixel_capi_measurement.md §2)**
- RESOLVED, and the earlier "version A" was outdated: the official current names are the **plural list fields** ("version B", matching Stape commit b7fc153 of 9 Sep 2026).
  - The OpenAI Codex plugin's singular `email_sha256`/`zip_code` and its "Do not send … phone numbers, or phone hashes" are **outdated**.
  - Phone hashes **are** accepted (`phone_numbers_sha256`).
  - Singular forms still appear to be tolerated, since the doc mentions merging singular and plural forms.
  
  — [Conversions API](https://developers.openai.com/ads/conversions-api)
- NUANCE: "source_url = origin + pathname only, strip query strings" is advice from OpenAI's plugin. The official doc requires only "a URL with a scheme and host". Stripping the query is still sensible for privacy. — [Conversions API](https://developers.openai.com/ads/conversions-api)
- CONFIRMED: `integration_source` is an official optional top-level field, not something Stape invented. — [Conversions API](https://developers.openai.com/ads/conversions-api)
- CONFIRMED: Pixel IDs and Conversions API keys are created in the Ads Manager "conversions tab". The exact sub-menu label ("Conversion keys") still comes only from third-party sources.

### Inferences
- In the earlier TypeScript sketch, `user: { emails_sha256: [...], ip_address, user_agent }` matches the official schema. Add `phone_numbers_sha256: [sha256("380671234567")]` and `obref` (from the `__obref` cookie) when available and covered by consent.

### Gaps
- The CAPI success and error response body is not documented.
- No CAPI rate limits are documented. The Advertiser API rate-limit table applies to api.ads.openai.com, not bzr.openai.com.
- No dedup time window is documented.

---

## 3. Landing page URL parameters: click ID, query_string_template, macros, beta status

### Takeaway
- The click ID parameter is **`oppref`**, appended to the landing URL. This is confirmed.
- Custom parameters use `landing_page_configuration.query_string_template` at the campaign, ad group or ad level, plus account tracking-settings defaults.
- The official examples use the macros `{campaign_id}`, `{ad_id}` and **`{oppref}`**.
- The developer docs label this "where available", not "beta". They list no other macros.

### Cited Findings
- The Pixel "captures `oppref` from the landing page URL, which is a privacy-preserving identifier". — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel)
- "Add `landing_page_configuration.query_string_template` at the campaign, ad-group, or ad level where available. Account tracking settings also provide defaults. For product feeds, the ad's tracking settings apply to product destinations". — [Campaign Management](https://developers.openai.com/ads/campaign-management)
- Official examples:
  - `"query_string_template": "utm_source=openai&utm_campaign={campaign_id}&utm_content={ad_id}&click_id={oppref}"` — [Campaign Management](https://developers.openai.com/ads/campaign-management)
  - The campaign-create example: `"utm_source=openai&utm_medium=paid&utm_campaign={campaign_id}&utm_content={ad_id}"` — [Campaign Management](https://developers.openai.com/ads/campaign-management)
- Precedence ("new mode"): "`Feed (if applicable) < Account < Campaign < Ad group < Ad`". "When the same query key appears at more than one level, the highest-priority value wins. This applies to all query keys, including custom keys". Feed parameters without a matching configured key stay in the final URL. — [Campaign Management](https://developers.openai.com/ads/campaign-management)
- Legacy product-feed ordering gives feed URL values the highest priority. "Accounts using Legacy ordering must migrate by **November 5, 2026**". An account admin opts in with "Switch now" in the "Feed tracking is changing" banner. — [Campaign Management](https://developers.openai.com/ads/campaign-management)
- Destination URL: "must be an HTTP or HTTPS URL no longer than 2,048 characters and accessible to OpenAI's ad crawlers". — [Campaign Management](https://developers.openai.com/ads/campaign-management)
- [TRADE, secondary] An academic panel study of 387 shops' GA4 data, reported by PPC Land on 2 Nov 2026, says: "Paid ChatGPT traffic is identified almost entirely by the chatgpt.com / cpc source and medium". This suggests paid clicks often arrive tagged `chatgpt.com / cpc`. It is not an OpenAI statement. — [PPC Land, 2 Nov 2026](https://ppc.land/chatgpt-ad-visits-earn-shops-0-89-against-2-45-for-google-search-ads/)

**Corrections to earlier notes (pixel_capi_measurement.md §3)**
- WRONG: "Don't put `oppref` in templates" (anytrack/metrikia). OpenAI's own example puts `{oppref}` in a template as `click_id={oppref}`. Do not *hard-code* an oppref value, but the macro is official. — [Campaign Management](https://developers.openai.com/ads/campaign-management)
- UNCONFIRMED: the macros `{ad_group_id}` and `{ad_account_id}` come from third-party sources (Soku). They are **not found** in the developer docs, which show only `{campaign_id}`, `{ad_id}` and `{oppref}`.
- UPDATED: the official precedence chain includes **Account** and **Feed**, not just "Ad URL > Ad > Ad Group > Campaign".
- The beta-vs-GA question: the developer docs say "where available", with no beta label. The help-center wording could not be checked.

### Inferences
- MrBean template: `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={ad_id}`. Leave `oppref` alone; OpenAI appends it, and the Pixel cookies it. Make sure Netlify redirects keep the query string.

### Gaps
- The complete supported macro list and the Ads Manager UI field name ("Landing page query parameters") were not verified; that is help-center content.
- No official statement says whether OpenAI auto-appends `utm_*` to ad clicks.

---

## 4. Bidding and budgets: strategies, Target CPC/CPA, Max CPC retirement, minimum daily budgets, currencies (UAH), pacing, suggested bids

### Takeaway
- The developer docs, current to their 26 Oct changelog, list only **`fixed_bid`, `maximize_clicks`, `maximize_conversions`** ("Maximize Results"). They do **not** mention Target CPC, Target CPA, "intelligent bidding", or the 1 Jan 2027 retirement of Max CPC/Max bid.
- Those claims, effective 9 Nov 2026, come only from the help center (unreachable) and from trade press quoting an OpenAI email. **PPC Land has no article on it.**
- Minimum daily budgets: the docs say only "Daily minimums depend on the account currency". There is **no table**. The full currency table and UAH status could not be verified. PPC Land says the 21 Oct expansion post "gives no billing currencies".
- 7-day-average pacing and the $3–5 suggested CPC are not in the developer docs.

### Cited Findings
**Bid strategies (developer docs)**
| Strategy | Compatible objectives | Budget | Bid amount |
|---|---|---|---|
| Fixed bid | Impressions, clicks, conversions | Daily or lifetime | Provide `max_bid_micros` |
| Maximize clicks | Clicks | Daily | Omit `max_bid_micros` |
| Maximize conversions | Conversions | Daily | Omit `max_bid_micros` |

"**Maximize Results** is the name for the `maximize_clicks` and `maximize_conversions` strategies. Both are available for standard and product-feed campaigns." — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)

- Valid objective, billing and strategy combinations:
  - `impressions`: `impression` billing with `fixed_bid`
  - `clicks`: `click` billing with `fixed_bid` or `maximize_clicks`
  - `conversions`: `click` billing with `fixed_bid` or `maximize_conversions`
  
  "Conversion campaigns optimize for the selected action and bill for valid clicks." — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)
- Maximize Results requirements: a daily budget, no `max_bid_micros`, no audience bid multipliers, and an `Idempotency-Key` ("required for Maximize Results"). "Use audience bid multipliers only with `fixed_bid`." — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)
- oCPC: "`max_bid_micros` is the CPA bid even though billing uses valid clicks". "oCPC is in open beta for both standard and product-feed campaigns." A 403 `Conversion bidding is not enabled` error means the account is not enabled. — [Conversion-Optimized Campaigns](https://developers.openai.com/ads/conversion-optimized-campaigns)
- Bid micros: "$2.50 click bid … is `2500000`". For impressions, the bid is per impression: "A $60 CPM bid … send `60000` micros". "Bid limits and permitted monetary precision depend on the account currency and campaign objective." — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)
- `bid_too_low: true` "indicates that the bid may be too low for reliable delivery. It is guidance, not a serving restriction". The warning is not raised "within 24 hours of an ad-group update". — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets); [Troubleshooting](https://developers.openai.com/ads/troubleshooting)

**Target CPC / Target CPA (not in developer docs)**
- A search of the full Ads export for `target_cpa`, `target_cpc`, "Target CPA", "intelligent bidding", `retire` and "January 1, 2027" returned **no matches** on 2026-11-09. — [Ads llms-full.txt](https://developers.openai.com/ads/llms-full.txt)
- The official help article [Bidding strategies and how pricing works in ChatGPT Ads](https://help.openai.com/en/articles/20001634-bidding-strategies-and-how-pricing-works-in-chatgpt-ads) is **unreachable** from this session.
- [3RD] Secondary coverage of OpenAI's advertiser email (not verified):
  - Target CPA and Target CPC start 9 Nov for *new* campaigns.
  - "Maximize Results" is renamed "Intelligent Bidding".
  - Max Bid and Max CPC retire 1 Jan 2027.
  - OpenAI recommends setting targets from recent actual CPA or CPC.
  
  — [Search Engine Roundtable](https://seroundtable.com/openai-updates-chatgpt-ads-bidding-options-42470.html); [Relevant Audience](https://www.relevantaudience.com/ai/chatgpt-ads-target-cpa-target-cpc-replace-max-bid/)
- [TRADE] PPC Land's sitemap (posts through 2026-11-09 08:08 UTC) has **no** article on the Target CPC/CPA change. Its newest bidding coverage is "ChatGPT Ads makes automated bidding the default in new ad groups" (21 Aug 2026). That article quotes the help center: "Maximize results prioritizes result volume and does not guarantee delivery against a specific CPA, CPC, ROAS, or other cost-efficiency target at this time", and says "Manual: Max bid remains … the only documented route to a hard ceiling". — [PPC Land, 21 Aug 2026](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/)

**Budgets**
- "Daily minimums depend on the account currency. Requests below the applicable minimum return an error with the required amount." — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)
- "Provide exactly one budget field. A campaign cannot have both a daily and a lifetime budget." "You cannot switch a daily budget back to a lifetime budget through a campaign update." "You cannot reduce a lifetime budget below the amount the campaign has already spent." "The API can reject a budget that is below an ad group's effective bid." — [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)
- The API minimum for `budget.lifetime_spend_limit_micros` is `1000000` (one currency unit). — [Campaigns API reference](https://developers.openai.com/ads/api-reference/campaigns)
- Currency and time zone: "Currency and timezone are creation-time choices and cannot be edited through the branding update." `GET /ad_account` returns `currency_code`. — [Account Management](https://developers.openai.com/ads/account-management); [API Partner Setup](https://developers.openai.com/ads/api-partner-setup)
- Account daily spending limits were added 9 Sep 2026 for "ad accounts on postpaid invoice billing", and "Spend-limit windows are available only to some accounts". — [API Overview changelog](https://developers.openai.com/ads/api-overview); [Bidding & Budgets](https://developers.openai.com/ads/bidding-and-budgets)
- [TRADE] The minimum-spend table "surfaced on August 21" listed ten currencies: USD 25, GBP 15, CAD 25, AUD 25, NZD 25, JPY 2,500, KRW 25,000, BRL 40, MXN 150, INR 725. — [PPC Land, 29 Aug 2026](https://ppc.land/openai-gains-32-chatgpt-ad-markets-in-5-days-as-india-goes-live/); [PPC Land, 22 Aug 2026](https://ppc.land/microsoft-retires-max-cpc-as-chatgpt-ads-defaults-to-automated-bidding/)
- [TRADE] On the 21 Oct expansion: "It gives no billing currencies … the Southeast Asian launch added no new currencies to it. Whether advertisers in Argentina, Nigeria or Pakistan are billed in local currency or in US dollars is not stated." Also: "currency tables have lagged launches". — [PPC Land, 21 Oct 2026](https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/)

**Corrections and caveats to earlier notes (official_openai_ads_docs.md §1 and §3)**
- UNVERIFIABLE TODAY: EUR 15, CHF 20, PLN 65, the "AED to ZAR" table, and the "7-day average, 2× daily / 7× weekly" pacing. These come only from help-center search extracts. No primary page read today contains them. PPC Land's last description of the table (August) lists ten currencies with **no EUR**, and that predates the 24 Aug European launch. Treat these values as plausible but unverified.
- UNVERIFIABLE: the "$3–$5 starting CPC" is not in the developer docs, whose examples are labeled "illustrative". PPC Land does corroborate that the May 2026 docs recommended "three to five dollars per click". — [PPC Land, 21 Aug 2026](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/)
- NOT IN DEVELOPER DOCS: **oCPM** ("billing per 1,000 impressions" for the Conversions objective). The developer docs allow only `click` billing for `conversions`. If oCPM exists, it is a help-center or UI feature not reflected in the API docs.
- UNVERIFIED: the Target CPC/CPA dates (9 Nov, 18 Nov API fields, 1 Jan 2027 retirement) remain trade-press-sourced. The developer docs are consistent with API fields not yet existing.
- No source read today states that UAH is a billing currency. **UAH: not found in primary docs.**

### Inferences
- The UI may show Target CPC today while the API still exposes `fixed_bid`/`maximize_*`. For a self-serve MrBean account, follow what Ads Manager shows at creation. The billing currency offered to a Ukraine-registered account can only be confirmed in the signup flow, and it is permanent.

### Gaps
- The minimum daily budget table by currency, the UAH status, the pacing rules, the official suggested bids, and the official 9 Nov text all need help.openai.com, which is not reachable.

---

## 5. Context hints: guidance, count, language, limits, negatives, audiences and multipliers

### Takeaway
- The developer docs confirm: hints are not exact-match keywords; **up to 2,000 per ad group**; updates replace the whole list; and the writing examples below.
- There is **no** guidance on language (Ukrainian or other non-English), no recommended count, and **no negative or exclusion hints**. The only exclusions are geographic and audience exclusions.
- Custom audiences: inclusion and bid multipliers need **at least 25,000 matched users**, and exclusion has no minimum. Bid multipliers range 0.1×–10× and work with fixed bids only. Custom audiences are **not supported for campaigns targeting the EEA or Switzerland**.

### Cited Findings
**Context hints**
- "Context hints provide additional information about the ads in an ad group. Use them to describe relevant products, use cases, or needs that the creative and landing page may not fully cover. Hints are not exact-match keywords. They also do not replace explicit geographic, platform, or audience targeting." — [Targeting](https://developers.openai.com/ads/campaign-targeting)
- Official examples (less useful → more useful):
  - "Shoes" → "Lightweight trail running shoes for rocky terrain"
  - "Outdoors" → "Water-resistant footwear for wet-weather hiking"
  - "California customers" → "Use geographic targeting for California; describe the product's use case in hints"
  
  "These examples illustrate writing style, not a guarantee". — [Targeting](https://developers.openai.com/ads/campaign-targeting)
- "An ad group can contain up to 2,000 hints. You do not need to fill the limit". "Updating `context_hints` replaces the current list … Send an empty array to clear the list." The API reference describes the field as `context_hints` string[] "Free-form audience or placement hints", with no per-hint character limit stated. — [Targeting](https://developers.openai.com/ads/campaign-targeting); [Ad Groups API](https://developers.openai.com/ads/api-reference/ad-groups)
- "Context hints supply context rather than hard keyword eligibility." — [Troubleshooting](https://developers.openai.com/ads/troubleshooting)

**Location exclusions**
- `targeting.excluded_locations` (countries or IDs), up to 2,500 IDs in the inclusion and exclusion lists. Location IDs cover "countries, regions, or markets" via `/v1/geo_lookup/search`. Product-feed campaigns allow country level only. — [Targeting](https://developers.openai.com/ads/campaign-targeting); [Location Targeting](https://developers.openai.com/ads/location-targeting)

**Audiences**
- "Inclusion and bid multipliers require at least 25,000 matched users; ready exclusion audiences have no minimum." "Exclusions take precedence". — [Targeting](https://developers.openai.com/ads/campaign-targeting)
- Bid multiplier range: "`100000` to `10000000`, representing 0.1× to 10×". — [Ad Groups API](https://developers.openai.com/ads/api-reference/ad-groups)
- "Custom audiences are not supported for campaigns targeting the European Economic Area (EEA) or Switzerland, where personalized ads are not yet available." — [Custom Audiences](https://developers.openai.com/ads/custom-audiences)
- Audience file rules:
  - UTF-8 CSV or TXT, at most 500,000,000 bytes.
  - Identifiers: `email`, `phone_number` (**E.164 with `+`**), `email_sha256`, `phone_number_sha256` ("normalized E.164"), `gaid`.
  - "do not assume another API uses the same phone normalization."
  
  — [Custom Audiences](https://developers.openai.com/ads/custom-audiences); [Targeting](https://developers.openai.com/ads/campaign-targeting)

**Corrections and additions to earlier notes (official_openai_ads_docs.md §4)**
- The quote "Hints cannot enforce geographic limits, schedules, or exclusions" is **not found** in the current developer docs. The current wording is "do not replace explicit geographic, platform, or audience targeting". The meaning is the same.
- NEW: the EEA/Switzerland custom-audience restriction. Ukraine is not in the EEA, so it does not apply to a Ukraine-only campaign. That is an inference; no Ukraine-specific statement exists.
- NEW: audience phone hashing (E.164 *with* "+") differs from Pixel/CAPI hashing (strip "+").
- UPDATED: geographic targeting is no longer "state, DMA, ZIP in US only" in the developer docs. It uses region and market location IDs. Whether Ukrainian oblasts or cities exist in the catalog is unknown, because the catalog CSV redirects to ads.openai.com (Cloudflare 403).

### Inferences
- Write hints as concrete use-case sentences, e.g. "Waterproof bean bag chair for a garden or terrace". The developer docs say nothing about language. Since ChatGPT conversations in Ukraine will mostly be in Ukrainian or Russian, a mixed set of Ukrainian and English hints is a reasonable test. That is my suggestion, not OpenAI guidance.

### Gaps
- The official help article [Writing context hints](https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads) could not be read. A search summary says the localized versions show an "article not available in this language" notice followed by English text, which is unverified.
- No primary statement covers non-English hints or matching across languages.
- No recommended hint count or per-hint length limit is documented.

---

## 6. Creative specs, multi-image, creative enhancements, landing page rules

### Takeaway
- Confirmed in the developer docs:
  - title 3–50 characters, body up to 100 characters
  - images JPEG, PNG or **WebP**, at least 640×640
  - multi-image ads take 4–6 square 1:1 images, for enabled accounts (changelog 26 Oct 2026)
  - landing URL HTTP/HTTPS, up to 2,048 characters, crawler-accessible
  - brand icon (favicon) at least 128×128
- Recommended lengths (16–24 / 32–48) and the 1200×1200 maximum are help-center claims I could not verify.
- Creative enhancements, which can rewrite, translate, resize and change the URL, are **not in the developer docs**. Per PPC Land quoting OpenAI's email and help page, they were switched **on by default on 29 or 30 Oct 2026**, with an opt-out toggle in Ads Manager **Settings → "Creative enhancement"** (account default, with campaign-level override).

### Cited Findings
**Single-image ads**
- "Use a title of 3–50 characters and a body no longer than 100 characters. The destination must be an HTTP or HTTPS URL no longer than 2,048 characters and accessible to OpenAI's ad crawlers." — [Campaign Management](https://developers.openai.com/ads/campaign-management); [Ads API](https://developers.openai.com/ads/api-reference/ads)
- "Use JPEG, PNG, or WebP and provide an image at least 640 × 640 pixels." — [Campaign Management](https://developers.openai.com/ads/campaign-management)

**Multi-image ads**
- "An ad can include 4–6 images using `creative.file_ids` … one title, body, and destination URL shared by all images. Your account must be enabled for ads with multiple images. Use an ad group in a standard Reach, Clicks, or Conversions campaign. Use fixed bidding unless your account is also enabled for multiple images with automatic bidding."
- Images must be square (1:1).
- Multi-image ads "don't accept `image_crop`, `price`, or `business_agent_id`".
- "Create a new ad to change an existing single-image ad into an ad with multiple images."

— [Campaign Management](https://developers.openai.com/ads/campaign-management)

- The changelog dates the multi-image API to "October 26, 2026" for "Enabled accounts". — [API Overview changelog](https://developers.openai.com/ads/api-overview)

**Review and branding**
- "Updating creative creates a new submitted version and starts another review." `review_status` is `in_review`, `rejected` or `approved`. — [Campaign Management](https://developers.openai.com/ads/campaign-management); [Ads API](https://developers.openai.com/ads/api-reference/ads)
- Brand icon: "An account cannot serve ads until its brand review is approved. If `review.reason` is `missing_favicon`…". The image "must be at least 128 × 128 pixels". "Changing the legal or public brand name pauses ad delivery until the account passes review." — [API Partner Setup](https://developers.openai.com/ads/api-partner-setup); [Ad Account API](https://developers.openai.com/ads/api-reference/ad-account)

**Creative enhancements (via PPC Land)**
- [TRADE, quoting OpenAI's 20 Oct email]:
  - "Starting Friday, October 30, 2026, we'll enable creative enhancements for your new and existing self-serve campaigns".
  - "Enhancements can include new or updated headlines and descriptions, image resizing, destination-URL optimization, and translation into other languages."
  - "When enabled, these ads can run automatically without requiring you to review or approve each version."
  - Opt-out: "You can opt out … or change your settings at any time in Ads Manager. We'll preserve your existing account and campaign-level opt-outs, and campaign-specific settings will take priority over account defaults."
  
  The help page as checked on 21 Oct said **Thursday 29 Oct**. — [PPC Land, 21 Oct 2026](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/)
- [TRADE] The control is a single card in Ads Manager **Settings** titled "Creative enhancement" with an On/Off toggle. It covers all four types together, with no per-type control and no ad- or ad-group-level control described. The help page says there is no preview of every variation and no reporting that separates enhanced versions. — [PPC Land, 21 Oct 2026](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/)
- A search of the developer docs export for "creative enhancement", "translat" and "language" finds no match. — [Ads llms-full.txt](https://developers.openai.com/ads/llms-full.txt)

**Corrections and caveats to earlier notes (official_openai_ads_docs.md §5)**
- ADD: WebP is accepted, the 640×640 minimum is confirmed, and the favicon minimum is 128×128.
- UNVERIFIABLE: "PNG/JPG, no larger than 1200×1200" and "16–24 / 32–48 recommended" are help-center only. PPC Land says the May docs recommended "about 16 characters" for headlines and "about 32" for descriptions. — [PPC Land, 21 Oct 2026](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/)
- UPDATED: creative enhancements are **on by default since about 29–30 Oct 2026** unless the advertiser opted out. The earlier notes did not mention the default-on switch or the opt-out location.
- The multi-image "open beta as of 26 Oct" claim is help-center sourced. The developer docs say "Enabled accounts".

### Inferences
- MrBean should decide on the Creative enhancement toggle in Settings before launch. The case for turning it off is that auto-translation and URL "optimization" can change Ukrainian copy and landing pages without review. If it stays on, monitor results.

### Gaps
- The official help article on creative enhancements could not be read directly.
- Landing-page policy details beyond "accessible to OpenAI's ad crawlers" are on openai.com/policies, which returned 403.

---

## 7. Product feeds for ads: spec, format, delivery, countries

### Takeaway
- The Ads guide uses a **UTF-8 CSV uploaded to the SFTP root**. The Commerce spec prefers **Parquet** and also supports `jsonl.gz`, `csv.gz` and `tsv.gz`.
- The spec has nine required fields, plus `is_ads_eligible=true` for ads.
- The Delta API handles title, price and availability changes. An optional `is_full_refresh` deletes products missing from a full upload within a day.
- Feed API access must be enabled ("contact your OpenAI account team").
- The spec states that **"The standard OpenAI-format upload currently targets the US"**. The shared market format "currently represents `US`, `CA`, and `MX`", and other markets require OpenAI confirmation.
- No primary source says feed campaigns are available in Ukraine.

### Cited Findings
- Prerequisites: "Product feed API access for the account … If feed access is unavailable, contact your OpenAI account team". Feed creation takes `countries` ("the countries your catalog supports"). — [Product Feeds](https://developers.openai.com/ads/product-feeds)
- "Create a UTF-8 CSV with one row per product item or variant." "Set `is_ads_eligible` to `true` for products you want processed for ads". "Product pages and images must be publicly accessible HTTPS URLs." "Place feed files directly in the SFTP root, without nested folders." Password or SSH-key authentication is supported. — [Product Feeds](https://developers.openai.com/ads/product-feeds)
- Required fields: `item_id`, `title`, `description`, `url`, `brand`, `seller_name`, `image_url`, `availability` (`in_stock`, `out_of_stock`, `pre_order`, `backorder` or `unknown`; "Omitted, empty, or unrecognized values reject the row"), and `price` (`"79.99 USD"`, major units, ISO 4217). — [Products spec](https://developers.openai.com/commerce/specs/file-upload/products)
- `is_ads_eligible`: "Omitted or empty: disabled unless a feed-level Ads default applies." `ads_metadata` (e.g. `{"custom_label_0":"summer"}`) is used for product filters. — [Products spec](https://developers.openai.com/commerce/specs/file-upload/products)
- Geo tagging: "The standard OpenAI-format upload currently targets the US. Row-level market columns do not change that default. Use additional markets only after OpenAI confirms the integration and its allowed countries and currencies." The `target_countries` column: "the shared format currently represents `US`, `CA`, and `MX`. Standard uploads use `["US"]` regardless of this column." — [Products spec](https://developers.openai.com/commerce/specs/file-upload/products)
- Delivery: "Push feeds to OpenAI via SFTP. Formats: Prefer `parquet` (ideally with `ztsd` compression). `jsonl.gz`, `csv.gz`, and `tsv.gz` are also supported." UTF-8, stable filenames, about 500k items and about 500 MB per shard. — [File upload overview](https://developers.openai.com/commerce/specs/file-upload/overview)
- Delta API: `PATCH /v1/feeds/{feed_id}/products` with prices in minor units `{"amount": 7999, "currency": "USD"}`. It is for title, price and availability only; new products and other fields go through a full SFTP upload. "`is_full_refresh: true` … OpenAI deletes products missing from it within a day." — [Product Feeds](https://developers.openai.com/ads/product-feeds)
- Product-ad template macros: `{{brand}}`, `{{product.title}}`, `{{product.body}}`, `{{product.price}}`. "Each product-feed ad group can contain at most one non-archived product-ad template." Feed campaigns allow country-level geo only, and "mode, objective, and linked feed cannot be changed after creation". — [Product Feeds](https://developers.openai.com/ads/product-feeds)
- Feed oCPC: "Product-feed oCPC is available in open beta." — [Conversion-Optimized Campaigns](https://developers.openai.com/ads/conversion-optimized-campaigns)

**Corrections and caveats to earlier notes (official_openai_ads_docs.md §6)**
- UNVERIFIABLE: "Items uploaded manually, by hosted URL or by SFTP expire after 2 weeks" and the "hosted URL" delivery option are help-center only. The developer docs describe SFTP only, and mention "expired" items only in passing (the item query "excludes deleted, expired, and ads-ineligible items").
- UPDATED: the formats are not "CSV only". The Commerce spec prefers Parquet and also accepts gzipped JSONL, CSV and TSV. The Ads walkthrough uses CSV.
- STRENGTHENED: the feed spec states that the standard format targets the US (with CA and MX in the shared format), and other markets need OpenAI confirmation. This firmly supports "feed campaigns likely unavailable for Ukraine for now".

### Inferences
- MrBean (Ukraine, UAH prices) cannot use a standard product feed without OpenAI confirming the UA market and UAH currency. Plan on standard image ads, and ask OpenAI support about feed eligibility.

### Gaps
- No primary statement on Ukraine or UAH product feeds.
- The help-center feed article could not be read.

---

## 8. Objectives, conversion event selection, attribution windows, metrics

### Takeaway
- Objectives (`bidding_type`) are `impressions` (the default if omitted), `clicks` and `conversions` (oCPC, billed per click).
- A conversions campaign needs exactly one active **standard** event setting. The event cannot be changed later, and existing CPM or CPC campaigns cannot be converted.
- Attribution: click window 7, 14 or 30 days (default 30); view window 0 or 1 day (default 1); time basis ad-event (default) or conversion time.
- The developer docs **contradict themselves** on whether "Conversions" includes view-through. The newer Reporting page and the 30 Sep changelog say yes; the Pixel and CAPI pages say no.

### Cited Findings
- `bidding_type`: "`impressions`, `clicks`, or `conversions`. Defaults to `impressions`." For conversions: "exactly one active standard event setting ID". — [Campaigns API](https://developers.openai.com/ads/api-reference/campaigns)
- "Custom events cannot be used for conversion optimization. The campaign objective cannot be changed after creation. For a conversion-optimized campaign, the selected event setting also cannot be changed". Clicks and impressions campaigns can attach event settings for tracking only. — [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)
- "You cannot change an existing CPM or CPC campaign to oCPC." — [Conversion-Optimized Campaigns](https://developers.openai.com/ads/conversion-optimized-campaigns)
- Event settings are created with `POST /v1/conversions/event_settings`, using `event_type`, `attribution_window_days: 30` ("Use `30` for this setup") and `source_ids` ("Select one source per setting"). — [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)
- Reporting windows:
  - `attribution_window_days`: `7`, `14` or `30`, default 30
  - `view_through_attribution_window_days`: `0` or `1`, default 1
  - "Each window defaults independently"
  - "If an outcome is eligible for both click-through and view-through attribution, the click takes precedence"
  - `attribution_time_basis` is `ad_event_time` (default) or `conversion_time`
  
  — [Reporting](https://developers.openai.com/ads/reporting)
- Metrics:
  - `impressions`, `clicks`, `spend`, `ctr` (a ratio), `cpc`, `cpm`
  - `conversions` ("Goal conversions from clicks plus views within the selected attribution windows")
  - `cpa`, `post_click_cvr`
  - `order_created_attributed_sales`, `order_created_roas`
  - for multi-product cards: `product.carousel_product_card_impressions` and `product.carousel_product_card_clicks`
  
  — [Reporting](https://developers.openai.com/ads/reporting)
- Breakdowns: country, device and platform (one segment per request), and product for feeds. — [Reporting](https://developers.openai.com/ads/reporting)
- Data freshness: "Conversions and purchase outcomes … Update through daily processing … Allow at least one day for conversion data to appear." Impressions and clicks can appear "within minutes". — [Reporting](https://developers.openai.com/ads/reporting)
- **Conflict within the official docs:**
  - The Pixel and CAPI pages say: "Ads Manager reports view-through conversions as a separate, campaign-level metric. They are not included in `Conversions`, which remains the click-through conversion total. CPA, post-click CVR, bidding, billing, and conversion optimization also remain click-through-based." — [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel); [Conversions API](https://developers.openai.com/ads/conversions-api)
  - The changelog and Reporting page say: "September 30th, 2026 – … Conversion totals include click-through plus view-through goal conversions". `post_click_cvr` remains click-only. — [API Overview changelog](https://developers.openai.com/ads/api-overview); [Reporting](https://developers.openai.com/ads/reporting)
  
  The newer, dated statement (30 Sep) probably supersedes the undated Pixel and CAPI text for reporting. Bidding is not addressed by the change.

**Corrections to earlier notes**
- The earlier official_openai_ads_docs.md §8 already flagged this conflict. It should now say that the **developer docs themselves** conflict, and that the 30 Sep 2026 changelog points to "Conversions = CT + VT" in reporting.
- The earlier claim that CSV headers look like `attributed_event_…` is help-center sourced. The API uses `attributed_events[]` objects.

### Inferences
- When comparing ChatGPT Ads conversions with GA4, set `view_through_attribution_window_days=0`, or the Ads Manager equivalent, to get click-only numbers.

### Gaps
- Help-center details on objectives in the UI (Reach/Clicks/Conversions naming, oCPM) could not be read.
- No modeled conversions are documented.

---

## 9. PPC Land: the 21 Oct 2026 "26 new countries" article, the 9 Nov bidding change, and other Oct–Nov 2026 ChatGPT-ads articles

### Takeaway
- The 21 Oct article confirms Ukraine among the **11 named of 26** new countries, for 89 in total. It says the OpenAI post gives **no billing currencies**, no languages and no eligibility rules.
- **No PPC Land article on the 9 Nov Target CPC/CPA change exists** in its sitemap as of 9 Nov 08:08 UTC.
- The most decision-relevant Oct–Nov pieces for a small store:
  - creative enhancements turned on by default, with an opt-out (21 Oct)
  - a TrafficGuard study finding 0.1%–34% invalid clicks by advertiser (5 Oct)
  - an academic panel finding paid ChatGPT visits earned shops $0.89 vs $2.45 for Google paid search in the US (2 Nov)

### Cited Findings
**21 Oct 2026: "Advertisers in 26 more countries gain ChatGPT ads, bringing the total to 89"** (Luis Rijo, dated October 21, 2026) — [PPC Land](https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/)
- OpenAI quote: "we're also launching in more markets across Europe, the Middle East, Africa, and Asia, including Nigeria, South Africa, Serbia, Ukraine, Cambodia, Bangladesh, and Pakistan". Only 11 of the 26 are named.
- Access: "Advertisers can access ChatGPT Ads in these countries through technology partners or self-service access through Ads Manager". The post "does not say whether the legal-entity restriction applies".
- Currency: "It gives no billing currencies." The August table listed ten currencies, "and the Southeast Asian launch added no new currencies to it". Billing in local currency vs USD "is not stated".
- Language: the new markets "bring languages such as … Ukrainian … The post does not say whether ads can be written in each local language or whether context hints work across them."
- Plans: Free and Go only ("Plus, Pro, and Enterprise subscriptions will remain ad-free").

**9 Nov bidding change**
- Not covered by PPC Land. A sitemap scan of posts since 1 Oct with "cpa", "cpc", "target" or "bidding" in the slug finds only Google, Reddit and Amazon items plus glossary pages. — [ppc.land sitemap-posts.xml](https://ppc.land/sitemap-posts.xml)
- The latest relevant PPC Land bidding coverage is 21–22 Aug 2026 (Maximize results default; Max bid as the only hard ceiling). — [PPC Land, 21 Aug 2026](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/); [PPC Land, 22 Aug 2026](https://ppc.land/microsoft-retires-max-cpc-as-chatgpt-ads-defaults-to-automated-bidding/)

**21 Oct 2026: "OpenAI to rewrite ChatGPT ads by default as advertisers get days to opt out"**
- Covered in section 6: default-on from 29 or 30 Oct; Settings → "Creative enhancement" toggle; account default with campaign override; no per-version approval; no per-type control; "Subject to the Ad Tool Terms".
- Practitioner reaction, opinion only: Melissa Mackey paused a test "due to poor lead quality".

— [PPC Land](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/); related: [PPC Land, Netflix / automatic ad rewrites](https://ppc.land/netflix-cuts-its-ad-target-to-2-7bn-as-openai-turns-on-automatic-ad-rewrites/)

**5 Oct 2026: "TrafficGuard finds up to 34% of clicks on some ChatGPT ads were invalid"**
- Sample: 40,021 ChatGPT ad clicks, 47 enterprise advertisers, 24 Aug–14 Sep 2026.
- Invalid rates ran from 0.1% to 34% by advertiser, about 4% overall by PPC Land's calculation.
- 3.34% of ChatGPT clicks came from hosting, proxy or malicious IP space, vs 0.92% for Google Ads clicks.
- Caveat: the vendor sells click-checking services, and the study does not show what OpenAI charged for.

— [PPC Land](https://ppc.land/trafficguard-finds-up-to-34-of-clicks-on-some-chatgpt-ads-were-invalid/)

**2 Nov 2026: "ChatGPT ad visits earn shops $0.89 against $2.45 for Google search ads"**
- Source: a working paper by Kaiser (WU Vienna) and Schulze (Frankfurt School), Oct 2026, v1, under review.
- Scope: 1,898 shops, with 387 receiving paid ChatGPT clicks.
- In the US, revenue per paid ChatGPT ad visit was $0.89 vs $2.45 per paid Google search visit. At paid-search returns, a ChatGPT click is worth about $0.26; "The largest publicly known account paid $1.72."
- Organic ChatGPT referrals fell about 6–8% after ads launched. Paid traffic was identified by "chatgpt.com / cpc".

— [PPC Land](https://ppc.land/chatgpt-ad-visits-earn-shops-0-89-against-2-45-for-google-search-ads/)

**6 Nov 2026: "ChatGPT builds mention and click charts for verified businesses"**
- An unannounced "Business Hub" for organic answers, reported via Marketplace Pulse and Search Engine Roundtable.
- Verification is "for example by connecting a Shopify store". It is separate from ads.

— [PPC Land](https://ppc.land/chatgpt-builds-mention-and-click-charts-for-verified-businesses/)

**6 Nov 2026: "War damage cut ad budgets, 76% of Ukrainian agencies tell IAB Ukraine"**
- Fetched. The article body contains **no** mention of ChatGPT or OpenAI. — [PPC Land](https://ppc.land/war-damage-cut-ad-budgets-76-of-ukrainian-agencies-tell-iab-ukraine/)

**Other Oct 2026 ChatGPT-ads posts in the sitemap (titles only, not read)**
- [Image-generation ad test, US](https://ppc.land/openai-to-test-ads-during-chatgpt-image-generation-in-us-this-month/) (5 Oct)
- [20 measurement partners](https://ppc.land/openai-gains-20-measurement-partners-for-chatgpt-ads/) (5 Oct)
- [IAS brand-safety pilot](https://ppc.land/chatgpt-ads-gains-ias-brand-safety-measurement-in-closed-pilot/) (5 Oct)
- [Weight Watchers CPA 15.3% below benchmark](https://ppc.land/weight-watchers-chatgpt-ads-cpa-ran-15-3-below-benchmark-dv-says/) (7 Oct)
- [StackAdapt retargeting of ChatGPT ad viewers](https://ppc.land/stackadapt-lets-advertisers-retarget-chatgpt-ad-viewers-on-ctv-and-display/) (28 Oct)
- [Click rate +112% worldwide](https://ppc.land/chatgpt-ad-click-rate-gains-112-worldwide-similarweb-and-graphite-find/) (4 Oct)

**Corrections to earlier notes**
- official_openai_ads_docs.md §1 says "PPC Land says the 21 Oct markets were added **without new billing currencies**". More precisely, PPC Land says the OpenAI post "gives no billing currencies" and that the SE Asia launch added none. It does not claim to have checked the table after 21 Oct.
- The earlier notes listed no PPC Land coverage of the bidding change. That is correct: none exists.

### Inferences
- For a small Ukrainian store, two findings matter most:
  - The economics are unproven: US revenue per paid ChatGPT visit is far below Google's in the one available panel.
  - The platform now rewrites ads by default.
- So: start small, opt out of creative enhancements, track invalid-click patterns in server logs and GA4, and judge results on CAPI-confirmed `order_created`.

### Gaps
- No PPC Land or primary coverage of Ukraine-specific currency, language or format availability.
- The PPC Land titles listed above were not read in full.
