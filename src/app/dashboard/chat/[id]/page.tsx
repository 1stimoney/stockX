import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import ChatThread from './thread'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await supabaseServer()

  // ✅ Use aliases so TS doesn't treat nested selects as arrays
  const { data: convo } = await supabase
    .from('conversations')
    .select(
      `
      id,
      listing_id,
      deal_id,
      listing:listings (
        id,
        title,
        price,
        currency
      ),
      deal:deals (
        id,
        status,
        offer_id
      )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (!convo) return notFound()

  // Pull the accepted offer (from deal.offer_id)
  const offerId = (convo as any)?.deal?.offer_id as string | undefined

  const { data: offer } = offerId
    ? await supabase
        .from('offers')
        .select('id, amount, currency, message, status, created_at')
        .eq('id', offerId)
        .maybeSingle()
    : { data: null }

  const { data: initial } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, type, data, is_system')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  const listingTitle = (convo as any)?.listing?.title ?? 'Chat'
  const dealStatus = ((convo as any)?.deal?.status ??
    'awaiting_payment') as string

  async function startPayment(formData: FormData) {
    'use server'

    const currency = String(formData.get('currency') || 'USDT').toUpperCase() // BTC | USDT
    const network = String(
      formData.get('network') || (currency === 'BTC' ? 'BTC' : 'TRC20'),
    ).toUpperCase() // BTC | TRC20 | ERC20

    const supabase = await supabaseServer()

    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return

    // Load convo again to validate participant & fetch deal_id
    const { data: c } = await supabase
      .from('conversations')
      .select('id, deal_id, buyer_id, seller_id')
      .eq('id', id)
      .maybeSingle()

    if (!c) return
    if (c.buyer_id !== user.id) return // ✅ only buyer can start payment

    // Deal
    const { data: deal } = await supabase
      .from('deals')
      .select(
        'id, status, listing_id, offer_id, buyer_id, seller_id, payment_requested_at',
      )
      .eq('id', c.deal_id)
      .single()

    // Only when awaiting payment
    if (!deal || deal.status !== 'awaiting_payment') return

    // Accepted offer (amount_due)
    const { data: off } = await supabase
      .from('offers')
      .select('id, amount, currency')
      .eq('id', deal.offer_id)
      .single()

    if (!off) return

    // Pick active address
    const { data: addr } = await supabase
      .from('payment_addresses')
      .select('address, currency, network')
      .eq('is_active', true)
      .eq('currency', currency)
      .eq('network', network)
      .maybeSingle()

    if (!addr?.address) return

    // Update deal payment fields
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

    // Post payment request message into chat
    await supabase.from('messages').insert({
      conversation_id: c.id,
      sender_id: user.id, // buyer triggers it
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

    revalidatePath(`/dashboard/chat/${id}`)
  }

  return (
    <div className='py-6 sm:py-8 space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <Button
          asChild
          variant='outline'
          className='border-white/15 bg-white/5 hover:bg-white/10'
        >
          <Link href='/dashboard/chat'>← Inbox</Link>
        </Button>

        <div className='text-sm text-zinc-400 truncate'>{listingTitle}</div>
      </div>

      <ChatThread
        conversationId={id}
        dealStatus={dealStatus}
        listingTitle={listingTitle}
        buyerId={(convo as any)?.buyer_id}
        askingPrice={(convo as any)?.listing?.price ?? null}
        askingCurrency={(convo as any)?.listing?.currency ?? null}
        offerAmount={(offer as any)?.amount ?? null}
        offerCurrency={(offer as any)?.currency ?? null}
        offerMessage={(offer as any)?.message ?? null}
        initialMessages={initial ?? []}
        startPayment={startPayment}
      />
    </div>
  )
}
