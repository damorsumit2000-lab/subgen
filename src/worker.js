export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Required for FFmpeg WASM (SharedArrayBuffer)
    const COOP = {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    };

    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
          ...COOP,
        }
      });
    }

    // Proxy: Groq Whisper
    if (url.pathname === '/proxy/audio/transcriptions') {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);
      headers.delete('host');
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST', headers, body: request.body,
      });
      return new Response(response.body, {
        status: response.status,
        headers: { ...Object.fromEntries(response.headers), 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Proxy: Groq LLaMA
    if (url.pathname === '/proxy/chat/completions') {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);
      headers.delete('host');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers, body: request.body,
      });
      return new Response(response.body, {
        status: response.status,
        headers: { ...Object.fromEntries(response.headers), 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Serve static files with COOP/COEP headers for FFmpeg WASM
    const response = await env.ASSETS.fetch(request);
    const newRes = new Response(response.body, response);
    Object.entries(COOP).forEach(([k, v]) => newRes.headers.set(k, v));
    return newRes;
  }
}
