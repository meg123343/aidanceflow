export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) return Response.json({ error: 'Missing media URL.' }, { status: 400 });

    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return Response.json({ error: 'Unsupported media URL.' }, { status: 400 });
    }

    const upstream = await fetch(parsedUrl, {
      headers: {
        Range: request.headers.get('range') ?? '',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: 'Media fetch failed.' }, { status: upstream.status || 502 });
    }

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
    for (const key of ['content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Media proxy failed' }, { status: 500 });
  }
}
