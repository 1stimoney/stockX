import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import ChatThread from './thread'
import { Button } from '@/components/ui/button'

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
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  const listingTitle = (convo as any)?.listing?.title ?? 'Chat'
  const dealStatus = ((convo as any)?.deal?.status ??
    'awaiting_payment') as string

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
        askingPrice={(convo as any)?.listing?.price ?? null}
        askingCurrency={(convo as any)?.listing?.currency ?? null}
        offerAmount={(offer as any)?.amount ?? null}
        offerCurrency={(offer as any)?.currency ?? null}
        offerMessage={(offer as any)?.message ?? null}
        initialMessages={initial ?? []}
      />
    </div>
  )
}
