interface Env { PADDLE_WEBHOOK_SECRET: string }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
