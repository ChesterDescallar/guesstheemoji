import { NextResponse } from 'next/server';

const GIPHY_SEARCH = 'https://api.giphy.com/v1/gifs/search';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    if (!q) return NextResponse.json({ error: 'missing query' }, { status: 400 });

    // Prefer a server-side GIPHY API key from env, fallback to public beta key
    const key = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC';

    const params = new URLSearchParams({
      api_key: key,
      q,
      limit: '1',
      rating: 'pg-13',
      lang: 'en',
    });

    const res = await fetch(`${GIPHY_SEARCH}?${params.toString()}`);
    if (!res.ok) return NextResponse.json({ error: 'giphy fetch error' }, { status: 502 });
    const body = await res.json();
    const gif = body.data && body.data[0];
    if (!gif) return NextResponse.json({ error: 'no gif found' }, { status: 404 });

    // choose a reasonably sized url
    const url = gif.images?.downsized?.url || gif.images?.original?.url || null;
    if (!url) return NextResponse.json({ error: 'no gif url' }, { status: 404 });

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
