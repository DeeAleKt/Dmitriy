// Для публікації: якщо docs/config.js ще із заглушкою — записати в нього налаштування веб-застосунку
// з проєкту Firebase (вивід `firebase apps:sdkconfig WEB … --json`, переданий файлом).
// node norma/scripts/web-config.mjs <sdkconfig.json> <docs/config.js>
import { readFileSync, writeFileSync } from 'node:fs';

const [src, dest] = process.argv.slice(2);
const r = JSON.parse(readFileSync(src, 'utf8')).result || {};
let cfg = r.sdkConfig;
if (!cfg && typeof r.fileContents === 'string') {
  const m = r.fileContents.match(/\{[\s\S]*\}/);
  cfg = m && JSON.parse(m[0].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
}
if (!cfg?.apiKey || !cfg?.projectId) {
  console.error('Не вдалося отримати налаштування веб-застосунку з Firebase');
  process.exit(1);
}
const pick = ({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }) => ({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId });
writeFileSync(
  dest,
  `// Згенеровано під час публікації з проєкту Firebase «${cfg.projectId}». Не секрет — дані захищають правила доступу.\n` +
    `window.NORMA_CONFIG = { firebase: ${JSON.stringify(pick(cfg), null, 2)} };\n`,
);
console.log(`config.js: проєкт ${cfg.projectId}`);
