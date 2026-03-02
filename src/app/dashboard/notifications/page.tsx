import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function NotificationsPage() {
  const supabase = await supabaseServer()

  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id,type,title,body,data,is_read,created_at')
    .order('created_at', { ascending: false })
    .limit(80)

  async function markRead(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    const supabase = await supabaseServer()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    revalidatePath('/dashboard/notifications')
  }

  async function markAllRead() {
    'use server'
    const supabase = await supabaseServer()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user!
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    revalidatePath('/dashboard/notifications')
  }

  return (
    <div className='py-6 sm:py-8 space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <h1 className='text-xl sm:text-2xl font-semibold'>Notifications</h1>

        <form action={markAllRead}>
          <Button
            variant='outline'
            className='border-white/15 bg-white/5 hover:bg-white/10'
          >
            Mark all read
          </Button>
        </form>
      </div>

      {!notifications?.length ? (
        <Card className='border-white/10 bg-white/5'>
          <CardContent className='p-6 text-sm text-zinc-400'>
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {notifications.map((n: any) => (
            <Card key={n.id} className='border-white/10 bg-white/5'>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <CardTitle className='text-base'>{n.title}</CardTitle>
                    <div className='mt-1 text-xs text-zinc-500'>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Badge className='bg-white/10 border border-white/10'>
                      {n.type}
                    </Badge>
                    {!n.is_read ? (
                      <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                        New
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-3'>
                {n.body ? (
                  <div className='text-sm text-zinc-300'>{n.body}</div>
                ) : null}

                <Separator className='bg-white/10' />

                <div className='flex flex-wrap gap-2'>
                  {/* quick links (optional) */}
                  {n.data?.listing_id ? (
                    <Button
                      asChild
                      variant='outline'
                      className='border-white/15 bg-white/5 hover:bg-white/10'
                      size='sm'
                    >
                      <Link href={`/marketplace/${n.data.listing_id}`}>
                        View listing
                      </Link>
                    </Button>
                  ) : null}

                  {n.data?.deal_id ? (
                    <Button
                      asChild
                      variant='outline'
                      className='border-white/15 bg-white/5 hover:bg-white/10'
                      size='sm'
                    >
                      <Link href={`/admin/deals`}>View deal</Link>
                    </Button>
                  ) : null}

                  {!n.is_read ? (
                    <form action={markRead}>
                      <input type='hidden' name='id' value={n.id} />
                      <Button
                        className='bg-white text-black hover:bg-zinc-200'
                        size='sm'
                      >
                        Mark read
                      </Button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
