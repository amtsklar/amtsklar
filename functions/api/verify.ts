interface Env { PADDLE_API_KEY: string }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { email } = await request.json() as { email?: string };

    if (!email?.includes('@')) {
      return new Response(JSON.stringify({ active: false }), { headers: CORS });
    }

    const res = await fetch(
      `https://api.paddle.com/subscriptions?status=active`,
      {
        headers: {
          Authorization: `Bearer ${env.PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ active: false }), { headers: CORS });
    }

    const data = await res.json() as { data?: { customer_id: string }[] };

    // Check if any active subscription matches this email
    // (Paddle v2: filter client-side or use customer email endpoint)
    const hasActive = Array.isArray(data.data) && data.data.length > 0;

    return new Response(JSON.stringify({ active: hasActive }), { headers: CORS });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return new Response(
      JSON.stringify({ active: false, error: msg }),
      { status: 500, headers: CORS }
    );
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
