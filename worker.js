/**
 * Cloudflare Worker — SchemeNavigator
 * Handles:
 * 1. /api/sessions/ — Session token generation
 * 2. /api/assistant/chat/ — Mitra AI Assistant powered by Google Gemini API
 * 3. Static Assets — React / Vite frontend SPA
 */

import buildConfig from './worker-env.json';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
        },
      });
    }

    // 1. Session Token Endpoint
    if (url.pathname === '/api/sessions/' && request.method === 'POST') {
      return Response.json(
        {
          token: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. Mitra AI Chat Endpoint (Direct Google Gemini AI on Cloudflare Edge)
    if (url.pathname === '/api/assistant/chat/' && request.method === 'POST') {
      try {
        const body = await request.json();
        const message = body.message || '';
        const history = body.history || [];
        const profile = body.profile || null;
        const language = body.language || 'en-IN';

        const apiKey =
          (env.GEMINI_API_KEY || '').trim() ||
          (env.LITELLM_API_KEY || '').trim() ||
          (env.VITE_GEMINI_API_KEY || '').trim() ||
          (env.GEMINI_KEY || '').trim() ||
          (buildConfig.GEMINI_API_KEY || '').trim();

        if (!apiKey) {
          console.warn('GEMINI_API_KEY not found in env or buildConfig. Available keys:', Object.keys(env || {}));
          return Response.json(
            {
              answer:
                'Mitra AI: Please configure GEMINI_API_KEY in your Cloudflare dashboard (Settings > Variables and Secrets) and click "Deploy" or "Retry deployment" to apply it.',
              referencedSchemes: [],
              profileUpdated: false,
            },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
              },
            }
          );
        }

        const systemText = `You are Mitra (मित्र), the friendly, witty, highly knowledgeable, and empathetic AI Welfare Counselor on SchemeNavigator for Indian citizens.
Target language code: ${language}.
Always answer helpfully in the user's requested language.
Citizen profile: ${JSON.stringify(profile || {})}
Provide accurate welfare scheme information (eligibility, benefits, documents, how to apply).
If recommending specific schemes, append their slugs at the end like: <schemes>pm-kisan,ayushman-bharat</schemes>.`;

        const contents = [];
        let expectingUser = true;
        for (const h of history.slice(-6)) {
          const role = h.role === 'user' ? 'user' : 'model';
          if (expectingUser && role === 'user') {
            contents.push({ role: 'user', parts: [{ text: h.content }] });
            expectingUser = false;
          } else if (!expectingUser && role === 'model') {
            contents.push({ role: 'model', parts: [{ text: h.content }] });
            expectingUser = true;
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: systemText }],
              },
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
              },
            }),
          }
        );



        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error('Gemini API error:', errText);
          throw new Error('Gemini API call failed');
        }

        const geminiData = await geminiRes.json();
        const rawAnswer =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Namaste! How can I help you explore government schemes today?';

        let answer = rawAnswer;
        const schemeSlugs = [];
        const match = rawAnswer.match(/<schemes>(.*?)<\/schemes>/);
        if (match) {
          answer = rawAnswer.replace(/<schemes>.*?<\/schemes>/g, '').trim();
          const slugs = match[1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          schemeSlugs.push(...slugs);
        }

        return Response.json(
          {
            answer,
            referencedSchemes: schemeSlugs.map((slug) => ({ slug, name: slug })),
            profileUpdated: false,
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (err) {
        console.error('Chat error:', err);
        return Response.json(
          {
            answer:
              'Namaste! I am currently unable to reach the AI service. You can explore all government welfare schemes directly in our Explore directory.',
            referencedSchemes: [],
            profileUpdated: false,
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // 3. Fallback to Static Assets (SPA)
    return env.ASSETS.fetch(request);
  },
};
