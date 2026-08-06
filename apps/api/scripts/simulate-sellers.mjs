/**
 * Twenty simulated sellers driven through the real pipeline — the production
 * dispatcher, the real state machine, real Postgres writes.
 *
 * Each persona behaves like a person, not like a script tuned to pass: taps
 * carry a replyId exactly as a WhatsApp interactive reply does, everything
 * else is typed. Every turn is recorded and scored for the failure modes that
 * matter — a question asked twice, an input rejected, a conversation lost,
 * a drop-off.
 *
 * Usage (see docs/TESTING.md):
 *   RUN_ID=4 node scripts/simulate-sellers.mjs            # human summary
 *   RUN_ID=4 FORMAT=json node scripts/simulate-sellers.mjs > run.json
 *
 * RUN_ID must differ per run: personas use deterministic phone numbers, so
 * reusing an id resumes the previous run's conversations and the results are
 * meaningless. Numbers stay inside the reserved +2700 demo range, which can
 * never collide with a real seller.
 */
const BASE = process.env.BASE ?? 'http://localhost:4100';
const RUN_ID = process.env.RUN_ID ?? '9';
const FORMAT = process.env.FORMAT ?? 'summary';

/** t = tap (id, label). s = say (typed text). */
const t = (id, label) => ({ kind: 'tap', id, label: label ?? id });
const s = (text) => ({ kind: 'say', text });

