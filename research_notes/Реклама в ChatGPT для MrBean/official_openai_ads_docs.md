# Official OpenAI Ads (ChatGPT Ads) platform documentation: how self-serve Ads Manager works and how a campaign is configured (state as of 9 November 2026)

**How these notes were gathered (read first).** Direct page fetching failed in this session: help.openai.com, openai.com, ppc.land and indexlab.ai all returned DNS errors (`getaddrinfo ENOTFOUND`) because those hosts are outside this session's allowed network. To fetch pages directly, help.openai.com, openai.com, developers.openai.com, ads.openai.com, ppc.land and searchengineland.com must be allowed in the session network settings. All facts below come from web-search index extracts and quotes of the pages named, collected on 2026-11-09. They are not full-page reads. Treat exact numbers as "as quoted by the search index" and re-check them in the live help center or in Ads Manager before spending money. Page publication or "last updated" dates were mostly not visible. Where a date is known it is given; otherwise the entry says "page date n/a".

**Source legend:**
- **[OFFICIAL]**: help.openai.com, openai.com, developers.openai.com, ads.openai.com, webinar.openai.com, chatgpt.com/merchants
- **[TRADE]**: PPC Land, Search Engine Land, Search Engine Journal, Digiday
- **[3RD]**: agency or vendor blogs, Wikipedia, forum posts
- **[UNVERIFIED]**: rumor, speculation, or a claim found only in one weak source

---

## 1. Account setup: eligibility, verification, country/currency/time zone, billing, taxes, new-account restrictions

### Takeaway
Ukraine is listed as "Available" for self-serve Ads Manager. The legal entity that advertises and is billed must be based in a listed country. Country, billing currency and time zone are permanent once the account is created. Billing is postpay by card, charged at a payment threshold and at month-end. **No evidence was found that UAH is a supported Ads billing currency.** The public minimum-budget table quoted by every source covers USD, EUR, GBP and others, but not UAH, so a Ukrainian ФОП will most likely be billed in USD or EUR. New accounts may be limited to their home country at first, which is not a problem for a Ukraine-only store.

