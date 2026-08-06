export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Unique-visit deduplication via a 24-hour cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const alreadyVisited = /nx6t_v=1/.test(cookieHeader);

    const stored = await env.VIEWS_KV.get('total');
    let count = parseInt(stored || '0', 10);

    const responseHeaders = { ...corsHeaders };

    if (!alreadyVisited) {
      count += 1;
      await env.VIEWS_KV.put('total', String(count));
      responseHeaders['Set-Cookie'] =
        'nx6t_v=1; Max-Age=86400; Path=/; SameSite=Lax; Secure';
    }

    return new Response(JSON.stringify({ count }), {
      headers: responseHeaders,
    });
  } catch (_) {
    // KV not yet bound — return a graceful fallback so the UI still loads
    return new Response(JSON.stringify({ count: 0 }), {
      headers: corsHeaders,
    });
  }
}
