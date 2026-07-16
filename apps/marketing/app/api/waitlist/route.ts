import { NextResponse, type NextRequest } from 'next/server';

// Server-to-server: the browser never talks to the API directly. The internal
// API URL is read from the environment (never exposed to the client).
const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

interface WaitlistBody {
  email?: string;
  name?: string;
  phone?: string;
  role?: string;
  consent?: boolean;
  /** Honeypot field — humans never see it; any value means a bot. */
  website?: string;
}

// Basic per-IP rate limit. In-memory, so it is per-instance on serverless —
// good enough to blunt naive form spam without adding a dependency.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  // Bots that fill the honeypot get a quiet "success" and nothing stored.
  if (body.website) {
    return NextResponse.json({ id: null }, { status: 201 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'waitlist',
        email: body.email,
        name: body.name,
        phone: body.phone,
        role: body.role,
        source: 'marketing:waitlist',
        consent: body.consent === true,
      }),
    });

    if (!res.ok) {
      // A waitlist lead failing to store is expensive — make it loud in logs.
      console.error(
        `[waitlist-lead] API rejected lead (status ${res.status}) for ${body.email ?? 'unknown email'}`,
      );
      return NextResponse.json({ error: 'rejected' }, { status: res.status });
    }

    const data = (await res.json()) as { id?: string };
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error(
      `[waitlist-lead] API unreachable — lead NOT stored for ${body.email ?? 'unknown email'}:`,
      err,
    );
    return NextResponse.json(
      { error: 'upstream_unavailable' },
      { status: 502 },
    );
  }
}
