import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gem, ShieldCheck, Search, Tag, ArrowUpRight } from 'lucide-react'

type Listing = {
  id: string
  title: string
  category: 'gold' | 'car' | 'house' | 'luxury_good'
  price: number
  currency: string
  location: string | null
  cover_image_url: string | null
  is_verified: boolean
  created_at: string
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const supabase = await supabaseServer()
  const param = await searchParams
  const q = (param?.q ?? '').trim()
  const category = (param?.category ?? 'all').trim()

  let query = supabase
    .from('listings')
    .select(
      'id,title,category,price,currency,location,cover_image_url,is_verified,created_at',
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(60)

  if (category !== 'all') query = query.eq('category', category)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data } = await query

  return (
    <div className='min-h-screen px-4 py-6 sm:py-10 pb-40 md:pb-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Header */}
        <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  <Gem className='h-3.5 w-3.5 mr-1 text-amber-50' />
                  StockX
                </Badge>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  <ShieldCheck className='h-3.5 w-3.5 mr-1 text-amber-50' />
                  Approved marketplace
                </Badge>
              </div>
              <h1 className='mt-3 text-2xl sm:text-3xl font-semibold tracking-tight'>
                Marketplace
              </h1>
              <p className='mt-1 text-sm sm:text-base text-zinc-400'>
                Only approved listings appear here. Verified listings get
                priority.
              </p>
            </div>

            <Button asChild className='bg-white text-black hover:bg-zinc-200'>
              <Link href='/sell'>
                List an asset <ArrowUpRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <form className='mt-5 grid gap-3 sm:grid-cols-[1fr_240px_auto]'>
            <div className='relative'>
              <Search className='h-4 w-4 text-zinc-500 absolute left-3 top-3' />
              <input
                name='q'
                defaultValue={q}
                placeholder='Search by title…'
                className='w-full h-10 rounded-md bg-black/20 border border-white/10 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-white/20'
              />
            </div>

            <div className='relative'>
              <Tag className='h-4 w-4 text-zinc-500 absolute left-3 top-3' />
              <select
                name='category'
                defaultValue={category}
                className='w-full h-10 rounded-md bg-black/20 border border-white/10 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-white/20'
              >
                <option value='all'>All categories</option>
                <option value='gold'>Gold</option>
                <option value='car'>Cars</option>
                <option value='house'>Houses</option>
                <option value='luxury_good'>Luxury goods</option>
              </select>
            </div>

            <Button
              type='submit'
              variant='outline'
              className='border-white/15 bg-white/5 hover:bg-white/10'
            >
              Apply
            </Button>
          </form>
        </div>

        {/* Grid */}
        {!data || data.length === 0 ? (
          <Card className='border-white/10 bg-white/5'>
            <CardContent className='p-6 text-sm text-zinc-400'>
              No approved listings yet. Be the first to post a premium asset.
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {(data as Listing[]).map((l) => (
              <Link
                key={l.id}
                href={`/marketplace/${l.id}`}
                className='group rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden'
              >
                <div className='aspect-[4/3] bg-black/30 overflow-hidden'>
                  {l.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.cover_image_url}
                      alt={l.title}
                      className='h-full w-full object-cover group-hover:scale-[1.02] transition'
                    />
                  ) : (
                    <div className='h-full w-full grid place-items-center text-xs text-zinc-500'>
                      No image
                    </div>
                  )}
                </div>

                <div className='p-4 space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <div className='font-medium truncate'>{l.title}</div>
                      <div className='text-xs text-zinc-400 mt-1 capitalize'>
                        {formatCategory(l.category)}
                        {l.location ? ` • ${l.location}` : ''}
                      </div>
                    </div>

                    {l.is_verified ? (
                      <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                        Verified
                      </Badge>
                    ) : (
                      <Badge className='bg-white/10 border border-white/10 text-zinc-300'>
                        Approved
                      </Badge>
                    )}
                  </div>

                  <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
                    <div className='text-xs text-zinc-400'>Price</div>
                    <div className='mt-1 text-lg font-semibold'>
                      {formatMoney(l.price, l.currency)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatCategory(c: Listing['category']) {
  if (c === 'luxury_good') return 'luxury good'
  return c
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
