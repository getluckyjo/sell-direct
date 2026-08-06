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
 * Usage:  node scripts/build-standalone-demo.mjs [outfile] [--fragment]
 *
 * By default the output is a COMPLETE html document, ready to serve from any
 * static host. `--fragment` emits just the body content instead, for hosts
 * that supply their own document shell (the Claude artifact renderer).
 */
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const fragment = argv.includes('--fragment');
const target = argv.find((a) => !a.startsWith('--'));
const out = resolve(target ?? resolve(here, '../dist/demo.html'));

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

const page = template.replace('/*__FLOW_BUNDLE__*/', js);

/**
 * The template is authored as body content. A statically-hosted copy needs a
 * real document around it — without the viewport meta in particular, the page
 * renders at desktop width on a phone, which is a poor look for a demo of a
 * WhatsApp product.
 */
const TITLE_RE = /<title>([\s\S]*?)<\/title>\s*/;

function asDocument(body) {
  // <title> lives in the template for the artifact renderer's benefit; in a
  // real document it belongs in <head>, so hoist it rather than leave a stray
  // element in the body.
  const title =
    TITLE_RE.exec(body)?.[1] ?? 'Sold Direct — seller onboarding demo';
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Sold Direct — the WhatsApp seller onboarding flow, playable in your browser.">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
</head>
<body>
${body.replace(TITLE_RE, '')}</body>
</html>
`;
}

await writeFile(out, fragment ? page : asDocument(page), 'utf8');
console.log(
  `wrote ${out} (${(js.length / 1024).toFixed(1)} kB of flow code` +
    `${fragment ? ', body fragment' : ', full document'})`,
);
