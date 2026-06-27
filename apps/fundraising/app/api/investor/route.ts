import { NextResponse, type NextRequest } from 'next/server';

// Server-to-server: the browser never talks to the API directly.
const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

interface InvestorBody {
  email?: string;
  name?: string;
  firm?: string;
  message?: string;
  consent?: boolean;
}

export async function POST(request: NextRequest) {
  let body: InvestorBody;
  try {
    body = (await request.json()) as InvestorBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const message = [body.firm ? `Firm: ${body.firm}` : null, body.message]
    .filter(Boolean)
    .join('\n');

  const res = await fetch(`${API_BASE}/api/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      kind: 'investor',
      role: 'investor',
      email: body.email,
      name: body.name,
      message: message || undefined,
      source: 'fundraising:data-room',
      consent: body.consent === true,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'rejected' }, { status: res.status });
  }

  const data = (await res.json()) as { id?: string };
  return NextResponse.json({ id: data.id }, { status: 201 });
}
