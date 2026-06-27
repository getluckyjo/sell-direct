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
}

export async function POST(request: NextRequest) {
  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'rejected' }, { status: res.status });
  }

  const data = (await res.json()) as { id?: string };
  return NextResponse.json({ id: data.id }, { status: 201 });
}
