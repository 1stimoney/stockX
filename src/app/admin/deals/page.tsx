import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AdminDealsPage() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return <div className='p-6 text-sm text-zinc-400'>Unauthorized</div>
  }

  const { data: deals } = await supabase
    .from('deals')
    .select(
      `
      id,
      status,
      created_at,
      listings(title),
      offers(amount, currency)
    `,
    )
    .order('created_at', { ascending: false })

  async function updateStatus(formData: FormData) {
    'use server'

    const id = String(formData.get('id') || '')
    const status = String(formData.get('status') || '')

    const supabase = await supabaseServer()

    // Update deal status
    await supabase.from('deals').update({ status }).eq('id', id)

    // Get related listing
    const { data: deal } = await supabase
      .from('deals')
      .select('listing_id')
      .eq('id', id)
      .single()

    if (!deal?.listing_id) return

    // If deal completed → listing becomes sold
    if (status === 'completed') {
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', deal.listing_id)
    }

    // If deal cancelled → listing goes back to approved
    if (status === 'cancelled') {
      await supabase
        .from('listings')
        .update({ status: 'approved' })
        .eq('id', deal.listing_id)
    }

    revalidatePath('/admin/deals')
    revalidatePath('/marketplace')
    revalidatePath('/dashboard')
  }
  return (
    <div className='min-h-screen px-4 py-8'>
      <div className='mx-auto max-w-5xl space-y-4'>
        <h1 className='text-2xl font-semibold'>Deals Panel</h1>

        {!deals?.length ? (
          <div className='text-sm text-zinc-400'>No deals yet.</div>
        ) : (
          deals.map((d: any) => (
            <Card key={d.id} className='border-white/10 bg-white/5'>
              <CardHeader>
                <CardTitle>{d.listings?.title}</CardTitle>
              </CardHeader>

              <CardContent className='space-y-3'>
                <div className='text-sm text-zinc-400'>
                  Offer: {d.offers?.currency} {d.offers?.amount}
                </div>

                <Badge className='bg-white/10 border border-white/10 capitalize text-zinc-300'>
                  {d.status.replace('_', ' ')}
                </Badge>

                <div className='flex flex-wrap gap-2 pt-2'>
                  {d.status === 'awaiting_payment' && (
                    <form action={updateStatus}>
                      <input type='hidden' name='id' value={d.id} />
                      <input
                        type='hidden'
                        name='status'
                        value='payment_received'
                      />
                      <Button className='bg-white text-black'>
                        Payment Received
                      </Button>
                    </form>
                  )}

                  {d.status === 'payment_received' && (
                    <form action={updateStatus}>
                      <input type='hidden' name='id' value={d.id} />
                      <input
                        type='hidden'
                        name='status'
                        value='transfer_initiated'
                      />
                      <Button variant='outline'>Transfer Initiated</Button>
                    </form>
                  )}

                  {d.status === 'transfer_initiated' && (
                    <form action={updateStatus}>
                      <input type='hidden' name='id' value={d.id} />
                      <input type='hidden' name='status' value='completed' />
                      <Button className='bg-white text-black'>
                        Complete Deal
                      </Button>
                    </form>
                  )}

                  {d.status !== 'completed' && (
                    <form action={updateStatus}>
                      <input type='hidden' name='id' value={d.id} />
                      <input type='hidden' name='status' value='cancelled' />
                      <Button variant='destructive'>Cancel</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
