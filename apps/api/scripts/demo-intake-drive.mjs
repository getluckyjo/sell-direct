/**
 * Browser drive of the /demo simulator that proves the intake never asks a
 * double question. Run against a server with ANTHROPIC_API_KEY set (the
 * extractor needs it); without a key the flow is strictly scripted and the
 * multi-field assertions below will fail by design.
 *
 * Prereqs: `npm i playwright` somewhere on NODE_PATH (or run from a folder
 * that has it) and a Chromium binary. Usage:
 *
 *   DEMO_URL=http://localhost:4100 DEMO_TOKEN=<internal token> \
 *   CHROMIUM=/path/to/chrome node scripts/demo-intake-drive.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.DEMO_URL ?? 'http://localhost:4100';
const TOKEN = process.env.DEMO_TOKEN ?? 'demotoken';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 460, height: 840 } });
await page.goto(`${BASE}/demo`);
await page.fill('#tokenbox', TOKEN);
await page.click('#tokensave');
await page.waitForTimeout(400);

async function say(text, wait = 4000) {
  await page.fill('#box', text);
  await page.click('#send');
  await page.waitForTimeout(wait);
  const bubbles = await page.$$eval('.row.them .bubble', (els) =>
    els.map((e) => e.textContent ?? ''),
  );
  return bubbles.at(-1) ?? '';
}

// The reported bug, end to end: headline carries suburb + bedrooms.
await say('list', 2500);
let reply = await say('4 bedroom home in mowbray');
assert.doesNotMatch(reply, /which suburb|how many bedrooms/i, `re-asked: ${reply}`);
assert.match(reply, /asking price/i, `expected price question, got: ${reply}`);
await page.screenshot({ path: 'demo-intake-1-no-double-question.png' });

reply = await say('5000000');
assert.doesNotMatch(reply, /which suburb|how many bedrooms/i);
reply = await say('2'); // bathrooms — the only count still missing
assert.match(reply, /60, 90 or 120/i, `expected term question, got: ${reply}`);
reply = await say('90');
assert.match(reply, /reply yes/i, `expected confirm summary, got: ${reply}`);
assert.match(reply, /5[\s,.\u00a0\u202f]?000[\s,.\u00a0\u202f]?000/);
await page.screenshot({ path: 'demo-intake-2-confirm-summary.png' });

reply = await say('YES');
assert.match(reply, /is live/i, `expected publish, got: ${reply}`);
await page.screenshot({ path: 'demo-intake-3-live.png' });

await browser.close();
console.log('DEMO INTAKE DRIVE: NO DOUBLE QUESTIONS — ALL ASSERTIONS PASSED');
