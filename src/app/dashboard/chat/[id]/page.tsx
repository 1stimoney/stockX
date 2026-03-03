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

  const { data: convo } = await supabase
    .from('conversations')
    .select('id, listing_id, deal_id, listings(title), deals(status)')
    .eq('id', id)
    .maybeSingle()

  if (!convo) return notFound()

  const { data: initial } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

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

        <div className='text-sm text-zinc-400 truncate'>
          {convo.listings?.[0]?.title ?? 'Chat'}
        </div>
      </div>

      <ChatThread
        conversationId={id}
        dealStatus={(convo.deals?.[0].status ?? 'awaiting_payment') as string}
        initialMessages={initial ?? []}
      />
    </div>
  )
}
