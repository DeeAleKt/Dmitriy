# Practitioner experience running ads in ChatGPT (OpenAI Ads), Jan–Nov 2026

> **Source-access note (read first).** This session's network blocked direct page fetches (WebFetch/curl refused for help.openai.com, searchengineland.com, reddit.com, ppc.land, trucommerce.ai, choice.marketing and others). Every finding below comes from **search-engine result summaries/snippets** of the cited URLs, not from reading the full pages. Numbers were copied as the snippets gave them; where a snippet was ambiguous it is flagged. Before quoting any number in a client-facing plan, open the URL and confirm it. No Reddit, LinkedIn or X thread could be opened directly; Reddit material is only available second-hand through roundup blogs (flagged as such). Research date: 2026-11-09.
>
> **Era labels used below:** **[Pilot]** = US invite-only pilot, Feb–early May 2026 (CPM-only, $200–250k commitments). **[Self-serve US]** = Ads Manager open to US businesses from ~5 May 2026. **[EU/intl]** = UK from 6 Jun, EEA from 24 Aug (self-serve from ~31 Aug/4 Sep), 89 countries incl. Ukraine from 21 Oct 2026. **Evidence labels:** **ANECDOTE** = one advertiser/agency; **PATTERN** = reported independently by ≥3 sources; **VENDOR** = source sells ChatGPT-ads services or tools (conflict of interest).

