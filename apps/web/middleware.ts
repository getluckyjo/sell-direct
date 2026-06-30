import { NextResponse, type NextRequest } from 'next/server';

// Optional HTTP Basic Auth gate for the internal dashboard. Enabled only when
// DASHBOARD_BASIC_AUTH ("user:pass") is set — so local dev stays open while
// any deployed instance is gated. (Supabase Auth is the production path; this
// is the MVP stand-in.)
export function middleware(request: NextRequest) {
  const expected = process.env.DASHBOARD_BASIC_AUTH;
  if (!expected) return NextResponse.next();

  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    const decoded = atob(header.slice(6));
    if (decoded === expected) return NextResponse.next();
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Sold Direct"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
