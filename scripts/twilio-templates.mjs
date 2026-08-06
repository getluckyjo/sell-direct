#!/usr/bin/env node
/**
 * Create Sold Direct's WhatsApp templates in Twilio's Content API and submit
 * them for WhatsApp approval — in one run. Bodies mirror docs/whatsapp-templates.md.
 *
 * Usage (from the repo root):
 *   TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... node scripts/twilio-templates.mjs
 *   ... node scripts/twilio-templates.mjs --dry-run   # print what would be sent, no calls
 *
 * Safe to re-run: templates whose friendly_name already exists are reused, not
 * duplicated. Prints TEMPLATE_<KEY>=<ContentSid> lines to paste into your env.
 *
 * Needs only Node 18+ (global fetch). No secrets are stored — creds come from env.
 */

const DRY_RUN = process.argv.includes('--dry-run');
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const PREFIX = 'sold_direct_'; // friendly_name prefix so they're easy to find

if (!DRY_RUN && (!SID || !TOKEN)) {
  console.error(
    'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (or pass --dry-run).',
  );
  process.exit(1);
}

const auth = 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64');

/** key → approval name; category MUST match content or WhatsApp rejects it. */
const TEMPLATES = [
  {
    key: 'welcome_consent',
    category: 'MARKETING', // promo line → marketing (Meta may recategorise)
    variables: { 1: 'Maria' },
    quickReply: {
      body:
        'Hi {{1}} 👋 Welcome to Sold Direct — sell your home with 0% commission. ' +
        'Before we start we need your consent to process your details under POPIA. Do you agree?',
      actions: [
        { id: 'consent_yes', title: 'Yes, I agree' },
        { id: 'consent_more', title: 'Tell me more' },
      ],
    },
  },
  {
    key: 'prequal_invite',
    category: 'UTILITY',
    variables: { 1: 'the Sea Point apartment' },
    quickReply: {
      body:
        "Great news — you're enquiring on {{1}}. Want a free, no-obligation home-loan " +
        "pre-qualification right here on WhatsApp? We'll ask your consent before sharing anything.",
      actions: [
        { id: 'prequal_yes', title: 'Yes, pre-qualify me' },
        { id: 'prequal_no', title: 'Not now' },
      ],
    },
  },
  {
    key: 'prequal_result',
    category: 'UTILITY',
    variables: { 1: 'R6 200 000', 2: 'Prime -0.50%', 3: '20' },
    text:
      "✅ You're pre-qualified up to {{1}} at approximately {{2}} over {{3}} years " +
      '(indicative, via our partner BetterBond). Reply VIEW to book a viewing or ask me anything.',
  },
  {
    key: 'otp_status',
    category: 'UTILITY',
    variables: {
      1: '23 Vredehoek Ave',
      2: 'your offer of R5 900 000 was sent to the seller',
    },
    text: '📄 Update on {{1}}: {{2}}. Reply here to respond.',
  },
  {
    key: 'bond_approved',
    category: 'UTILITY',
    variables: { 1: '23 Vredehoek Ave', 2: 'Standard Bank', 3: 'R5 400 000' },
    text:
      '🏦 Your home loan for {{1}} has been approved by {{2}} for {{3}}. ' +
      "Next we'll start the transfer with the conveyancing attorneys.",
  },
  {
    key: 'fica_checklist',
    category: 'UTILITY',
    variables: { 1: '23 Vredehoek Ave', 2: 'the buyer' },
    text:
      'To keep your transfer of {{1}} moving, please send {{2}}’s FICA documents: ID, ' +
      'proof of residence (≤3 months), and proof of source of funds. Reply with photos here — ' +
      'they’re stored securely.',
  },
  {
    key: 'compliance_certs',
    category: 'UTILITY',
    variables: { 1: '23 Vredehoek Ave' },
    text:
      '🔧 For {{1}} we now arrange the compliance certificates (electrical, plumbing, gas, ' +
      "electric fence, beetle). We'll book inspectors and keep you posted — no action needed yet.",
  },
  {
    key: 'transfer_status',
    category: 'UTILITY',
    variables: {
      1: '23 Vredehoek Ave',
      2: 'Lodged at the Deeds Office',
      3: 'Registration usually follows in 7-10 working days.',
    },
    text: '📌 Transfer update for {{1}}: {{2}}. {{3}}',
  },
  {
    key: 'reengagement',
    category: 'MARKETING',
    variables: { 1: 'Maria' },
    quickReply: {
      body:
        "Hi {{1}}, it's Sold Direct. We paused while your last chat window closed — " +
        'want to pick up where we left off?',
      actions: [
        { id: 'reengage_continue', title: 'Continue' },
        { id: 'reengage_stop', title: 'No thanks' },
      ],
    },
  },
];

function buildTypes(t) {
  if (t.quickReply) {
    return {
      'twilio/quick-reply': {
        body: t.quickReply.body,
        actions: t.quickReply.actions.map((a) => ({
          type: 'QUICK_REPLY',
          id: a.id,
          title: a.title,
        })),
      },
    };
  }
  return { 'twilio/text': { body: t.text } };
}

async function api(method, path, body) {
  const res = await fetch(`https://content.twilio.com${path}`, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

async function listExisting() {
  const map = new Map();
  let url = '/v1/Content?PageSize=100';
  // paginate through all content once
  while (url) {
    const page = await api('GET', url);
    for (const c of page.contents ?? []) map.set(c.friendly_name, c.sid);
    url = page.meta?.next_page_url
      ? page.meta.next_page_url.replace('https://content.twilio.com', '')
      : null;
  }
  return map;
}

async function main() {
  console.log(
    DRY_RUN
      ? '— DRY RUN (no API calls) —'
      : `Creating templates on account ${SID}\n`,
  );

  const existing = DRY_RUN ? new Map() : await listExisting();
  const envLines = [];

  for (const t of TEMPLATES) {
    const friendlyName = PREFIX + t.key;
    const types = buildTypes(t);

    if (DRY_RUN) {
      console.log(`\n[${t.category}] ${friendlyName}`);
      console.log(
        JSON.stringify({ friendly_name: friendlyName, types }, null, 2),
      );
      continue;
    }

    let sid = existing.get(friendlyName);
    if (sid) {
      console.log(`• ${friendlyName}: reusing existing ${sid}`);
    } else {
      const created = await api('POST', '/v1/Content', {
        friendly_name: friendlyName,
        language: 'en',
        variables: t.variables,
        types,
      });
      sid = created.sid;
      console.log(`• ${friendlyName}: created ${sid}`);
    }

    // Submit for WhatsApp approval (idempotent-ish: ignore "already requested").
    try {
      await api('POST', `/v1/Content/${sid}/ApprovalRequests/whatsapp`, {
        name: t.key,
        category: t.category,
      });
      console.log(`    ↳ approval submitted (${t.category})`);
    } catch (err) {
      console.log(
        `    ↳ approval skipped: ${String(err.message).slice(0, 120)}`,
      );
    }

    envLines.push(`TEMPLATE_${t.key.toUpperCase()}=${sid}`);
  }

  if (!DRY_RUN) {
    console.log('\nPaste these into your API env (Railway / .env):\n');
    console.log(envLines.join('\n'));
    console.log(
      '\nCheck approval status in Twilio Console → Messaging → Content Template Builder.',
    );
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
