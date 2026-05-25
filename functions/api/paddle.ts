interface Env {
  PADDLE_WEBHOOK_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.text()
    const signature = context.request.headers.get('Paddle-Signature')

    if (!signature) {
      return new Response('Keine Signatur', { status: 401 })
    }

    // Event verarbeiten
    const event = JSON.parse(body)
    console.log('Paddle Webhook:', event.event_type)

    switch (event.event_type) {
      case 'subscription.created':
        console.log('✅ Neues Abo:', event.data?.customer?.email)
        break
      case 'subscription.canceled':
        console.log('❌ Abo gekündigt:', event.data?.customer?.email)
        break
      case 'subscription.past_due':
        console.log('⚠️ Zahlung fehlgeschlagen:', event.data?.customer?.email)
        break
      case 'transaction.completed':
        console.log('💳 Zahlung erfolgreich:', event.data?.customer?.email)
        break
      default:
        console.log('Event:', event.event_type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook Fehler:', err)
    return new Response('Fehler', { status: 500 })
  }
}