### Cited Findings
**Eligibility and availability**
- [OFFICIAL] The Ads Manager Availability page lists Ukraine as "Available" for self-service, next to Tunisia, Turkey, the UAE and the UK. Countries not on the list get a waitlist sign-up instead. Page date n/a. The search tool's date stamp put the page at about 82 days old (around mid-August 2026), which contradicts it listing Ukraine, since Ukraine was only added on 21 Oct 2026. The stamp is probably the crawl date. — [Ads Manager Availability](https://help.openai.com/en/articles/20001245-ads-manager-availability)
- [OFFICIAL] The same page says the legal entity that will advertise and be billed must be based in a listed country. — [Ads Manager Availability](https://help.openai.com/en/articles/20001245-ads-manager-availability)
- [OFFICIAL] 21 Oct 2026: "we're expanding ChatGPT Ads to 26 additional countries, extending availability to 89 countries worldwide". The post says over 100,000 advertisers have run campaigns since launch "just over eight months ago", and advertisers can buy through technology partners or self-serve. The post names Ukraine among the new markets; per the search summary, OpenAI named only 11 of the 26. — [OpenAI: ChatGPT Ads expands to 26 new countries](https://openai.com/index/chatgpt-ads-expands-26-new-countries/)
- [TRADE] / [3RD] Coverage of the Ukraine launch on 21 Oct 2026, saying advertisers can buy via partners or self-serve in Ads Manager. — [dev.ua](https://dev.ua/en/news/reklamu-v-chatgpt-teper-mozhna-zapuskaty-v-ukraini-1792594874); [Advermedia.ua](https://advermedia.ua/en/chatgpt-ads/); [PPC Land, 89 countries](https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/); [The Next Web](https://thenextweb.com/news/chatgpt-ads-89-countries-100000-advertisers)
- [3RD] Digital Applied says the help center listed all 89 countries as self-serve available on the same day. — [Digital Applied](https://www.digitalapplied.com/blog/where-chatgpt-ads-are-sold-every-market-and-date)
- [3RD] [UNVERIFIED] Indexlab says a test of the campaign API did not accept Ukraine, Pakistan or Uzbekistan as targets, which conflicts with the help-center listing. — [Indexlab: 89 countries](https://www.indexlab.ai/blog/chatgpt-ads-89-countries)
- [OFFICIAL] Restricted or prohibited business models may be ineligible. Being a registered or licensed business does not make an advertiser automatically eligible for every category or market. — [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues)
- [3RD] A Sept 28, 2026 article claimed a Ukrainian legal entity could not yet pay for ads itself. The 21 Oct expansion supersedes this. — [propersonal.in.ua](https://propersonal.in.ua/blog/reklama-v-chatgpt-dlya-ukrainskogo-biznesu)

**Business verification**
- [OFFICIAL] Ads requires **business verification only**, not identity verification. Typical data: legal name, registered address, and a tax or registration identifier if requested. OpenAI may check official business-registration and tax records, then approve, decline or ask for more information. — [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues); [Ads Manager Account Setup](https://help.openai.com/en/articles/20001213-ads-manager-account-setup)
- [OFFICIAL] Pending verification "may take up to 7 business days". Verification can fail if OpenAI cannot confirm the business's identity, ownership or affiliations. — [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues)
- [OFFICIAL] If OpenAI cannot confirm that the advertiser identity matches the website provided, the domain may be rejected. — same source
- [OFFICIAL] Account verification, account approval, ad review and ad delivery are separate checks. Some accounts can run ads before full verification, but more business verification may be required after a spending threshold (amount not published). — same source
- [OFFICIAL] Ads may not serve until the account is verified, and Ads Manager Beta shows a banner prompting this step. — [Creating campaigns for ChatGPT Ads](https://help.openai.com/en/articles/20001210-creating-campaigns-for-chatgpt-ads)
- [OFFICIAL] Account-level rejections are appealed through the link in the decision email. Individual ads use a "Request Review" option in Ads Manager when available. — [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues)
- [3RD] A forum anecdote describes a German advertiser whose "geographic verification" was rejected without explanation. — [OpenAI Developer Community](https://community.openai.com/t/ads-manager-geographic-verification-rejected-without-a-specific-explanation/1410964)
- [3RD] No source says whether a Ukrainian ФОП (sole proprietor) is accepted as the "legal entity". — [mpatsan.com](https://mpatsan.com/thinking/yak-pratsiuie-reklama-v-chatgpt-i-z-choho-ukrainskomu-biznesu-pochaty-pershyi-test)

**Settings that cannot be changed**
- [OFFICIAL] An existing ad account's **country/region, billing currency and time zone cannot be changed**. Different settings need a separate ad account, and Support cannot change them. During setup the advertiser reviews the country and currency shown before completing. An older mirror of the billing article said only that these "may not be self-serve editable"; the newer, firmer wording applies. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment); [Ads Manager Account Setup](https://help.openai.com/en/articles/20001213-ads-manager-account-setup); [older mirror](https://help-lb.openai.com/en/articles/20001216-billing-payment)
- [OFFICIAL] API reference: the account time zone cannot change while a daily limit exists. — [Ad Account API reference](https://developers.openai.com/ads/api-reference/ad-account)
- [OFFICIAL] Creating more ad accounts requires an existing eligible self-serve account with credit-card billing, and it does not bypass verification or review. — [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues)

**Billing currencies and UAH**
- [OFFICIAL, via search extract] The billing-currency table in the help center runs alphabetically from AED to ZAR, with a minimum daily budget per currency. Quoted rows: USD 25, EUR 15, GBP 15, CHF 20, PLN 65. — [Daily budgets](https://help.openai.com/en/articles/20001413-daily-budgets); [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment)
- [TRADE] PPC Land says the "Minimum Campaign Spend" table was first documented on **21 Aug 2026** with ten currencies: USD 25, GBP 15, CAD 25, AUD 25, NZD 25, JPY 2,500, KRW 25,000, BRL 40, MXN 150, INR 725. — [PPC Land: 3-platform targeting](https://ppc.land/chatgpt-ads-gains-3-platform-targeting-as-reporting-stays-at-2-buckets/); [PPC Land: Microsoft retires Max CPC](https://ppc.land/microsoft-retires-max-cpc-as-chatgpt-ads-defaults-to-automated-bidding/)
- [TRADE] PPC Land says the 21 Oct markets were added **without new billing currencies** in the table. — [PPC Land, 89 countries](https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/)
- [3RD] Currency counts conflict: one guide says 37 currencies as of late Oct 2026, up from 10 in August; another says 21. — [Indexlab costs guide](https://www.indexlab.ai/guides/chatgpt-ads/costs); [Sprites.ai](https://www.sprites.ai/blog/chatgpt-ads-cost)
- [3RD] UAH is "not stated in OpenAI's table — check in Ads Manager". — [agentMention: ChatGPT Ads in Ukraine](https://agentmention.ai/blog/chatgpt-ads-ukraine); [newage.agency](https://newage.agency/blog-uk/chatgpt-ads-openai-ads/)
- [3RD] AG.Marketing says the account will be in a foreign currency and that paying with a UAH card means double conversion. It also says the bank may hold about $100 when the card is linked. — [AG.Marketing](https://ag.marketing/blog/shcho-take-reklama-chatgpt-ads/)
- [OFFICIAL, not ads] OpenAI's multi-currency billing page lists UAH for **ChatGPT subscriptions** on the web, and says API credits are USD-only. It does **not** cover Ads. — [Multi-currency billing](https://help.openai.com/en/articles/10421635-multicurrency-billing)

**Payment methods, thresholds, invoicing**
- [OFFICIAL] Billing must be set up before campaigns can deliver. Adding a card may trigger a temporary authorization hold in the account's billing currency. — [Ads Manager Account Setup](https://help.openai.com/en/articles/20001213-ads-manager-account-setup)
- [OFFICIAL] ChatGPT Ads uses **postpay** billing: advertisers are charged after delivery. Self-serve card accounts are charged when unpaid spend reaches the **payment threshold**, and any remaining unpaid balance is charged at month-end. The threshold cannot be changed manually. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment); [Troubleshooting Common Issues](https://help.openai.com/en/articles/20001217-troubleshooting-common-issues)
- [OFFICIAL] Thresholds vary by account and currency, and approved advertisers usually start lower. A higher threshold can follow **two separate successful payments**, each at or above the qualifying threshold before tax. Starting values were not published. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment); [Filipino version](https://help.openai.com/fil-ph/articles/20001216-billing-at-pagbabayad)
- [OFFICIAL] The threshold is not a campaign budget and not an account spend cap. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment)
- [OFFICIAL] **Invoicing** is for eligible sales-managed advertisers on postpaid invoice terms. Those accounts can also set a daily account spending limit; card-billed accounts cannot. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment); [Daily budgets](https://help.openai.com/en/articles/20001413-daily-budgets)
- [OFFICIAL] No prepay or top-up option was found in any official source. Search returned nothing on prepay. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment)
- [OFFICIAL] Ad credits for ChatGPT Business customers exist (article title only; content not retrieved). — [Claiming ad credits with ChatGPT Business](https://help.openai.com/en/articles/20001633-claiming-ad-credits-with-chatgpt-business)

**Taxes and VAT**
- [OFFICIAL] Advertisers can add or update supported VAT and tax IDs in Ads Manager. The available tax-ID types depend on the billing country. — [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment)
- [OFFICIAL] Fees exclude applicable taxes, so a card charge can exceed the payment threshold once taxes are added. — [Advertising Terms](https://openai.com/policies/advertising-terms/); [Billing & Payment](https://help.openai.com/en/articles/20001216-billing-payment)

**New-account restrictions**
- [OFFICIAL] "Some new self-serve ad accounts can initially advertise only in their home country", and selecting other countries does not override this. Other countries open up only after verification is approved and the account has spent enough on home-country campaigns. Creating a campaign or setting a budget is not enough, and the spend threshold is not published. This snippet says "identity verification", which conflicts with "business verification only" above. — [Frequently asked questions](https://help.openai.com/en/articles/20001220-frequently-asked-questions); [Creating campaigns](https://help.openai.com/en/articles/20001210-creating-campaigns-for-chatgpt-ads)

**Other buying routes**
- [OFFICIAL] An Ads Manager plugin can run inside ChatGPT. — [Use the ChatGPT Ads Manager plugin](https://help.openai.com/en/articles/20001558-use-the-chatgpt-ads-manager-plugin); [plugin page](https://openai.com/business/plugins/chatgpt-ads-manager/)
- [OFFICIAL] There is an Ads API with an API-partner programme. — [API overview](https://developers.openai.com/ads/api-overview); [API Partner Setup](https://developers.openai.com/ads/api-partner-setup)
- [TRADE] Since 16 Sep 2026, campaigns can be run from HubSpot and Shopify. A free Shopify app exists for **US** merchants. — [PPC Land: HubSpot and Shopify](https://ppc.land/openai-lets-advertisers-run-chatgpt-ads-from-hubspot-and-shopify/)

### Inferences
- Pick country and currency very carefully at signup. Since UAH appears unsupported, a Ukrainian ФОП will probably be offered USD or EUR. EUR has the lower minimum (€15 vs $25 per day). Which currencies a Ukraine-registered account is actually offered can only be confirmed in the signup flow.
- A Ukraine-only campaign avoids the home-country-only restriction for new accounts.
- Without prepay, the ФОП needs a card that can be charged in a foreign currency, ideally a USD or EUR card to avoid double conversion. Card spending in foreign currency on foreign online services also has Ukrainian banking and tax implications, which are outside this scope.

### Gaps
- No official confirmation of the exact list of billing currencies offered to Ukrainian accounts (UAH yes/no). The full currency table could not be fetched.
- Whether a ФОП (individual entrepreneur) passes business verification, and which Ukrainian documents are accepted (ЄДР extract, РНОКПП/ЄДРПОУ), is not documented.
- Starting payment-threshold amounts, the spend threshold for extra verification, and the spend needed to unlock other countries are not published.
- VAT handling for Ukrainian advertisers is not documented: no reverse-charge or Ukrainian "Google tax" (ПДВ на е-послуги) treatment was found.
- No source documents how long ad review takes, as opposed to the 7 business days for business verification.

---

## 2. Campaign structure: hierarchy, objectives, settings at each level

### Takeaway
The hierarchy is **ad account → campaign → ad group → ad**. The campaign holds the objective, location, platforms, schedule, budget and (for conversion campaigns) the conversion event. The ad group holds the bid strategy and bid, context hints, product selections and audience bid multipliers. Objectives are Reach (Views), Clicks and Conversions. No frequency-cap control was found.

### Cited Findings
- [OFFICIAL] Hierarchy: ad account → campaign → ad group → ad. Ad groups hold different bid configurations, context hints or product selections. Audience bid multipliers are an ad-group setting. — [API overview](https://developers.openai.com/ads/api-overview); [Campaign Management](https://developers.openai.com/ads/campaign-management)
- [OFFICIAL] Objectives and pricing: "Choose Views for impression-based buying, Clicks to optimize for traffic, or Conversions to optimize toward a supported standard conversion event." Elsewhere these are called Reach, Clicks and Conversions. — [Ads in ChatGPT: The Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics); [Creating ads](https://help.openai.com/en/articles/20001212-creating-ads-for-chatgpt-ads)
- [OFFICIAL] **Campaign level: location.** Country targeting, plus state, DMA and ZIP in the US only. Geo and audience updates replace existing criteria. — [Targeting (dev docs)](https://developers.openai.com/ads/campaign-targeting); [Creating campaigns](https://help.openai.com/en/articles/20001210-creating-campaigns-for-chatgpt-ads)
- [OFFICIAL] **Campaign level: platforms.** iOS App, Android App and Web (Web covers desktop and mobile web). Per a Sept 2026 changelog, the API offers finer web options: desktop_web, ios_web, android_web. Device appears as a reporting breakdown only. — [Targeting (dev docs)](https://developers.openai.com/ads/campaign-targeting)
- [TRADE] The headline says platform targeting covers three platforms while reporting has only two buckets. — [PPC Land: 3-platform targeting](https://ppc.land/chatgpt-ads-gains-3-platform-targeting-as-reporting-stays-at-2-buckets/)
- [OFFICIAL] **Campaign level: schedule.** Ads show only between the campaign's start and end times and only in its targeted locations. — [Campaigns API reference](https://developers.openai.com/ads/api-reference/campaigns)
- [OFFICIAL] **Campaign level: budget.** Daily budget or campaign-total budget (see section 3). — [Daily budgets](https://help.openai.com/en/articles/20001413-daily-budgets)
- [OFFICIAL] **Campaign level: conversion event.** A conversion campaign uses one selected standard event, and the event cannot be changed after creation. — [Conversion-optimized Campaigns](https://help.openai.com/en/articles/20001412-create-ocpc-campaigns)
- [OFFICIAL] **Ad group level.** Bid strategy (Maximize results / intelligent bidding is the default for eligible new ad groups; Manual max bid; from 9 Nov 2026 Target CPA/CPC), max or target bid, context hints, product selection for feed campaigns, and audience bid multipliers. — [Create Ad Groups for ChatGPT Ads](https://help.openai.com/en/articles/20001211-create-ad-groups-for-chatgpt-ads); [Maximize Results Bid Strategy](https://help.openai.com/en/articles/20001425-maximize-results-bid-strategy); [API overview](https://developers.openai.com/ads/api-overview)
- [OFFICIAL] **Custom audiences** exist (inclusion, exclusion, bid multipliers); see section 4. — [Set up Custom Audiences](https://help.openai.com/en/articles/20001346-set-up-custom-audiences-for-your-campaign); [Custom Audiences (dev)](https://developers.openai.com/ads/custom-audiences)
- [OFFICIAL] Delivery depends on campaign schedule, resource statuses, reviews, targeting and available inventory. — [Creating campaigns](https://help.openai.com/en/articles/20001210-creating-campaigns-for-chatgpt-ads)
- [OFFICIAL] Supporting articles: Quickstart, Launch Campaigns, and a bulk-upload schema checklist (campaigns can be bulk-uploaded). — [Quickstart: Launch your first campaign](https://help.openai.com/en/articles/20001224); [Launch Campaigns](https://help.openai.com/en/articles/20001209-launch-campaigns); [Bulk Upload Campaign Schema Checklist](https://help.openai.com/en/articles/20001218-bulk-upload-campaign-schema-checklist)
- [TRADE] Feature additions over time: daily budgets, geo-targeting and dynamic CTAs; later an "overview tab", "suggested ad drafts" and new ad formats. Headlines only. — [PPC Land: daily budgets, geo-targeting, dynamic CTAs](https://ppc.land/chatgpt-ads-manager-gets-daily-budgets-geo-targeting-and-dynamic-ctas/); [Search Engine Land: overview tab, suggested drafts](https://searchengineland.com/chatgpt-ads-new-overview-tab-suggested-ad-drafts-new-ad-formats-and-more-481913)
- [TRADE] Ads Manager opened to all US businesses with CPC bidding on about 5 May 2026. — [PPC Land: Ads Manager open to all US businesses](https://ppc.land/openai-opens-chatgpt-ads-manager-to-all-us-businesses-with-cpc-bidding/)

### Inferences
- For MrBean: one campaign targeting Ukraine and all three platforms, with separate ad groups per product line (bean bag chairs, frameless sofas, children's models, outdoor/waterproof) and distinct context hints in each. This follows OpenAI's advice to split ad groups when products or use cases differ.

### Gaps
- No frequency-cap setting found in any source.
- No dayparting or ad scheduling within a day was found.
- Whether language targeting exists is not documented.
- Whether campaign-level geo can include or exclude regions inside Ukraine is not documented; sub-national targeting is described for the US only.

---

## 3. Bidding and budgets: CPC, oCPC, CPM, oCPM, minimums, auction, learning, 9 Nov 2026 changes

### Takeaway
Reach campaigns bill on CPM, Clicks on CPC, and Conversions on oCPC (billed per click) or oCPM (billed per 1,000 impressions). Conversion campaigns need a Pixel or Conversions API and a standard event. **From 9 Nov 2026 (today), new click campaigns use Target CPC and new conversion campaigns use Target CPA.** Max CPC and Max Bid retire on 1 Jan 2027. The minimum daily budget is $25 or €15 per campaign. Daily budgets are 7-day averages: spend can reach 2× the daily budget in one day and 7× over a week.

### Cited Findings
**Bid types**
- [OFFICIAL] ChatGPT Ads bills on impressions and on valid clicks. Ad-group bids are a max CPM for Reach campaigns or a max CPC for Clicks campaigns. — [Ads in ChatGPT: The Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics); [Ad Groups API](https://developers.openai.com/ads/api-reference/ad-groups)
- [OFFICIAL] For CPC, the help center recommends **starting with a max bid of $3–$5 USD per click**. — [Ads in ChatGPT: The Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics)
- [TRADE] Default max CPM bid was $60 at the 5 May 2026 launch. — [PPC Land: Ads Manager open to all US businesses](https://ppc.land/openai-opens-chatgpt-ads-manager-to-all-us-businesses-with-cpc-bidding/)
- [OFFICIAL] **oCPC** optimizes delivery toward one conversion event but bills on valid clicks. In the API, `max_bid_micros` on an oCPC campaign is a CPA bid. Bid Cap is the most the advertiser will pay for a conversion, and the system converts it into a per-click auction bid from predicted conversion likelihood. — [Conversion-Optimized Campaigns (dev)](https://developers.openai.com/ads/conversion-optimized-campaigns); [Conversion-optimized Campaigns (help)](https://help.openai.com/en/articles/20001412-create-ocpc-campaigns)
- [OFFICIAL] **oCPM**: under the Conversions objective, eligible advertisers choose billing on valid clicks (oCPC) or on impressions served (oCPM, per 1,000 impressions). Advertisers never pay per conversion. — [Conversion-optimized Campaigns (help)](https://help.openai.com/en/articles/20001412-create-ocpc-campaigns); [Creating campaigns](https://help.openai.com/en/articles/20001210-creating-campaigns-for-chatgpt-ads)
- [OFFICIAL] oCPC/oCPM prerequisites:
  - conversion tracking through the Conversions API, the JavaScript Pixel, or both
  - at least one supported **standard** event; custom events are not supported for oCPC
  - one event per campaign, which cannot be changed after creation
  - existing CPM/CPC campaigns cannot be converted, so a new campaign is required
  - "no recommended bid amount at this time"
  
  The developer docs call oCPC "open beta". — [Conversion-optimized Campaigns (help)](https://help.openai.com/en/articles/20001412-create-ocpc-campaigns); [Conversion-Optimized Campaigns (dev)](https://developers.openai.com/ads/conversion-optimized-campaigns)
- [TRADE] Conversion-optimized campaigns began rolling out on 5 Jun 2026 to accounts that had a Pixel or CAPI event by 1 June. — [PPC Land: automated bidding default](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/)
- [TRADE] oCPC entered beta for product-feed campaigns in early August 2026 (SEL article dated 7 Aug 2026). — [Search Engine Land: oCPC, AAM, product carousels](https://searchengineland.com/chatgpt-ads-rolls-out-ocpc-campaigns-aam-and-product-carousels-484494); [PPC Land: AAM](https://ppc.land/chatgpt-advertisers-face-10-days-to-opt-out-of-automatic-advanced-matching/)
- No published minimum number of conversions or lookback window for oCPC/oCPM eligibility was found. The rumored "X conversions in 30 days" rule is unconfirmed. — [Conversion-optimized Campaigns (help)](https://help.openai.com/en/articles/20001412-create-ocpc-campaigns)

**Bid strategies**
- [OFFICIAL] "Maximize results" is selected by default for eligible new ad groups (changeable under Bid strategy). It optimizes toward the campaign goal within budget and, as PPC Land quotes the docs, "does not guarantee delivery against a specific CPA, CPC, ROAS, or other cost-efficiency target at this time". "Manual: Max bid" remains available as the only hard ceiling. — [Maximize Results Bid Strategy](https://help.openai.com/en/articles/20001425-maximize-results-bid-strategy); [PPC Land: automated bidding default](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/); [PPC Land: Microsoft retires Max CPC](https://ppc.land/microsoft-retires-max-cpc-as-chatgpt-ads-defaults-to-automated-bidding/)
- [OFFICIAL + TRADE] **Change effective 9 Nov 2026:**
  - Target CPA replaces Max Bid for new conversion campaigns, and Target CPC replaces Max CPC for new click campaigns.
  - "Maximize results" is renamed "intelligent bidding".
  - API partners get dedicated Target CPA and Target CPC fields from **18 Nov 2026**.
  - **Max Bid and Max CPC retire on 1 Jan 2027**, and remaining campaigns migrate.
  - Targets are averages, not caps: the system may bid above or below the target in a given auction.
  - Restrictive targets or weak conversion signals can reduce delivery and leave budget unspent.
  
  — [Bidding strategies and how pricing works in ChatGPT Ads](https://help.openai.com/en/articles/20001634-bidding-strategies-and-how-pricing-works-in-chatgpt-ads); [Search Engine Land: bidding options changing 9 Nov](https://searchengineland.com/chatgpt-ads-bidding-options-are-changing-on-november-9th-500701); [Relevant Audience](https://www.relevantaudience.com/ai/chatgpt-ads-target-cpa-target-cpc-replace-max-bid/); [Rudra Kasturi blog](https://blog.rudrakasturi.com/chatgpt-ads-target-cpa-and-target-cpc-start-on-9-november-and-max-bid-and-max-cpc-retire-on-1-january-2027/)
- Caveat: the full text of the official help article 20001634 was not retrieved. The dates come mainly from trade press quoting OpenAI's advertiser email, partly confirmed by the help-article title and structure.

**Budgets**
- [OFFICIAL] The minimum daily campaign budget varies by market and billing currency: **USD 25** (US), **EUR 15**, **GBP 15** (UK), CHF 20, PLN 65. Requests below the minimum return an API error that states the required amount. — [Daily budgets](https://help.openai.com/en/articles/20001413-daily-budgets); [Bidding & Budgets (dev)](https://developers.openai.com/ads/bidding-and-budgets)
- [TRADE] Other minimums: CAD 25, AUD 25, NZD 25, JPY 2,500, KRW 25,000, BRL 40, MXN 150, INR 725. — [PPC Land](https://ppc.land/chatgpt-ads-gains-3-platform-targeting-as-reporting-stays-at-2-buckets/)
- No UAH minimum was found; see section 1.
- [OFFICIAL] A daily budget is a **7-day average**: maximum daily spend is 2× the daily budget, and maximum 7-day spend is 7×. A campaign-total budget is the stricter control. — [Daily budgets](https://help.openai.com/en/articles/20001413-daily-budgets); [Frequently asked questions](https://help.openai.com/en/articles/20001220-frequently-asked-questions)
- [TRADE] Fixed daily caps became 7-day averages in July 2026, about 9 weeks after daily budgets were introduced. — [PPC Land: budgets lose fixed daily caps](https://ppc.land/chatgpt-ad-budgets-lose-fixed-daily-caps-9-weeks-after-openai-set-them/)
- [OFFICIAL] With fixed bidding, a daily budget cannot be set below the highest effective per-event bid. OpenAI's example: a $250.50 effective bid blocks any daily budget under $250.50. This is not a universal platform minimum. — [Daily budgets](https://help.openai.com/en/articles/20001413-daily-budgets)
- [OFFICIAL] No account-level minimum spend beyond the campaign daily minimum was found. Third-party guides say the same. — [Screpy](https://screpy.com/blog/chatgpt-ads-cost/); [spendlessgrowmore](https://www.spendlessgrowmore.com/learn/chatgpt-ads-cost)

**Auction and learning**
- [OFFICIAL] The auction uses predicted conversion likelihood for oCPC. ChatGPT weighs several relevance signals, including conversational intent. — [Conversion-optimized Campaigns (help)](https://help.openai.com/en/articles/20001412-create-ocpc-campaigns); [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)
- [OFFICIAL] OpenAI's webinar (24 Sep 2026) advises giving campaigns "enough room to learn". It recommends the impression-based conversion objective (oCPM) because it learns from both click-through and eligible view-through conversions. — [Webinar: five best practices](https://webinar.openai.com/on-demand/067e119c-9315-4087-8006-8f4dfb236b65)
- No formal "learning phase" definition, duration or conversion threshold was found in official docs.

### Inferences
- For a new Ukrainian store without conversion history:
  1. Start with a Clicks campaign. From today this means Target CPC for new campaigns.
  2. Install the Pixel and CAPI from day one.
  3. Create a separate Conversions campaign (oCPC/oCPM on purchase or order_created) once events flow, since existing campaigns cannot be converted.
- At €15/day minimum and $3–5 suggested CPCs (US-centric guidance), the minimum budget buys only a handful of clicks a day. Ukrainian CPC levels are unknown.

### Gaps
- No official UAH or Ukraine-specific minimum budget.
- No Ukraine CPC or CPM benchmarks.
- No official learning-phase threshold.
- The exact wording of the 9 Nov 2026 bidding change could not be verified from the full official text.

---

## 4. Targeting: context hints, exclusions, audiences, brand safety, who sees ads, placements

### Takeaway
Targeting combines campaign-level geo and platform settings, ad-group-level **context hints** (up to 2,000 per ad group via the API; natural-language descriptions of conversations, not keywords) and custom audiences. Inclusion audiences need 25,000 or more matched users; exclusion audiences have no minimum. Hints cannot exclude anything, and there are no negative keywords. Brand safety and sensitive-topic exclusions are enforced by OpenAI's platform policy, not by advertiser controls. Ads show to **Free and Go** users only, never to under-18s, and appear **below ChatGPT's answer**.

### Cited Findings
**Context hints**
- [OFFICIAL] Context hints describe the conversations or topics where an ad may fit. They guide matching but are **not exact-match keywords** and do not guarantee delivery. — [Writing context hints for ChatGPT Ads](https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads); [Ad Groups API](https://developers.openai.com/ads/api-reference/ad-groups)
- [OFFICIAL] An ad group can hold **up to 2,000 hints** ("you do not need to fill the limit"). This figure appears only in the developer docs; whether the UI has the same limit is not stated. — [Targeting (dev)](https://developers.openai.com/ads/campaign-targeting)
- [OFFICIAL] Updating `context_hints` replaces the whole list, so the full list must be resent. — [Ad Groups API](https://developers.openai.com/ads/api-reference/ad-groups)
- [OFFICIAL] Best practice:
  - write a clear, natural phrase on one idea rather than a list of disconnected keywords
  - prefer specific descriptions over broad terms ("Shoes" is OpenAI's example of a weak hint)
  - create separate ad groups for meaningfully different products, audiences or use cases
  
  — [Writing context hints](https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads); [Targeting (dev)](https://developers.openai.com/ads/campaign-targeting)
- [OFFICIAL] Hints "cannot enforce geographic limits, schedules, or exclusions". Restrictions must be set separately on the campaign. — [Targeting (dev)](https://developers.openai.com/ads/campaign-targeting)
- [3RD] OpenAI reportedly recommends describing needs and situations rather than audience labels. — [AirOps best practices](https://www.airops.com/blog/chatgpt-ads-best-practices)

**Exclusions and negatives**
- No negative-keyword or negative-hint control was found in any official source. Exclusions are done through geo exclusions and audience exclusions. — [Targeting (dev)](https://developers.openai.com/ads/campaign-targeting)
- [OFFICIAL] Product-feed campaigns support geographic targeting and exclusions at country level only. — [Create Campaigns from Product Feeds](https://help.openai.com/en/articles/20001268-create-campaigns-from-product-feeds)

**Custom audiences**
- [OFFICIAL] Inclusion audiences and bid multipliers need at least **25,000 matched users** (the public planning threshold; uploading 25,000 identifiers does not guarantee 25,000 matches). Ready exclusion audiences have **no minimum**. Uploads are UTF-8 CSV or TXT, up to 500 MB and 5,000,000 identifiers. Invalid, duplicate or unmatched values do not count toward matched users. — [Custom Audiences (dev)](https://developers.openai.com/ads/custom-audiences)
- [OFFICIAL, older] The help center still says the eligible audience after exclusions must meet 25,000 matched users. This conflicts with the developer docs and may be outdated. — [Set up Custom Audiences](https://help.openai.com/en/articles/20001346-set-up-custom-audiences-for-your-campaign)
- [TRADE] The exclusion-audience floor was removed in the week of 31 Aug 2026. Members can now be added, removed or replaced without recreating the audience. — [PPC Land: drops 25,000 floor for exclusions](https://ppc.land/openai-drops-25-000-user-floor-for-chatgpt-ad-exclusion-audiences/); [PPC Land: blocks audiences under 25,000](https://ppc.land/openai-blocks-chatgpt-ad-audiences-under-25-000-matched-users/); [PPC Land: custom audiences added](https://ppc.land/openai-adds-custom-audiences-to-chatgpt-ads-as-self-serve-expands/)
- [TRADE] LiveRamp onboarding of customer lists is available in 11 markets (headline only; markets not verified). — [PPC Land: LiveRamp](https://ppc.land/brands-customer-lists-reach-chatgpt-ads-via-liveramp-in-11-markets/)

**Brand safety and sensitive topics**
- [OFFICIAL] Brand safety is enforced by the platform. Ads are not placed near sensitive content: personal health, mental health, politics, "emotionally reliant contexts", "sensitive user journeys", and harmful or controversial topics. — [Ad policies](https://openai.com/policies/ad-policies/); [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)
- [OFFICIAL] There is a technical write-up on how the ad stack is built for "user trust and relevance" (title only; content not retrieved). — [How we built ChatGPT's novel ad stack](https://openai.com/index/building-chatgpt-ad-stack/)

**Who sees ads**
- [OFFICIAL] Ads may appear for **Free and Go** users. Plus, Pro, Business, Enterprise and Edu accounts see no ads. — [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt); [OpenAI 21 Oct 2026 post](https://openai.com/index/chatgpt-ads-expands-26-new-countries/)
- [OFFICIAL] No ads are shown to accounts identified as under 18, based on account age information and age prediction. Accounts placed in the teen experience see no ads. — [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt); [Age prediction in ChatGPT](https://help.openai.com/en/articles/12652064-age-verification)
- [OFFICIAL] Logged-out experiences: "ads shown in logged-out experiences are appropriate for all audiences", while mature-content ads go only to eligible logged-in users. This implies logged-out users can see ads. — [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)
- Older and superseded sources differ:
  - [OFFICIAL, Feb 2026] The original test (9 Feb 2026) covered logged-in adult Free and Go users in the US only. — [Testing ads in ChatGPT](https://openai.com/index/testing-ads-in-chatgpt/)
  - [3RD] Some blogs say there are no ads when logged out, in Temporary Chats, right after image generation, or in the Atlas browser. This conflicts with the current help center on logged-out users. — [slobodan-jelisavac.com](https://www.slobodan-jelisavac.com/en/blog/chatgpt-ads-guide); [geotoolbox.ai](https://geotoolbox.ai/blog/chatgpt-ads)
  - [3RD] [UNVERIFIED] Wikipedia reportedly says ChatGPT Atlas shut down on 9 Aug 2026. This was not verified against an OpenAI source. — [Wikipedia: ChatGPT Atlas](https://en.wikipedia.org/wiki/ChatGPT_Atlas)

**Placement**
- [OFFICIAL] Ads appear **below ChatGPT responses**, as a labeled unit separate from the answer. — [Ads in ChatGPT: The Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics); [Ads in ChatGPT](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)
- [3RD] There is no sidebar or banner placement. — [wpseoai.com](https://wpseoai.com/blog/what-does-advertising-inside-chatgpt-actually-look-like/)
- [3RD] Users can open the ad's "…" menu to see "About this ad", hide it, report it, or "Ask ChatGPT" about it. Advertisers do not control ChatGPT's answers about their ad. One source describes an advertiser-configured "Ask ChatGPT About This Ad" conversational banner; this conflicts with the others and is [UNVERIFIED]. — [geotoolbox.ai](https://geotoolbox.ai/blog/chatgpt-ads); [gend.co](https://www.gend.co/blog/openai-tests-ads-in-chatgpt-enhanced-access); [maciejturek.com](https://maciejturek.com/resources/chatgpt-ads-2026.html)
- [OFFICIAL via search summary] [UNVERIFIED detail] A visual ad format during image generation is planned for testing with US Free and Go users. — [OpenAI: A milestone in expanding access to AI](https://openai.com/index/expanding-access-to-ai-with-chatgpt-ads/)

### Inferences
- Bean bag chairs fit the "lifestyle and household goods" vertical well, and hints can describe real purchase situations: furnishing a gaming corner, a comfortable chair for a teenager's room, a waterproof outdoor bean bag, a gift.
- Because of the 25,000 matched-user floor, a small Ukrainian store's customer list is unlikely to work as an inclusion audience. It can still serve as an exclusion list, for example to suppress recent buyers.

### Gaps
- No frequency cap, negative hints or keyword exclusions were found.
- Whether hints work in Ukrainian or Russian, and how matching works across languages, is not documented.
- Whether placements in the mobile apps (iOS/Android) and on web differ in format is not documented.

---

## 5. Ad formats and specs

### Takeaway
The standard ad has these parts: advertiser name, favicon, headline (max 50 characters, 16–24 recommended), description (max 100, 32–48 recommended), one square image (PNG/JPG, up to 1200×1200) and a landing page. A multi-image ad takes 4–6 square images (open beta as of 26 Oct 2026). Product-feed ads are a separate retail format, in beta. OpenAI's "creative enhancements" may rewrite, resize or translate creatives.

### Cited Findings
- [OFFICIAL] Ad components: advertiser name, favicon, headline, description, landing page and image, shown below the response. — [Ads in ChatGPT: The Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics)
- [OFFICIAL] Title: 16–24 characters recommended, **50 maximum**. Copy: 32–48 recommended, **100 maximum**. The API allows titles of 3–50 characters and bodies up to 100. — [Launch Campaigns](https://help.openai.com/en/articles/20001209-launch-campaigns); [Ads API reference](https://developers.openai.com/ads/api-reference/ads)
- [OFFICIAL] Images must be square, PNG or JPG, no larger than 1200×1200 px. The API docs recommend at least 640×640 px. — [Creating ads for ChatGPT Ads](https://help.openai.com/en/articles/20001212-creating-ads-for-chatgpt-ads); [Ads API reference](https://developers.openai.com/ads/api-reference/ads)
- [OFFICIAL] Under Ad format, choose "Single image" or "Multiple images". A multi-image ad takes **4–6 square 1:1 images** and follows the same headline and description rules. Both formats work in standard Reach, Clicks and Conversions campaigns. Multiple images was in **open beta as of 26 Oct 2026**. — [Creating ads for ChatGPT Ads](https://help.openai.com/en/articles/20001212-creating-ads-for-chatgpt-ads)
- [OFFICIAL] "Creative enhancements" may adjust headlines and descriptions, resize images, optimize destination URLs, or **translate ad text**. — [Creative enhancements for ChatGPT Ads](https://help.openai.com/en/articles/20001614-creative-enhancements-for-chatgpt-ads)
- [OFFICIAL] OpenAI recommends a "high volume and diverse set of ads" (several title and copy variations per offering). — [Create Ads for ChatGPT Ads](https://help.openai.com/en/articles/20001212-create-ads-for-chatgpt)
- [3RD] OpenAI reportedly recommends showing the product in use rather than only the logo. — [AirOps best practices](https://www.airops.com/blog/chatgpt-ads-best-practices)
- [OFFICIAL] Product-feed ads show images, titles, star ratings, prices, sale prices and brand. A feed campaign may show one card or several products together, with the layout chosen automatically. — [Product Feeds (dev)](https://developers.openai.com/ads/product-feeds); [Create Campaigns from Product Feeds](https://help.openai.com/en/articles/20001268-create-campaigns-from-product-feeds)
- [TRADE] A refreshed product card with price and stars rolled out in July 2026. A multi-product carousel was tested in August 2026, and consultant Brodie Clark reported it live. — [PPC Land: product feeds after checkout killed](https://ppc.land/chatgpt-ads-manager-now-supports-product-feeds-after-checkout-is-killed/); [Search Engine Land: product carousels](https://searchengineland.com/chatgpt-ads-rolls-out-ocpc-campaigns-aam-and-product-carousels-484494)
- [TRADE] Dynamic CTAs were added (headline only). — [PPC Land: dynamic CTAs](https://ppc.land/chatgpt-ads-manager-gets-daily-budgets-geo-targeting-and-dynamic-ctas/)
- [OFFICIAL] Ads must not imitate the ChatGPT interface or voice. — [Ad policies](https://openai.com/policies/ad-policies/)

### Inferences
- Since creative enhancements can translate ad text, write the copy in Ukrainian and check how it renders.
- Keep the headline within the recommended 16–24 characters, e.g. "Крісла-мішки MrBean" (19 characters).

### Gaps
- No exact file-size limit, minimum image dimension in the UI, video support, or display-URL rules were found.
- Whether a separate logo or brand-name field exists beyond advertiser name and favicon is not documented.
- An official "Ask ChatGPT about this ad" or conversational advertiser format was not confirmed.
- Which formats are available in which of the 89 markets is not documented. Single and multi-image appear to be general features; product-feed availability by country was not found.

---

## 6. Product feeds for ads and the merchant program (chatgpt.com/merchants, OpenAI product feed spec / Agentic Commerce)

### Takeaway
Product-feed campaigns are a **beta** in Ads Manager. Feed management moved there on 2 Jun 2026, after Instant Checkout was shut down in March 2026 (trade press). Feeds use OpenAI's spec, a UTF-8 CSV with nine required fields, and a Google-Merchant-compatible variant also exists. A full catalog is uploaded over SFTP or a hosted URL, and price, title and availability changes go through the Delta API. Manually uploaded or hosted feed items **expire after 2 weeks**. Feed products appear only in ads, not in organic answers. **No official source confirms that feed campaigns are available outside the US.** The organic merchant program page says shopping is live for US users only.

### Cited Findings
**Ads product feeds**
- [OFFICIAL] Retail advertisers upload a product feed in Ads Manager and create ads from the catalog. Feed products are eligible **only for ads during the beta** and do not appear in organic ChatGPT conversations ("we may offer that capability in the future"). — [Create Campaigns from Product Feeds](https://help.openai.com/en/articles/20001268-create-campaigns-from-product-feeds); [Ads in ChatGPT: The Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics)
- [OFFICIAL] Feeds must follow OpenAI's feed spec. Products intended for ads need `is_ads_eligible = true`, with current price and availability. Items uploaded manually, by hosted URL or by SFTP **expire after 2 weeks**, so a hosted URL or automated SFTP is recommended. — [Create Campaigns from Product Feeds](https://help.openai.com/en/articles/20001268-create-campaigns-from-product-feeds)
- [OFFICIAL] Update methods: the Delta API changes an existing item's title, price or availability. New products, other field changes (images, descriptions) and full refreshes go through a full catalog upload over SFTP. — [Product Feeds (dev)](https://developers.openai.com/ads/product-feeds)
- [OFFICIAL] Delta API requests update only the fields sent, and are applied asynchronously after acceptance. Prices are in minor units (8999 = $89.99). — [Delta Feeds API](https://developers.openai.com/ads/delta-feeds)
- [OFFICIAL] CSV must be UTF-8, one row per item or variant, with stable IDs. The example CSV includes `target_countries` and `store_country` columns. — [Product Feeds (dev)](https://developers.openai.com/ads/product-feeds)
- [OFFICIAL] Selected Google-compatible fields are kept for product filtering in campaigns, currently including `custom_label_0`–`custom_label_4` "and a few other key columns" (may change). — [Product Feeds (dev)](https://developers.openai.com/ads/product-feeds)
- [OFFICIAL] There is a conflict between documents. The spec says Ads eligibility comes from the registered feed configuration and uploaded eligibility fields do not override it, yet the guide's example CSV includes `is_eligible_search` and `is_eligible_checkout`. — [Products spec (file upload)](https://developers.openai.com/commerce/specs/file-upload/products); [Product Feeds (dev)](https://developers.openai.com/ads/product-feeds)
- [OFFICIAL] Diagnostics: error codes include `missing_required_column` and `invalid_value`. With a general upload error, check rows for missing fields, wrong names or wrong formats. — [Troubleshooting (dev)](https://developers.openai.com/ads/troubleshooting); [Troubleshooting Common Issues](https://help.openai.com/en/articles/20001217-troubleshooting-common-issues)

**Product feed spec (Commerce)**
- [OFFICIAL] Required fields in the OpenAI-format spec: `item_id`, `title`, `description`, `url`, `brand`, `seller_name`, `image_url`, `availability`, `price`.
  - An omitted, empty or unrecognized `availability` value rejects the row.
  - Booleans are lowercase `true`/`false`.
  - IDs should be kept as strings to preserve leading zeros.
  
  — [Products spec (file upload)](https://developers.openai.com/commerce/specs/file-upload/products)
- [OFFICIAL] A Google-compatible variant requires `id`, `title`, `description`, `link`, `image_link`, `availability`, `price` and `brand`, plus `availability_date` when an item is preorder or backorder. An "upcoming draft" schema with a different structure also exists. — [Products spec](https://developers.openai.com/commerce/specs/spec); [Feed Reference, upcoming draft](https://developers.openai.com/commerce/specs/file-upload/products-fragments/upcoming-draft)
- [OFFICIAL] Commerce key concepts describe "a secure, regularly refreshed feed (CSV or JSON)" with no specific interval. This page is about 406 days old (around Sep–Oct 2025), so it predates the Ads feed changes. — [Key concepts](https://developers.openai.com/commerce/guides/key-concepts)
- [OFFICIAL] `is_eligible_checkout` allows direct purchase in ChatGPT and requires `is_eligible_search = true`. — [Products spec](https://developers.openai.com/commerce/specs/spec); [Agentic Checkout Spec](https://developers.openai.com/commerce/specs/checkout)
- [OFFICIAL] Feeds API and Products API exist. — [Feeds API](https://developers.openai.com/commerce/specs/api/feeds); [Products API](https://developers.openai.com/commerce/specs/api/products)

**Merchant program (organic)**
- [OFFICIAL] The page at chatgpt.com/merchants ("Power product discovery in ChatGPT") says shopping is live for **US** ChatGPT users. A self-serve merchant platform and more regions are planned, and no country list is given. — [chatgpt.com/merchants](https://chatgpt.com/merchants/)

**Trade-press history**
- [TRADE] OpenAI shut down Instant Checkout in March 2026. Feed management moved into Ads Manager on **2 Jun 2026**, with a Feeds section containing "Feed Connection" and "Upload History" tabs. Ads are generated automatically from product names, images and attributes. Up to 1M SKUs per advertiser. Retailers can largely reuse their Google Merchant feed. Criteo was the first ad-tech partner. — [PPC Land: product feeds after checkout is killed](https://ppc.land/chatgpt-ads-manager-now-supports-product-feeds-after-checkout-is-killed/); [Search Engine Land: product feed ads](https://searchengineland.com/openai-adds-product-feed-ads-to-chatgpt-477208); [Digiday](https://digiday.com/marketing/openai-makes-it-easier-to-run-shopping-ads-in-chatgpt/)
- [TRADE] Feed-campaign oCPC beta supports click-billed campaigns with fixed or manual bidding and a positive conversion bid cap. — [PPC Land: AAM](https://ppc.land/chatgpt-advertisers-face-10-days-to-opt-out-of-automatic-advanced-matching/)
- [TRADE] About three months ago, PPC Land said Brazil and Mexico would follow for feed features, implying the feature was US-first. — [PPC Land via search summary](https://ppc.land/chatgpt-advertisers-face-10-days-to-opt-out-of-automatic-advanced-matching/)
- The brief's "~31.08.2026" launch date for shopping or product formats is not confirmed. Sources date the feed move to 2 Jun 2026, the product card to July, oCPC for feeds to 7 Aug, and the carousel test to August.

### Inferences
- If MrBean already has a Google Merchant Center feed (XML/CSV from its e-commerce CMS), most fields map directly. Missing fields are likely `seller_name` and `is_ads_eligible`, and the feed is CSV, not XML.
- A hosted URL or scheduled SFTP is needed to avoid the 2-week expiry.
- Feed campaigns for Ukraine may not be available yet. Check in the Ads Manager "Feeds" section after the account is created.

### Gaps
- No official country list for product-feed campaigns. Availability in Ukraine is unknown.
- Whether XML feeds are accepted for Ads is not documented; only CSV is documented for Ads, with CSV or JSON in the older commerce docs.
- No official refresh-rate SLA.
- Whether prices can be in UAH (currency field) is not documented.
- The organic merchant program is US-only, and no timeline for Ukraine was found.

---

## 7. Ad policies and review

### Takeaway
Allowed verticals focus on consumer categories (lifestyle and household goods, local services, travel, digital products and education). Furniture and home goods fall into the allowed group. Finance, health and legal are restricted to manual case-by-case approval; dating, sexual content, alcohol, drugs, gambling and politics are disallowed. Editorial rules require truthful claims, no vulgarity and no imitation of the ChatGPT interface. Policies cover landing pages as well as the ad. Ad review times are not published.

### Cited Findings
- [OFFICIAL] "During the initial test period, ads are primarily limited to consumer verticals such as lifestyle and household goods, local services, travel and experiences, and digital products or education." — [Ad policies](https://openai.com/policies/ad-policies/)
- [OFFICIAL] Financial services, healthcare and medicine, and legal services may be approved for approved advertisers, rolled out gradually with manual case-by-case review. — [Ad policies](https://openai.com/policies/ad-policies/)
- [OFFICIAL] "All other categories are disallowed at launch", including dating and sexual content, health claims, alcohol and drugs, gambling and political content. Political advertising is not allowed. — [Ad policies](https://openai.com/policies/ad-policies/); [Political campaigning restrictions](https://help.openai.com/en/articles/20001255-political-campaigning-restrictions)
- [OFFICIAL] Editorial rules:
  - Ads must be truthful, with no unfounded claims about capabilities, pricing, outcomes, affiliations or comparisons, and no exaggerated results or false endorsements.
  - Obscene, vulgar or shocking language, including in product names or branding, may be rejected.
  - Ads must not imitate ChatGPT or OpenAI interfaces.
  
  — [Ad policies](https://openai.com/policies/ad-policies/)
- [OFFICIAL] Standards apply to all assets: copy, images or video, and **landing pages**. Ads must be consistent end to end, and approved creatives may not link to destinations with disallowed content (OpenAI's example: a food-delivery ad linking to alcohol delivery). — [Ad policies](https://openai.com/policies/ad-policies/)
- [OFFICIAL] The onboarding troubleshooting article has a country-by-country category eligibility table. An ad can pass review and still be ineligible in its selected countries. — [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues)
- [OFFICIAL] OpenAI may decline, restrict or remove advertisers, and may refuse ad content or links for any reason. — [Ad policies](https://openai.com/policies/ad-policies/)
- [OFFICIAL] Related terms documents: [Advertising Terms](https://openai.com/policies/advertising-terms/), [Ad Tools Terms](https://openai.com/policies/ad-tools-terms/), [Commerce policies](https://openai.com/policies/commerce-policies/)
- [OFFICIAL] Ads must pass review before serving. Individual ad decisions can be appealed with "Request Review". — [Creating campaigns](https://help.openai.com/en/articles/20001210-creating-campaigns-for-chatgpt-ads); [Troubleshooting Common Onboarding and Policy Issues](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues)
- [OFFICIAL] Context on OpenAI's ads principles. — [Our approach to advertising and expanding access to ChatGPT](https://openai.com/index/our-approach-to-advertising-and-expanding-access/)

### Inferences
- Bean bag furniture falls squarely in "lifestyle and household goods". Avoid unverifiable claims ("найкращі в Україні" / "best in Ukraine", "ортопедичні" / orthopedic, health benefits), since health claims are disallowed and superlatives need substantiation under the truthfulness rule.
- The landing page must match the ad.

### Gaps
- Review turnaround time is not published.
- Rules on language (Ukrainian or Russian), capitalization, punctuation, emoji and superlatives are not documented in the extracts.
- A specific privacy-policy requirement for landing pages was not found in the extracts, although verification includes a website or domain match.
- The full country-category table was not retrieved.

---

## 8. Reporting and measurement

### Takeaway
Ads Manager reports impressions, clicks, CTR, spend, average CPC and CPM, conversions, and Order Created sales and ROAS. Delivery metrics refresh about every 15 minutes, and conversions arrive within 24–48 hours. Attribution is last-touch: a 7-, 14- or 30-day click window (default 30) and a fixed 1-day view-through window (default on). Tracking runs through the OpenAI Pixel and the Conversions API. CSV export and an Insights API are available.

### Cited Findings
- [OFFICIAL] Metrics: impressions, clicks, spend, CTR, average CPC, average CPM, and conversions when measurement is set up. Impressions, clicks and CTR refresh about every 15 minutes. — [Measure Results](https://help.openai.com/en/articles/20001214-measure-results)
- [OFFICIAL] Conversions can be reported by ad event time (default) or by conversion time. Individual event columns are added with "Edit columns"; CSV headers look like `attributed_event_…`. — [Measure Results](https://help.openai.com/en/articles/20001214-measure-results); [Troubleshooting conversion tracking](https://help.openai.com/en/articles/20001604-troubleshooting-conversion-tracking-for-chatgpt-ads)
- [OFFICIAL] "Order Created Sales" and "Order Created ROAS" are calculated only from attributed `order_created` events. — [Troubleshooting conversion tracking](https://help.openai.com/en/articles/20001604-troubleshooting-conversion-tracking-for-chatgpt-ads)
- [OFFICIAL] Exports come from the three-dot menu: the current table view, cumulative values for selected rows, or daily values. Reports can be viewed as tables, trend charts or CSV. — [Measure Results](https://help.openai.com/en/articles/20001214-measure-results); [Ads Manager Beta Overview](https://help.openai.com/en/articles/20001206-ads-manager-beta-overview)
- [OFFICIAL] Attribution windows: click 7, 14 or 30 days (default 30); view-through 0 or 1 day (default 1; 0 turns it off). If a click and an impression both qualify, the click gets credit. Attribution is last-touch, not multi-touch. — [Conversions API](https://developers.openai.com/ads/conversions-api); [Reporting (dev)](https://developers.openai.com/ads/reporting); [Insights API](https://developers.openai.com/ads/api-reference/insights)
- [OFFICIAL] The two sources conflict on whether the Conversions total includes view-through:
  - The developer docs say view-through is a separate campaign-level metric and is not included in Conversions. — [Conversions API](https://developers.openai.com/ads/conversions-api)
  - The help center and reporting docs say Conversions includes eligible view-through when the window is 1 day. There is an optional "VTA (1d)" column, and the window affects reporting only, not bidding or billing. — [Measure Results](https://help.openai.com/en/articles/20001214-measure-results); [Reporting (dev)](https://developers.openai.com/ads/reporting)
- [OFFICIAL] CPA, post-click CVR, bidding, billing and optimization remain click-through based. — [Conversions API](https://developers.openai.com/ads/conversions-api)
- [OFFICIAL] Attributed conversions can take 24–48 hours to appear in reporting. — [Measure Results](https://help.openai.com/en/articles/20001214-measure-results)
- [OFFICIAL] Pixel and CAPI deduplicate on the same Pixel ID, event name and event ID (`id` in CAPI, `event_id` in the Pixel). CAPI does not capture the click reference `oppref` automatically, so the server must pass it. — [Conversions API](https://developers.openai.com/ads/conversions-api); [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel); [Conversion Setup](https://developers.openai.com/ads/api-reference/conversion-setup); [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking)
- [OFFICIAL] OpenAI blog: in an early analysis, 52.7% of eligible one-day view-through conversions happened within one hour of the impression. This is company data from a limited sample. — [More ways to measure ChatGPT Ads](https://ads.openai.com/blog/more-ways-to-measure)
- [TRADE] View-through conversions were added with a fixed 1-day window. — [PPC Land: view-through 1-day](https://ppc.land/chatgpt-ads-gains-view-through-conversions-with-a-fixed-1-day-window/)
- [TRADE] Automatic advanced matching became the default for existing web pixels on **17 Aug 2026**, with 10 days to opt out. — [PPC Land: AAM](https://ppc.land/chatgpt-advertisers-face-10-days-to-opt-out-of-automatic-advanced-matching/)
- [TRADE] App attribution through AppsFlyer and Adjust is live in 7 markets (not relevant for web e-commerce). — [PPC Land: app attribution](https://ppc.land/chatgpt-ads-gains-app-attribution-in-7-markets-as-appsflyer-adjust-go-live/)
- [TRADE] Reporting shows platforms in only 2 buckets, despite 3-platform targeting. — [PPC Land](https://ppc.land/chatgpt-ads-gains-3-platform-targeting-as-reporting-stays-at-2-buckets/)
- [TRADE] "Advertisers still don't know what 'good' looks like" after 6 months: no public benchmarks. — [Search Engine Journal](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/)

### Inferences
- MrBean should fire `order_created` with value and currency, through both the Pixel and CAPI with deduplication, to get ROAS reporting and to qualify for Conversions campaigns.
- Pass `oppref` from the landing URL into the order record for CAPI matching.

### Gaps
- No modeled-conversions documentation was found.
- The full breakdown list (age, geo, placement) was not found; only device and platform are mentioned.
- Insights API endpoints and fields were not retrieved.
- Whether non-USD values (UAH order value) are converted in ROAS is not documented.

---

## 9. Official best-practice guides, playbooks and webinars

### Takeaway
OpenAI runs an official webinar series at ads.openai.com/webinars. It includes a 24 Sep 2026 session, "five best practices for creating campaigns designed to perform", and a "2026 ChatGPT Ads Holiday Playbook". The help center has dedicated guidance on writing context hints and building creatives.

### Cited Findings
- [OFFICIAL] Webinars hub. — [ChatGPT Ads Webinars](https://ads.openai.com/webinars)
- [OFFICIAL] "Set up your ChatGPT Ads for success: five best practices for creating campaigns designed to perform" (24 Sep 2026; live demos in Ads Manager). The visible transcript confirms "give campaigns enough room to learn" and the recommendation of the impression-based conversion objective (oCPM). — [Webinar](https://webinar.openai.com/on-demand/067e119c-9315-4087-8006-8f4dfb236b65)
- [3RD] Recaps list the five practices as: track conversions; give campaigns room to learn; optimize for the outcome you want; connect a product feed; use ChatGPT to build and manage campaigns. One recap cites an example of splitting a $100k budget across 2 campaigns rather than 10, i.e. consolidating. Recap lists differ slightly. — [AirOps](https://www.airops.com/blog/chatgpt-ads-best-practices); [botrank.ai](https://www.botrank.ai/post/chatgpt-ads-best-practices-guide)
- [OFFICIAL] "Your 2026 ChatGPT Ads Holiday Playbook" webinar (content not retrieved). — [Holiday Playbook](https://webinar.openai.com/2026-chatgpt-ads-holiday-playbook/)
- [OFFICIAL] Introductory webinar "The decision is the opportunity: ChatGPT Ads, a new channel for marketers". It is about 80 days old and lists the earlier markets (Canada, Australia, New Zealand, UK, Japan, Korea, Brazil, Mexico). — [Intro webinar](https://webinar.openai.com/intro-chatgpt-ads/watch/?blockId=gAmNoH7vPEhAKpYFH4AbZ&videoId=c0448ee2-a792-456b-82c6-c48a7d6adbbb)
- [OFFICIAL] Help-center guides: [Writing context hints](https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads), [Quickstart](https://help.openai.com/en/articles/20001224), [Ads Manager Beta Overview](https://help.openai.com/en/articles/20001206-ads-manager-beta-overview), [ChatGPT Ads collection index](https://help.openai.com/en/collections/20001223)
- [OFFICIAL] Regional expansion posts (history):
  - [Europe, 31 markets](https://openai.com/index/chatgpt-ads-expands-across-europe/)
  - [Southeast Asia and Taiwan](https://openai.com/index/chatgpt-ads-expands-southeast-asia-taiwan/)
  - [New ways to buy ChatGPT ads](https://openai.com/index/new-ways-to-buy-chatgpt-ads/)
  - [TRADE] [32 markets in 5 days, India live](https://ppc.land/openai-gains-32-chatgpt-ad-markets-in-5-days-as-india-goes-live/)
  - [TRADE] [7 Asian markets, past 60 countries](https://ppc.land/openai-gains-7-asian-markets-for-chatgpt-ads-passing-60-countries/)
- [TRADE] Step-by-step practitioner guide (budgets "as low as $25"). — [Search Engine Land: How to run ChatGPT ads](https://searchengineland.com/run-chatgpt-ads-484513)
- [TRADE] Retail took 39% of ChatGPT ads on 24% of US queries (Adthena). — [PPC Land: Adthena](https://ppc.land/retail-took-39-of-chatgpt-ads-on-24-of-us-queries-adthena-finds/)
- [TRADE] ChatGPT ads passed a $1bn run rate. — [PPC Land: $1bn run rate](https://ppc.land/chatgpt-ads-pass-1bn-run-rate-as-financial-services-spend-triples/)

### Inferences
- The official playbook points small retailers toward few consolidated campaigns, conversion tracking first, a product feed once available, and an oCPM conversion objective once there is enough signal.

### Gaps
- The full webinar content and the Holiday Playbook content could not be read.
- No Ukraine- or CEE-specific official guidance was found.
