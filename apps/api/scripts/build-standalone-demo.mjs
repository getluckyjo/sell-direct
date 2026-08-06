/**
 * Builds a single self-contained HTML file of the seller onboarding flow —
 * no server, no database, no network. Used for hosted/shareable demos where
 * standing up the API isn't practical.
 *
 * The conversation code is the real thing: `browser-flow.ts` imports the same
 * `intake.ts` state machine, `welcome.ts` copy and demo valuation adapter the
 * server runs, bundled for the browser. Only persistence and transport are
 * dropped, and the page says so on its face.
 *
 * Usage:  node scripts/build-standalone-demo.mjs [outfile]
 */
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] ?? resolve(here, '../dist/demo.html'));

const bundled = await build({
  entryPoints: [resolve(here, '../src/modules/demo/browser-flow.ts')],
  bundle: true,
  write: false,
  minify: true,
  // IIFE + a global so the page can use it from a plain (non-module) script.
  format: 'iife',
  globalName: 'SoldDirectFlow',
  platform: 'browser',
  target: 'es2020',
});

const js = bundled.outputFiles[0].text;

// The bundle must never drag server-only code into a public page.
for (const forbidden of ['@anthropic-ai', '@prisma', 'process.env']) {
  if (js.includes(forbidden)) {
    throw new Error(`refusing to build: bundle contains ${forbidden}`);
  }
}

const template = await readFile(resolve(here, 'standalone-demo.html'), 'utf8');
if (!template.includes('/*__FLOW_BUNDLE__*/')) {
  throw new Error('template is missing the /*__FLOW_BUNDLE__*/ placeholder');
}

await writeFile(out, template.replace('/*__FLOW_BUNDLE__*/', js), 'utf8');
console.log(`wrote ${out} (${(js.length / 1024).toFixed(1)} kB of flow code)`);