### Platform timeline (context for dating every lesson)
- Feb 2026: invite-only US pilot; Williams-Sonoma Inc. announced it was joining the pilot on 11 Feb 2026 — [BusinessWire](https://www.businesswire.com/news/home/20260211993758/en/WILLIAMS-SONOMA-INC.-PARTNERS-WITH-OPENAI-TO-TEST-ADS-IN-CHATGPT). Launch CPM ~$60; minimum commitment $250k (Digiday) or $200k (other sources) — [Digiday, 17 Apr 2026](https://digiday.com/marketing/everything-is-coming-down-chatgpt-ads-are-getting-cheaper/); [Wall St Engine on X summarising Digiday](https://x.com/wallstengine/status/2045203100382998787).
- ~Mar–Apr 2026: $100M annualized run rate in ~6 weeks, ~600 advertisers, self-serve planned for April — [Ben's Bites](https://news.bensbites.co/posts/62158-openai-has-surpassed-100m-in-annualized-revenue-from-chatgpt-ads-has-expanded-to-600-advertisers-and-plans-to-launch-self-serve-advertiser-access-in-april).
- 17 Apr 2026: buyers report CPM down from $60 to as low as $25, minimum spend down from $250k to $50k (Krystal Scanlon, Digiday) — [Digiday](https://digiday.com/marketing/everything-is-coming-down-chatgpt-ads-are-getting-cheaper/). Ad Age reportedly cited a low of $15 — [PPC Land timeline](https://ppc.land/chatgpt-ad-cpms-drop-to-25-as-openai-races-toward-global-auction/).
- 21 Apr 2026: CPC bidding switched on in Ads Manager — [Digiday](https://digiday.com/marketing/openai-turns-on-cost-per-click-ads-inside-chatgpt/); [SEJ: CPC bids $3–$5](https://www.searchenginejournal.com/chatgpt-ads-now-offer-cpc-bidding-between-3-and-5-report/572652/).
- 5 May 2026: self-serve Ads Manager opens to US businesses; CPC + CPM; measurement pixel + Conversions API; commitment dropped; $25/day floor — [TechWyse](https://www.techwyse.com/news/platform-updates/chatgpt-ads-ocpc-bidding-geo-exclusions-bulk-api-2026); [groas/other secondary](https://groas.com/post/the-cheap-window-on-chatgpt-ads-closes-fast-seven).
- 6 Jun 2026: UK launch (first European market), Dentsu launch partner; early UK advertisers include Zalando, Tesco — [Lengow](https://blog.lengow.com/chatgpt-ads-first-results-are-in).
- ~11 Jun 2026: product feed ads (open beta) — [Search Engine Land](https://searchengineland.com/openai-adds-product-feed-ads-to-chatgpt-477208); [Adventure Media](https://adventuremedia.ai/blog/chatgpt-ads-for-ecommerce-product-feed-integration-and-shopping-ads-in-2026).
- 16 Jun (changelog) or July 2026 (other sources): conversion-optimized bidding (oCPC) — dates conflict — [TechWyse](https://www.techwyse.com/news/platform-updates/chatgpt-ads-ocpc-bidding-geo-exclusions-bulk-api-2026); [cadimar](https://cadimar.net/blogs/chatgpt-ads-bidding).
- 18 Aug announced / 24 Aug live: 31 European countries via sales team/partners (first phase: selected advertisers, €80k first-month requirement per Karel Huk); self-serve in Europe ~31 Aug (one source) or 4 Sep 2026 (Karel Huk) — [Search Engine Watch](https://searchenginewatch.com/chatgpt-ads-89-countries-26-new-markets/); [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-comes-to-europe).
- 31 Aug 2026: OpenAI says $1B annualized run rate in <200 days; "tens of thousands" of advertisers (~20,000); cites one e-commerce advertiser at 3x ROAS over 28 days — [MediaPost](https://www.mediapost.com/publications/article/417561/chatgpt-ads-reaches-1b-annualized-in-200-days.html); [Pulse2](https://pulse2.com/openai-chatgpt-ads-reaches-1-billion-annualized-revenue-run-rate-in-under-200-days-as-self-service-expands-globally/).
- 16 Sep 2026: oCPM, attribution changes, HubSpot + Shopify integrations, Sponsored Agents (US) — [OpenAI](https://openai.com/index/reimagining-advertising-with-ai/); [MetricFixer](https://metricfixer.com/publications/online-advertising/openai-ads-september-2026-ocpm-attribution-integrations-sponsored-agents).
- 5 Oct 2026: visual ads during image generation (US, small advertiser group) + 18–20 measurement partners — [Marketing Brew](https://www.marketingbrew.com/stories/openai-visual-ad-format-measurement-tools-advertising-week); [TechCrunch](https://techcrunch.com/2026/10/05/openai-launches-visual-ads-that-appear-alongside-image-generation-results/).
- 21 Oct 2026: +26 countries → 89 total; >100,000 advertisers cumulative (up from ~20,000 late Aug) — [OpenAI](https://openai.com/index/chatgpt-ads-expands-26-new-countries/); [The Next Web](https://thenextweb.com/news/chatgpt-ads-89-countries-100000-advertisers). Ukraine included — [Netpeak](https://netpeak.net/uk/blog/reklama-v-chatgpt-zapratsyuvala-v-ukraini/); [Mezha](https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/).

---

## 1. Contextual hints / targeting: how practitioners write them, observed matching behavior, which contexts deliver buyers

### Takeaway
Official guidance and most practitioners treat context hints as natural-language descriptions of one need/situation per ad group (not keyword lists), and recommend splitting ad groups by intent or buying stage. But the few hard data points disagree: Opascope reports **one hint per ad group lifted ROAS 52%**, while Workshop Digital found **keyword-style hints out-performed conversational ones on CTR**. No-one can see the triggering queries, so every hint test has to be done as an ad-group-vs-ad-group test.

### Cited Findings
**Official OpenAI guidance (help center, as summarised by search; 2026, applies to self-serve era)**
- Hints are "signals", broad thematic guides to matching, not exact-match rules — [OpenAI Help: Create ad groups](https://help.openai.com/en/articles/20001211-create-ad-groups-for-chatgpt).
- Write a clear natural phrase about a single idea rather than a list of disconnected keywords; cover *what* (product), *who* (customer need) and *when* (situations of use); update hints when price, promos, availability or service area change — [OpenAI Help: Writing context hints](https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads).
- One product category/theme/intent per ad group; separate ad groups for meaningfully different audiences. Geography, schedules and exclusions are set in campaign settings, not in hints — [OpenAI Help: Create ad groups](https://help.openai.com/en/articles/20001211-create-ad-groups-for-chatgpt); [AirOps](https://www.airops.com/blog/chatgpt-ads-best-practices).
- As of Oct 2026 the help article documents **no hint count per ad group and no length limit**; one guide claims "up to 2,000 hints" per ad group — unverified, conflicting — [contexthints.com guide](https://www.contexthints.com/guide/context-hints.html); [easilygeo](https://www.easilygeo.com/blog/what-are-openai-ads-context-hints-and-how-do-they-work-in-chatgpt-ads).
- Ad selection reportedly also reads the landing-page URL and ad copy alongside hints (third-party claim) — [theadleaf](https://theadleaf.com/openai-ads-setting-up-context-hints-for-chatgpt-ad-success/).

**Practitioner data (hard numbers)**
- **Opascope (US, e-commerce client, ~15 days, ~$60k spend, self-serve era ~mid-2026; VENDOR, ANECDOTE):** "A single context hint per ad group improved ROAS by 52%" — [Opascope insights](https://opascope.com/insights/chatgpt-ads-benchmarks/).
- **Workshop Digital (US, B2B, $2,319 spend, published 26 Aug 2026; ANECDOTE):** keyword-style hints reached 1.2% CTR vs 0.9% for conversational hints — contradicts the "write conversationally" advice — [Workshop Digital](https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/).
- **Searchflow (Netherlands, ad groups split by buying stage, EU era Aug–Oct 2026; spend & period undisclosed; ANECDOTE via secondary):** Discovery 0.82% CTR / €1.63 CPC; Consideration 0.73% / €1.71; Decision 0.96% / €2.09 — decision-stage hints got best CTR but most expensive clicks — [PPC One roundup](https://ppcone.cz/en/blog/chatgpt-ads-results/).
- **Q1Media (US agency, several accounts; VENDOR):** campaigns built around specific customer pain points worked better than broad categories — [Q1Media](https://www.q1media.com/pages/case-studies-blogs/chatgpt-ads-part2).
- **Symphonic Digital (US agency, own-brand test, self-serve era):** recommends multiple intent-themed ad groups and many creative variants from day one *because advertisers cannot see the queries that trigger ads*; they had to add an ad group (plus raise bids) before a $50/day budget would spend — [Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results).
- **PromptMarketing (European e-commerce, 3 webshops, 4 countries, from Sep 2026; VENDOR):** wrote separate context hints per market (country/language) — [PromptMarketing case](https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/).

**Practitioner heuristics (opinion, not data)**
- Zero/near-zero impressions after ~2 days usually means hints are too narrow or written in rigid keyword syntax; broaden to the underlying need; split different situations into new ad groups rather than stacking hints; check max bid vs Ads Manager's bid guidance (single-source thresholds) — [ai-advisors](https://www.ai-advisors.ai/blog/what-are-context-hints-in-chatgpt-ads); [synlig.ai](https://synlig.ai/en/guides/context-hints-chatgpt-ads/); [Lapis 12 best practices](https://www.trylapis.com/resources/how-to-write-chatgpt-ads-context-hints).
- Structure "persona + intent + scope + disqualifier" (persona and intent mandatory; scope/disqualifier stop budget leakage) — [guptadeepak](https://guptadeepak.com/guides/context-hints/).
- Count advice conflicts: one guide recommends 5–15 hints per ad group all describing the same need; Opascope's data favours 1 — [Lapis](https://www.trylapis.com/resources/how-to-write-chatgpt-ads-context-hints); [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/).
- Reporting is per ad group, not per hint → change one variable at a time — [contexthints.com](https://www.contexthints.com/guide/context-hints.html).
- Describe the customer's situation rather than product jargon (e.g., "a marketing manager comparing social media scheduling tools for a team of three") — [commercepundit](https://www.commercepundit.com/blog/openai-ads-manager-guide/); [spaceads](https://www.spaceads.agency/blog/openai-ads-manager-how-to-set-up-chatgpt-ads-campaign).
- For bottom-funnel: budget language ("under $X") signals someone sizing the purchase; comparison language signals shortlist narrowing; map purchase-ready hints to product/pricing pages and comparison hints to comparison pages — [Lapis conversion targeting](https://www.trylapis.com/resources/chatgpt-ads-conversion-targeting-guide).

**Observed matching / relevance behaviour (independent studies)**
- SE Ranking study: ads appeared on 25.94% of commercial prompts; >14% of ads appeared for the wrong topic — [SE Ranking](https://seranking.com/blog/chatgpt-ads-study/); MediaPost: "ChatGPT Serves Ads In Results On Irrelevant Topics" — [MediaPost](https://www.mediapost.com/publications/article/417172/chatgpt-serves-ads-in-results-on-irrelevant-topics.html).
- Adthena (177 comparison prompts): 86% of ads on "X vs Y" prompts came from brands not named in the query; brand-name queries rarely trigger ad carousels (VENDOR — sells ChatGPT ad intelligence) — [Neil Patel stats page](https://neilpatel.com/marketing-stats/brand-hijacking-in-chatgpt-ads/); [PPC Land on Adthena](https://ppc.land/adthenas-29m-query-report-reveals-whats-actually-working-in-ai-search-ads/).
- Graphite: top advertisers write messaging around the use-cases people discuss in conversations (98% new copy) — [Search Engine Land](https://searchengineland.com/reportchatgpt-ads-are-growing-fast-but-advertisers-are-still-figuring-them-out-492337).
- EEA/Switzerland: personalised ads initially unavailable; in NL ad selection is based "primarily on the current conversation, language and approximate location" — [OpenAI](https://openai.com/index/chatgpt-ads-expands-26-new-countries/); [taskforce.nl / Dutch roundup](https://taskforce.nl/en/insights/chatgpt-ads-initial-findings/).
- Custom audiences require ≥25,000 matched users (excludes most small shops' customer lists) — [spendlessgrowmore](https://www.spendlessgrowmore.com/learn/chatgpt-ads-cost).

**Buyers vs curiosity clicks**
- Reddit r/PPC (via Sprites roundup, Jan–Sep 2026): one thread title argues "ChatGPT Ads are missing the exact buyers Google reaches"; another agency reported "same-evening form fills" and cheaper mid-funnel conversions than Google after 3 weeks — [Sprites.ai Reddit roundup](https://www.sprites.ai/blog/what-marketers-say-about-chatgpt-ads-reddit) (secondary; threads not opened).
- Organic ChatGPT visits convert far better than paid clicks: Andy Brice data 4.2% organic vs 0.46% paid; Q1Media paid CVR ~2%, "roughly half that of unpaid ChatGPT traffic" — [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/).

### Inferences
- For a bean-bag/frameless-furniture shop the hint evidence argues for **few, tight ad groups each built on one buying situation** (e.g., "choosing a bean bag chair for a teenager's room", "comfortable chair for gaming / long sitting", "furniture for a small apartment that's easy to move", "gift for kids/teen", "outdoor/waterproof bean bag for terrace") with 1–3 hints each, rather than one ad group with dozens of hints. Opascope's "1 hint" finding and Searchflow's stage split both point this way.
- Because Workshop Digital found keyword-style hints beat conversational ones, test both styles in parallel ad groups rather than assuming conversational is better.
- The >14% off-topic serving rate means a monthly negative check (does the ad appear in irrelevant chats?) is worthwhile — e.g., manually prompting Free/Go accounts.

### Gaps
- No published data on hints written in Ukrainian vs Russian vs English, or on how hints match for non-English conversations.
- No furniture/home-goods-specific hint experiments found.
- Could not open the OpenAI help pages directly to confirm hint limits.
- No Reddit thread could be opened directly.

---

## 2. Ad creative: copy patterns, images, "Ask ChatGPT about this ad"/conversational formats

### Takeaway
The dominant observed pattern (Adthena, Workshop Digital) is **"Brand: Benefit" headlines that echo the user's question**; brand-first gave a small (≈7%) CPC advantage in one test. E-commerce agency data (ScaleWise VA, VENDOR) says **use-case + product-specifics copy beats discount-led copy**, and fresh ChatGPT-specific copy beats re-used Shopify/Google descriptions. Image evidence is thin (one B2B test: industry-specific images 1.2% CTR vs lifestyle 1.1%). The conversational "ask about this ad" equivalent is **Sponsored Agents** — a US test with select advertisers only, no performance data.

### Cited Findings
- **Adthena (index of 40,000+ daily ChatGPT ad placements, 2026; VENDOR):** overwhelming majority of ads use a "Brand: Benefit" headline formula; advises leading with brand name; strongest ads echo the user's query directly — [Adthena blog](https://www.adthena.com/resources/blog/inside-chatgpt-ads-what-the-data-tells-us-and-whats-coming-next/); [Search Engine Land](https://searchengineland.com/inside-chatgpt-ads-what-the-data-tells-us-and-whats-coming-next-474504). PATTERN (observational, many ads).
- **Graphite "State of ChatGPT Ads" (95,000+ ads, 500+ advertisers, US, 1 Apr–16 Aug 2026; published 28–29 Sep 2026):** top advertisers create 98% new copy for ChatGPT rather than lifting ads from other platforms; messaging built around conversation use cases — [Search Engine Land](https://searchengineland.com/reportchatgpt-ads-are-growing-fast-but-advertisers-are-still-figuring-them-out-492337); [Search Engine Journal](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/).
- **Workshop Digital (US B2B, $2,319, 69,630 impr., 739 clicks, 1.1% CTR, $3.14 CPC; published 26 Aug 2026; ANECDOTE):** brand-first ads $3.07 CPC vs $3.30 without brand (~7%, "not huge"), slightly higher CTR; industry-specific imagery 1.2% CTR vs lifestyle photography 1.1% (≈482 clicks on lifestyle variant) — [Workshop Digital](https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/).
- **ScaleWise VA (10 Shopify clients, first 90 days of beta, US; VENDOR, no methodology published):** fresh merchant-written descriptions beat default Shopify descriptions by 40–60% on conversion rate; copy opening with discounts did worse than copy leading with use case and product specifics; generic product pages that didn't reinforce the use case lost sales; clients with 6+ months of prior GEO work had 25–40% higher CTR — [ScaleWise VA case study](https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days).
- **Headline anecdote (one campaign, travel):** "Book flights 40% cheaper than airlines" had 3.2x the CTR of "Best Flight Deals Online" — i.e., a concrete, quantified benefit beat a generic claim — [Simplified](https://simplified.com/blog/ai-writing/chatgpt-ads-creative-examples). ANECDOTE.
- **Creative variance is extreme at small budgets:** an Australian founder's ~A$500 test — all seven free-report requests came from a single ad — [industrycontents](https://industrycontents.com/how-chatgpt-ads-work/). ANECDOTE.
- **Bidding changes CTR too:** Karel Huk (US account, ~$33k / ~750k CZK since Apr 2026) — moving identical text ads from click bidding to conversion bidding raised CTR 61% — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons).
- **Product feed ads vs text ads:** feed ads CTR ~6% lower than text ads, but 43% cheaper CPC (Karel Huk, not like-for-like) — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons).
- Contrary advice (no data): a B2B playbook claims UI screenshots/outcome visuals beat lifestyle photos in research contexts — [Just Global](https://justglobal.com/chatgpt-ads-best-practices-guide-b2b-playbook/).
- **Sponsored Agents (announced/launched 16 Sep 2026; US test with select advertisers; one source says international from 23 Sep, others say US-only, OpenAI not taking early-access requests):** after seeing an ad, a user can open a labeled separate conversation with a business-run agent, ask follow-ups, and click to the site — [Search Engine Land](https://searchengineland.com/openai-is-turning-chatgpt-ads-into-conversations-488949); [SER](https://www.seroundtable.com/openai-chatgpt-sponsored-agents-42104.html); [mb-dm.pl](https://mb-dm.pl/en/news/sponsored-agents-chatgpt-brand-conversation-ads/).
- **Visual ads in image generation (5 Oct 2026; US; small initial advertiser group)** — [TechCrunch](https://techcrunch.com/2026/10/05/openai-launches-visual-ads-that-appear-alongside-image-generation-results/).
- Creative testing advice: launch 3–5 variants per ad group; pause weak ones after ~1 week of data — [Adventure Media / AirOps-type 30-day plan](https://adventuremedia.ai/blog/how-to-a-b-test-chatgpt-ad-creative-a-data-driven-framework-for-2026).

### Inferences
- For a bean-bag store: headline "MrBean: [specific benefit matching the chat]" (e.g., "MrBean: frameless chairs that hold shape — 2-year cover warranty") plus body with concrete specs (filling type, washable cover, sizes, delivery time across Ukraine) is consistent with all observed patterns; avoid leading with "-20% sale".
- Price in copy: no source tested price-in-copy directly; ScaleWise's "discount-led copy underperforms" is the closest signal.
- Images: no e-commerce product-on-white vs lifestyle test exists; this needs an in-account A/B.

### Gaps
- No controlled e-commerce image test (product on white vs lifestyle) published.
- No data on question-style headlines, on price-in-headline, or on Ukrainian-language creative.
- No performance data for Sponsored Agents or visual ads; neither appears available to Ukrainian advertisers yet (unconfirmed).
- "Ask ChatGPT about this ad" as a named feature was not found; Sponsored Agents is the closest analogue.

---

## 3. Bidding & budget: starting bids, CPC vs CPM vs oCPC/oCPM, learning phase, pacing, $25/day minimum

### Takeaway
OpenAI's $3–5 suggested starting CPC is often **too low to deliver** in competitive US verticals (Symphonic: $3 = zero impressions; others needed $9–13), but European/CEE e-commerce clicks have cleared at **€0.44–€2.09**. The strongest single optimisation reported is **switching to conversion bidding (oCPC): −69% CPC, +61% CTR** (Karel Huk), but only after pixel+CAPI are live, and the bid type cannot be changed after campaign creation. Too-low target CPA starves delivery. The minimum is **$25/€15/£15 per campaign per day**, spend can hit 2× daily budget on a given day, and practitioners say to wait ≥14 days before judging.

### Cited Findings
**Platform rules (self-serve era)**
- Suggested starting max CPC $3–$5; OpenAI publishes no rate card — [OpenAI Help: Basics](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics); [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/).
- Minimum $25/day per campaign (USD), €15 (EUR), £15 (GBP), 350 CZK; daily budget is an average, actual spend can reach up to 2× daily budget on a single day; no minimum commitment since May (Feb pilot required $200k) — [ppcone.cz Czech page](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/); [spendlessgrowmore](https://www.spendlessgrowmore.com/learn/chatgpt-ads-cost); [justinmckelvey](https://justinmckelvey.com/blog/chatgpt-ads-cost). PATTERN. Windmill Strategy noted the $25 floor exists even though OpenAI says "no minimum spend" — [Windmill Strategy](https://www.windmillstrategy.com/chatgpt-ads-b2b-industrial-manufacturing-pilot/). One guide's claim of $1–$10 minimums in "testing environments" is unverified.
- oCPC prerequisites: conversion bidding enabled on account; pixel or CAPI live; exactly one active *standard* conversion event as goal (custom events not allowed); goal/event cannot be changed after creation; existing CPC/CPM campaigns cannot be switched to oCPC; you set a CPA bid but are still billed per click — [novoads](https://novoads.ai/en/blog/chatgpt-ads-conversion-bidding); [gptadsai oCPC guide](https://www.gptadsai.com/guides/chatgpt-ads-conversion-campaigns); [cadimar](https://cadimar.net/blogs/chatgpt-ads-bidding).
- oCPM (impression billing, optimises to conversions including view-through) added 16 Sep 2026; secondary sources say OpenAI now recommends it — [MetricFixer](https://metricfixer.com/publications/online-advertising/openai-ads-september-2026-ocpm-attribution-integrations-sponsored-agents); [parvi.ai](https://parvi.ai/news/openai-chatgpt-ads-updates-september-2026/).
- Promo: $500 ad credit when spending first $500 (offer reportedly expiring 30 Sep 2026; terms unverified) — [Steven Cheng on X](https://x.com/stevencheng/status/2115705446879436937); [Threads post](https://www.threads.com/@othmantmoulik/video/Dd4uowujJn1/video-this-is-insane-chat-gpt-will-double-your-first-in-ads-open-ai-adds-in-chat-gpt/).

**Practitioner experience**
- **Karel Huk (Czech e-commerce PPC specialist, US account, ~$33k since Apr 2026; ANECDOTE but detailed):** oCPC on identical text ads cut CPC 69% and raised CTR 61%; in a 30-campaign test a very low target CPA produced almost no delivery — raising target CPA to $20 grew delivery 523-fold; bid type is fixed at campaign creation so a wrong choice means rebuilding — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons); [karelhuk.cz/en](https://karelhuk.cz/en).
- **Symphonic Digital (US agency, own test, self-serve era; ANECDOTE):** a $3 bid got zero impressions; max bid climbed to ~$12; ~$500 spent at CPC near $9; took ~1.5 weeks of incremental bid increases plus an extra ad group before a $50/day budget actually spent — [Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results).
- Several advertisers reportedly needed $9–13 bids before ads delivered (agency report) — [Out of the Box Advisors / secondary](https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth).
- **Out of the Box Advisors (US small-business coaching, $500, Jul 2026):** budget ran out in about an hour; ~140 reported clicks (~$3.50 CPC) — [Out of the Box Advisors](https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth). (How this squares with daily-budget pacing is unclear; possibly a lifetime budget.)
- **Opascope (US, ~$60k / 15 days):** realised CPC ~$1.72 (well below the $3–5 guidance); daily ROAS swung 0.2x–2.9x → judge on rolling windows; secondary summary says they advise $5k–10k for a believable read; "the same forces that flatter early ROAS depress early CPC" — [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/).
- Observed CPC ranges: PPC One compilation of 15 dollar-billed (mostly US) campaigns: $0.76–$14.80, median $4.41; one test UK $5.10 vs US $10.62; ppc.io: median CPC $4.34 across 53 US accounts spending ≥$1,000 (30 May–28 Aug 2026; its 8.54% median CTR is out of line with all other sources); SEJ: CPCs from <$3 to ~$10–13 (some reviews cite $3–$22) — [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/); [ppc.io](https://ppc.io/blog/chatgpt-ads); [SEJ](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/). PATTERN: US CPCs mostly $3–5, long tail to $10+.
- European/CEE CPCs: PromptMarketing €0.44 (3 webshops, 4 EU countries, Sep 2026, product feeds); Searchflow NL €1.63–2.09; Premium Online NL €2.68 (Dutch buyer calls €2–3 "high"); Czech: Advisio CZK 15–30/click, Srovname.cz's Lucie Thiemlová considers €0.5–1 "relatively high" — [PromptMarketing](https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/); [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/); [ppcone.cz Czech](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/).
- Patience: guides say give each campaign ≥14 days; 2–4 weeks to stabilise; ScaleWise clients who waited until day 14 before changes outperformed those optimising daily (VENDOR) — [Adventure Media mistakes](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them); [ScaleWise VA](https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days).
- Google-Shopping-style tactics (aggressive bid laddering, constant creative refresh) did not suit the platform (ScaleWise, VENDOR) — [ScaleWise VA](https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days).
- Small-budget math: $25/day ≈ $750/30 days per campaign — [spendlessgrowmore](https://www.spendlessgrowmore.com/learn/chatgpt-ads-cost).

### Inferences
- For a small Ukrainian store: one campaign at the minimum (€15 or $25/day, depending on account currency) with 2–4 ad groups is the realistic structure; multiple campaigns multiply the floor.
- Recommended sequence implied by sources: (1) install pixel + CAPI first; (2) start on CPC to gather data (or start directly on oCPC if conversions already flow, since you cannot convert a CPC campaign later); (3) when switching, create a *new* oCPC campaign and set a target CPA realistic for the AOV — Huk's data shows a too-low target CPA kills delivery.
- With ~150–750 clicks/month at $1–5 CPC and paid CVR of 0.4–2%, a small store may get only ~1–15 tracked purchases per month — likely too few for confident oCPC learning; optimising to an upper-funnel standard event (add-to-cart / initiate checkout) may be needed (inference; no source tested this).
- CEE CPCs appear 2–5× lower than US, which partly offsets the fixed $25/€15 floor.

### Gaps
- UAH-denominated minimum (if UAH accounts exist) not found.
- No documented "learning phase" length or conversion threshold for oCPC/oCPM from OpenAI.
- No published oCPM vs oCPC comparison from practitioners.

---

## 4. Landing pages: product vs category vs dedicated landing page; intent match; mobile

### Takeaway
Universal practitioner advice: **never send ChatGPT clicks to the homepage**; send them to a product or tightly matched collection/comparison page that continues the conversation's use case. There is no published head-to-head of product vs category pages. Mobile in-app WebView strips referrers, so UTM tagging is mandatory.

### Cited Findings
- OpenAI reportedly recommends relevant product, collection or content pages instead of a generic homepage (via guide citing OpenAI docs) — [Lapis landing page guide](https://www.trylapis.com/resources/chatgpt-ads-landing-page-guide).
- Sending traffic to a homepage or broad category page called "the single biggest mistake" e-commerce brands make (VENDOR opinion) — [Lapis e-commerce playbook](https://www.trylapis.com/resources/chatgpt-ads-ecommerce-dtc-shopify-playbook).
- Symphonic Digital: "not sending ChatGPT traffic to the homepage" was a decision they felt good about — [Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results).
- ScaleWise VA: two of 10 Shopify clients had strong engagement but weak click-to-conversion; generic product pages that didn't reinforce the use case lost sales — [ScaleWise VA](https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days).
- Research-stage users need a page that answers their question (agency guide) — [Adventure Media](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them).
- Match landing headline to ad headline; one landing page per topic cluster; claimed +20–40% conversions and "5–15% dedicated LP vs 1–3% homepage" — single-agency claims, unverified — [Lapis](https://www.trylapis.com/resources/chatgpt-ads-landing-page-guide).
- Product ads should link to a page matching the headline with the product above the fold and immediate purchase path — [eSEOspace](https://eseospace.com/blog/chatgpt-ads-ecommerce/).
- Mobile/WebView: ad clicks open in ChatGPT's in-app WebView; referrers are often stripped, so traffic shows as Direct in GA4 unless UTM-tagged — [paidsync](https://paidsync.ai/blog/measure-chatgpt-ads-in-ga4); [evergreen-growth](https://evergreen-growth.com/articles/chatgpt-ads-tracking-pixel-capi-ga4).

### Inferences
- For bean bags: map each ad group to a matching page — e.g., "gaming/long sitting" → specific model PDP or a curated "for gamers" collection; "kids/teens" → kids collection; "outdoor" → waterproof models collection; "how to choose size/filling" → buying-guide page with product blocks. Pages should load fast inside a mobile WebView and repeat the key specs and Ukraine-wide delivery/payment-on-delivery terms.

### Gaps
- No published product-page vs category-page vs dedicated-LP experiment.
- No mobile vs desktop split of ChatGPT ad performance found.

---

## 5. Product feeds / shopping formats in ChatGPT ads

### Takeaway
Product feed ads (catalog-generated sponsored product ads) have been in open beta since ~June 2026 and produced the **cheapest clicks** in the two e-commerce accounts with data (Huk: −43% CPC vs text; PromptMarketing: €0.44 CPC, 2.41% CTR in EU). But delivery is **country-restricted** — in Czechia feed ads did not serve even with a valid 43,000-product feed — so Ukrainian availability must be verified in-account.

### Cited Findings
- Feed ads: retailers upload a catalog to Ads Manager; ads auto-generated from product name, image, attributes; shown below responses, labeled sponsored; set up via Tools → Feeds → Create Feed (SFTP credentials); start with a ~100-product sample; same structured format as Google Shopping feeds; during beta feed products are used only for ads, not organic ChatGPT shopping results — [Search Engine Land](https://searchengineland.com/openai-adds-product-feed-ads-to-chatgpt-477208); [GeekSeller](https://www.geekseller.com/blog/openai-chatgpt-product-feed-ads-are-now-opening-to-more-sellers-via-ads-manager-beta/); [Adventure Media](https://adventuremedia.ai/blog/chatgpt-ads-for-ecommerce-product-feed-integration-and-shopping-ads-in-2026); [ALM Corp](https://almcorp.com/news/openai-chatgpt-product-feed-ads-retailers/).
- **Karel Huk (US account):** feed ads 43% cheaper per click and 46% cheaper per 1,000 impressions than text ads, CTR 6% lower (not a like-for-like comparison) — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons); [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/).
- **PromptMarketing (European e-commerce owner, 3 specialist webshops, 4 countries, started Sep 2026; VENDOR):** feeds via Channable + context hints per market + pixel/CAPI; first 25 days: 2,287 clicks, 2.41% CTR, €0.44 CPC; takeaway: "webshops with good Google Shopping feed data have a head start" — [PromptMarketing](https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/). No conversion/ROAS disclosed in snippet.
- **Czech Republic restriction (ppcone.cz, Sep–Oct 2026):** Czechia is "Available" for ChatGPT Ads, but product feed ads are "Not in the Czech Republic"; OpenAI support confirmed the feed was correct with 43,000 products indexed, yet the country is restricted — [ppcone.cz Czech](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/).
- **AFA Stores (US furniture & home décor retailer, 50,000+ SKUs; via Quartile webinar with OpenAI's Mik Kurian; VENDOR):** 4.7x ROAS, 112% growth in orders from direct ChatGPT traffic, 11% improvement in overall conversion rate; source itself cautions organic/direct increases shouldn't automatically be attributed to paid. Technical lighting brand: +153% ROAS, +75% organic orders from ChatGPT — [Quartile](https://www.quartile.com/blog/chatgpt-ads-key-takeaways-and-results-from-our-openai-webinar). Quartile became an OpenAI technology partner 21 Sep 2026 — [Unite.ai](https://www.unite.ai/quartile-adds-chatgpt-advertising-access-as-technology-partner/). This is the **only furniture-specific result found**.
- Shopify: OpenAI's free ChatGPT Ads app for Shopify (US sellers, from 16 Sep 2026); Shopify's Shop Campaigns network can place ads in ChatGPT; Target, Williams-Sonoma, Adobe, Albertsons cited as early testers — [OpenAI](https://openai.com/index/reimagining-advertising-with-ai/); [eMarketer](https://www.emarketer.com/content/shopify-brings-chatgpt-ads-its-merchant-ecosystem).
- Lengow (European feed manager): main question for advertisers is whether the feed already powering Google Shopping is ready for ChatGPT — [Lengow](https://blog.lengow.com/chatgpt-ads-first-results-are-in); [Lengow Europe guide](https://www.lengow.com/get-to-know-more/how-to-get-ready-for-chatgpt-ads-in-europe).
- Unverified claim: since 13 Oct 2026 submitting a commerce feed commits a site to crawler/agent access with no TDM opt-out — single source, uncorroborated — [contexthints.com feed guide](https://www.contexthints.com/guide/chatgpt-product-feed.html).

### Inferences
- If MrBean has a Google Merchant Center / Prom / Rozetka-style XML feed, re-using it for ChatGPT feed ads is low-effort and, where available, likely the cheapest traffic. But given the Czech precedent, expect that feed ads may not deliver in Ukraine at first; build text ads in parallel.

### Gaps
- No data on whether feed ads serve in Ukraine or in other 21-Oct-2026 markets.
- No published ROAS for feed ads from a small store.
- Williams-Sonoma, Target: no published results.

---

## 6. Measurement problems: pixel/CAPI, GA4 discrepancies, view-through, low conversion volume

### Takeaway
Measurement is the #1 complaint (PATTERN). Typical issues: platform clicks ≫ GA4 sessions when UTMs are missing (13% → 68% match after fixing tags in one case; Graphite: 92–96% match when tagged); referrer loss in mobile WebView; Ads Manager conversions vs store orders diverge (different windows, view-through); tiny conversion counts. Independent research (1,898 shops) finds paid ChatGPT traffic worth **64% less revenue per visit** than Google Search, while vendor incrementality studies claim last-click **undercounts by ~80%**. Treat both as bounds and run your own holdout.

### Cited Findings
**Tracking set-up and discrepancies**
- Karel Huk: deploy OpenAI Pixel **and** Conversions API before spending anything; a Google Ads GTM container won't cover it; declining tracking consent doesn't stop users seeing ads (biggest difference from Meta/Google) — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons).
- OpenAI docs (per guides): "The Conversions API is a more reliable tracking source than the pixel alone"; run both with deduplication; CAPI accepts batches of up to 1,000 events — [spaceads](https://www.spaceads.agency/blog/chatgpt-ads-conversion-tracking-measurement-pixel-conversions-api); [gptadsai tracking](https://www.gptadsai.com/guides/chatgpt-ads-conversion-tracking); [hpanov-digital (oppref parameter)](https://hpanov-digital.com/en/chatgpt-ads-conversion-tracking/).
- Out of the Box Advisors (US, $500, Jul 2026): initially only ~13% of paid clicks traceable on their site, zero leads; 20 Aug update showed 68% after they found their own UTM tags were missing — [Out of the Box Advisors](https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth); [MadContext tracker / secondary](https://madcontext.com/benchmark/).
- Symphonic Digital: 53 platform clicks vs 35 GA4 sessions — [Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results).
- Graphite test: 92–96% of tagged ChatGPT Ads clicks showed up as paid sessions in GA4 — [Graphite five-percent research](https://graphite.io/five-percent/research/chatgpt-ads-tracking).
- OpenAI attributes click–session gaps to redirects, consent, blockers, UTM handling, attribution windows and time zones — [digitalapplied attribution playbook](https://www.digitalapplied.com/blog/chatgpt-ads-attribution-metrics-measurement-playbook-2026); [soku.ai](https://soku.ai/blog/chatgpt-ads-ga4-integration).
- Windows: click-through conversions 7/14/30 days; view-through within 1 day of impression; OpenAI docs inconsistent (captured 5 Oct 2026) on whether view-through is folded into "conversions" or reported separately — [paidsync](https://paidsync.ai/blog/measure-chatgpt-ads-in-ga4); [enalitica](https://enalitica.com/blog/chatgpt-ads-attribution). Expect GA4 totals far above Ads Manager conversions.
- Opascope: Ads Manager under-reported conversions and did not report ROAS at the time (they used their own tracking) — [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/). Later Ads Manager added "Sales ROAS" and "Attributed Sales Value" — [seo-day.de](https://www.seo-day.de/news/article/chatgpt-ads-manager-gains-attributed-sales-value-sales-roas?lang=en).
- Advertisers see no queries/conversations — only aggregated impressions, clicks, spend, CTR, CPC, CPM, conversions — [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/). Metrics refresh ~every 15 minutes — [Synter](https://synterai.com/blog/chatgpt-ads-real-data).
- Early pilot era (Feb–Apr 2026): two agency executives said they could not show measurable business results for clients; little performance data, no automated buying, minimal targeting — [Search Engine Land](https://searchengineland.com/openais-ad-platform-cant-tell-advertisers-if-their-money-is-working-472233); [eMarketer](https://www.emarketer.com/content/chatgpt-ads-will-soon-reach-more-users--proven-results-still-missing).

**Independent value evidence**
- **Kaiser & Schulze working paper (WU Vienna / Frankfurt School; 1,898 online shops, 60 weeks; under review; covered Oct–Nov 2026):** paid ChatGPT visits $0.89 revenue/session vs $2.45 for Google Search ads (−64%); CVR 0.37% vs 1.17%; among dual-channel advertisers 97% earned less per ChatGPT visit and 98% converted worse; ChatGPT ads would need ~$0.26 CPC to match Google ROAS; paid panel = 387 sites, 102 with full financial tracking, 31 with Google Ads cost; 14 of 87 dual-channel advertisers recorded paid ChatGPT purchases; after ads launched, ChatGPT's *unpaid* referrals to stores fell ~6–8% — [Search Engine Land](https://searchengineland.com/chatgpt-ads-generate-less-revenue-per-visit-than-google-search-study-500160); [PPC Land](https://ppc.land/chatgpt-ad-visits-earn-shops-0-89-against-2-45-for-google-search-ads/); [TechXplore](https://techxplore.com/news/2026-11-chatgpt-advertising-money-google-ads.html); [SEJ](https://www.searchenginejournal.com/google-search-chatgpt-ad-revenue-per-visit/595596/). Caveat: observational, last-visit revenue, may miss later purchases.
- StubGroup (agency running ChatGPT campaigns, via SEL, Aug 2026): 0.21% CVR on ChatGPT ads vs 3.71% on Google Ads (conflicted source) — [AirOps summary](https://www.airops.com/blog/chatgpt-ads-performance); [Omnius](https://www.omnius.so/blog/chatgpt-ads-vs-geo).
- Organic vs paid: Andy Brice 4.2% vs 0.46%; WorkMagic Q3: organic ChatGPT visitors convert 5.3% — [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/); [WorkMagic](https://www.workmagic.io/blog/do-chatgpt-ads-work).
- adlibrary (13 Jul 2026, $200 two-week test): ~5,000 impressions, ~40 clicks, 0 conversions; organic SEO/GEO referrals from ChatGPT brought more visitors than paid in the same window — [adlibrary](https://adlibrary.com/posts/we-tested-chatgpt-ads).

**Incrementality (vendor)**
- WorkMagic (Q3 2026, 1 Jul–30 Sep, brands with ≥5 last-click orders; VENDOR): incrementality-adjusted attribution showed median +83% orders and +74% revenue vs last-click (1.8x / 1.7x) — [WorkMagic](https://www.workmagic.io/blog/do-chatgpt-ads-work).
- OpenAI says incrementality work is early; geo experiments with WorkMagic, Haus, Measured; Dose (wellness) showed statistically significant lift with 67% of incremental purchases from net-new customers; brand-lift tests with Kantar and Cint; 18–20 measurement partners (AppsFlyer, Adjust, Branch, Kochava, Hightouch, Tealium, LiveRamp, Fospha, Measured, INCRMNTAL) announced 5 Oct 2026 — [OpenAI](https://openai.com/index/new-chatgpt-ads-format-and-measurement/); [Marketing Brew](https://www.marketingbrew.com/stories/openai-visual-ad-format-measurement-tools-advertising-week); [Relevant Audience](https://www.relevantaudience.com/ai/chatgpt-ads-measurement-partners-image-ads/).
- Conflict: Improvado says OpenAI ships no native lift/holdout/geo product (you must design your own); a GPT Ads guide lists geo incrementality and brand lift as shipped — [Improvado](https://improvado.io/blog/chatgpt-ads-measurement); [gptadsai visual ads](https://www.gptadsai.com/guides/chatgpt-visual-ads).

### Inferences
- For MrBean (likely on Horoshop/OpenCart/Prom/Shopify-like stack): UTM-tag every ad URL, create a GA4 custom channel "ChatGPT Ads", install pixel + server-side CAPI (purchase with order value), and reconcile Ads Manager vs GA4 vs actual orders weekly. Phone/Viber/Telegram orders common in Ukraine will be invisible unless sent back via CAPI.
- Low conversion volume at small budget means ROAS should be read over 4+ weeks, and a simple on/off or regional holdout (e.g., exclude several oblasts) is the only feasible incrementality check.

### Gaps
- No evidence on how ChatGPT Ads attribution handles Ukrainian payment flows (cash on delivery, Nova Poshta) or offline orders.
- Whether personalisation/consent rules in Ukraine follow EEA restrictions is unknown.

---

## 7. Typical mistakes, 30/60/90-day plans, incrementality, early-mover advantages and how long they lasted

### Takeaway
Repeated mistakes (PATTERN): no UTMs/pixel/CAPI at launch, keyword-list thinking, homepage landing, killing campaigns in week 1, using Google Shopping tactics, comparing CTR with Google Search, and bids too low to deliver. Agencies frame ChatGPT Ads as an **incremental test channel** (not a Google replacement), with a 30-day diagnostic, then holdout testing at 4–6 weeks. Early-mover price advantage in the US was real but **short and ambiguous**: CPMs fell $60→$25 in ~9 weeks (Feb–Apr) because the auction was thin; advertiser count went ~600 (spring) → ~20k (late Aug) → ~60k (early Oct) → 100k+ cumulative (21 Oct). CTR benchmarks slid May→June as advertisers entered, but Sept data showed CTR rising again. In newly opened EU/CEE markets, early CPCs are far lower than US.

### Cited Findings
**Mistakes**
- Creating the ad account in the agency's name (unsupported, ownership problems); launching without UTMs/conversion tracking (clicks blend with organic ChatGPT referrals); treating hints like Google keywords; homepage landing; judging in week one (give ≥14 days); comparing panel CTR to campaign CTR or Google CTR; selling ads as a way to boost organic AI mentions (OpenAI says ads don't affect answers) — [Adventure Media](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them); [Swydo for agencies](https://www.swydo.com/blog/chatgpt-ads-for-agencies/); [AirOps](https://www.airops.com/blog/how-to-advertise-on-chatgpt). PATTERN.
- Bids at OpenAI's $3–5 guidance failing to deliver (Symphonic, others) — [Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results).
- Target CPA set too low → no delivery (Huk) — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons).
- Applying Google Shopping playbooks (bid laddering, constant creative refresh) — [ScaleWise VA](https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days).
- Measuring on platform conversions only (Opascope, WorkMagic, Kaiser & Schulze point in opposite directions) — see §6.

**30/60/90 plans (agency opinion)**
- 30-day diagnostic: days 1–7 check live policy/category eligibility; days 8–14 test tracking; days 15–21 launch 3–5 variants per ad group; days 22–28 pause weak variants; day 30 compare paid with organic mentions; at month end pause ad groups/hints spending without clicks or conversions — [Adventure Media first campaign guide](https://adventuremedia.ai/blog/how-to-build-your-first-chatgpt-ads-campaign-2026-beginner-s-guide); [Lyfe Marketing](https://www.lyfemarketing.com/blog/chatgpt-advertising-best-practices/).
- One guide suggests extending attribution windows to 45–60 days (others silent) — [AirOps](https://www.airops.com/blog/chatgpt-ads-best-practices).
- Incrementality: geo split of matched markets with/without ads, read after 4–6 weeks on total revenue (not platform events); on/off pulse test watching branded search and direct traffic; pause ads in one market 3–4 weeks to check effect on organic mentions — [Measured](https://www.measured.com/faq/how-to-measure-chatgpt-ads-ai-chat-advertising-incrementality/); [BlueAlpha](https://bluealpha.ai/articles/how-to-measure-whether-chatgpt-ads-actually-drive-revenue); [The State of Brand](https://www.thestateofbrand.com/news/chatgpt-ads-organic-traffic).
- Brands already widely recommended organically by ChatGPT may find ads partially duplicative (like branded search) — [Measured](https://www.measured.com/faq/how-to-measure-chatgpt-ads-ai-chat-advertising-incrementality/).
- Positioning: Q1Media — treat as incremental test, don't replace what works, not recommended for B2B currently; Karel Huk — supplement Google Ads/Sklik, track incrementality not last-click; Graphite — incremental, not substitute for search budgets; adlibrary — "billboard, not funnel" — [Q1Media](https://www.q1media.com/pages/case-studies-blogs/chatgpt-ads-part2); [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons); [Search Engine Land](https://searchengineland.com/reportchatgpt-ads-are-growing-fast-but-advertisers-are-still-figuring-them-out-492337); [adlibrary](https://adlibrary.com/posts/chatgpt-ads-billboard-not-funnel). PATTERN.
- Budget for a believable read: $5k–10k (Opascope, via secondary) — [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/). Treat $500 as a learning budget (agency field report) — [decantery / related](https://decantery.com/we-spent-500-on-chatgpt-ads/).

**Early-mover window**
- CPM $60 (Feb launch) → as low as $25 by 17 Apr 2026 (Digiday buyers) → $15 low (Ad Age, per PPC Land); one commentator reads the 58% fall in 10 weeks as early advertisers not seeing value proportional to price — [Digiday](https://digiday.com/marketing/everything-is-coming-down-chatgpt-ads-are-getting-cheaper/); [PPC Land](https://ppc.land/chatgpt-ad-cpms-drop-to-25-as-openai-races-toward-global-auction/); [ctidigital](https://www.ctidigital.com/insights/chatgpt-is-testing-ads-will-early-movers-be-rewarded/).
- CTR: Similarweb Q1 0.68% overall (top quartile 1.0%); ~0.68% May → ~0.50% June as more advertisers entered; Graphite/Similarweb Sept report: 112% rise in worldwide ad click rate; US all-time 0.73% (clicks per ad-bearing reply, not per impression) — [SER](https://www.seroundtable.com/chatgpt-ads-click-through-rates-41267.html); [Stratezik](https://www.stratezik.com/blog/chatgpt-ads-benchmarks); [PPC Land via search](https://ppc.land/chatgpt-ad-cpms-drop-to-25-as-openai-races-toward-global-auction/); [ecommerceparadise](https://ecommerceparadise.com/chatgpt-ads-ecommerce-sellers-absent/). Conflicting signals → no clear "window closing" in CTR.
- Market CTR (Graphite, Sep 2026): Brazil 1.91%, UK 0.74%, US 0.73%, NZ 0.60%; CTR higher outside the US in newer markets — [ALM Corp](https://almcorp.com/news/chatgpt-ads-draw-higher-ctr-outside-us-report-finds/); [SEO Rank](https://seorank.com/ppc/chatgpt-ad-ctr-varies-by-market).
- Advertisers: ~600 (spring) → 1,400+ brands (mid-year, substack) → ~20,000 late Aug → ~60,000 early Oct (New Street Research) → 100,000+ cumulative 21 Oct — [Ben's Bites](https://news.bensbites.co/posts/62158-openai-has-surpassed-100m-in-annualized-revenue-from-chatgpt-ads-has-expanded-to-600-advertisers-and-plans-to-launch-self-serve-advertiser-access-in-april); [AI Ad Economy substack](https://aiadeconomy.substack.com/p/more-than-1400-brands-have-tested); [The Next Web](https://thenextweb.com/news/chatgpt-ads-89-countries-100000-advertisers).
- Hostinger (web hosting, ~$70k total testing; via Digitrendz/SEJ, secondary): CPCs comparable to Google early, but CPMs >$65 as spend grew; $9,620 slice at $4.41 CPC, 0.94% CTR; estimated ROAS 3.3x–6.8x depending on attribution model — [Digitrendz](https://digitrendz.blog/?p=251819); [SEJ](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/).
- Competition example: Symphonic found a competing agency ad on nearly every test search (agency vertical saturated by self-serve era) — [Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results).
- Graphite: e-commerce largely absent from US ChatGPT ads (headline "Ecommerce Mostly Absent") — [ecommerceparadise](https://ecommerceparadise.com/chatgpt-ads-ecommerce-sellers-absent/).
- Mediapost: agencies posted on LinkedIn (late Aug 2026) that they did not see performance from ChatGPT Ads; trendingtopics: "$1B run rate but advertisers are not sold" — [MediaPost](https://www.mediapost.com/publications/article/417561/chatgpt-ads-reaches-1b-annualized-in-200-days.html); [Trending Topics](https://www.trendingtopics.eu/chatgpt-ads-hits-1-billion-run-rate-but-advertisers-are-not-sold/).

**CEE / Europe first impressions (EU era, Aug–Nov 2026)**
- Czechia: available from ~24 Aug via partners; health/financial/legal ads banned in CZ (dentistry not allowed though case-by-case in US); feed ads not delivering; CPCs CZK 15–30 (Advisio); a travel site's first 6 days: CTR 8.2% vs 16.3% on Google, CPC CZK 1.49 vs 0.27 (Petra Větrovská / Michal Smetana) — [ppcone.cz Czech](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/); [Smetana](https://smetanartb.cz/performance/chatgpt-ads-v-cesku-2026-prvni-data-a-ceny/).
- Netherlands: ads seen since 24 Aug, self-serve since 31 Aug; no personalisation; Searchflow and Premium Online data above — [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/); [taskforce.nl](https://taskforce.nl/en/insights/chatgpt-ads-initial-findings/).
- Ukraine (from 21 Oct 2026): Netpeak, Mezha, Cases.media, mpatsan, Digital Kitchen, Advermedia, newage, seo-evolution publish setup guides; requirements — legal entity registered in a listed country, business verification, payment set-up; ads only on Free and Go plans; **no Ukrainian campaign results (CTR/CPC/ROAS) found as of 9 Nov 2026**; agencies stress efficiency must still be proven via own tests — [Netpeak](https://netpeak.net/uk/blog/reklama-v-chatgpt-zapratsyuvala-v-ukraini/); [mpatsan](https://mpatsan.com/thinking/yak-pratsiuie-reklama-v-chatgpt-i-z-choho-ukrainskomu-biznesu-pochaty-pershyi-test); [newage](https://newage.agency/blog-uk/chatgpt-ads-openai-ads/); [seo-evolution](https://seo-evolution.com.ua/blog/ai-systems/chatgpt-ads-instrukciya); [Cases.media](https://cases.media/en/article/chatgpt-ads-v-ukrayini-yak-biznesu-pidiiti-do-novogo-reklamnogo-kanalu); [Spilno agency setup guide](https://spilnoagency.com.ua/en/instructions-us/chatgpt-ads-new-features-setup-guide).

### Inferences
- The US cheap-CPM window effectively lasted Feb→May (thin auction, high minimums) and was replaced by a CPC auction with rising advertiser counts; there is no evidence of a sustained "cheap forever" period. For Ukraine (opened 21 Oct), competition in niche furniture conversations is plausibly very low for the first months, which is the main argument for testing now — but this is an inference from US/EU patterns, not a measured Ukrainian fact.
- A sensible 90-day frame (synthesised from sources): Days 1–14 tracking + 2–4 ad groups on CPC at a bid that actually delivers; days 15–45 cut non-delivering/irrelevant groups, iterate creative; once ≥ some dozens of conversions, launch a separate oCPC/oCPM campaign; days 45–90 run an on/off or regional holdout and compare total orders, branded search, and direct traffic.

### Gaps
- No ChatGPT-ads-specific 60/90-day agency playbooks with data were found; only 30-day frameworks.
- No measured duration of the early-mover window in any EU/CEE market yet (markets only ~2–3 months old).

---

## 8. Published case studies with numbers

### Takeaway
Public evidence is thin and skewed: vendor/agency cases (AFA Stores 4.7x ROAS, Hostinger 3.3–6.8x est., OpenAI's unnamed 3x ROAS e-commerce advertiser, Opascope 1.49x) contrast with many small tests producing **zero conversions** and an independent study showing **−64% revenue per visit vs Google**. Only one furniture case (AFA Stores, vendor-reported) exists.

### Cited Findings
| Advertiser / source | Country, vertical, era | Spend / period | Results | Evidence type |
|---|---|---|---|---|
| AFA Stores via Quartile webinar | US, furniture & home décor (50k+ SKUs), self-serve era (published ~Sep–Oct 2026) | n/d | 4.7x ROAS; +112% orders from direct ChatGPT traffic; +11% overall CVR | VENDOR — [Quartile](https://www.quartile.com/blog/chatgpt-ads-key-takeaways-and-results-from-our-openai-webinar) |
| Technical lighting brand via Quartile | US?, lighting | n/d | +153% ROAS; +75% organic ChatGPT orders | VENDOR — [Quartile](https://www.quartile.com/blog/chatgpt-ads-key-takeaways-and-results-from-our-openai-webinar) |
| Unnamed e-commerce advertiser (OpenAI) | US, e-commerce, announced 31 Aug 2026 | 28 days | 3x ROAS | Platform claim — [Pulse2](https://pulse2.com/openai-chatgpt-ads-reaches-1-billion-annualized-revenue-run-rate-in-under-200-days-as-self-service-expands-globally/) |
| Opascope (client) | US, e-commerce, self-serve | ~$60k / 15 days | ~$89k revenue; 1.49x blended ROAS; $1.72 CPC; daily ROAS 0.2–2.9x; scaled campaigns only | VENDOR — [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/) |
| PromptMarketing (3 webshops) | 4 EU countries, specialist e-commerce, from Sep 2026 | 25 days | 2,287 clicks; 2.41% CTR; €0.44 CPC (feed ads) | VENDOR — [PromptMarketing](https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/) |
| Karel Huk | US account, e-commerce, Apr–Oct 2026 | ~$33k | oCPC −69% CPC, +61% CTR; feed ads −43% CPC, −46% CPM, −6% CTR; target CPA $20 → 523x delivery | ANECDOTE (practitioner) — [Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons) |
| Hostinger | Global/US, web hosting | ~$70k total; $9,620 slice | $4.41 CPC; 0.94% CTR; CPM >$65 later; est. ROAS 3.3–6.8x | Secondary — [Digitrendz](https://digitrendz.blog/?p=251819) |
| Synter (own account) | 5 markets (US, CA, AU, UK, +1), ad-tech, 2–10 Jun 2026 | $4,428.84 | 129,663 impr.; 448 clicks; 0.35% CTR; $9.89 CPC; $34.16 CPM; too few conversions | VENDOR — [Synter](https://synterai.com/blog/chatgpt-ads-real-data) |
| Workshop Digital | US, B2B | $2,319 | 69,630 impr.; 739 clicks; 1.1% CTR; $3.14 CPC; 0 MQLs (Google: 2) | ANECDOTE — [Workshop Digital](https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/) |
| Windmill Strategy | US, B2B industrial | 1 month | 39,284 impr.; 259 clicks; 0 conversions | ANECDOTE — [Windmill](https://www.windmillstrategy.com/chatgpt-ads-b2b-industrial-manufacturing-pilot/) |
| Choice OMG (Peter Jaffray) | Canada, agency | n/d | 58 clicks; 0.65% CTR; CAD 7.16 CPC; 0 leads (another snippet: two CPC campaigns 1.18%/0.79% CTR, CA$4.42/4.88 CPC) | ANECDOTE — [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/) |
| Symphonic Digital | US, agency | ~$500+ | CPC ~$9; max bid ~$12; 53 clicks vs 35 GA4 sessions | ANECDOTE — [Symphonic](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results) |
| Out of the Box Advisors | US, small-business coaching, Jul 2026 | $500 (~1 hour) | ~140 clicks (~$3.50); 13% → 68% traceable after UTM fix; 0 leads | ANECDOTE — [OOTBA](https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth) |
| adlibrary | US, 2 weeks, published 13 Jul 2026 | $200 | ~5,000 impr.; ~40 clicks; 0 conversions | ANECDOTE — [adlibrary](https://adlibrary.com/posts/we-tested-chatgpt-ads) |
| Decantery | US, self-serve launch, no tracking | $500 | 1.09% CTR (another figure "$71.60" in snippet is unclear) | ANECDOTE — [Decantery](https://decantery.com/we-spent-500-on-chatgpt-ads/) |
| SE Ranking | US?, SEO tool | n/d | 97,000+ impr.; 1,263 clicks; 1.30% CTR | ANECDOTE — via [Q1Media summary](https://www.q1media.com/pages/case-studies-blogs/chatgpt-ads-part2) |
| Q1Media (clients) | US, several accounts | n/d | CTR 0.5–2.5%; CPC ~$5; CVR ~2% | VENDOR — [Q1Media](https://www.q1media.com/pages/case-studies-blogs/chatgpt-ads-part2) |
| WKND agency | developer tools | n/d | ~1.8x ROAS | VENDOR — [WKND](https://wkndagency.com/case-studies/chatgpt-ads/) |
| WeightWatchers (via OpenAI partners) | US, wellness | n/d | CPA 15.3% below blended paid-search benchmark | Partner claim — [MadContext summary](https://madcontext.com/benchmark/) |
| MalachiSoft (wellness practice) | Texas, US | 6 weeks | 22 leads at $52 | VENDOR — [MalachiSoft](https://blogs.malachisoft.com/chatgpt-ads-case-study-22-leads-at-52-each-in-the-first-6-weeks-on-a-channel-most-businesses-havent-touched/) |
| Unnamed agency | n/d | n/d | ~$80 cost/signup vs ~$98 on Google | VENDOR — [lslabs roundup](https://lslabs.tw/en/blog/chatgpt-ads-performance-data/) |
| Intelegencia | financial services | ~6 months | CPL 35% below search | VENDOR — [Intelegencia](https://www.intelegencia.com/blog/digital-marketing/chatgpt-ads-six-months-cost-per-lead) |
| Reddit r/PPC (via Sprites) | US, early beta | small | ad-group CTRs 0%, 1.15%, 2.4% (best on 228 impr.), no conversions yet | Secondary — [Sprites](https://www.sprites.ai/blog/what-marketers-say-about-chatgpt-ads-reddit) |
| Kaiser & Schulze (independent) | US traffic, 1,898 shops, 60 weeks | — | RPV $0.89 vs $2.45 Google; CVR 0.37% vs 1.17% | Independent working paper — [Search Engine Land](https://searchengineland.com/chatgpt-ads-generate-less-revenue-per-visit-than-google-search-study-500160) |
| WorkMagic (aggregate) | US DTC, Q3 2026 | — | incrementality-adjusted +83% orders / +74% revenue vs last-click | VENDOR — [WorkMagic](https://www.workmagic.io/blog/do-chatgpt-ads-work) |

- Meta-commentary: "any case study missing spend, duration, and measurement method is a marketing artifact, not evidence"; Opascope reports revenue only from campaigns it chose to scale — [contexthints.com case studies](https://www.contexthints.com/guide/chatgpt-ads-case-studies.html); [lslabs](https://lslabs.tw/en/blog/chatgpt-ads-performance-data/).
- OpenAI states it has no cross-advertiser performance benchmarks — [SEJ](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/).

### Inferences
- Positive ROAS cases are concentrated in large catalogues, scaled budgets ($60k+), and vendor-reported last-click/blended attribution; small-budget tests (<$1k) mostly report zero or near-zero conversions — partly due to tracking set-up errors, partly due to statistical noise. A small store should plan the test as a 6–12 week learning investment, not expect immediate ROAS.
- The only home-furniture result (AFA, 4.7x) is directionally encouraging for the category, but cannot be generalised (large brand, vendor-reported, mixed organic/paid attribution).

### Gaps
- No small-budget furniture/home-goods case found; no bean-bag / frameless-furniture example anywhere.
- No Ukrainian or CIS case studies with numbers (as of 9 Nov 2026).
- No LinkedIn/X/YouTube practitioner posts could be opened directly; the late-Aug LinkedIn agency complaints are known only through MediaPost.
- Lengow's "first results" post numbers could not be retrieved from snippets.
