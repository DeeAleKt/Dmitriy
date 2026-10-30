// Збирає вебверсію в ../docs (звідти її віддає Firebase Hosting або GitHub Pages)
// і сторінку для claude.ai в dist/calc-artifact.html.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

const root = new URL('.', import.meta.url).pathname;
const out = join(root, '../docs');
const pub = join(root, 'public');
const watch = process.argv.includes('--watch');

const common = {
  bundle: true,
  minify: !watch,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  jsxImportSource: 'preact',
  legalComments: 'eof',
  charset: 'utf8',
};

// Вебверсія з акаунтами: docs/ (Firebase Hosting або GitHub Pages)
const webOptions = {
  ...common,
  entryPoints: [join(root, 'src/calc/web.jsx')],
  outfile: join(out, 'app.js'),
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
  plugins: [{ name: 'shell', setup: (b) => b.onEnd(copyShell) }],
};

function copyShell(result) {
  if (result.errors.length) return;
  const hash = createHash('sha256')
    .update(readFileSync(join(out, 'app.js')))
    .update(readFileSync(join(out, 'app.css')))
    .digest('hex')
    .slice(0, 10);
  mkdirSync(join(out, 'icons'), { recursive: true });
  for (const f of ['index.html', 'sw.js']) {
    writeFileSync(join(out, f), readFileSync(join(pub, f), 'utf8').replaceAll('__VERSION__', hash));
  }
  copyFileSync(join(pub, 'manifest.webmanifest'), join(out, 'manifest.webmanifest'));
  for (const f of readdirSync(join(pub, 'icons'))) copyFileSync(join(pub, 'icons', f), join(out, 'icons', f));
  // config.js власник заповнює прямо в docs/ — не перезаписуємо вже заповнений
  const cfg = join(out, 'config.js');
  if (!existsSync(cfg) || readFileSync(cfg, 'utf8').includes('ВСТАВТЕ_СЮДИ')) copyFileSync(join(pub, 'config.js'), cfg);
  // стара адреса окремого калькулятора веде на головну
  mkdirSync(join(out, 'calc'), { recursive: true });
  writeFileSync(
    join(out, 'calc/index.html'),
    '<!doctype html>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n<title>Норма</title>\n' +
      '<script>location.replace("../" + location.search + location.hash)</script>\n<a href="../">Норма</a>\n',
  );
  writeFileSync(join(out, '.nojekyll'), '');
  console.log(`  вебверсія: ../docs (версія ${hash})`);
}

// Сторінка для claude.ai: той самий калькулятор одним HTML-фрагментом, дані — в акаунті Claude.
async function buildArtifact() {
  const result = await esbuild.build({
    ...common,
    entryPoints: [join(root, 'src/calc/main.jsx')],
    outdir: join(root, 'dist/calc'),
    minify: true,
    write: false,
    logLevel: 'warning',
  });
  const pick = (ext) => result.outputFiles.find((f) => f.path.endsWith(ext)).text;
  const js = pick('.js').replaceAll('</script', '<\\/script');
  const css = pick('.css');
  const body =
    '<title>Калькулятор норми</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
    `<style>${css}</style>\n<div id="app"></div>\n<script type="module">${js}</script>\n`;
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist/calc-artifact.html'), body);
  console.log(`  для claude.ai: dist/calc-artifact.html (${Math.round(body.length / 1024)} КБ)`);
}

if (watch) {
  const ctx = await esbuild.context(webOptions);
  await ctx.watch();
} else if (process.argv.includes('--calc')) {
  await buildArtifact();
} else {
  await esbuild.build(webOptions);
  await buildArtifact();
}
