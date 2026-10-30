// Збирає програму в ../docs (звідти її віддає GitHub Pages).
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

const root = new URL('.', import.meta.url).pathname;
const out = join(root, '../docs');
const pub = join(root, 'public');
const watch = process.argv.includes('--watch');
const demo = process.argv.includes('--demo');

const options = {
  entryPoints: [join(root, 'src/main.jsx')],
  outfile: join(out, 'app.js'),
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  jsxImportSource: 'preact',
  loader: { '.rules': 'text' },
  legalComments: 'eof',
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
  // config.js редагує власник прямо в docs/ — не перезаписуємо його
  if (!existsSync(join(out, 'config.js'))) copyFileSync(join(pub, 'config.js'), join(out, 'config.js'));
  writeFileSync(join(out, '.nojekyll'), '');
  console.log(`  версія ${hash}`);
}

// Демо: та сама програма без Firebase, з вигаданими даними в браузері, одним HTML-файлом.
const demoModules = {
  name: 'demo-modules',
  setup(b) {
    b.onResolve({ filter: /^\.\.?\/(firebase|data)\.js$/ }, (args) => {
      if (args.importer.includes(`${join('src', 'demo')}`)) return;
      return { path: join(root, 'src/demo', args.path.replace(/^.*\//, '')) };
    });
  },
};

async function buildDemo() {
  const { plugins, outfile, ...rest } = options;
  const result = await esbuild.build({ ...rest, outdir: join(root, 'dist'), write: false, plugins: [demoModules] });
  const pick = (ext) => result.outputFiles.find((f) => f.path.endsWith(ext)).text;
  const js = pick('.js').replaceAll('</script', '<\\/script');
  const css = pick('.css');
  const fixHeader =
    '.top{top:env(safe-area-inset-top,0px);padding-top:10px}' +
    'body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:21;background:var(--bg)}';
  const body =
    `<title>Норма (демо)</title>\n<meta name="robots" content="noindex, nofollow">\n` +
    `<style>${css}${fixHeader}</style>\n<div id="app"></div>\n<script type="module">${js}</script>\n`;
  // фрагмент для сторінки claude.ai (обгортку додає сам сервіс) і повний документ для GitHub Pages
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist/demo-artifact.html'), body);
  mkdirSync(join(out, 'demo'), { recursive: true });
  writeFileSync(
    join(out, 'demo/index.html'),
    '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<link rel="icon" href="../icons/icon.svg" type="image/svg+xml">\n</head>\n<body>\n' +
      body +
      '</body>\n</html>\n',
  );
  console.log(`  демо: ../docs/demo/index.html, dist/demo-artifact.html (${Math.round(body.length / 1024)} КБ)`);
}

// Офлайн-калькулятор: окремий застосунок одним HTML-файлом, без сервера і зовнішніх запитів.
async function buildCalc() {
  const result = await esbuild.build({
    entryPoints: [join(root, 'src/calc/main.jsx')],
    outdir: join(root, 'dist/calc'),
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    jsx: 'automatic',
    jsxImportSource: 'preact',
    legalComments: 'eof',
    charset: 'utf8',
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
  mkdirSync(join(out, 'calc'), { recursive: true });
  writeFileSync(
    join(out, 'calc/index.html'),
    '<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<meta name="robots" content="noindex, nofollow">\n' +
      '<meta name="theme-color" content="#f1f3f8" media="(prefers-color-scheme: light)">\n' +
      '<meta name="theme-color" content="#0a0d15" media="(prefers-color-scheme: dark)">\n' +
      '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Норма">\n' +
      '<link rel="icon" href="../icons/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="../icons/apple-touch-icon.png">\n' +
      '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n' +
      '</head>\n<body>\n' +
      body +
      '</body>\n</html>\n',
  );
  console.log(`  калькулятор: ../docs/calc/index.html, dist/calc-artifact.html (${Math.round(body.length / 1024)} КБ)`);
}

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else if (demo) {
  await buildDemo();
} else if (process.argv.includes('--calc')) {
  await buildCalc();
} else {
  await esbuild.build(options);
  await buildDemo();
  await buildCalc();
}
