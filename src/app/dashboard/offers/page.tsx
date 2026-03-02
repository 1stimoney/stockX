import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function SellerOffersPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='border-white/10 bg-white/5 w-full max-w-md'>
          <CardHeader>
            <CardTitle>Not signed in</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className='w-full bg-white text-black hover:bg-zinc-200'
            >
              <Link href='/auth'>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get offers for listings you own
  const { data: offers } = await supabase
    .from('offers')
    .select(
      'id,amount,currency,message,status,created_at,listing_id, listings(title)',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className='min-h-screen px-4 py-8 pb-28 md:pb-8'>
      <div className='mx-auto max-w-4xl space-y-4'>
        <Button
          asChild
          variant='outline'
          className='border-white/15 bg-white/5 hover:bg-white/10'
        >
          <Link href='/dashboard'>← Back</Link>
        </Button>

        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle>Offers</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {!offers || offers.length === 0 ? (
              <div className='text-sm text-zinc-400'>No offers yet.</div>
            ) : (
              offers.map((o: any) => (
                <div
                  key={o.id}
                  className='rounded-2xl border border-white/10 bg-black/20 p-4'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <div className='font-medium truncate'>
                        {o.listings?.title ?? 'Listing'}
                      </div>
                      <div className='text-xs text-zinc-400 mt-1'>
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge className='bg-white/10 border border-white/10'>
                      {o.status}
                    </Badge>
                  </div>

                  <div className='mt-2 text-lg font-semibold'>
                    {formatMoney(o.amount, o.currency)}
                  </div>

                  {o.message ? (
                    <div className='mt-2 text-sm text-zinc-300'>
                      {o.message}
                    </div>
                  ) : null}

                  <div className='mt-3 text-xs text-zinc-500'>
                    Offer actions (accept/reject) next.
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}
