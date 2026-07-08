/**
 * End-to-end smoke for the photo + description flow (no live Anthropic call;
 * real webhook, dispatcher, Prisma against a real Postgres, local storage in
 * a temp dir). Two runs:
 *
 *   Scripted: list → answers → YES → listing pends → description text stored
 *   verbatim → 2 photos → active + LIVE reply + syndication stub log.
 *   Variant: SKIP then photo-first still activates.
 *
 * Run: DATABASE_URL=... DIRECT_URL=... WHATSAPP_PHONE_NUMBER_ID=x \
 *      npx tsx scripts/photo-smoke.mts
 */
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildServer } from '../src/app';
import { prisma } from '../src/db/client';
import { createLocalStorageProvider } from '../src/modules/storage';
import type {
  InboundMessage,
  MessagingAdapter,
  OutboundMessage,
} from '../src/modules/messaging';

const PHONE = '+27820006666';
const sent: OutboundMessage[] = [];
// 1×1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const fakeAdapter: MessagingAdapter = {
  verifyChallenge: () => null,
  verifySignature: () => true,
  parseInbound(payload) {
    const p = payload as { id: string; text?: string; image?: boolean };
    return [
      {
        waMessageId: p.id,
        from: PHONE,
        to: 'businessnumber',
        type: p.image ? 'image' : 'text',
        text: p.image ? undefined : p.text,
        media: p.image ? { id: `media-${p.id}`, mimeType: 'image/png' } : undefined,
        raw: {},
      } satisfies InboundMessage,
    ];
  },
  async send(message) {
    sent.push(message);
    return { waMessageId: `wamid.out.${sent.length}` };
  },
  async fetchMedia() {
    return { bytes: PNG, mimeType: 'image/png' };
  },
};

async function reset() {
  await prisma.agentDraft.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationState.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.seller.deleteMany();
  sent.length = 0;
}

async function main() {
  const storageDir = await mkdtemp(join(tmpdir(), 'sd-photo-smoke-'));
  const storage = createLocalStorageProvider({
    baseDir: storageDir,
    publicBase: 'http://localhost:4000',
  });
  const app = buildServer({ adapter: fakeAdapter, storage });

  async function say(id: string, text?: string, image = false) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/webhooks/whatsapp',
      payload: { id, text, image },
    });
    assert.equal(res.statusCode, 200, res.body);
    await new Promise((r) => setTimeout(r, 250));
  }

  // ---------- Run 1: description typed, then photos ----------
  await reset();
  await say('r1.1', 'list');
  await say('r1.2', '4 bedroom home in mowbray');
  await say('r1.3', 'mowbray');
  await say('r1.4', '5000000');
  await say('r1.5', '4');
  await say('r1.6', '2');
  await say('r1.7', '90');
  await say('r1.8', 'YES');

  let listing = (await prisma.listing.findMany())[0];
  assert.equal(listing.status, 'awaiting_photos', 'listing pends after YES');
  assert.match(sent.at(-1)!.text, /confirmed/i);
  assert.match(sent.at(-1)!.text, /skip/i);
  const onboarding = await prisma.conversationState.findUnique({
    where: { phone: PHONE },
  });
  assert.equal(onboarding?.flow, 'listing_onboarding');

  await say('r1.9', 'Sunny family home near great schools, walking distance to shops.');
  assert.match(sent.at(-1)!.text, /description saved/i);
  listing = (await prisma.listing.findMany())[0];
  assert.equal(
    listing.description,
    'Sunny family home near great schools, walking distance to shops.',
    'description stored verbatim',
  );
  assert.equal(
    await prisma.conversationState.findUnique({ where: { phone: PHONE } }),
    null,
    'onboarding state cleared',
  );

  await say('r1.10', undefined, true); // first photo
  assert.match(sent.at(-1)!.text, /now LIVE/i);
  assert.match(sent.at(-1)!.text, /CERTS/);
  listing = (await prisma.listing.findMany())[0];
  assert.equal(listing.status, 'active', 'first photo activates');

  await say('r1.11', undefined, true); // second photo
  assert.match(sent.at(-1)!.text, /Photo 2 added/);
  const photos = await prisma.listingPhoto.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  assert.equal(photos.length, 2);
  assert.deepEqual(
    photos.map((p) => p.sortOrder),
    [0, 1],
  );
  assert.ok(photos[0].url?.includes('/api/storage/listing-photos/'));

  // ---------- Run 2: SKIP description, photo-first ----------
  // (No ANTHROPIC_API_KEY in this smoke → extraction is a noop, so answer
  // one field at a time; the multi-field path is covered by unit tests.)
  await reset();
  await say('r2.1', 'list my 3-bed in Gardens');
  const state = await prisma.conversationState.findUnique({
    where: { phone: PHONE },
  });
  assert.equal(state?.flow, 'listing_intake');
  await say('r2.2', 'Gardens');
  await say('r2.3', '2500000');
  await say('r2.4', '3');
  await say('r2.5', '2');
  await say('r2.6', '90');
  await say('r2.7', 'YES');
  await say('r2.8', 'SKIP');
  assert.match(sent.at(-1)!.text, /no problem/i);
  await say('r2.9', undefined, true);
  assert.match(sent.at(-1)!.text, /now LIVE/i);
  const l2 = (await prisma.listing.findMany())[0];
  assert.equal(l2.status, 'active');
  assert.equal(l2.description, null, 'skipped description stays null');

  await app.close();
  await prisma.$disconnect();
  console.log('PHOTO SMOKE: ALL ASSERTIONS PASSED');
  console.log('  run 1 listing:', listing.title, '| photos:', photos.length);
  console.log('  run 2 listing:', l2.title, '| description skipped');
}

main().catch((err) => {
  console.error('PHOTO SMOKE FAILED', err);
  process.exit(1);
});
