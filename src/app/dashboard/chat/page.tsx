import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ChatInboxPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  const { data: convos } = await supabase
    .from('conversations')
    .select(
      'id, created_at, listing_id, deal_id, listings(title), deals(status)',
    )
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className='py-6 sm:py-8 space-y-4'>
      <h1 className='text-xl sm:text-2xl font-semibold'>Chat</h1>

      {!convos?.length ? (
        <Card className='border-white/10 bg-white/5'>
          <CardContent className='p-6 text-sm text-zinc-400'>
            No chats yet. A chat opens automatically when an offer is accepted.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {convos.map((c: any) => (
            <Link
              key={c.id}
              href={`/dashboard/chat/${c.id}`}
              className='block rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4'
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <div className='font-medium truncate'>
                    {c.listings?.title ?? 'Listing'}
                  </div>
                  <div className='text-xs text-zinc-400 mt-1'>
                    Deal:{' '}
                    <span className='capitalize'>
                      {(c.deals?.status ?? 'awaiting_payment').replaceAll(
                        '_',
                        ' ',
                      )}
                    </span>
                  </div>
                </div>
                <Badge className='bg-white/10 border border-white/10 text-zinc-300'>
                  Open
                </Badge>
              </div>

              <div className='mt-2 text-xs text-zinc-500'>
                Started {new Date(c.created_at).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
