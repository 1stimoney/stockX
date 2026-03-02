import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  Gem,
  ArrowUpRight,
  PlusCircle,
  Store,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react'
import LogoutButton from './logout-button'

type Listing = {
  id: string
  title: string
  category: 'gold' | 'car' | 'house' | 'luxury_good'
  price: number
  currency: string
  location: string | null
  status: 'pending' | 'approved' | 'rejected' | 'sold'
  is_verified: boolean
  cover_image_url: string | null
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const role = (profile as any)?.role ?? 'user'
  const completeness = calcProfileCompleteness(profile)

  // ✅ My Listings
  const { data: listings } = await supabase
    .from('listings')
    .select(
      'id,title,category,price,currency,location,status,is_verified,cover_image_url,created_at',
    )
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className='min-h-screen px-4 py-6 sm:py-8 pb-40 md:pb-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Header */}
        <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  <Gem className='h-3.5 w-3.5 mr-1 text-amber-50' />
                  StockX
                </Badge>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  <ShieldCheck className='h-3.5 w-3.5 mr-1 text-amber-50' />
                  Verified access
                </Badge>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  Role: {role}
                </Badge>
              </div>

              <div>
                <h1 className='text-2xl sm:text-3xl font-semibold tracking-tight'>
                  Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}.
                </h1>
                <p className='text-zinc-400 mt-1 text-sm sm:text-base'>
                  Manage premium listings, offers, and verification — all in one
                  place.
                </p>
              </div>

              {/* Profile completeness */}
              <div className='rounded-2xl border border-white/10 bg-black/20 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-medium'>
                    Profile completeness
                  </div>
                  <div className='text-xs text-zinc-400'>{completeness}%</div>
                </div>
                <Progress value={completeness} className='mt-3' />
                <div className='mt-2 text-xs text-zinc-400'>
                  Completing your profile increases trust and improves buyer
                  quality.
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className='flex flex-col sm:items-end gap-2'>
              <div className='flex flex-wrap gap-2'>
                {role === 'admin' && (
                  <Button
                    asChild
                    variant='outline'
                    className='border-white/15 bg-white/5 hover:bg-white/10'
                  >
                    <Link href='/admin'>
                      Admin <ArrowUpRight className='ml-2 h-4 w-4' />
                    </Link>
                  </Button>
                )}
                <LogoutButton />
              </div>

              <div className='text-xs text-zinc-500'>
                Signed in as <span className='text-zinc-300'>{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className='grid gap-4 lg:grid-cols-3'>
          {/* Quick actions */}
          <Card className='border-white/10 bg-white/5'>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <PlusCircle className='h-4 w-4' />
                Quick actions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                asChild
                className='w-full bg-white text-black hover:bg-zinc-200'
              >
                <Link href='/sell'>
                  List an asset <ArrowUpRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>

              <Button
                asChild
                variant='outline'
                className='w-full border-white/15 bg-white/5 hover:bg-white/10'
              >
                <Link href='/marketplace'>
                  Browse marketplace <Store className='ml-2 h-4 w-4' />
                </Link>
              </Button>

              <Button
                asChild
                variant='outline'
                className='w-full border-white/15 bg-white/5 hover:bg-white/10'
              >
                <Link href='/dashboard/settings'>
                  Account settings <Settings className='ml-2 h-4 w-4' />
                </Link>
              </Button>

              <Separator className='bg-white/10' />

              <div className='text-xs text-zinc-400'>
                Next: offers, document upload, escrow flow.
              </div>
            </CardContent>
          </Card>

          {/* Profile card */}
          <Card className='border-white/10 bg-white/5 lg:col-span-2'>
            <CardHeader>
              <CardTitle className='text-base'>Your profile</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!profile ? (
                <div className='text-sm text-zinc-400'>
                  No profile found yet. If you just verified, refresh once.
                </div>
              ) : (
                <>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <InfoRow
                      label='Full name'
                      value={profile.full_name ?? '-'}
                    />
                    <InfoRow label='Phone' value={profile.phone ?? '-'} />
                    <InfoRow label='Country' value={profile.country ?? '-'} />
                    <InfoRow
                      label='State'
                      value={(profile as any).state ?? '-'}
                    />
                    <InfoRow label='City' value={profile.city ?? '-'} />
                    <InfoRow label='Address' value={profile.address ?? '-'} />
                    <InfoRow
                      label='Occupation'
                      value={profile.occupation ?? '-'}
                    />
                    <InfoRow label='Company' value={profile.company ?? '-'} />
                    <InfoRow label='ID Type' value={profile.id_type ?? '-'} />
                    <InfoRow
                      label='ID Number'
                      value={profile.id_number ?? '-'}
                    />
                    <InfoRow
                      label='Source of funds'
                      value={profile.source_of_funds ?? '-'}
                    />
                    <InfoRow
                      label='Income range'
                      value={profile.annual_income_range ?? '-'}
                    />
                  </div>

                  <Separator className='bg-white/10' />

                  <div className='rounded-2xl border border-white/10 bg-black/20 p-4'>
                    <div className='text-sm font-medium'>Trust indicators</div>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                        Email verified
                      </Badge>
                      <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                        Identity submitted
                      </Badge>
                      <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                        Escrow-ready (coming)
                      </Badge>
                    </div>
                    <div className='mt-2 text-xs text-zinc-400'>
                      When we add document upload + admin approval, Verified
                      badges will appear here.
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ✅ My Listings */}
        <Card className='border-white/10 bg-white/5'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>My Listings</CardTitle>
            <Button
              asChild
              variant='outline'
              className='border-white/15 bg-white/5 hover:bg-white/10'
            >
              <Link href='/sell'>
                New listing <PlusCircle className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {!listings || listings.length === 0 ? (
              <div className='rounded-2xl border border-white/10 bg-black/20 p-5'>
                <div className='text-sm text-zinc-200 font-medium'>
                  No listings yet
                </div>
                <div className='mt-1 text-sm text-zinc-400'>
                  Create your first listing and submit it for approval.
                </div>
                <div className='mt-4'>
                  <Button
                    asChild
                    className='bg-white text-black hover:bg-zinc-200'
                  >
                    <Link href='/sell'>List an asset</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {(listings as Listing[]).map((l) => (
                  <Link
                    key={l.id}
                    href={`/dashboard/listings/${l.id}`}
                    className='group rounded-3xl border border-white/10 bg-black/20 hover:bg-black/30 transition overflow-hidden'
                  >
                    <div className='p-4 space-y-3'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <div className='font-medium truncate'>{l.title}</div>
                          <div className='text-xs text-zinc-400 flex items-center gap-2 mt-1'>
                            <Tag className='h-3.5 w-3.5' />
                            <span className='capitalize'>
                              {formatCategory(l.category)}
                            </span>
                            {l.location ? (
                              <span className='truncate'>• {l.location}</span>
                            ) : null}
                          </div>
                        </div>

                        <StatusPill
                          status={l.status}
                          verified={l.is_verified}
                        />
                      </div>

                      <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
                        <div className='text-xs text-zinc-400'>
                          Asking price
                        </div>
                        <div className='mt-1 text-lg font-semibold'>
                          {formatMoney(l.price, l.currency)}
                        </div>
                      </div>

                      <div className='text-xs text-zinc-500 flex items-center gap-2'>
                        <Clock className='h-3.5 w-3.5' />
                        <span>Submitted {formatDate(l.created_at)}</span>
                        <span className='ml-auto text-zinc-400 group-hover:text-zinc-200 transition'>
                          View{' '}
                          <ArrowUpRight className='inline h-3.5 w-3.5 ml-1' />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle className='text-base'>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-zinc-400'>
              After we build offers, you’ll see:
              <ul className='mt-2 list-disc pl-5 space-y-1'>
                <li>Submitted listings</li>
                <li>Admin approval updates</li>
                <li>Buyer offers</li>
                <li>Status changes (pending → approved → sold)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
      <div className='text-xs text-zinc-400'>{label}</div>
      <div className='mt-1 font-medium text-zinc-100 break-words'>{value}</div>
    </div>
  )
}

function StatusPill({
  status,
  verified,
}: {
  status: Listing['status']
  verified: boolean
}) {
  const common =
    'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] whitespace-nowrap'
  if (status === 'approved') {
    return (
      <span className={`${common} border-white/10 bg-white/10 text-amber-50`}>
        <CheckCircle2 className='h-3.5 w-3.5' />
        Approved{verified ? ' • Verified' : ''}
      </span>
    )
  }
  if (status === 'sold') {
    return (
      <span className={`${common} border-white/10 bg-white/10 text-zinc-100`}>
        <CheckCircle2 className='h-3.5 w-3.5' />
        Sold
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className={`${common} border-white/10 bg-white/5 text-zinc-300`}>
        <XCircle className='h-3.5 w-3.5' />
        Rejected
      </span>
    )
  }
  return (
    <span className={`${common} border-white/10 bg-white/5 text-zinc-300`}>
      <Clock className='h-3.5 w-3.5' />
      Pending
    </span>
  )
}

function calcProfileCompleteness(profile: any): number {
  if (!profile) return 0

  const fields = [
    'full_name',
    'phone',
    'country',
    'state',
    'city',
    'address',
    'dob',
    'occupation',
    'id_type',
    'id_number',
    'source_of_funds',
    'annual_income_range',
  ]

  let filled = 0
  for (const f of fields) {
    const v = profile?.[f]
    if (v !== null && v !== undefined && String(v).trim() !== '') filled++
  }
  return Math.round((filled / fields.length) * 100)
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
