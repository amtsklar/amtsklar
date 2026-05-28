interface Env { ANTHROPIC_API_KEY: string }

// Language name map for the compact system prompt
const LANG_NAMES: Record<string, string> = {
  de:'German', en:'English', tr:'Turkish', sr:'Serbian',
  hr:'Croatian', hu:'Hungarian', sl:'Slovenian', sk:'Slovak',
  ro:'Romanian', pl:'Polish', ru:'Russian', it:'Italian',
};

// Single compact system prompt — ~85 tokens (was 400+), huge cost saving
const SYSTEM = (lang: string) =>
  `You are AmtsKlar, expert on Austrian official documents. Analyze the provided Austrian government letter/notice and explain it clearly:
1. Document type
2. What it means (simple language)
3. Key deadlines or dates
4. What action is required
5. Who to contact
6. Legal area

Be concise, friendly, no jargon. Respond entirely in ${LANG_NAMES[lang] ?? 'German'}. Not legal advice.`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json() as {
      text?:      string | null;
      imageData?: string | null;
      imageType?: string;
      language?:  string;
    };

    const { text, imageData, imageType = 'image/jpeg', language = 'de' } = body;

    // Build message content
    let content: unknown[];

    if (imageData) {
      content = [
        {
          type: 'image',
          source: { type: 'base64', media_type: imageType, data: imageData },
        },
        { type: 'text', text: 'Analyze this Austrian official document.' },
      ];
    } else if (text?.trim()) {
      // Trim input — max 2500 chars to stay cost-efficient
      const trimmed = text.trim().slice(0, 2500);
      content = [{ type: 'text', text: trimmed }];
    } else {
      return new Response(
        JSON.stringify({ error: 'No content provided' }),
        { status: 400, headers: CORS }
      );
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001', // ~4x cheaper than Sonnet
        max_tokens: 700,                          // enough for a clear explanation
        system:     SYSTEM(language),
        messages:   [{ role: 'user', content }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic API error:', res.status, err);
      return new Response(
        JSON.stringify({ error: 'AI service error — please try again' }),
        { status: 502, headers: CORS }
      );
    }

    const data = await res.json() as { content?: { text: string }[] };
    const result = data.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ result }), { headers: CORS });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: CORS });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
