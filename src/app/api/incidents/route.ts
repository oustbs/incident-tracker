import { NextResponse } from 'next/server';

/**
 * GET /api/incidents — Proxies the backend incidents list
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = process.env.API_BASE_URL;

  const params = new URLSearchParams();
  if (searchParams.get('page')) params.set('page', searchParams.get('page')!);
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
  if (searchParams.get('status')) params.set('status', searchParams.get('status')!);
  if (searchParams.get('siteCode')) params.set('siteCode', searchParams.get('siteCode')!);

  try {
    // cache: 'no-store' ensures Next.js never caches incident data server-side.
    // Serving stale incidents in a supervision dashboard would be a safety issue.
    const res = await fetch(`${baseUrl}/v1/incidents?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}
