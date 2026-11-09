# Реклама в ChatGPT для MrBean: малий тест із жорсткими стоп-правилами

**Дата:** 09.11.2026.
**Для кого:** власник MrBean (ФОП, mrbean.com.ua, безкаркасні меблі, власний цех у Києві).
**Копія в репозиторії:** `docs/OPENAI-ADS-RESEARCH-2026-11.md`. Шляхи до коду вказано від кореня репозиторію mrbean-shop.

**Позначки рівня доказів:**
- «офіційна документація» — сторінки OpenAI;
- «фахова преса» — PPC Land, Search Engine Land, Search Engine Journal тощо;
- «один рекламодавець» — досвід одного акаунта;
- «агентство» — блог агенції, яка часто продає ці послуги;
- «дослідження» — незалежна наукова робота;
- «оцінка» — висновок без прямих даних;
- «дані магазину» — цифри MrBean.

**Курс у розрахунках:** 1 € ≈ 48 грн, 1 $ ≈ 42 грн. Це приблизно, перевірити на день оплати.

---

## 1. Головне

- **MrBean уже може сам запустити рекламу в ChatGPT.** Україну додали 21.10.2026. У кабінеті Ads Manager вона позначена як доступна для самостійного запуску ([OpenAI](https://openai.com/index/chatgpt-ads-expands-26-new-countries/); [довідка OpenAI](https://help.openai.com/en/articles/20001245-ads-manager-availability), офіційна документація). Рекламу бачать лише дорослі користувачі безкоштовного плану Free і дешевого плану Go, під відповіддю ChatGPT ([довідка OpenAI](https://help.openai.com/en/articles/20001047-ads-in-chatgpt)).
- **Конкуренція зараз, найімовірніше, низька.** На 09.11 немає жодного опублікованого українського результату чи ціни кліку ([Mezha](https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/); [Inweb](https://theinweb.media/reklama-v-chatgpt-v-ukrayini/)). Ознак реклами інших продавців крісел-мішків теж не знайдено. Це оцінка з відсутності даних, а не вимір.
- **Чесна економіка жорстка.** Щоб замовлення з реклами коштувало ≤350 грн, клік має коштувати не більше **1,2 грн** при конверсії 0,35 %, **3,5 грн** при 1 % і **7 грн** при 2 %. Платні візити з ChatGPT у великому дослідженні конвертуються лише на 0,31–0,37 % ([Kaiser & Schulze](https://ecommerceresearch.org/chatgpt-ads/), дослідження). Найближчі реальні ціни кліку для інтернет-магазинів у ЄС — €0,44–0,78, тобто ≈21–37 грн ([PromptMarketing](https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/), агентство).
- **Тому вкластися в 300–350 грн — непевно.** Це можливо лише при кліку до ~7 грн і конверсії ~2 %, як в органічного трафіку з ChatGPT. Тест потрібен, щоб дешево це з'ясувати, а не щоб «відкрити новий канал».
- **Мінімальний денний бюджет — €15 або $25 на кампанію** (≈720 або ≈1 050 грн на день). Для України це не перевірено ([довідка OpenAI](https://help.openai.com/en/articles/20001413-daily-budgets)). Це в 3–4,5 раза більше, ніж Google Shopping зараз витрачає за день (≈230 грн, дані магазину). Але денний бюджет — це стеля: з низькою ставкою кампанія витратить менше.
- **Пропозиція:** одна кампанія «Кліки» з ручною стелею ставки ≈7 грн (€0,15 / $0,17), 3 групи оголошень, 14 днів, ліміт **3 500 грн** на весь тест і чіткі правила зупинки. Абсолютний максимум ризику — ≈5 000–5 600 грн плюс можливий ПДВ.
- **Без трекінгу не запускати.** Потрібні піксель OpenAI, серверні події (Conversions API), UTM-мітки й розділ на `/cookie/`. Усе це — один деплой (≈11–12 кредитів Netlify) поза вікнами перебудови цін на Чорну п'ятницю.
- **Вимкнути «Creative enhancement».** З ~30.10 OpenAI за замовчуванням може сама переписувати й **перекладати** тексти оголошень без погодження ([PPC Land](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/), фахова преса).
- **Реклами з товарного фіда для України, ймовірно, ще немає.** Формат фіда «зараз орієнтований на США» ([специфікація OpenAI](https://developers.openai.com/commerce/specs/file-upload/products)). Робимо звичайні оголошення з фото.
- **Ставки «за конверсії» — пізніше й окремою новою кампанією.** Тип ставки й подію конверсії не можна змінити після створення ([документація OpenAI](https://developers.openai.com/ads/conversion-tracking)). Один практик отримав −69 % ціни кліку на таких ставках, але занадто низька цільова ціна замовлення майже зупиняла покази ([Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons), один рекламодавець).

---

## 2. Що показало дослідження

Частину довідки OpenAI (help.openai.com) не вдалося відкрити напряму. Такі факти взято з пошукових витягів і переказів преси. Вони позначені «не перевірено».

### 2.1. Як працює платформа зараз

**Акаунт, країна, верифікація**
- Порядок такий: акаунт → кампанія → група оголошень → оголошення. Кампанія задає ціль, країну, платформи, дати й бюджет. Група задає ставку й підказки контексту ([документація OpenAI](https://developers.openai.com/ads/campaign-management)).
- Рекламодавець і платник мають бути з країни зі статусом «Available». Україна в списку є ([довідка OpenAI](https://help.openai.com/en/articles/20001245-ads-manager-availability), офіційна документація).
- Чи приймають саме ФОП як «бізнес», ніде не написано. Один сторонній тест API не зміг вибрати Україну ціллю ([Indexlab](https://www.indexlab.ai/blog/chatgpt-ads-89-countries), не підтверджено). Це суперечить довідці.
- Потрібна лише верифікація бізнесу: назва, адреса, реєстраційний чи податковий номер. Вона триває до 7 робочих днів. Якщо OpenAI не підтвердить, що сайт належить рекламодавцю, домен можуть відхилити ([довідка OpenAI](https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues), офіційна документація).
- Який документ ФОП підходить, не описано. Найімовірніше — витяг з ЄДР з Дії (оцінка).
- Окремо перевіряють бренд (потрібна іконка від 128×128 пікселів) і кожне оголошення. Строк перевірки оголошень не опубліковано ([документація OpenAI](https://developers.openai.com/ads/api-partner-setup)).
- Нові акаунти спершу можуть рекламуватися лише у своїй країні. MrBean це не заважає ([довідка OpenAI](https://help.openai.com/en/articles/20001220-frequently-asked-questions)).

**Хто бачить рекламу і де**
- Рекламу показують лише на планах Free і Go. Plus, Pro, Business і Enterprise реклами не мають ([довідка OpenAI](https://help.openai.com/en/articles/20001047-ads-in-chatgpt), офіційна документація).
- Реклами не бачать користувачі до 18 років. Її не ставлять поруч із чутливими темами: здоров'я, психічне здоров'я, політика ([довідка OpenAI](https://help.openai.com/en/articles/20001047-ads-in-chatgpt); [правила реклами OpenAI](https://openai.com/policies/ad-policies/)).
- Оголошення стоїть **під відповіддю** ChatGPT, з позначкою «Реклама». Окремих банерів чи бокової панелі немає ([довідка OpenAI](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics); [Mezha](https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/)).
- Реклама не впливає на текст відповіді. Тобто реклама не зробить так, щоб ChatGPT сам почав радити MrBean ([Adventure Media](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them)).

**Валюта, оплата, податки**
- Країну, валюту й часовий пояс **не можна змінити** після створення акаунта. Підтримка теж не змінить ([довідка OpenAI](https://help.openai.com/en/articles/20001216-billing-payment), офіційна документація).
- Гривні як валюти реклами немає в жодному джерелі. UAH є лише для підписок ChatGPT, не для реклами ([довідка OpenAI про валюти](https://help.openai.com/en/articles/10421635-multicurrency-billing); [Inweb](https://theinweb.media/reklama-v-chatgpt-v-ukrayini/), агентство).
- Мінімальний денний бюджет кампанії: $25 у доларах, €15 у євро, 65 злотих у злотих. Таблиця є лише в пошукових витягах довідки. У документації для розробників її немає, а в серпневій версії таблиці євро ще не було ([довідка OpenAI](https://help.openai.com/en/articles/20001413-daily-budgets); [PPC Land](https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/); [scall.me](https://scall.me/en/chatgpt-ads-poland-small-business/)). **Для України не перевірено.**
- Оплата — після показів (постоплата). Картку списують, коли борг досягає порогу, і в кінці місяця. Передоплати немає. Поріг — не ліміт витрат. Денний ліміт на весь акаунт мають лише акаунти з рахунками-фактурами, не з карткою ([довідка OpenAI](https://help.openai.com/en/articles/20001216-billing-payment)).
- Банк може заморозити ≈$100 при прив'язці картки ([AG.Marketing](https://ag.marketing/blog/shcho-take-reklama-chatgpt-ads/), агентство). З гривневої картки буде подвійна конвертація.
- OpenAI — платник ПДВ в Україні з 12.11.2024 ([Forbes.ua](https://forbes.ua/news/openai-bude-splachuvati-podatok-na-google-z-2025-roku-shcho-zminitsya-dlya-koristuvachiv-25112024-25044)). ФОП, що не платить ПДВ, сам ПДВ не нараховує ([Фактор](https://i.factor.ua/ukr/journals/nibu/2026/april/issue-27/article-137037.html)). Чи додасть OpenAI 20 % до рахунку за рекламу, не підтверджено.
- Ліміт НБУ на оплати за кордон бізнес-карткою ФОП — 400 000 грн ([ДТКТ](https://news.dtkt.ua/finance/bank-system/113897-novi-valiutni-limiti-nbu-z-11-serpnia-2026-r-iak-zminilosia-vikoristannia-kliuc-kartok-dlia-biznesu)). Тест у нього не впреться.

**Цілі, ставки, бюджет**
- Є три цілі: «Покази» (оплата за 1 000 показів, CPM), «Кліки» (CPC — ціна за клік) і «Конверсії». У «Конверсіях» система шукає тих, хто купить, але платите ви однаково за кліки ([документація OpenAI](https://developers.openai.com/ads/bidding-and-budgets)).
- Документація для розробників (останній запис від 26.10) знає три стратегії:
  - `fixed_bid` — фіксована ставка; для будь-якої цілі; денний або загальний бюджет;
  - `maximize_clicks` і `maximize_conversions` — автоматичні; лише денний бюджет
  ([документація OpenAI](https://developers.openai.com/ads/bidding-and-budgets)).
- Фахова преса з посиланням на лист OpenAI пише: **з 09.11** нові клікові кампанії отримують Target CPC (цільова середня ціна кліку), а конверсійні — Target CPA (цільова ціна замовлення). Max CPC і Max Bid вимкнуть 01.01.2027. Ціль — це **середнє**, а не стеля: в окремому аукціоні ставка буває вищою ([Search Engine Land](https://searchengineland.com/chatgpt-ads-bidding-options-are-changing-on-november-9th-500701); [SE Roundtable](https://seroundtable.com/openai-updates-chatgpt-ads-bidding-options-42470.html)). У документації для розробників цього ще немає — джерела розходяться.
- Автоматична стратегія «Maximize results» «не гарантує» жодної ціни кліку чи замовлення. Ручна максимальна ставка — єдина жорстка стеля ([PPC Land](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/), фахова преса з цитатою довідки).
- Ціль кампанії й подію конверсії **не можна змінити** після створення. Клікову кампанію не можна перетворити на конверсійну, лише створити нову. Для конверсій потрібна стандартна подія, не власна ([документація OpenAI](https://developers.openai.com/ads/conversion-tracking); [документація OpenAI](https://developers.openai.com/ads/conversion-optimized-campaigns)).
- OpenAI радить стартову ставку $3–5 за клік. Це орієнтир для США ([довідка OpenAI](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics); [PPC Land](https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/)). Попередження «ставка замала» — лише порада, не заборона ([документація OpenAI](https://developers.openai.com/ads/bidding-and-budgets)).
- Денний бюджет — це середнє за 7 днів. За один день можна витратити до 2× денного, за тиждень — до 7× ([довідка OpenAI](https://help.openai.com/en/articles/20001413-daily-budgets), не перевірено в первинній документації). Загальний бюджет кампанії — суворіший контроль.
- Мінімум загального бюджету в API — 1 одиниця валюти ([документація OpenAI](https://developers.openai.com/ads/api-reference/campaigns)). Чи дозволить кабінет загальний бюджет, менший за «денний мінімум × кількість днів», невідомо.

**Підказки контексту й аудиторії**
- Підказки контексту (context hints) описують розмови, де реклама доречна. Це **не ключові слова** і не гарантія показу. Їх може бути до 2 000 на групу. Мінус-слів немає. Нове збереження замінює весь список ([документація OpenAI](https://developers.openai.com/ads/campaign-targeting)).
- OpenAI радить: одна природна фраза — одна ідея; конкретне краще за загальне; різні товари й сценарії — у різні групи ([довідка OpenAI](https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads); [документація OpenAI](https://developers.openai.com/ads/campaign-targeting)).
- Як підказки працюють українською чи російською, **не задокументовано** ([PPC Land](https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/)). Українські агенції радять писати мовою покупця ([Mix Digital](https://mixdigital.agency/ua/blog/openai-ads-reklama-v-chatgpt/), агентство).
- Рекламодавець не бачить запитів, на які показалась реклама ([Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results), один рекламодавець).
- Власні аудиторії: для включення потрібно ≥25 000 збігів, для виключення мінімуму немає ([документація OpenAI](https://developers.openai.com/ads/custom-audiences)). MrBean це зараз не потрібно: база мала, а передавати контакти покупців сайт не обіцяв.

**Оголошення та «Creative enhancement»**
- Оголошення має: назву бренду, іконку, заголовок 3–50 символів, текст до 100 символів, квадратне фото (JPEG, PNG або WebP) від 640×640 і посилання до 2 048 символів, доступне для краулера OpenAI ([документація OpenAI](https://developers.openai.com/ads/campaign-management)).
- Рекомендовані 16–24 і 32–48 символів та максимум фото 1200×1200 — лише в довідці, не перевірено ([довідка OpenAI](https://help.openai.com/en/articles/20001212-creating-ads-for-chatgpt-ads)).
- Оголошення з 4–6 фото доступні лише «увімкненим» акаунтам і з фіксованою ставкою ([документація OpenAI](https://developers.openai.com/ads/campaign-management)).
- Правила: твердження мають бути правдиві, без перебільшених результатів і вигаданих відгуків. Правила діють і для сторінки, на яку веде реклама. Товари для дому — дозволена категорія ([правила реклами OpenAI](https://openai.com/policies/ad-policies/)).
- «Creative enhancement» увімкнено за замовчуванням з 29–30.10. Функція пише нові заголовки й описи, змінює розмір фото, «оптимізує» посилання і **перекладає тексти іншими мовами**. Змінені версії показуються без окремого погодження. Вимкнути: Ads Manager → Settings → «Creative enhancement». Є налаштування для акаунта й окремо для кампанії ([PPC Land](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/); [Search Engine Journal](https://www.searchenginejournal.com/chatgpt-ads-turns-on-automatic-ad-changes-by-default/595117/), фахова преса).

**Товарні фіди**
- Реклама з фіда — бета. Стандартний формат фіда «зараз орієнтований на США». Інші ринки — лише після підтвердження OpenAI ([специфікація OpenAI](https://developers.openai.com/commerce/specs/file-upload/products), офіційна документація).
- У Чехії фід-реклама не показувалась навіть із правильним фідом на 43 000 товарів ([ppcone.cz](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/), агентство). Безкоштовний каталог chatgpt.com/merchants працює лише для США ([OpenAI](https://chatgpt.com/merchants/)).

**Атрибуція і звіти**
- Атрибуція (кому зарахувати замовлення) іде за останнім дотиком. Вікно після кліку — 7, 14 або 30 днів (за замовчуванням 30). Вікно після показу — 0 або 1 день (за замовчуванням 1). Вікна змінюють лише звіти, не оптимізацію ([документація OpenAI](https://developers.openai.com/ads/reporting)).
- Документація суперечить сама собі: чи входять конверсії «після показу» в загальне число Conversions. Новіший запис від 30.09 каже, що входять ([звіти](https://developers.openai.com/ads/reporting); [піксель](https://developers.openai.com/ads/measurement-pixel)).
- У звітах є: покази, кліки, CTR (частка кліків від показів), CPC, CPM, конверсії, CPA (вартість замовлення), конверсія після кліку, продажі й ROAS (виторг на 1 гривню реклами) за подією `order_created`. Розбивка — країна, пристрій, платформа. Покази й кліки з'являються за хвилини, конверсії — щонайменше через добу ([документація OpenAI](https://developers.openai.com/ads/reporting)).
- Піксель (код у браузері) і Conversions API (події з сервера) зводяться в одну подію за Pixel ID, назвою події та `event_id`. Зараховується перша ([документація OpenAI](https://developers.openai.com/ads/conversions-api)).
- Зв'язок GA4 з Ads Manager — бета, вмикає менеджер акаунта ([довідка OpenAI](https://help.openai.com/en/articles/20001562-connect-google-analytics-4-to-openai-ads-manager)).

**Що перевірити в кабінеті при створенні (бо не підтверджено)**

| Що перевірити | Чому |
|---|---|
| Які валюти пропонують, чи є EUR, чи немає UAH | валюту не можна змінити |
| Мінімальний денний бюджет у вибраній валюті | €15 / $25 не перевірено для України |
| Чи можна вибрати Україну ціллю кампанії | сторонній тест API її не приймав |
| Чи приймають ФОП на верифікації | у документах не описано |
| Є «Max CPC» чи лише «Target CPC» | з 09.11 правила змінюються |
| Чи приймає кабінет ставку €0,15 / $0,17 | мінімальна ставка за валютою не опублікована |
| Чи можна задати загальний бюджет з фіксованою ставкою | це найкращий захист від перевитрати |
| «Creative enhancement» вимкнено | інакше тексти можуть переписати й перекласти |
| Розділ Feeds: чи можна вибрати Україну | фід-реклама, ймовірно, лише для США |
| Чи є в першому рахунку ПДВ 20 % | не підтверджено |

### 2.2. Ціни, CTR і конверсія: бенчмарки

Українських цифр ще немає. Нижче — найкращі доступні.

| Показник | Значення | Ринок і дата | Тип доказу | Джерело |
|---|---|---|---|---|
| Стартова ставка від OpenAI | $3–5 за клік (≈126–210 грн) | глобально, 2026 | офіційна довідка, орієнтир США | [довідка OpenAI](https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics) |
| Ціна кліку, інтернет-магазин | $1,72 (≈72 грн) | США, 15 днів, ~$60 тис. | один рекламодавець (продає послуги) | [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/) |
| Ціна кліку й CTR, магазини з фідом | €0,44 (≈21 грн), CTR 2,41 % | Нідерланди, Німеччина, Австрія, Франція; вересень 2026 | агентство | [PromptMarketing](https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/) |
| Ціна кліку за етапами покупки | €1,63–2,09; CTR 0,73–0,96 % | Нідерланди, серпень–жовтень 2026 | агентство, через огляд | [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/) |
| Ціна кліку | 15–30 крон (≈€0,6–1,2, оцінка) | Чехія, осінь 2026 | агентство | [ppcone.cz](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/) |
| Ціна кліку, 15 кампаній | $0,76–14,80, медіана ≈$4,41 | переважно США, 2026 | огляд практиків | [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/) |
| CTR на відповідь із рекламою | 0,60–0,75 % у США, Канаді, Британії, Австралії, Новій Зеландії; 1,21–1,91 % у Бразилії, Мексиці, Японії, Кореї | березень–вересень 2026 | панель користувачів | [Similarweb](https://aisearch.similarweb.com/blog/chatgpt-ads-ctr-by-country/); [SEJ](https://www.searchenginejournal.com/chatgpt-ad-ctr-markets-report/591384/) |
| Конверсія платних візитів | 0,37 % у США, 0,31 % у всіх країнах; у Google Search Ads — 1,17 % | 1 898 магазинів, жовтень 2026 | дослідження (робоча версія) | [Kaiser & Schulze](https://ecommerceresearch.org/chatgpt-ads/); [PPC Land](https://ppc.land/chatgpt-ad-visits-earn-shops-0-89-against-2-45-for-google-search-ads/) |
| Виторг на платний візит | $0,89 проти $2,45 у Google (−64 %) | США, те саме | дослідження | [Search Engine Land](https://searchengineland.com/chatgpt-ads-generate-less-revenue-per-visit-than-google-search-study-500160) |
| Конверсія і ROAS | 2,35 %; ROAS 1,49 | США, 15 днів | один рекламодавець (продає послуги) | [Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/) |
| Конверсія | 0,21 % проти 3,71 % у Google | 2026 | одне агентство | [StubGroup](https://stubgroup.com/blog/why-you-should-run-chatgpt-ads/) |
| Органічний проти платного трафіку з ChatGPT | 4,2 % проти 0,46 % | 2026 | один рекламодавець | [PPC One](https://ppcone.cz/en/blog/chatgpt-ads-results/) |
| Меблі | ROAS 4,7 (AFA Stores) | США, 2026 | переказ вебінару, не перевірено | [Quartile](https://www.quartile.com/blog/chatgpt-ads-key-takeaways-and-results-from-our-openai-webinar) |
| Недійсні кліки | 0,1–34 % у різних рекламодавців, ≈4 % загалом | серпень–вересень 2026 | постачальник антифроду, через фахову пресу | [PPC Land](https://ppc.land/trafficguard-finds-up-to-34-of-clicks-on-some-chatgpt-ads-were-invalid/) |
| Органічний ChatGPT в українських магазинах | конверсія ≈2 % | Україна, 2025 | агентство | [Promodo](https://www.promodo.ua/blog/skilki-trafiku-ta-konversiy-chatgpt-prinosit-ukrayinskim-onlayn-magazinam-doslidzhennya-promodo) |
| Google Search, меблі | CTR 6,11 %, конверсія 2,73 % | США, 2025 | агрегатор даних клієнтів | [WordStream](https://www.wordstream.com/blog/2025-google-ads-benchmarks) |
| Google Shopping, дім | конверсія 2,45 % | 2026 | блог | [Store Growers](https://www.storegrowers.com/shopping-ads-benchmarks/) |
| Google Ads, Україна, товари для дому | ≈3–15 грн за клік | Україна, 2026 | агентства, приблизно | [SEOquick](https://seoquick.com.ua/en/context-click-cost/); [Guild of Marketing](https://guildofmarketing.ua/en/google-ads-cost-in-2026-budgets-and-roas-by-niche/) |
| ChatGPT Ads в Україні | опублікованих цифр немає | на 09.11.2026 | преса й агенції | [Mezha](https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/); [Inweb](https://theinweb.media/reklama-v-chatgpt-v-ukrayini/) |

Як це читати:
- CTR у панелі рахують на «відповідь із рекламою». Тому його не можна порівнювати з CTR Google. OpenAI сама визнає, що бенчмарків немає ([Search Engine Journal](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/)).
- Позитивні кейси (ROAS 1,5–4,7) — від продавців послуг і з великими бюджетами. Малі тести на $200–500 часто дають нуль замовлень ([adlibrary](https://adlibrary.com/posts/we-tested-chatgpt-ads); [Out of the Box Advisors](https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth), один рекламодавець кожен).
- Найсильніший доказ — дослідження 1 898 магазинів. Воно каже: платний клік з ChatGPT приносить приблизно третину від кліку з Google.
- **Оцінка для України.** Перенесемо ціни США за співвідношенням цін Meta (≈$2 за 1 000 показів в Україні проти $16–23 у США, [AdKit](https://adkit.so/resources/how-much-do-facebook-ads-cost)) і Google. Тоді клік у ChatGPT в Україні коштував би ≈$0,15–0,70, тобто **≈6–30 грн**. Це оцінка, не дані: OpenAI може мати мінімальні ціни в аукціоні.

### 2.3. Що працює

- **Трекінг до першої гривні.** Піксель і Conversions API ставлять до запуску ([Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons), один рекламодавець). З UTM-мітками 92–96 % кліків видно в GA4 ([Graphite](https://graphite.io/five-percent/research/chatgpt-ads-tracking)). Без міток один рекламодавець бачив лише 13 % кліків, після виправлення — 68 % ([Out of the Box Advisors](https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth)).
- **Кілька вузьких груп за наміром покупця**, одна ідея на групу ([документація OpenAI](https://developers.openai.com/ads/campaign-targeting)). Дані про кількість підказок суперечать:
  - одна підказка на групу підняла ROAS на 52 % ([Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/), продає послуги);
  - в іншому акаунті підказки-«ключові слова» дали CTR 1,2 % проти 0,9 % у розмовних ([Workshop Digital](https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/), один рекламодавець, B2B).
  - Висновок: порівнювати групи, а не окремі фрази.
- **Нові тексти саме для ChatGPT.** Найактивніші рекламодавці пишуть 98 % нових текстів, а не копіюють їх з Google ([Search Engine Land про Graphite](https://searchengineland.com/reportchatgpt-ads-are-growing-fast-but-advertisers-are-still-figuring-them-out-492337)). Найчастіша формула заголовка — «Бренд: вигода», що відповідає на питання користувача ([Adthena](https://www.adthena.com/resources/blog/inside-chatgpt-ads-what-the-data-tells-us-and-whats-coming-next/), спостереження). Бренд на початку заголовка зробив клік дешевшим на ~7 % ([Workshop Digital](https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/)).
- **Конкретика замість знижки на початку.** Тексти про сценарій і характеристики працювали краще, ніж тексти, що починаються зі знижки ([ScaleWise](https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days), продає послуги, без методики).
- **Перехід на товар, а не на головну** ([Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results); [Lapis](https://www.trylapis.com/resources/chatgpt-ads-landing-page-guide), продає послуги).
- **Ставки «за конверсії», коли вже є дані.** На тих самих текстах ціна кліку впала на 69 %, а CTR зріс на 61 % ([Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons), один рекламодавець, акаунт у США, ~$33 тис.).
- **Терпіння.** Денний ROAS в одному акаунті коливався від 0,2 до 2,9 ([Opascope](https://opascope.com/insights/chatgpt-ads-benchmarks/)). Агентства радять не судити раніше ~14 днів ([Inweb](https://theinweb.media/reklama-v-chatgpt-v-ukrayini/); [Adventure Media](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them)).

### 2.4. Типові помилки

- Запуск без UTM-міток, пікселя й Conversions API ([Adventure Media](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them)).
- Підказки як список ключових слів; перехід на головну сторінку (там само).
- Ставка, з якою немає показів. У США ставка $3 дала нуль показів; покази пішли лише при ~$9–12 ([Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results)). Рівень для України невідомий.
- Занадто низька цільова CPA. У практика майже не було показів; після підняття цілі до $20 покази зросли в 523 рази ([Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons)).
- Кілька кампаній одночасно. У кожної свій денний мінімум (оцінка з правил бюджету).
- Порівнювати CTR ChatGPT з CTR Google ([Search Engine Journal](https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/)).
- Залишити «Creative enhancement» увімкненим ([PPC Land](https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/)).
- Не стежити за недійсними кліками. В одного агентства 53 кліки в кабінеті дали лише 35 сесій у GA4 ([Symphonic Digital](https://www.symphonicdigital.com/blog/chatgpt-ads-test-results)). З хостингів і проксі приходило 3,34 % кліків ChatGPT проти 0,92 % у Google ([PPC Land про TrafficGuard](https://ppc.land/trafficguard-finds-up-to-34-of-clicks-on-some-chatgpt-ads-were-invalid/)).
- Не перевіряти, де показується реклама. Понад 14 % оголошень з'являлися не на тему ([SE Ranking](https://seranking.com/blog/chatgpt-ads-study/)).
- Створити акаунт на агенцію, а не на власника ([Adventure Media](https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them)).

### 2.5. Україна й сусіди: конкуренція

- 21.10.2026 OpenAI додала 26 країн, разом їх 89. Україна серед названих. Від початку рекламу запускали понад 100 000 рекламодавців у світі ([OpenAI](https://openai.com/index/chatgpt-ads-expands-26-new-countries/)). Є українська сторінка ads.openai.com/uk-UA ([Mezha](https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/)).
- Українські агенції пишуть інструкції, але результатів немає: «локальних даних про вартість і результати кампаній ще немає» ([Inweb](https://theinweb.media/reklama-v-chatgpt-v-ukrayini/)). OpenAI не оприлюднила середню вартість для України ([Mezha](https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/)). Агенції радять окремий експериментальний бюджет, ≥14 днів і оцінку за ціною замовлення, а не кліку ([Speka](https://speka.ua/artificial-intelligence/chatgpt-ads-v-ukrayini-za-shho-platitimut-brendi-ta-yak-ocinyuvati-rezultat-p6wo1l); [Inweb](https://theinweb.media/reklama-v-chatgpt-v-ukrayini/)).
- Конкурентів у ніші не видно. Пошук не знайшов ознак реклами SanchoBAG, Rozetka, Епіцентру чи інших продавців крісел-мішків у ChatGPT. Офіційної бібліотеки оголошень немає, тож це не доказ, що їх немає (оцінка).
- Польща й Чехія відкрилися 24.08, на два місяці раніше, але публічних цифр там майже немає. У Чехії клік коштує 15–30 крон, а фід-реклама не працює ([ppcone.cz](https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/)).
- Аудиторія велика: chatgpt.com — №7 серед сайтів в Україні ([Similarweb](https://www.similarweb.com/top-websites/ukraine/)). 62 % опитаних користуються ШІ перед покупкою. Трафік з ШІ в ніші «Меблі та інтер'єр» зріс на 3 174 % з низької бази ([Elit-Web](https://elit-web.ua/ua/blog/chi-otrimueh-vasha-nisha-trafik-iz-chatgpt), агентство).
- Дані магазину: за 03–09.11 ШІ-асистенти дали MrBean 38 сесій і 2 ключові події. ChatGPT безкоштовно радить MrBean на запити «де купити / виробник», але майже не радить на запити про конкретні товари (`audits/CHATGPT-VISIBILITY-2026-11-09.md`).

### 2.6. Як використати раннє вікно

- У США дешевизна тривала недовго. Ціна 1 000 показів упала з $60 до ~$25 за ~9 тижнів, бо аукціон був порожній ([Digiday](https://digiday.com/marketing/everything-is-coming-down-chatgpt-ads-are-getting-cheaper/)). Потім кількість рекламодавців зросла з ~600 навесні до 100 000+ у жовтні ([Ben's Bites](https://news.bensbites.co/posts/62158-openai-has-surpassed-100m-in-annualized-revenue-from-chatgpt-ads-has-expanded-to-600-advertisers-and-plans-to-launch-self-serve-advertiser-access-in-april); [The Next Web](https://thenextweb.com/news/chatgpt-ads-89-countries-100000-advertisers)). Тривалого «дешевого періоду» не видно (оцінка).
- Що це означає для MrBean:
  1. Тестувати зараз, поки ніша, ймовірно, порожня і поки сезон (Чорна п'ятниця, Новий рік) не привів конкурентів.
  2. Не чекати дива: дешевий аукціон не виправить низьку конверсію.
  3. Трекінг, підказки й тексти, перевірені зараз, знадобляться й пізніше.
  4. Стежити за безкоштовним трафіком. Після запуску реклами органічні переходи з ChatGPT у магазини впали на ~6–8 % ([Kaiser & Schulze](https://ecommerceresearch.org/chatgpt-ads/)). MrBean уже отримує безкоштовний трафік з ChatGPT. Платні кліки не мають його підмінити.

---

## 3. Економіка для MrBean

**Вихідні дані**

| Параметр | Значення | Звідки |
|---|---|---|
| Середнє замовлення | ≈1 600–2 500 грн | ціни сайту: Груша M 1 595, L 2 095, XL · Гігант 2 995, Monaco 2 500, комплект чохлів від 890 грн |
| Чорна п'ятниця, 20–30.11 | −10 % на все, крім наповнювача: Груша 1 435 / 1 885 / 2 695, Monaco 2 250, чохли від 800 грн | `data/products.ts` |
| Межа CPA (вартість замовлення з реклами) | 300–350 грн | рішення власника |
| Конверсія, песимістично | 0,31–0,37 % | платні візити з ChatGPT ([Kaiser & Schulze](https://ecommerceresearch.org/chatgpt-ads/)) |
| Конверсія, оптимістично | ≈1–2 % | органічний ChatGPT в українських магазинах ≈2 % ([Promodo](https://www.promodo.ua/blog/skilki-trafiku-ta-konversiy-chatgpt-prinosit-ukrayinskim-onlayn-magazinam-doslidzhennya-promodo)); Google, меблі ≈2,7–3 % ([WordStream](https://www.wordstream.com/blog/2025-google-ads-benchmarks)) |
| Курс | 1 € ≈ 48 грн, 1 $ ≈ 42 грн | приблизно, перевірити |

**Скільки можна платити за клік.** Формула: максимальна ціна кліку = межа CPA × конверсія.

| Конверсія | Макс. CPC при CPA 350 грн | Макс. CPC при CPA 300 грн | 350-гривневий поріг у € | у $ |
|---|---|---|---|---|
| 0,35 % | 1,23 грн | 1,05 грн | €0,026 | $0,029 |
| 1 % | 3,50 грн | 3,00 грн | €0,073 | $0,083 |
| 2 % | 7,00 грн | 6,00 грн | €0,146 | $0,167 |

Для порівняння: клік у ЄС ≈21–37 грн, у США $1,72 ≈ 72 грн, стартова ставка OpenAI ≈126–210 грн, оцінка для України ≈6–30 грн.

**Яка вийде CPA, грн** (CPA = ціна кліку ÷ конверсія; жирним — у межах 350 грн):

| Ціна кліку | Конверсія 0,35 % | Конверсія 1 % | Конверсія 2 % |
|---|---|---|---|
| 3 грн | 857 | **300** | **150** |
| 5 грн | 1 429 | 500 | **250** |
| 7 грн | 2 000 | 700 | **350** |
| 10 грн | 2 857 | 1 000 | 500 |
| 20 грн | 5 714 | 2 000 | 1 000 |

**Що означає мінімальний денний бюджет** (для України не перевірено):

| | €15 на день | $25 на день |
|---|---|---|
| У гривнях на день | ≈720 грн | ≈1 050 грн |
| З можливим ПДВ 20 % (не підтверджено) | ≈864 грн | ≈1 260 грн |
| Замовлень на день, щоб CPA ≤350 грн | ≥2,1 | ≥3,0 |
| Замовлень на день, щоб CPA ≤300 грн | ≥2,4 | ≥3,5 |
| Кліків на день, щоб витратити бюджет при кліку 7 грн | ≈103 | ≈150 |
| Найбільша витрата за один день (2× денного) | ≈1 440 грн | ≈2 100 грн |
| 14 днів повністю на мінімумі | ≈10 080 грн | ≈14 700 грн |

Висновки з таблиці:
- Денний бюджет — стеля, а не обов'язкова витрата. Щоб витратити 720 грн при кліку 7 грн, потрібно ~100 кліків на день. Для вузької ніші це малоймовірно, тож реальна витрата, ймовірно, буде нижчою (оцінка).
- Якщо ж бюджет витрачається повністю, потрібні 2–3,5 замовлення щодня. Для MrBean це багато.
- EUR вигідніший за USD: нижчий мінімум і менший ризик першого дня.

**Порівняння з Google Ads**

| | Google Ads зараз (дані магазину) | ChatGPT Ads (тест) |
|---|---|---|
| Ціна замовлення | перше замовлення з Shopping — 316 грн; чохли в жовтні — 167 грн за замовлення | невідомо; беззбитковість лише при кліку ≤7 грн і конверсії ≥2 % |
| Витрата на день | Shopping ≈230 грн | мінімальна стеля ≈720–1 050 грн |
| Конверсія | є історія | платні візити конвертуються приблизно втричі гірше, ніж з Google ([Kaiser & Schulze](https://ecommerceresearch.org/chatgpt-ads/)) |

Якщо це співвідношення справджується, клік у ChatGPT має бути **приблизно втричі дешевшим** за клік у Google, щоб замовлення коштувало стільки ж (оцінка).

**Що можуть показати 3 500 грн тесту** (сценарії, оцінка):

| Сценарій | Ціна кліку | Конверсія | Кліків за 3 500 грн | Замовлень | CPA |
|---|---|---|---|---|---|
| Немає показів | — | — | 0 | 0 | — (витрат майже немає, відповідь: аукціон дорожчий) |
| Песимістичний | 7 грн | 0,35 % | ≈500 | ≈2 | ≈2 000 грн |
| Середній | 7 грн | 1 % | ≈500 | ≈5 | ≈700 грн |
| Оптимістичний | 5 грн | 2 % | ≈700 | ≈14 | ≈250 грн |

Правила зупинки з п. 4.6 обірвуть песимістичний сценарій раніше: при 0 замовлень — на ≈1 050 грн, при одному дорогому замовленні — після 7-го дня. Тож найімовірніша реальна втрата при поганому результаті — 1 000–2 000 грн.

**ROAS для контролю.** При CPA 350 грн і чеку 1 600–2 500 грн ROAS = 4,6–7,1. При CPA 300 грн — 5,3–8,3. Орієнтир: ROAS ≥5,7 при середньому чеку 2 000 грн.

**Чесний підсумок.** Опубліковані дані не підтримують CPA 300–350 грн у ChatGPT. Але українських даних немає взагалі, а аукціон у ніші, ймовірно, порожній. Тест із жорсткою стелею — дешевий спосіб дізнатися відповідь. Якщо результат поганий, це теж корисна відповідь: гроші лишаються в Google Shopping.

---

## 4. План для MrBean

### 4.1. Інструменти й трекінг

**Хто що робить**

| № | Крок | Хто | Деталі |
|---|---|---|---|
| 1 | Створити акаунт | власник | ads.openai.com (є українська сторінка), робоча пошта. Країна — Україна; валюта — EUR, якщо є, інакше USD; часовий пояс — Київ. Перед підтвердженням зробити знімок екрана: змінити потім не можна. |
| 2 | Верифікація бізнесу | власник | До ~7 робочих днів. Дані ФОП, адреса, РНОКПП, сайт mrbean.com.ua. Список документів не опубліковано; ймовірно — витяг з ЄДР з Дії (оцінка). Перевірити, що ім'я ФОП на сайті (оферта, контакти) збігається з ЄДР. |
| 3 | Картка й оплата | власник | Бажано валютна картка ФОП. Можливе блокування ≈$100. Якщо ФОП — платник ПДВ, внести податковий номер. |
| 4 | Бренд і налаштування | власник | Назва «MrBean», іконка `app/icon.png` (180×180). Settings → «Creative enhancement» → вимкнути. Якщо в налаштуваннях пікселя є «automatic advanced matching» — вимкнути. |
| 5 | Піксель і ключ | власник | У вкладці Conversions створити Pixel ID і ключ Conversions API. Pixel ID передати агенту (це не секрет). Ключ самостійно вставити в Netlify → Environment variables як `OPENAI_ADS_CAPI_KEY`. |
| 6 | Код і тести | агент | Піксель, події, серверна подія, `oppref`, `/cookie/`, тести (див. нижче). |
| 7 | Один деплой | агент | ≈11–12 кредитів Netlify; не у вікна перебудови Чорної п'ятниці. |
| 8 | Перевірка подій | агент і власник | Event Stream у кабінеті, тест `validate_only`. Контрольне замовлення — лише з дозволу власника. |
| 9 | Кампанія | власник; агент готує таблицю з налаштуваннями й текстами | Лише після «так» власника із сумою. |

Агент ніколи не вводить платіжні дані, паролі, коди підтвердження чи документи власника.

**Піксель OpenAI (агент)**
- `lib/site.ts`: константа з Pixel ID поруч із `GA_ID` і `ADS_ID`. Це не секрет. Статичний сайт не читає змінні оточення під час роботи.
- `app/layout.tsx`: окремий `<Script id="openai-pixel" strategy="afterInteractive">` після тега GA4, з тією самою умовою `location.hostname === 'mrbean.com.ua'`. Усередині — офіційний завантажувач `https://bzrcdn.openai.com/sdk/oaiq.min.js` і `oaiq("init", { pixelId })` ([документація OpenAI](https://developers.openai.com/ads/measurement-pixel)). `host-guard` лишається першим. `gtag` не чіпаємо.
- Заголовків CSP на сайті немає (`public/_headers`), тож скрипт не заблокується. Якщо CSP колись додасте, дозвольте `bzrcdn.openai.com` і `bzr.openai.com`.
- Обгортки — у `lib/ads.ts` або новому `lib/openai-ads.ts`, за зразком `trackOrderConversion`: перевірка хоста, `try/catch`, без `oaiq` нічого не ламається. Тести — у `tests/ads.mjs`.
- Перевірено в коді: `lib/product-selection.ts` при зміні тканини чи розміру прибирає з адреси лише `f, s, c, a, d, kit`. `oppref` і `utm_*` лишаються, тож піксель побачить мітку кліку.

| Подія OpenAI | Де в коді | Що передати |
|---|---|---|
| `page_viewed` | при відкритті й зміні сторінки (`usePathname`, як у `components/AttributionCapture.tsx`) | `{ type: "contents" }` |
| `contents_viewed` | `components/ProductClient.tsx`, поруч із `view_item` | ID товару з фіда (`adsItem.id`), ціна в копійках, `UAH` |
| `items_added` | `components/ProductClient.tsx`, у `addToCart()` поруч із `add_to_cart` | те саме, кількість 1 |
| `checkout_started` | `components/CheckoutClient.tsx`, поруч із `begin_checkout` | сума кошика в копійках, `contents[]` |
| `order_created` | `components/CheckoutClient.tsx`, поруч із `order_submitted` і `trackOrderConversion` | `amount` = `total` × 100, `currency: "UAH"`, `contents[]` з ID з `adsItemFields(it.key).id`, кількістю й ціною одиниці в копійках; в опціях — `event_id` |

- **Суми — у копійках.** Наприклад, 2 095 грн = `209500` ([документація OpenAI](https://developers.openai.com/ads/supported-events)). Беремо той самий `total`, що й Google: без доставки, після промокоду, з ціною розпродажу. Так цифри збігатимуться.
- **`event_id`** — окремий унікальний ID, наприклад `crypto.randomUUID()`, створений поруч з `orderNo`. Номер `MB-` + 6 останніх цифр часу повторюється приблизно кожні 16,7 хвилини. Тому для дедуплікації (зведення двох однакових подій в одну) він не годиться. Додати необов'язкове поле `eventId` у тип `SiteOrder` (`netlify/crm.ts`), передавати його в замовленні й перевіряти суворим regex у `netlify/functions/order.ts`.
- **Оплата карткою.** Зараз перехід на mono чекає лише Google (`adsSent`, до 1,2 с). Додати очікування OpenAI паралельно, наприклад `Promise.all([adsSent, openAiSent])`, де `openAiSent` — таймер до 1,2 с. У пікселя немає документованого підтвердження відправки (оцінка). Паралельне очікування не збільшує загальну паузу. Серверна подія піде раніше, тож піксель тут — резерв.

**Серверна подія через Conversions API (агент)**
- Новий файл `netlify/openai.ts` за зразком `netlify/crm.ts` і `netlify/telegram.ts`: `openaiConfigured()` (є ключ і Pixel ID) та `sendOrderEvent(...)`, що повертає true/false і ніколи не кидає помилку.
- Виклик — у `netlify/functions/order.ts`, одразу після обчислення `ok` і до відповіді. Умови: `ok`, `host === 'mrbean.com.ua'`, ключ налаштовано. Функція приймає й прев'ю (`*.netlify.app`), і localhost. Без перевірки хоста вони слали б справжні конверсії.
- Запит: `POST https://bzr.openai.com/v1/events?pid=<Pixel ID>`, заголовок `Authorization: Bearer <OPENAI_ADS_CAPI_KEY>` ([документація OpenAI](https://developers.openai.com/ads/conversions-api)). Тайм-аут 2–3 с, `try/catch`. Відповідь клієнту, `ok` і код статусу не змінюються. У лог — лише статус, без ключа й тіла запиту.
- Тіло запиту: одна подія `order_created` з полями:
  - `id` — той самий `eventId`, що й у пікселі;
  - `timestamp_ms`, `action_source: "web"`;
  - `source_url: "https://mrbean.com.ua/checkout/"` — без параметрів;
  - `oppref`;
  - `user: { ip_address, user_agent }`;
  - `data: { type: "contents", amount, currency: "UAH", contents[] }`.
  - Події мають бути не старші 7 днів ([документація OpenAI](https://developers.openai.com/ads/conversions-api)).
- **`oppref`** (мітка кліку з реклами) сервер сам не бачить ([документація OpenAI](https://developers.openai.com/ads/conversions-api)). Брати її з cookie `__oppref` у заголовку запиту: піксель ставить цю cookie на 30 днів, а запит до `/order` іде з того самого домену. Запасний варіант — `order.marketing.oppref`. Передавати без змін і не логувати.
- IP і тип браузера (user agent) брати із заголовків запиту. Назву заголовка з IP на Netlify перевірити в документації Netlify.
- **Спершу `validate_only: true`.** Такий запит перевіряє подію, але не зберігає її ([документація OpenAI](https://developers.openai.com/ads/conversion-tracking)). Зробити змінну, наприклад `OPENAI_ADS_VALIDATE_ONLY=true`, на перший час. Перші 1–2 звичайні замовлення покажуть у логах, чи відповідь 2xx. Потім змінну вимкнути. Зміни змінних Netlify діють з наступного деплою (`DEPLOY.md`), тож вимикати її варто разом із наступним плановим деплоєм.
- **Конверсія = «замовлення прийняте», а не оплата.** За замовчуванням покупці платять при отриманні. Google рахує так само (коментар до `ADS_ORDER` у `lib/site.ts`).
- **Тести.** Додати мок `'../openai'` у `tests/notifications.mjs`. Інакше тест падає з «Unexpected dependency», і CI блокує деплой. Додати тести для `netlify/openai.ts` з підмінним `fetch`: успіх, помилка, тайм-аут, немає ключа, хост прев'ю. `DEPLOY.md` вимагає моків для змін у Functions.

**Хешовані e-mail і телефон — не в першій версії**
- Advanced matching (передача хешованих контактів для кращого зіставлення) технічно доступна ([документація OpenAI](https://developers.openai.com/ads/measurement-pixel)).
- Але `/cookie/` зараз обіцяє: «Ім'я, телефон, адресу та e-mail із форми замовлення ми Google не передаємо». А пункт 9.3 оферти каже, що дані йдуть лише перевізнику.
- Вмикати це — рішення власника. Оферту побічно не змінюємо.
- Окремий ризик: з 17.08 «автоматичне розширене зіставлення» стало типовим для наявних пікселів ([PPC Land](https://ppc.land/chatgpt-advertisers-face-10-days-to-opt-out-of-automatic-advanced-matching/), фахова преса). Воно саме шукає контакти на сторінці. Де його вимкнути, документація не каже. **Перевірити в кабінеті й вимкнути.**

**Мітка кліку `oppref` в атрибуції сайту (агент)**
- `lib/attribution.ts`: додати `'oppref'` у `CLICK_KEYS`. Тоді мітка піде в `order.marketing`, коментар CRM і резервний лист.
- **Перевірити формат.** Поточний regex `^[a-zA-Z0-9_-]{1,256}$` мовчки відкидає інші символи. Сторонні джерела показують мітки на кшталт `gAAAAA…`. Такі токени можуть містити `=` і бути довшими (оцінка). Після першого справжнього кліку перевірити, що рядок `oppref=` є в CRM. Якщо його немає, розширити regex.
- `scripts/crm_ads_export.py`: додати `oppref` у його regex. Парсер зупиняється на першому незнайомому рядку. Без цього замовлення з Google може втратити `captured_at` і не імпортуватися.
- Розширити тести, зокрема `tests/attribution.mjs`.

**Сторінка `/cookie/` (агент)**
- `app/cookie/page.tsx`: пункт про піксель OpenAI в блоці «Що працює на сайті».
- Нова картка «Що отримує OpenAI»:
  - cookie `__oppref` (мітка кліку з реклами, 30 днів) і `__obref` (випадковий ID браузера, 365 днів) ([документація OpenAI](https://developers.openai.com/ads/measurement-pixel));
  - переглянуті сторінки й коди товарів, номер і сума замовлення;
  - серверна подія про прийняте замовлення на `bzr.openai.com` з IP-адресою й типом браузера;
  - передача даних у США;
  - ім'я, телефон, адресу й e-mail OpenAI не передаємо.
- «Як відмовитися»: видалити або заблокувати cookie в браузері. Пізніше можна додати кнопку з `oaiq("consent", false)`: піксель запам'ятовує відмову й видаляє свої cookie ([документація OpenAI](https://developers.openai.com/ads/measurement-pixel)).
- Оновити заголовок, опис, вступ і дату `UPDATED`. Оферту не змінювати. Так само зробили з ремаркетингом Google 03.11.

**UTM-мітки й GA4**
- Шаблон параметрів на рівні кампанії: `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={ad_id}`. Макроси `{campaign_id}` і `{ad_id}` — з офіційної документації ([документація OpenAI](https://developers.openai.com/ads/campaign-management)). `oppref` OpenAI додає сама.
- Код міняти не треба. Сайт уже передає `utm_*` у CRM і Telegram (`lib/attribution.ts`, `netlify/crm.ts`, `netlify/order-message.ts`).
- У GA4 створити власну групу каналів або сегмент «ChatGPT Ads»: джерело `chatgpt_ads` **або** джерело містить `chatgpt` і канал `cpc`. Дослідники бачили платний ChatGPT як `chatgpt.com / cpc` ([PPC Land](https://ppc.land/chatgpt-ad-visits-earn-shops-0-89-against-2-45-for-google-search-ads/)). Органічні переходи лишаються `chatgpt.com`. Частина з них з 09.10, можливо, потрапляє в Direct ([Delante](https://delante.co/chatgpt-changes-cause-drop-in-ai-traffic-recorded-by-ga4/), одне джерело).
- `utm_campaign` буде числом. Відповідність «ID → назва» записувати у звіти `audits/`.
- Інтеграція GA4 з Ads Manager (бета через менеджера) зараз не потрібна.

**Товарний фід — не зараз**
- Фід OpenAI не будуємо: формат поки для США. Основа — `scripts/build-merchant-feed.mjs` (формат Google).
- Колись знадобиться CSV (UTF-8) з полями `item_id, title, description, url, brand, seller_name, image_url, availability, price, is_ads_eligible` ([специфікація OpenAI](https://developers.openai.com/commerce/specs/file-upload/products)). ID — ті самі, що в Google-фіді. Посилання — з власними UTM.
- Що варто виправити у фіді вже зараз:
  - `availability` всюди жорстко `in_stock`, хоча більшість виробів шиють під замовлення 2–3 дні;
  - у 97 чохлів немає `google_product_category`;
  - немає кольорів і custom labels;
  - фото чохлів не квадратні (1200×1046).
- Власник: заявка в список очікування chatgpt.com/merchants і питання до підтримки OpenAI про фід для України.

**Деплой**
- Один деплой на все: піксель, серверна подія, `oppref`, `/cookie/`, тести. Це ≈11–12 кредитів Netlify.
- Не пушити в `main` 19.11 і 30.11 з 21:30 до 23:30 UTC. О 22:03 і 23:03 UTC ідуть планові перебудови цін, а `cancel-in-progress` їх скасує.

**Як перевірити трекінг після деплою (агент)**
1. Відкрити сторінку товару на mrbean.com.ua. У DevTools → Network мають піти запити на `bzr.openai.com` ([документація OpenAI](https://developers.openai.com/ads/image-tag)).
2. У кабінеті (вкладка Conversions) події з браузера позначені `pixel_sdk`, із сервера — `server_to_server`. Там видно вибірку подій приблизно за останні 15 хвилин ([документація OpenAI](https://developers.openai.com/ads/conversion-tracking)).
3. Режим `debug` пікселя пише події в консоль, але не прибирає тестові події зі звітів. Вмикати його лише ненадовго ([довідка OpenAI](https://help.openai.com/en/articles/20001604-troubleshooting-conversion-tracking-for-chatgpt-ads)).
4. Серверну подію спершу перевірити з `validate_only: true`: у логах Netlify має бути статус 2xx.
5. Після першого справжнього замовлення: у звіті одне `order_created`, а не два. Тобто дедуплікація за `event_id` працює.
6. Ключ API ніде не видно в коді сторінки й у логах.

### 4.2. Структура кампанії

- **Одна кампанія:** «MrBean UA — тест кліки». У кожної кампанії свій денний мінімум, тож друга кампанія подвоїть витрати.
- **Ціль:** Кліки. **Країна:** Україна. **Платформи:** усі (iOS, Android, веб). **Дати:** фіксовані початок і кінець.
- **Бюджет:** якщо кабінет дозволяє загальний бюджет з фіксованою ставкою — 3 500 грн у валюті акаунта (≈€73 / ≈$83). Якщо ні — денний мінімум (€15 / $25), кінцева дата й ручна зупинка за правилами з п. 4.6. Пам'ятати: за окремий день витрата може сягнути 2× денного бюджету.
- **Ставка:** ручна «Max bid / Max CPC», тобто жорстка стеля, — €0,15 або $0,17 (≈7 грн, беззбитковість при конверсії 2 %). Вона діє до 01.01.2027, тож на тест вистачить.
  - Якщо для нової кампанії кабінет пропонує лише Target CPC — поставити ту саму суму й щодня дивитися фактичну середню ціну кліку. Ціль — це середнє, не стеля.
  - Автоматичну стратегію («Maximize results» / «intelligent bidding») не брати: вона не контролює ціну.
- **Подія:** прикріпити `order_created` до кампанії лише для звітів. Клікові кампанії це дозволяють ([документація OpenAI](https://developers.openai.com/ads/conversion-tracking)).
- **Вікна у звітах:** 7 днів після кліку і 0 днів після показу. Так цифри ближчі до CRM (оцінка).
- **Чому кліки, а не конверсії:**
  - у пікселі ще немає жодного замовлення з ChatGPT;
  - конверсійну кампанію не можна потім змінити;
  - наша цільова CPA ≈€7,3 / ≈$8,3 нижча за $20, з якими в практика пішли покази ([Karel Huk](https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons)). Ризик нуля показів високий.
- **Пізніше:** після ~10–15 замовлень з ChatGPT у пікселі (оцінка; офіційного порогу немає) — **нова** кампанія «Конверсії» на `order_created` з цільовою CPA ≈350 грн. Клікову кампанію тоді зупинити, щоб не платити два мінімуми. Оплату за покази для конверсій (oCPM) радить вебінар OpenAI ([вебінар OpenAI](https://webinar.openai.com/on-demand/067e119c-9315-4087-8006-8f4dfb236b65)), але в документації для розробників її немає. Перевірити в кабінеті.

**Налаштування кампанії поле за полем** (для власника; назви полів у кабінеті можуть трохи відрізнятися)

| Поле | Значення |
|---|---|
| Назва кампанії | MrBean UA — тест кліки |
| Ціль | Clicks (кліки) |
| Країна | Україна |
| Платформи | усі: iOS, Android, Web |
| Початок і кінець | за рішенням власника (розділ 5); кінець обов'язковий |
| Бюджет | загальний 3 500 грн у валюті акаунта, якщо можна; інакше денний мінімум |
| Стратегія ставки | Manual: Max bid / Max CPC; якщо немає — Target CPC |
| Ставка | €0,15 або $0,17 |
| Подія для звітів | `order_created` |
| Вікна атрибуції у звітах | 7 днів після кліку, 0 днів після показу |
| Параметри посилання | `utm_source=chatgpt_ads&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={ad_id}` |
| Creative enhancement | вимкнено (і для акаунта, і для кампанії) |
| Групи оголошень | 1, 2, 3 зі старту; 4 — резерв |

**Групи оголошень**

| Група | Намір покупця | Посадкові сторінки | Коли |
|---|---|---|---|
| 1. Велика груша для дорослих і «для двох» | купити велике крісло | `/product/grusha/?f=oxford&s=xl`, `/product/grusha/?f=oxford&s=l`, `/product/kreslo-monaco/?f=oxford` | зі старту |
| 2. Подарунок на Новий рік, дитині, підлітку | обрати подарунок | `/product/grusha/?f=oxford&s=m`, `/product/grusha/?f=oxford&s=l`, `/product/kreslo-monaco/?f=oxford` | зі старту |
| 3. Заміна чохла | оновити старе крісло | `/chokhly/grusha/?f=oxford&s=m` | зі старту |
| 4. Київ (резерв) | купити в Києві | `/krisla-mishky-kyiv/`, `/product/grusha/?f=oxford&s=l` | якщо в групах 1–3 мало показів |

- **Чому група 1 головна.** Аудит показав: на запити «де купити / виробник» ChatGPT уже безкоштовно радить MrBean. На запити про конкретні товари — майже ні (`audits/CHATGPT-VISIBILITY-2026-11-09.md`). Тут реклама додає найбільше.
- **Посилання** — завжди з кінцевою скісною рискою (`/`), щоб не було зайвого переадресування. Колір на фото має збігатися з кольором, який сторінка показує за замовчуванням. Інакше додати в посилання `&c=<номер кольору>`.
- **Група 3 — ризикова.** Підказки про заміну чохла приведуть і власників крісел інших брендів. Тексти не обіцяють сумісності, а сторінка чохлів має форму запиту (`CoverRequestForm`). Тест покаже, чи це працює.
- Сторінки `/catalog/podarunky/` і `/catalog/dlya-dytyny/` залишимо для пізнішого тесту. Практики радять вести на товар, а на сторінках каталогу немає рядків про доставку й гарантію.
- **Мова:** тексти лише українською. Чи додавати російськомовні підказки для російськомовних розмов з України, вирішує власник (розділ 5).

### 4.3. Підказки контексту

Правила: природні фрази, одна ситуація покупця, одна тема на групу. По 10 у групі. Дані про кількість суперечать (1 проти 5–15), тому порівнюємо групи, а не окремі фрази. Не писати підказок про візит у цех: цех закритий для відвідувачів.

**Група 1. Велика груша для дорослих і для двох**
1. Шукаю велике крісло-мішок для дорослої людини, щоб лежати перед телевізором
2. Яке безкаркасне крісло обрати у вітальню, щоб на ньому могли сидіти двоє
3. Порадь велике крісло-грушу для високої людини
4. Хочу купити крісло-мішок розміру XL, щоб відпочивати після роботи
5. Велике м'яке крісло для читання й перегляду фільмів у квартирі
6. Чим відрізняється крісло-груша L від XL і який розмір обрати дорослому
7. Де купити велике крісло-мішок в Україні з доставкою Новою поштою
8. Зручне крісло-мішок, щоб вечорами грати в приставку
9. Хочу замінити старе крісло в кімнаті на велике безкаркасне
10. Яке крісло-мішок купити дорослому до 3 000 гривень

**Група 2. Подарунок**
1. Що подарувати підлітку на Новий рік, щоб це знадобилося в кімнаті
2. Ідея подарунка дитині до свят: щось для дому, а не іграшка
3. Чи гарна ідея подарувати крісло-мішок на день народження
4. Що подарувати студенту в гуртожиток чи першу квартиру
5. Подарунок на новосілля до 2 000 гривень
6. Шукаю незвичайний подарунок для дому до Нового року
7. Подарунок для геймера, з яким зручно грати
8. Корисний подарунок батькам, щоб відпочивати ввечері
9. Що подарувати дружині, яка любить читати вдома
10. Подарунок для всієї родини, яким користуватимуться щодня

**Група 3. Заміна чохла**
1. Порвався чохол на кріслі-мішку, де купити новий
2. Чи можна купити окремо чохол для крісла-груші без наповнювача
3. Крісло-мішок вицвіло, хочу оновити тканину
4. Де замовити запасний зовнішній чохол для безкаркасного крісла
5. Як оновити старе крісло-грушу, не купуючи нове
6. Хочу чохол на крісло-мішок іншого кольору під новий інтер'єр
7. Скільки коштує новий чохол для крісла-груші
8. Кіт подряпав крісло-мішок, хочу поміняти чохол
9. Потрібен міцний чохол з оксфорду для крісла-груші
10. Знімний чохол для крісла-мішка, який можна зняти й почистити

**Група 4. Київ (резерв)**
1. Де купити крісло-мішок у Києві у виробника
2. Київський виробник крісел-мішків з власним цехом
3. Крісло-груша з доставкою по Києву
4. Хочу крісло-мішок у Києві, щоб пошили швидко
5. Магазин безкаркасних меблів у Києві
6. Крісло-мішок у Київській області із самовивозом
7. Крісло-груша на подарунок з доставкою по Києву
8. Велике безкаркасне крісло для квартири в Києві
9. Де в Києві замовити крісло-мішок потрібного кольору
10. Крісло-мішок у Києві, яке можна забрати в день замовлення

### 4.4. Тексти оголошень

Правила для всіх текстів:
- Лише українською і лише перевірені факти: власний цех у Києві з 2017 року; пошиття 2–3 робочі дні; частина виробів з оксфорду є в наявності й відправляється в день замовлення; Нова пошта 1–3 дні після відправлення; гарантія 24 місяці на шви й фурнітуру; ціни нижче.
- Без відгуків, рейтингів, цін доставки, сумісності з іншими брендами, слів на кшталт «найкращий».
- Тексти з «−10%» — лише в кампанії, що закінчується 30.11 о 23:59 за київським часом акаунта.
- «6 тканин і понад 140 кольорів» є в описі сайту (`app/layout.tsx`), але не в брифі. Варіант 2.2 — лише після «так» власника.
- «Creative enhancement» вимкнено, щоб OpenAI не переписала й не переклала тексти.
- Ліміти: заголовок ≤50 символів, текст ≤100. Символи рахуються з пробілами. Заголовки довші за рекомендовані 16–24 символи (не перевірено) свідомо, щоб вмістити розмір і ціну. Якщо кабінет їх обрізає, скоротити.

**Група 1. Велика груша для дорослих**

| № | Заголовок | Симв. | Текст | Симв. | Посилання |
|---|---|---|---|---|---|
| 1.1 | Груша XL · Гігант 150 × 110 см — MrBean | 39 | 2 995 грн. Шиємо у власному цеху в Києві з 2017 року за 2–3 робочі дні. | 71 | `/product/grusha/?f=oxford&s=xl` |
| 1.2 | MrBean: груша L 135 × 90 см за 2 095 грн | 40 | Пошиття 2–3 робочі дні. Нова пошта 1–3 дні після відправлення. | 62 | `/product/grusha/?f=oxford&s=l` |
| 1.3 | Крісло Monaco від MrBean — 2 500 грн | 36 | Власний цех у Києві з 2017 року. Гарантія 24 місяці на шви й фурнітуру. | 71 | `/product/kreslo-monaco/?f=oxford` |
| 1.1-ЧП | Груша XL · Гігант: −10% до 30.11 | 32 | 2 695 грн замість 2 995. Шиємо 2–3 робочі дні у власному цеху в Києві. | 70 | `/product/grusha/?f=oxford&s=xl` |
| 1.2-ЧП | MrBean: груша L за 1 885 грн до 30.11 | 37 | Чорна п'ятниця: −10%. Гарантія 24 місяці на шви й фурнітуру. | 60 | `/product/grusha/?f=oxford&s=l` |
| 1.3-ЧП | Крісло Monaco за 2 250 грн до 30.11 | 35 | −10% до 30 листопада. Власний цех у Києві з 2017 року. | 54 | `/product/kreslo-monaco/?f=oxford` |

**Група 2. Подарунок**

| № | Заголовок | Симв. | Текст | Симв. | Посилання |
|---|---|---|---|---|---|
| 2.1 | Подарунок: груша M 115 × 75 см | 30 | 1 595 грн. Шиємо 2–3 робочі дні у власному цеху в Києві. | 56 | `/product/grusha/?f=oxford&s=m` |
| 2.2 | MrBean: крісло-мішок як подарунок | 33 | 6 тканин і понад 140 кольорів. Пошиття 2–3 робочі дні, гарантія 24 місяці. | 74 | `/product/grusha/?f=oxford&s=m` |
| 2.3 | Крісло Monaco на подарунок — 2 500 грн | 38 | Нова пошта 1–3 дні після відправлення. Гарантія 24 місяці на шви й фурнітуру. | 77 | `/product/kreslo-monaco/?f=oxford` |
| 2.1-ЧП | Груша M за 1 435 грн до 30.11 | 29 | −10% на все, крім наповнювача. Власний цех у Києві з 2017 року. | 63 | `/product/grusha/?f=oxford&s=m` |
| 2.2-ЧП | Крісло-мішок на подарунок: −10% до 30.11 | 40 | Груша L — 1 885 грн, Monaco — 2 250 грн. Шиємо 2–3 робочі дні. | 62 | `/product/grusha/?f=oxford&s=l` |

**Група 3. Заміна чохла**

| № | Заголовок | Симв. | Текст | Симв. | Посилання |
|---|---|---|---|---|---|
| 3.1 | Новий чохол для груші — від 890 грн | 35 | Комплект чохлів для груш MrBean M і L. Шиємо 2–3 робочі дні у цеху в Києві. | 75 | `/chokhly/grusha/?f=oxford&s=m` |
| 3.2 | MrBean: комплект чохлів від 890 грн | 35 | Гарантія 24 місяці на шви й фурнітуру. Нова пошта 1–3 дні після відправлення. | 77 | `/chokhly/grusha/?f=oxford&s=m` |
| 3.1-ЧП | Чохли для груші від 800 грн до 30.11 | 36 | Чорна п'ятниця: −10%. Шиємо 2–3 робочі дні, гарантія 24 місяці. | 63 | `/chokhly/grusha/?f=oxford&s=m` |

**Група 4. Київ (резерв)**

| № | Заголовок | Симв. | Текст | Симв. | Посилання |
|---|---|---|---|---|---|
| 4.1 | Крісло-мішок у Києві від виробника | 34 | Частина виробів з оксфорду є в наявності: їх відправляємо в день замовлення. | 76 | `/krisla-mishky-kyiv/` |
| 4.2 | MrBean: власний цех у Києві з 2017 | 34 | Груша L 135 × 90 см — 2 095 грн. Шиємо 2–3 робочі дні, гарантія 24 місяці. | 74 | `/product/grusha/?f=oxford&s=l` |

Під час Чорної п'ятниці група 4 може використати текст 1.2-ЧП.

### 4.5. Зображення

- **Квадратні справжні фото з сайту, 1200×1200** (розміри перевірено у файлах):
  - `public/assets/catalog/grusha-oxford-1-1200.jpg` і `grusha-oxford-2-1200.jpg` — груша на світлому тлі;
  - `public/assets/catalog/monaco-1-1200.jpg` — крісло Monaco.
- **Інтер'єр** — обрізати до квадрата 1200×1200: `public/assets/lifestyle-pear-1200.jpg` (1200×1600), `public/assets/hero-composition-1200.jpg` (1200×800).
- **Чохли:** `public/assets/covers/grusha-kit-c000-unfolded-1200.jpg` (1200×1046) — обрізати до квадрата або додати світлі поля.
- **Іконка бренду:** `app/icon.png` (180×180; мінімум — 128×128).
- **Тест у групі 1:** той самий текст з фото на світлому тлі й з інтер'єрним фото. Даних для інтернет-магазинів немає. В одному B2B-тесті різниця CTR була мала: 1,2 % проти 1,1 % ([Workshop Digital](https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/)). Агентство переказує пораду OpenAI показувати товар у використанні ([AirOps](https://www.airops.com/blog/chatgpt-ads-best-practices)).
- **Без написів, цін і знижок на фото.** Ціна на фото застаріє після 30.11 і може не пройти перевірку на правдивість.
- Колір на фото = колір на сторінці за посиланням.
- Оголошення з 4–6 фото — лише якщо кабінет їх пропонує. У першому тесті вони не потрібні.

### 4.6. Тестовий бюджет і правила зупинки

**Тест:** 14 днів, одна кампанія, ставка ≈7 грн, стеля **3 500 грн** (≈€73 / ≈$83). Це ціна 10 замовлень по 350 грн. При кліку 7 грн це до ~500 кліків. Цього досить, щоб побачити, чи конверсія ближча до 0,35 % чи до 2 %.

| Умова | Дія |
|---|---|
| 48 год без показів при ставці €0,15 / $0,17 | Перевірити статус верифікації й модерації. Один раз підняти ставку до €0,20 / $0,24 (≈10 грн). |
| Ще 48 год без показів | Зупинити: аукціон дорожчий, ніж дозволяє наша економіка. |
| Кабінет не приймає ставку €0,15 / $0,17 | Не запускати без окремого «так» власника: беззбитковий клік тут неможливий. |
| Витрачено ≈1 050 грн (3 × 350), замовлень 0 у CRM і в кабінеті | Зупинити. |
| Після 7-го дня CPA > 700 грн | Зупинити. |
| CTR < 0,3 % після 1 000+ показів у групі | Один раз змінити підказки й тексти групи. Ставку не чіпати. |
| Середня ціна кліку > 10 грн три дні поспіль | Повернути ставку до 7 грн або зупинити. |
| Кліків у кабінеті на 30 %+ більше, ніж сесій `chatgpt_ads` у GA4; сплески кліків уночі; сесії по 0 секунд | Пауза. Звернутися в підтримку через кабінет щодо недійсних кліків. |
| Витрачено 3 500 грн | Кінець тесту, звіт і рішення. |
| CPA ≤350 грн і ≥5 замовлень у CRM | Продовжити ще на 14 днів з такою ж стелею. Готувати конверсійну кампанію. |
| CPA 350–500 грн і знижується | +7 днів і +1 750 грн — лише після «так» власника. |

**Скільки ризикує власник:**
- За планом — **3 500 грн**.
- Якщо загального бюджету в кабінеті немає, контроль ручний. Тоді в найгіршому разі перевищення — один день подвійної витрати: **до ≈5 000 грн** в EUR-акаунті (3 500 + 1 440) або **до ≈5 600 грн** в USD-акаунті (3 500 + 2 100).
- Плюс можливий ПДВ 20 % (не підтверджено), курсова різниця й тимчасове блокування ≈$100 на картці.

### 4.7. KPI

| Показник | Ціль | Тривога | Як рахувати |
|---|---|---|---|
| CPA (витрати ÷ замовлення) | ≤300 грн (ціль), ≤350 грн (межа) | >700 грн після 7 днів | Витрати — з кабінету в гривнях за курсом списання. Замовлення — CRM з `utm_source=chatgpt_ads`. |
| Макс. ціна кліку | ≤7 грн | >10 грн три дні | кабінет |
| CTR | орієнтир 0,6–1,9 % (панель, неточне порівняння) | <0,3 % | кабінет |
| Конверсія кліку в замовлення | ≥2 % | <1 % після 300 кліків | замовлення в CRM ÷ кліки з кабінету |
| ROAS (виторг ÷ витрати) | ≥5,7 при чеку 2 000 грн | <3 | «Order Created ROAS» у кабінеті та CRM. Як кабінет перераховує гривні у валюту акаунта, не задокументовано. |
| Частка замовлень з кабінету, видимих у CRM з `utm_source=chatgpt_ads` | ≥80 % | <60 % — шукати проблему з мітками | щотижня |
| Кліки проти сесій GA4 | різниця ≤30 % | >30 % | кабінет проти GA4 |

Як рахувати:
- **Кабінет OpenAI** показує більше замовлень: cookie живе 30 днів, і можуть додаватися конверсії після показу. Для порівнянь — вікно 7 днів після кліку і 0 після показу.
- **GA4** — сесії з `chatgpt_ads / cpc` і ключова подія `order_submitted`.
- **CRM** — головне джерело правди про замовлення: прийняті замовлення з `utm_source=chatgpt_ads` у коментарі. Воно трохи занижує: мітки живуть у межах однієї вкладки браузера.
- Раз на місяць — перевірити, скільки з цих замовлень справді отримані й оплачені: накладений платіж можуть не забрати.

### 4.8. Графік перевірок

| Коли | Що перевірити |
|---|---|
| До старту | Event Stream у кабінеті: `page_viewed`, `contents_viewed`, `items_added`, `checkout_started`, `order_created`. Подія з браузера й сервера зводиться в одну. `validate_only` відповідає 2xx. |
| Перший клік | У CRM з'явився рядок `oppref=`. |
| Дні 1–3, щодня | Покази, витрати, ціна кліку, статус модерації, події пікселя й сервера, кліки проти сесій GA4. |
| Далі двічі на тиждень (пн і чт) | Таблиця KPI і правила зупинки. |
| Після кожної перевірки | Звіт у `audits/OPENAI-ADS-YYYY-MM-DD.md` (такі файли не запускають деплой). |
| 01.12 | Повторний тест видимості MrBean у ChatGPT (як `audits/CHATGPT-VISIBILITY-2026-11-09.md`). Ручна перевірка в безкоштовному акаунті, українською й російською: чи видно нашу рекламу й рекламу конкурентів. |
| День 14 | Підсумок і рішення: зупинити, продовжити чи готувати конверсійну кампанію. |

---

## 5. Рішення для власника

1. **Валюта акаунта.** EUR, якщо кабінет запропонує: мінімум €15 на день ≈720 грн проти $25 ≈1 050 грн. Інакше — USD. Гривні для реклами, схоже, немає. Змінити валюту потім не можна, лише відкрити новий акаунт. Часовий пояс — Київ. Мінімум у вибраній валюті перевірити при створенні.
2. **Бюджет тесту.** 3 500 грн (≈€73 / ≈$83) на 14 днів. Денний бюджет — мінімальний (€15 / $25), ставка ≈7 грн. Абсолютний максимум — ≈5 000–5 600 грн плюс можливий ПДВ.
3. **Дата старту.** Лише після трьох речей: деплой трекінгу, верифікація бізнесу, перевірені оголошення.
   - **Варіант А — 20.11, з текстами Чорної п'ятниці.** Кампанія закінчується 30.11 о 23:59. Підходить, якщо все готово до 18.11 включно. Плюси: знижка підвищує шанс на замовлення, і ми побачимо найкращий сценарій. Мінуси: результат завищений; конкуренція в сезон може зрости; мало часу на налагодження. Після 30.11 — нова кампанія зі звичайними текстами на решту днів тесту, якщо правила зупинки не спрацювали.
   - **Варіант Б — 01.12–14.12, зі звичайними цінами й подарунковими текстами.**
   - Не стартувати до 20.11 зі звичайними цінами на 1–2 дні: опівночі 20.11 ціни на сайті зміняться.
   - **Порада:** варіант А, якщо все готово до 18.11. Інакше — варіант Б.
4. **Дрібніші рішення:**
   - Хешовані e-mail і телефон — порада: **ні**, поки що. Для цього треба міняти `/cookie/` та оферту.
   - Російськомовні підказки — порада: почати лише з українських. Якщо за 48 год мало показів, додати 3–5 російських підказок у групу 1. Тексти лишаються українськими.
   - «Creative enhancement» — **вимкнути**.
   - «Automatic advanced matching» пікселя — вимкнути, якщо є перемикач.
   - «6 тканин і понад 140 кольорів» в оголошенні 2.2 — так чи ні.

---

## 6. Межі

- Google Ads не чіпаємо: кампанії, бюджети, ставки й конверсії лишаються як є.
- Власник сам створює акаунт, проходить верифікацію, надає документи, прив'язує картку й платить. Агент не вводить платіжні дані, паролі, коди підтвердження чи документи.
- Кампанії й бюджети — лише після явного «так» власника із сумою.
- Секрети — лише в змінних оточення Netlify. Не в коді, чаті, листах чи логах.
- Оферту не змінюємо. Змінюємо лише `/cookie/`.
- Один деплой на весь трекінг, поза вікнами перебудови Чорної п'ятниці.

---

## 7. Джерела

**Офіційна документація OpenAI**
- https://openai.com/index/chatgpt-ads-expands-26-new-countries/
- https://help.openai.com/en/articles/20001245-ads-manager-availability
- https://help.openai.com/en/articles/20001047-ads-in-chatgpt
- https://help.openai.com/en/articles/20001534-troubleshooting-common-onboarding-and-policy-issues
- https://help.openai.com/en/articles/20001216-billing-payment
- https://help.openai.com/en/articles/10421635-multicurrency-billing
- https://help.openai.com/en/articles/20001413-daily-budgets
- https://help.openai.com/en/articles/20001220-frequently-asked-questions
- https://help.openai.com/en/articles/20001207-ads-in-chatgpt-the-basics
- https://help.openai.com/en/articles/20001521-writing-context-hints-for-chatgpt-ads
- https://help.openai.com/en/articles/20001212-creating-ads-for-chatgpt-ads
- https://help.openai.com/en/articles/20001562-connect-google-analytics-4-to-openai-ads-manager
- https://developers.openai.com/ads/campaign-management
- https://developers.openai.com/ads/api-partner-setup
- https://developers.openai.com/ads/bidding-and-budgets
- https://developers.openai.com/ads/api-reference/campaigns
- https://developers.openai.com/ads/conversion-tracking
- https://developers.openai.com/ads/conversion-optimized-campaigns
- https://developers.openai.com/ads/campaign-targeting
- https://developers.openai.com/ads/custom-audiences
- https://developers.openai.com/ads/reporting
- https://developers.openai.com/ads/measurement-pixel
- https://developers.openai.com/ads/conversions-api
- https://developers.openai.com/ads/supported-events
- https://developers.openai.com/ads/image-tag
- https://help.openai.com/en/articles/20001604-troubleshooting-conversion-tracking-for-chatgpt-ads
- https://developers.openai.com/commerce/specs/file-upload/products
- https://chatgpt.com/merchants/
- https://openai.com/policies/ad-policies/
- https://webinar.openai.com/on-demand/067e119c-9315-4087-8006-8f4dfb236b65

**Фахова преса**
- https://ppc.land/advertisers-in-26-more-countries-gain-chatgpt-ads-bringing-the-total-to-89/
- https://ppc.land/openai-to-rewrite-chatgpt-ads-by-default-as-advertisers-get-days-to-opt-out/
- https://ppc.land/chatgpt-ads-makes-automated-bidding-the-default-in-new-ad-groups/
- https://ppc.land/chatgpt-advertisers-face-10-days-to-opt-out-of-automatic-advanced-matching/
- https://ppc.land/chatgpt-ad-visits-earn-shops-0-89-against-2-45-for-google-search-ads/
- https://ppc.land/trafficguard-finds-up-to-34-of-clicks-on-some-chatgpt-ads-were-invalid/
- https://searchengineland.com/chatgpt-ads-bidding-options-are-changing-on-november-9th-500701
- https://searchengineland.com/chatgpt-ads-generate-less-revenue-per-visit-than-google-search-study-500160
- https://searchengineland.com/reportchatgpt-ads-are-growing-fast-but-advertisers-are-still-figuring-them-out-492337
- https://seroundtable.com/openai-updates-chatgpt-ads-bidding-options-42470.html
- https://www.searchenginejournal.com/chatgpt-ads-turns-on-automatic-ad-changes-by-default/595117/
- https://www.searchenginejournal.com/6-months-into-chatgpt-ads-advertisers-still-dont-know-what-good-looks-like/587583/
- https://www.searchenginejournal.com/chatgpt-ad-ctr-markets-report/591384/
- https://digiday.com/marketing/everything-is-coming-down-chatgpt-ads-are-getting-cheaper/
- https://thenextweb.com/news/chatgpt-ads-89-countries-100000-advertisers
- https://news.bensbites.co/posts/62158-openai-has-surpassed-100m-in-annualized-revenue-from-chatgpt-ads-has-expanded-to-600-advertisers-and-plans-to-launch-self-serve-advertiser-access-in-april

**Дослідження й панелі**
- https://ecommerceresearch.org/chatgpt-ads/
- https://aisearch.similarweb.com/blog/chatgpt-ads-ctr-by-country/
- https://graphite.io/five-percent/research/chatgpt-ads-tracking
- https://seranking.com/blog/chatgpt-ads-study/
- https://www.similarweb.com/top-websites/ukraine/

**Рекламодавці й агентства (досвід практиків)**
- https://karelhuk.cz/en/blog/chatgpt-ads-management-lessons
- https://opascope.com/insights/chatgpt-ads-benchmarks/
- https://www.promptmarketing.com/about/cases/chatgpt-ads-ecommerce/
- https://ppcone.cz/en/blog/chatgpt-ads-results/
- https://ppcone.cz/en/blog/chatgpt-ads-czech-republic/
- https://www.symphonicdigital.com/blog/chatgpt-ads-test-results
- https://www.workshopdigital.com/blog/chatgpt-ads-for-b2b/
- https://www.outoftheboxadvisors.com/post/we-spent-real-money-on-chatgpt-ads-for-small-business-here-s-the-honest-truth
- https://adlibrary.com/posts/we-tested-chatgpt-ads
- https://stubgroup.com/blog/why-you-should-run-chatgpt-ads/
- https://www.quartile.com/blog/chatgpt-ads-key-takeaways-and-results-from-our-openai-webinar
- https://scalewiseva.com/blog/chatgpt-ads-case-study-first-90-days
- https://www.adthena.com/resources/blog/inside-chatgpt-ads-what-the-data-tells-us-and-whats-coming-next/
- https://www.trylapis.com/resources/chatgpt-ads-landing-page-guide
- https://adventuremedia.ai/blog/7-costly-chatgpt-ads-mistakes-brands-are-already-making-and-how-to-avoid-them
- https://www.airops.com/blog/chatgpt-ads-best-practices
- https://www.indexlab.ai/blog/chatgpt-ads-89-countries
- https://scall.me/en/chatgpt-ads-poland-small-business/
- https://delante.co/chatgpt-changes-cause-drop-in-ai-traffic-recorded-by-ga4/

**Україна**
- https://mezha.ua/news/chatgpt-ads-launches-in-ukraine-316398/
- https://theinweb.media/reklama-v-chatgpt-v-ukrayini/
- https://speka.ua/artificial-intelligence/chatgpt-ads-v-ukrayini-za-shho-platitimut-brendi-ta-yak-ocinyuvati-rezultat-p6wo1l
- https://mixdigital.agency/ua/blog/openai-ads-reklama-v-chatgpt/
- https://ag.marketing/blog/shcho-take-reklama-chatgpt-ads/
- https://elit-web.ua/ua/blog/chi-otrimueh-vasha-nisha-trafik-iz-chatgpt
- https://www.promodo.ua/blog/skilki-trafiku-ta-konversiy-chatgpt-prinosit-ukrayinskim-onlayn-magazinam-doslidzhennya-promodo
- https://forbes.ua/news/openai-bude-splachuvati-podatok-na-google-z-2025-roku-shcho-zminitsya-dlya-koristuvachiv-25112024-25044
- https://i.factor.ua/ukr/journals/nibu/2026/april/issue-27/article-137037.html
- https://news.dtkt.ua/finance/bank-system/113897-novi-valiutni-limiti-nbu-z-11-serpnia-2026-r-iak-zminilosia-vikoristannia-kliuc-kartok-dlia-biznesu

**Порівняльні бенчмарки (Google, Meta)**
- https://www.wordstream.com/blog/2025-google-ads-benchmarks
- https://www.storegrowers.com/shopping-ads-benchmarks/
- https://seoquick.com.ua/en/context-click-cost/
- https://guildofmarketing.ua/en/google-ads-cost-in-2026-budgets-and-roas-by-niche/
- https://adkit.so/resources/how-much-do-facebook-ads-cost
