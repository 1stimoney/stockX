import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import ChatShell from './shell'

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const sp = await searchParams
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // role (for admin controls)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (profile as any)?.role ?? 'user'

  // conversations list
  const { data: convos } = await supabase
    .from('conversations')
    .select(
      `
      id,
      buyer_id,
      seller_id,
      deal_id,
      listing_id,
      created_at,
      listing:listings ( id, title ),
      deal:deals ( id, status )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(80)

  const activeId = sp?.c ?? convos?.[0]?.id ?? null

  // Load active conversation context
  const active =
    activeId &&
    (await supabase
      .from('conversations')
      .select(
        `
        id,
        buyer_id,
        seller_id,
        deal_id,
        listing_id,
        listing:listings ( id, title, price, currency ),
        deal:deals (
          id,
          status,
          offer_id,
          payment_currency,
          payment_network,
          payment_address,
          amount_due,
          payment_requested_at,
          buyer_tx_hash,
          buyer_paid_at
        )
      `,
      )
      .eq('id', activeId)
      .maybeSingle())

  const convo = active ? (active as any).data : null

  if (activeId && !convo) return notFound()

  // Accepted offer details (for header)
  const offerId = (convo as any)?.deal?.offer_id as string | undefined
  const { data: offer } = offerId
    ? await supabase
        .from('offers')
        .select('id, amount, currency, message')
        .eq('id', offerId)
        .maybeSingle()
    : { data: null }

  // Messages
  const { data: initialMessages } = activeId
    ? await supabase
        .from('messages')
        .select('id, sender_id, body, created_at, type, data, is_system')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true })
        .limit(300)
    : { data: [] as any[] }

  // -------------------------
  // Server Actions (Payment + Tx + Admin status)
  // -------------------------

  async function startPayment(formData: FormData) {
    'use server'

    if (!activeId) return

    const currency = String(formData.get('currency') || 'USDT').toUpperCase() // BTC | USDT
    const network = String(
      formData.get('network') || (currency === 'BTC' ? 'BTC' : 'TRC20'),
    ).toUpperCase() // BTC | TRC20 | ERC20

    const supabase = await supabaseServer()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return

    const { data: c } = await supabase
      .from('conversations')
      .select('id, deal_id, buyer_id')
      .eq('id', activeId)
      .maybeSingle()

    if (!c) return
    if (c.buyer_id !== user.id) return // buyer only

    const { data: deal } = await supabase
      .from('deals')
      .select('id, status, listing_id, offer_id')
      .eq('id', c.deal_id)
      .single()

    if (!deal || deal.status !== 'awaiting_payment') return

    const { data: off } = await supabase
      .from('offers')
      .select('id, amount, currency')
      .eq('id', deal.offer_id)
      .single()
    if (!off) return

    const { data: addr } = await supabase
      .from('payment_addresses')
      .select('address, currency, network')
      .eq('is_active', true)
      .eq('currency', currency)
      .eq('network', network)
      .maybeSingle()

    if (!addr?.address) return

    await supabase
      .from('deals')
      .update({
        payment_currency: addr.currency,
        payment_network: addr.network,
        payment_address: addr.address,
        amount_due: off.amount,
        payment_requested_at: new Date().toISOString(),
      })
      .eq('id', deal.id)

    // Post payment card message
    await supabase.from('messages').insert({
      conversation_id: c.id,
      sender_id: user.id,
      type: 'payment_request',
      is_system: true,
      body: 'Make payment',
      data: {
        deal_id: deal.id,
        listing_id: deal.listing_id,
        amount_due: off.amount,
        offer_currency: off.currency,
        pay_currency: addr.currency,
        pay_network: addr.network,
        address: addr.address,
      },
    })

    revalidatePath('/dashboard/chat')
  }

  async function submitTxHash(formData: FormData) {
    'use server'
    if (!activeId) return

    const tx = String(formData.get('tx') || '').trim()
    if (!tx) return

    const supabase = await supabaseServer()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return

    const { data: c } = await supabase
      .from('conversations')
      .select('deal_id, buyer_id')
      .eq('id', activeId)
      .single()

    if (!c || c.buyer_id !== user.id) return

    // Save tx + move deal to payment_submitted
    await supabase
      .from('deals')
      .update({
        buyer_tx_hash: tx,
        buyer_paid_at: new Date().toISOString(),
        status: 'payment_submitted',
      })
      .eq('id', c.deal_id)

    // System message
    await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: user.id,
      type: 'text',
      is_system: true,
      body: `Payment submitted. TxID: ${tx}`,
      data: { tx },
    })

    revalidatePath('/dashboard/chat')
  }

  async function adminSetDealStatus(formData: FormData) {
    'use server'
    if (!activeId) return

    const nextStatus = String(formData.get('status') || '').trim()

    const supabase = await supabaseServer()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return

    // verify admin
    const { data: p } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if ((p as any)?.role !== 'admin') return

    const { data: c } = await supabase
      .from('conversations')
      .select('deal_id')
      .eq('id', activeId)
      .single()

    if (!c?.deal_id) return

    // get listing_id for status side effects
    const { data: deal } = await supabase
      .from('deals')
      .select('id, listing_id')
      .eq('id', c.deal_id)
      .single()

    if (!deal) return

    await supabase
      .from('deals')
      .update({ status: nextStatus })
      .eq('id', deal.id)

    // listing side effects
    if (nextStatus === 'completed') {
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', deal.listing_id)
    }

    if (nextStatus === 'cancelled') {
      await supabase
        .from('listings')
        .update({ status: 'approved' })
        .eq('id', deal.listing_id)
    }

    // system message
    await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: user.id,
      type: 'text',
      is_system: true,
      body: `Admin updated deal status → ${nextStatus.replaceAll('_', ' ')}`,
      data: { status: nextStatus },
    })

    revalidatePath('/dashboard/chat')
  }

  return (
    <ChatShell
      meId={user.id}
      role={role}
      convos={convos ?? []}
      activeId={activeId}
      convo={convo}
      offer={offer}
      initialMessages={initialMessages ?? []}
      startPayment={startPayment}
      submitTxHash={submitTxHash}
      adminSetDealStatus={adminSetDealStatus}
    />
  )
}
