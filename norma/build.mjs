// Збирає програму в ../docs (звідти її віддає GitHub Pages).
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

const root = new URL('.', import.meta.url).pathname;
const out = join(root, '../docs');
const pub = join(root, 'public');
const watch = process.argv.includes('--watch');

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

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
