interface Env { PADDLE_API_KEY: string }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { email } = await context.request.json() as { email: string }
    if (!email || !email.includes('@')) return new Response(JSON.stringify({ active: false }), { headers: { 'Content-Type': 'application/json' } })
    const res = await fetch(`https://api.paddle.com/customers?email=${encodeURIComponent(email)}`, { headers: { 'Authorization': `Bearer ${context.env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' } })
    const data = await res.json() as any
    const active = data.data?.some((c: any) => c.status === 'active') ?? false
    return new Response(JSON.stringify({ active }), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ active: false }), { headers: { 'Content-Type': 'application/json' } })
  }
}
