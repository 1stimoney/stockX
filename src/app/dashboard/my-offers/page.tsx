import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function MyOffersPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  if (!user) return null

  const { data: offers } = await supabase
    .from('offers')
    .select('*, listings(title)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className='min-h-screen px-4 py-8'>
      <div className='mx-auto max-w-4xl space-y-4'>
        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle>My Offers</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {!offers?.length ? (
              <div className='text-sm text-zinc-400'>
                You haven’t made any offers yet.
              </div>
            ) : (
              offers.map((o: any) => (
                <div
                  key={o.id}
                  className='rounded-2xl border border-white/10 bg-black/20 p-4'
                >
                  <div className='font-medium'>{o.listings?.title}</div>
                  <div className='text-sm text-zinc-400 mt-1'>
                    {o.currency} {o.amount}
                  </div>

                  <div className='mt-2 text-xs text-zinc-400 capitalize'>
                    Status: {o.status}
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
