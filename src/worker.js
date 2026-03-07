export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── CORS Preflight ──
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

    // ── Proxy: /proxy/audio/transcriptions → Groq Whisper ──
    if (url.pathname === '/proxy/audio/transcriptions') {
      const groqUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';

      // Strip incoming auth, inject our secure key from env
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);
      headers.delete('host');

      const response = await fetch(groqUrl, {
        method: 'POST',
        headers,
        body: request.body,
      });

      const newRes = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      newRes.headers.set('Access-Control-Allow-Origin', '*');
      return newRes;
    }

    // ── Proxy: /proxy/chat/completions → Groq LLaMA ──
    if (url.pathname === '/proxy/chat/completions') {
      const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);
      headers.delete('host');

      const response = await fetch(groqUrl, {
        method: 'POST',
        headers,
        body: request.body,
      });

      const newRes = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      newRes.headers.set('Access-Control-Allow-Origin', '*');
      return newRes;
    }

    // ── Serve static files from /public ──
    return env.ASSETS.fetch(request);
  }
}
