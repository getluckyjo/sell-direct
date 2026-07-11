/**
 * Browser drive of the /demo simulator through the FULL seller journey:
 * intake → YES (listing pends) → description → photo upload (listing goes
 * LIVE) → second photo. Proves the photo flow end-to-end in the UI.
 *
 * Prereqs: `npm i playwright` somewhere on NODE_PATH and a Chromium binary.
 *
 *   DEMO_URL=http://localhost:4100 DEMO_TOKEN=<internal token> \
 *   CHROMIUM=/path/to/chrome node scripts/demo-photo-drive.mjs
 *
 * Note: without ANTHROPIC_API_KEY on the server the intake is strictly
 * scripted (answer one field per message, as below); with a key you can
 * answer multi-field ("4 bed home in Mowbray") and fields are extracted.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
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

async function lastBubble() {
  const bubbles = await page.$$eval('.row.them .bubble', (els) =>
    els.map((e) => e.textContent ?? ''),
  );
  return bubbles.at(-1) ?? '';
}
async function say(text, wait = 2500) {
  await page.fill('#box', text);
  await page.click('#send');
  await page.waitForTimeout(wait);
  return lastBubble();
}

// Intake to the confirm step.
await say('list');
await say('4 bedroom home in Mowbray');
let reply = await lastBubble();
if (/which suburb/i.test(reply)) {
  // extractor off — answer scripted
  await say('Mowbray');
}
reply = await lastBubble();
if (/street address/i.test(reply)) {
  // the optional pre-price address question
  reply = await say('12 Milner Road');
}
// The demo's mock valuation adapter decorates the price prompt.
assert.match(reply, /Price guidance/i, `expected price guidance, got: ${reply}`);
assert.match(reply, /via LOOM Property Insights/, `expected attribution, got: ${reply}`);
await say('5000000');
reply = await lastBubble();
if (/how many bedrooms/i.test(reply)) await say('4');
await say('2');
reply = await lastBubble();
if (/60, 90 or 120/i.test(reply)) reply = await say('90');
assert.match(reply, /reply yes/i, `expected confirm summary, got: ${reply}`);

// YES → pending, NOT live.
reply = await say('YES');
assert.match(reply, /confirmed/i, `expected pending copy, got: ${reply}`);
assert.match(reply, /photos/i);
assert.doesNotMatch(reply, /now LIVE/i);
await page.screenshot({ path: 'demo-photo-0-pending.png' });

// Description.
reply = await say('A sunny north-facing family home near good schools.');
assert.match(reply, /description saved/i, `got: ${reply}`);

// First photo → LIVE.
await page.setInputFiles('#file', join(here, 'fixtures/demo-house.png'));
await page.waitForTimeout(3000);
reply = await lastBubble();
assert.match(reply, /now LIVE/i, `expected LIVE after first photo, got: ${reply}`);
assert.match(reply, /CERTS/);
const photoBubbles = await page.locator('.bubble.photo img').count();
assert.ok(photoBubbles >= 1, 'photo bubble rendered');
await page.screenshot({ path: 'demo-photo-1-live.png' });

// Second photo → counted.
await page.setInputFiles('#file', join(here, 'fixtures/demo-house.png'));
await page.waitForTimeout(3000);
reply = await lastBubble();
assert.match(reply, /Photo 2 added/i, `got: ${reply}`);
await page.screenshot({ path: 'demo-photo-2-second.png' });

await browser.close();
console.log('DEMO PHOTO DRIVE: ALL ASSERTIONS PASSED');
