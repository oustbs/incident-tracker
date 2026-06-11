import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/incidents/[id] — Proxies incident detail
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const baseUrl = process.env.API_BASE_URL;

  try {
    const res = await fetch(`${baseUrl}/v1/incidents/${id}`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * PATCH /api/incidents/[id] — Update incident
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const baseUrl = process.env.API_BASE_URL;

  try {
    const body = await req.json();
    const res = await fetch(`${baseUrl}/v1/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
