import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/incidents/[id]/comments — Proxies comments list
 */
export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const baseUrl = process.env.API_BASE_URL;

  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';

  try {
    const res = await fetch(`${baseUrl}/v1/incidents/${id}/comments?page=${page}&limit=${limit}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

/**
 * POST /api/incidents/[id]/comments — Create a comment
 */
export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const baseUrl = process.env.API_BASE_URL;

  try {
    const body = await req.json();

    const res = await fetch(`${baseUrl}/v1/incidents/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: body.author, message: body.message }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
