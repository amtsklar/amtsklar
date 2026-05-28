export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json() as { event_type?: string; data?: unknown };
    console.log('Paddle webhook received:', body.event_type);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
};
