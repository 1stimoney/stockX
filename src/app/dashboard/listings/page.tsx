import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, PlusCircle } from 'lucide-react'

export default async function MyListingsPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  if (!user) return null

  const { data: listings } = await supabase
    .from('listings')
    .select('id,title,category,price,currency,status,is_verified,created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className='py-6 sm:py-8 space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <h1 className='text-xl sm:text-2xl font-semibold'>My Listings</h1>
        <Button asChild className='bg-white text-black hover:bg-zinc-200'>
          <Link href='/sell'>
            New <PlusCircle className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </div>

      {!listings?.length ? (
        <Card className='border-white/10 bg-white/5'>
          <CardContent className='p-6 text-sm text-zinc-400'>
            No listings yet.
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {listings.map((l: any) => (
            <Link
              key={l.id}
              href={`/dashboard/listings/${l.id}`}
              className='rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4'
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <div className='font-medium truncate'>{l.title}</div>
                  <div className='text-xs text-zinc-400 capitalize mt-1'>
                    {l.category}
                  </div>
                </div>
                <Badge className='bg-white/10 border border-white/10 capitalize'>
                  {l.status}
                </Badge>
              </div>

              <div className='mt-3 text-lg font-semibold'>
                {formatMoney(l.price, l.currency)}
              </div>

              <div className='mt-3 text-xs text-zinc-500'>
                {l.is_verified ? 'Verified' : 'Not verified'} •{' '}
                <span className='text-zinc-300'>
                  View <ArrowUpRight className='inline h-3.5 w-3.5 ml-1' />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
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
