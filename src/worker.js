export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Proxy all /openai/* requests to Groq ──
    if (url.pathname.startsWith('/openai/')) {

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      const groqUrl = 'https://api.groq.com' + url.pathname + url.search;

      const proxyRequest = new Request(groqUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      const response = await fetch(proxyRequest);
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Headers', '*');

      return newResponse;
    }

    // ── Serve static HTML assets ──
    return env.ASSETS.fetch(request);
  }
}