const PERSONAS = [
  {
    name: 'Thandi — taps everything, perfect run',
    goal: 'publish',
    steps: [
      s('list'),
      t('START', 'List my property'),
      t('house', 'House'),
      t('REGION:southern', 'Southern Suburbs'),
      t('Rondebosch', 'Rondebosch'),
      t('SKIP', 'Skip'),
      t('5350000', 'R5 350 000'),
      t('3', '3 bedrooms'),
      t('2', '2 bathrooms'),
      t('90', '90 days'),
      t('YES', 'Publish now'),
      t('SKIP', 'Skip for now'),
    ],
  },
  {
    name: 'Dan — opens with the details already in the message',
    goal: 'publish',
    steps: [
      s('sell my 4 bedroom house in Mowbray'),
      t('house', 'House'),
      t('REGION:southern', 'Southern'),
      t('Mowbray', 'Mowbray'),
      t('SKIP', 'Skip'),
      s('4200000'),
      s('4'),
      s('2'),
      s('90'),
      s('yes'),
      t('SKIP', 'Skip'),
    ],
  },
  {
    name: 'Trevor — never taps, types every answer',
    goal: 'publish',
    steps: [
      s('list'),
      s('start'),
      s('house'),
      s('Newlands'),
      s('12 Main Road'),
      s('3200000'),
      s('3'),
      s('2'),
      s('90'),
      s('yes'),
      s('skip'),
    ],
  },
  {
    name: 'Olwethu — suburb is not on the list',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('apartment', 'Apartment'),
      t('OTHER', 'Other — type it'),
      s('Scarborough'),
      t('SKIP'),
      s('1800000'),
      t('2', '2 bedrooms'),
      t('1', '1 bathroom'),
      t('90', '90 days'),
      t('YES', 'Publish'),
      t('SKIP'),
    ],
  },
  {
    name: 'Rina — changes her mind about the region',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:northern', 'Northern'),
      t('REGION:back', '← Another region'),
      t('REGION:atlantic', 'Atlantic Seaboard'),
      t('Sea Point', 'Sea Point'),
      t('SKIP'),
      s('7500000'),
      t('3'),
      t('2'),
      t('90'),
      t('YES'),
      t('SKIP'),
    ],
  },
  {
    name: 'Sipho — types "skip" instead of tapping it',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('townhouse', 'Townhouse'),
      t('REGION:southern'),
      t('Claremont', 'Claremont'),
      s('skip'),
      s('2900000'),
      s('2'),
      s('2'),
      s('90'),
      s('YES'),
      s('skip'),
    ],
  },
  {
    name: 'Ayanda — gives a full street address',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:falsebay', 'False Bay'),
      t('Muizenberg', 'Muizenberg'),
      s('47 Beach Road'),
      s('3100000'),
      s('3'),
      s('1'),
      t('120', '120 days'),
      t('YES'),
      t('SKIP'),
    ],
  },
  {
    name: 'Riaan — types the price the way South Africans write it',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:northern', 'Northern'),
      t('Durbanville', 'Durbanville'),
      t('SKIP'),
      s('R3 500 000'),
      s('4'),
      s('3'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Sam — types the price in shorthand',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('apartment', 'Apartment'),
      t('REGION:citybowl', 'City Bowl'),
      t('Gardens', 'Gardens'),
      t('SKIP'),
      s('3.5m'),
      s('2'),
      s('2'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Lerato — enters an implausible price, then corrects it',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:southern'),
      t('Wynberg', 'Wynberg'),
      t('SKIP'),
      s('50000'),
      s('2500000'),
      s('3'),
      s('2'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Elmarie — edits the price at the summary',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:southern'),
      t('Constantia', 'Constantia'),
      t('SKIP'),
      s('9000000'),
      s('5'),
      s('4'),
      s('90'),
      t('EDIT', 'Change something'),
      t('EDIT:priceZar', 'Asking price'),
      s('8500000'),
      t('YES', 'Publish'),
      t('SKIP'),
    ],
  },
  {
    name: 'Cameron — cancels at the summary',
    goal: 'cancel',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:westcoast', 'West Coast'),
      t('Melkbosstrand', 'Melkbosstrand'),
      t('SKIP'),
      s('2200000'),
      s('3'),
      s('2'),
      s('90'),
      t('CANCEL', 'Cancel listing'),
    ],
  },
  {
    name: 'Sarah — a studio apartment, zero bedrooms',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('apartment', 'Apartment'),
      t('REGION:citybowl'),
      t('Woodstock', 'Woodstock'),
      t('SKIP'),
      s('1250000'),
      t('0', 'Studio'),
      t('1', '1 bathroom'),
      t('90'),
      t('YES'),
      t('SKIP'),
    ],
  },
  {
    name: 'Lodewyk — vacant land, no bedrooms to give',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('land', 'Vacant land / plot'),
      t('REGION:westcoast'),
      t('Yzerfontein', 'Yzerfontein'),
      t('SKIP'),
      s('950000'),
      s('0'),
      s('0'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Gugu — abandons three questions in',
    goal: 'abandon',
    steps: [s('list'), t('START'), t('house', 'House'), t('REGION:southern')],
  },
  {
    name: 'Cara — asks about cost in the middle of the flow',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:southern'),
      t('Kenilworth', 'Kenilworth'),
      t('SKIP'),
      s('how much do you charge?'),
      s('3300000'),
      s('3'),
      s('2'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Gerhard — types nonsense at the property picker',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      s('asdkjhasd'),
      t('house', 'House'),
      t('REGION:citybowl'),
      t('Tamboerskloof', 'Tamboerskloof'),
      t('SKIP'),
      s('4800000'),
      s('3'),
      s('2'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Lindiwe — a very long opening message',
    goal: 'publish',
    steps: [
      s(
        'list my absolutely stunning north facing family home with a pool and a flatlet and mountain views in Pinelands that we have loved for eleven years',
      ),
      t('house', 'House'),
      t('REGION:southern'),
      t('OTHER', 'Other'),
      s('Pinelands'),
      t('SKIP'),
      s('3900000'),
      s('4'),
      s('3'),
      s('90'),
      s('yes'),
      t('SKIP'),
    ],
  },
  {
    name: 'Shaun — wants the shortest term',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('estate', 'Secure estate'),
      t('REGION:northern'),
      t('Brackenfell', 'Brackenfell'),
      t('SKIP'),
      s('2750000'),
      s('3'),
      s('2'),
      t('60', '60 days'),
      t('YES'),
      t('SKIP'),
    ],
  },
  {
    name: 'Dineo — writes her own description after publishing',
    goal: 'publish',
    steps: [
      s('list'),
      t('START'),
      t('house', 'House'),
      t('REGION:atlantic'),
      t('Green Point', 'Green Point'),
      t('SKIP'),
      s('6400000'),
      s('3'),
      s('2'),
      s('90'),
      t('YES', 'Publish'),
      t('TYPE', "I'll write it"),
      s(
        'Sunny three bedroom home a short walk from the promenade, with secure parking and a private garden.',
      ),
    ],
  },
];

const WELCOME_MARK = 'Welcome to Sold Direct';
const REJECT_RE =
  /please pick|please give|please reply|didn.t catch|digits only|at least|must be|sorry|not sure what|between/i;

async function send(phone, step) {
  const body =
    step.kind === 'tap'
      ? { phone, text: step.label, replyId: step.id }
      : { phone, text: step.text };
  const res = await fetch(`${BASE}/api/demo/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { httpError: `${res.status} ${await res.text()}` };
  }
  return res.json();
}

/**
 * Refuse to run on numbers that already carry a conversation. Re-using a
 * RUN_ID resumes the previous run mid-flow, and the output looks like product
 * bugs that are not there — this exact trap cost a debugging cycle.
 */
async function preflight(phones) {
  const used = [];
  for (const phone of phones) {
    const res = await fetch(
      `${BASE}/api/demo/conversation?phone=${encodeURIComponent(phone)}`,
    );
    if (!res.ok) {
      throw new Error(
        `preflight failed for ${phone}: ${res.status} ${await res.text()}`,
      );
    }
    const { messages } = await res.json();
    if (messages.length > 0) used.push(phone);
  }
  if (used.length) {
    console.error(
      `\nRUN_ID=${RUN_ID} has already been used — ${used.length} of ` +
        `${phones.length} numbers already have history.\n` +
        `Pick an unused RUN_ID (0-9, a-z), or reset the database first.\n`,
    );
    process.exit(1);
  }
}

const phoneFor = (i) => `+2700${RUN_ID}${String(100 + i).padStart(6, '0')}`;
await preflight(PERSONAS.map((_, i) => phoneFor(i)));

const results = [];

for (const [i, persona] of PERSONAS.entries()) {
  const phone = phoneFor(i); // +2700 then exactly seven digits
  const turns = [];
  const issues = [];
  let seen = 0;
  let lastReply = '';

  for (const [n, step] of persona.steps.entries()) {
    const input = step.kind === 'tap' ? `[tap ${step.id}]` : step.text;
    const json = await send(phone, step);

    if (json.httpError) {
      issues.push({
        at: n + 1,
        type: 'http_error',
        detail: json.httpError,
        input,
      });
      break;
    }
    const out = json.messages.filter((m) => m.direction === 'outbound');
    const fresh = out.slice(seen);
    seen = out.length;
    const reply = fresh.map((m) => m.body).join('\n') || '(no reply)';
    const options = fresh.at(-1)?.options;
    turns.push({ input, reply, hasOptions: !!options });

    if (reply === '(no reply)') {
      issues.push({ at: n + 1, type: 'no_reply', input });
    } else if (n > 1 && reply.includes(WELCOME_MARK)) {
      // Falling back to the welcome menu mid-journey means the conversation
      // was lost — the seller has to start over.
      issues.push({
        at: n + 1,
        type: 'conversation_lost',
        input,
        reply: reply.slice(0, 90),
      });
    } else if (REJECT_RE.test(reply)) {
      issues.push({
        at: n + 1,
        type: 'input_rejected',
        input,
        reply: reply.slice(0, 110),
      });
    }
    if (reply === lastReply && n > 0) {
      issues.push({
        at: n + 1,
        type: 'question_repeated',
        input,
        reply: reply.slice(0, 90),
      });
    }
    lastReply = reply;
  }

  results.push({
    persona: persona.name,
    goal: persona.goal,
    phone,
    turns,
    issues,
  });
}

/** A correction, as opposed to a question being asked for the first time. */
const CORRECTION_RE = /^(Please |I didn.t|Sorry)/i;
const PUBLISHED_RE = /is confirmed!/;

if (FORMAT === 'json') {
  console.log(JSON.stringify(results, null, 1));
} else {
  report(results);
}

function report(runs) {
  const published = runs.filter((r) =>
    r.turns.some((t) => PUBLISHED_RE.test(t.reply)),
  );
  const expected = runs.filter((r) => r.goal === 'publish');

  console.log(`\nSold Direct — seller simulation (run ${RUN_ID})`);
  console.log('='.repeat(52));
  console.log(`personas          ${runs.length}`);
  console.log(
    `published         ${published.length} of ${expected.length} expected`,
  );
  console.log(
    `turns exchanged   ${runs.reduce((n, r) => n + r.turns.length, 0)}`,
  );

  const missed = expected.filter((r) => !published.includes(r));
  if (missed.length) {
    console.log('\nDID NOT PUBLISH (expected to):');
    for (const r of missed) console.log(`  ✗ ${r.persona}`);
  }

  const problems = [];
  for (const r of runs) {
    for (const [i, turn] of r.turns.entries()) {
      if (CORRECTION_RE.test(turn.reply.trim())) {
        problems.push(
          `  · ${r.persona.split(' —')[0]} turn ${i + 1}: ${JSON.stringify(turn.input)} → ${turn.reply.split('\n')[0].slice(0, 60)}`,
        );
      }
      if (i > 0 && turn.reply === r.turns[i - 1].reply) {
        problems.push(
          `  ! ${r.persona.split(' —')[0]} turn ${i + 1}: same reply twice — possible loop`,
        );
      }
    }
    for (const issue of r.issues) {
      if (issue.type === 'http_error' || issue.type === 'no_reply') {
        problems.push(
          `  !! ${r.persona.split(' —')[0]} turn ${issue.at}: ${issue.type}` +
            (issue.detail ? ` — ${issue.detail.slice(0, 90)}` : ''),
        );
      }
    }
  }
  console.log(
    problems.length
      ? '\nINPUTS CORRECTED / LOOPS:'
      : '\nNo corrections or loops.',
  );
  problems.forEach((p) => console.log(p));

  console.log('\nRe-run with FORMAT=json for full transcripts.');
}
