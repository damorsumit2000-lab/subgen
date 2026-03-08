export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const COOP = {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    };
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400', ...COOP } });
    }

    // ── Groq Whisper ──
    if (url.pathname === '/proxy/audio/transcriptions') {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);
      headers.delete('host');
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST', headers, body: request.body,
      });
      return new Response(response.body, {
        status: response.status,
        headers: { ...Object.fromEntries(response.headers), ...corsHeaders },
      });
    }

    // ── Groq LLaMA ──
    if (url.pathname === '/proxy/chat/completions') {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${env.GROQ_API_KEY}`);
      headers.delete('host');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers, body: request.body,
      });
      return new Response(response.body, {
        status: response.status,
        headers: { ...Object.fromEntries(response.headers), ...corsHeaders },
      });
    }

    // ── YouTube Transcript Proxy ──
    if (url.pathname === '/proxy/yt-transcript') {
      const videoId = url.searchParams.get('id');
      if (!videoId) {
        return new Response(JSON.stringify({ error: 'Missing video id' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      try {
        // Fetch the YouTube watch page
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        if (!pageRes.ok) throw new Error('Could not fetch YouTube page: ' + pageRes.status);
        const html = await pageRes.text();

        // Extract ytInitialPlayerResponse JSON
        const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var |if|<\/script)/s);
        if (!playerMatch) throw new Error('Could not parse YouTube player data — video may be private or age-restricted');

        let playerData;
        try { playerData = JSON.parse(playerMatch[1]); }
        catch (e) { throw new Error('Failed to parse player JSON'); }

        // Get caption tracks
        const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!captions || captions.length === 0) {
          return new Response(JSON.stringify({
            error: 'no_captions',
            message: 'This video has no subtitles/captions available on YouTube. Download the video and upload it here for Whisper AI transcription.'
          }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        // Pick best track: requested lang > English > first
        const lang = url.searchParams.get('lang') || 'en';
        const track = captions.find(t => t.languageCode === lang)
          || captions.find(t => t.languageCode?.startsWith('en'))
          || captions[0];

        // Fetch captions in json3 format (has millisecond timing)
        const captionRes = await fetch(track.baseUrl + '&fmt=json3', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!captionRes.ok) throw new Error('Failed to fetch caption track');
        const captionData = await captionRes.json();

        // Parse events into subtitle objects
        const transcript = (captionData?.events || [])
          .filter(e => e.segs && e.tStartMs !== undefined)
          .map(e => ({
            start: (e.tStartMs / 1000).toFixed(3),
            dur:   ((e.dDurationMs || 2000) / 1000).toFixed(3),
            text:  e.segs.map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim()
          }))
          .filter(e => e.text && !/^\[.+\]$/.test(e.text)); // strip [Music] etc

        if (!transcript.length) throw new Error('Caption track was empty after filtering');

        return new Response(JSON.stringify({
          transcript,
          language: track.languageCode,
          trackName: track.name?.simpleText || track.languageCode,
          availableLangs: captions.map(t => ({ code: t.languageCode, name: t.name?.simpleText }))
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // ── Static assets ──
    const response = await env.ASSETS.fetch(request);
    const newRes = new Response(response.body, response);
    newRes.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    newRes.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    newRes.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    newRes.headers.set('Access-Control-Allow-Origin', '*');
    // Allow FFmpeg WASM scripts and workers from CDN sources
    newRes.headers.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://fonts.googleapis.com; " +
      "worker-src 'self' blob: https://cdn.jsdelivr.net https://unpkg.com; " +
      "connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://api.groq.com https://www.youtube.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "media-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
    );
    return newRes;
  }
}
