import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import OfferBox from './offer-box'
import {
  ArrowLeft,
  Gem,
  MapPin,
  ShieldCheck,
  Tag,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

type Listing = {
  id: string
  seller_id: string
  title: string
  description: string
  category: 'gold' | 'car' | 'house' | 'luxury_good'
  price: number
  currency: string
  location: string | null
  status: 'pending' | 'approved' | 'rejected' | 'sold'
  is_verified: boolean
  cover_image_url: string | null
  created_at: string
}

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await supabaseServer()
  const { id } = await params

  // Only approved listings should be visible here (RLS already enforces this for public).
  const { data: listing } = await supabase
    .from('listings')
    .select(
      'id,seller_id,title,description,category,price,currency,location,status,is_verified,cover_image_url,created_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!listing) return notFound()

  // Optional: seller “trust” preview (only public-safe fields)
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('full_name,country,city')
    .eq('id', (listing as Listing).seller_id)
    .maybeSingle()

  return (
    <div className='min-h-screen px-4 py-6 sm:py-10 pb-28 md:pb-10'>
      <div className='mx-auto max-w-6xl space-y-5'>
        {/* Top bar */}
        <div className='flex items-center justify-between gap-3'>
          <Button
            asChild
            variant='outline'
            className='border-white/15 bg-white/5 hover:bg-white/10'
          >
            <Link href='/marketplace'>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Link>
          </Button>

          <div className='flex items-center gap-2'>
            <Badge className='bg-white/10 border border-white/10 text-amber-50'>
              <Gem className='h-3.5 w-3.5 mr-1 text-amber-50' />
              StockX
            </Badge>
            {listing.is_verified ? (
              <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                <ShieldCheck className='h-3.5 w-3.5 mr-1 text-amber-50' />
                Verified
              </Badge>
            ) : (
              <Badge className='bg-white/10 border border-white/10 text-zinc-300'>
                Approved
              </Badge>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className='grid gap-4 lg:grid-cols-3'>
          {/* Left: Image + Info */}
          <div className='lg:col-span-2 space-y-4'>
            <Card className='border-white/10 bg-white/5 overflow-hidden'>
              <div className='aspect-[16/10] bg-black/30'>
                {listing.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.cover_image_url}
                    alt={listing.title}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='h-full w-full grid place-items-center text-sm text-zinc-500'>
                    No image provided
                  </div>
                )}
              </div>

              <CardContent className='p-5 sm:p-6 space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge className='bg-white/10 border border-white/10 capitalize  text-zinc-100'>
                        <Tag className='h-3.5 w-3.5 mr-1' />
                        {formatCategory(listing.category)}
                      </Badge>
                      {listing.location ? (
                        <Badge className='bg-white/10 border border-white/10 text-zinc-100'>
                          <MapPin className='h-3.5 w-3.5 mr-1' />
                          {listing.location}
                        </Badge>
                      ) : null}
                      <Badge className='bg-white/10 border border-white/10 text-zinc-300'>
                        <Clock className='h-3.5 w-3.5 mr-1' />
                        {formatDate(listing.created_at)}
                      </Badge>
                    </div>

                    <h1 className='mt-3 text-2xl sm:text-3xl font-semibold tracking-tight break-words'>
                      {listing.title}
                    </h1>

                    <p className='mt-2 text-zinc-300 leading-relaxed whitespace-pre-wrap'>
                      {listing.description}
                    </p>
                  </div>

                  <div className='sm:w-[240px]'>
                    <div className='rounded-3xl border border-white/10 bg-black/20 p-4'>
                      <div className='text-xs text-zinc-400'>Asking price</div>
                      <div className='mt-1 text-2xl font-semibold'>
                        {formatMoney(listing.price, listing.currency)}
                      </div>

                      <Separator className='bg-white/10 my-3' />

                      <div className='text-xs text-zinc-400'>
                        Listing status
                      </div>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        <Badge className='bg-white/10 border border-white/10 text-zinc-100'>
                          {listing.is_verified ? 'Verified' : 'Approved'}
                        </Badge>
                        <Badge className='bg-white/10 border border-white/10 capitalize text-zinc-100'>
                          {listing.status}
                        </Badge>
                      </div>

                      <div className='mt-3 text-xs text-zinc-500'>
                        Buyer protection + escrow flow coming next.
                      </div>

                      <Button
                        asChild
                        className='mt-4 w-full bg-white text-black hover:bg-zinc-200'
                      >
                        <Link href={`/marketplace/${listing.id}#offer`}>
                          Make offer <ArrowUpRight className='ml-2 h-4 w-4' />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className='bg-white/10' />

                <div className='rounded-3xl border border-white/10 bg-black/20 p-4'>
                  <div className='text-sm font-medium'>Seller (preview)</div>
                  <div className='mt-2 text-sm text-zinc-400'>
                    {sellerProfile?.full_name ? (
                      <div className='text-zinc-200 font-medium'>
                        {sellerProfile.full_name}
                      </div>
                    ) : (
                      <div className='text-zinc-200 font-medium'>Seller</div>
                    )}
                    <div className='mt-1'>
                      {sellerProfile?.city || sellerProfile?.country
                        ? `${sellerProfile?.city ?? ''}${
                            sellerProfile?.city && sellerProfile?.country
                              ? ', '
                              : ''
                          }${sellerProfile?.country ?? ''}`
                        : 'Location hidden'}
                    </div>
                    <div className='mt-2 text-xs text-zinc-500'>
                      Full identity verification badges will appear after admin
                      review & document checks.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Offer */}
          <div id='offer' className='space-y-4'>
            <OfferBox
              listingId={listing.id}
              currency={(listing.currency || 'USD').toUpperCase()}
            />

            <Card className='border-white/10 bg-white/5'>
              <CardHeader>
                <CardTitle className='text-base'>How it works</CardTitle>
              </CardHeader>
              <CardContent className='text-sm text-zinc-400 space-y-2'>
                <div>1) Submit an offer.</div>
                <div>2) Seller reviews (accept / reject).</div>
                <div>3) Admin confirms payment + transfer workflow.</div>
                <div className='text-xs text-zinc-500 pt-1'>
                  This is MVP — we’ll add escrow & chat next.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
