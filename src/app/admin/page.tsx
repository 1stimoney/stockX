import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Gem,
  ArrowUpRight,
  Clock,
  RefreshCw,
} from 'lucide-react'

export default async function AdminPage() {
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

  const { data: me } = await supabase
    .from('profiles')
    .select('role,full_name')
    .eq('id', user.id)
    .maybeSingle()

  const role = (me as any)?.role ?? 'user'
  if (role !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='border-white/10 bg-white/5 w-full max-w-md'>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='text-sm text-zinc-400'>
              You don’t have admin access.
            </div>
            <Button
              asChild
              className='w-full bg-white text-black hover:bg-zinc-200'
            >
              <Link href='/dashboard'>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: queue } = await supabase
    .from('listings')
    .select(
      'id,title,category,price,currency,location,cover_image_url,status,is_verified,created_at,seller_id',
    )
    .in('status', ['pending', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(80)

  const { data: approved } = await supabase
    .from('listings')
    .select(
      'id,title,category,price,currency,location,cover_image_url,status,is_verified,created_at,seller_id',
    )
    .in('status', ['approved', 'sold'])
    .order('created_at', { ascending: false })
    .limit(80)

  async function setStatus(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    const status = String(formData.get('status') || '')
    if (!id || !['pending', 'approved', 'rejected', 'sold'].includes(status))
      return

    const supabase = await supabaseServer()
    await supabase.from('listings').update({ status }).eq('id', id)

    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/marketplace')
  }

  async function toggleVerify(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    const next = String(formData.get('next') || 'false') === 'true'

    const supabase = await supabaseServer()
    await supabase.from('listings').update({ is_verified: next }).eq('id', id)

    revalidatePath('/admin')
    revalidatePath('/marketplace')
  }

  async function refresh() {
    'use server'
    revalidatePath('/admin')
  }

  return (
    <div className='min-h-screen px-4 py-8 pb-10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  <Gem className='h-3.5 w-3.5 mr-1 text-amber-50' />
                  StockX Admin
                </Badge>
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  <ShieldCheck className='h-3.5 w-3.5 mr-1 text-amber-50' />
                  Approval console
                </Badge>
              </div>
              <h1 className='mt-3 text-2xl sm:text-3xl font-semibold tracking-tight'>
                Admin approvals
              </h1>
              <p className='mt-1 text-sm sm:text-base text-zinc-400'>
                Approve, reject, verify, and mark listings as sold.
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <form action={refresh}>
                <Button
                  variant='outline'
                  className='border-white/15 bg-white/5 hover:bg-white/10'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Refresh
                </Button>
              </form>
              <Button asChild className='bg-white text-black hover:bg-zinc-200'>
                <Link href='/dashboard'>
                  Dashboard <ArrowUpRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Queue */}
        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle className='text-base'>Queue</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {!queue || queue.length === 0 ? (
              <div className='text-sm text-zinc-400'>
                No pending/rejected listings.
              </div>
            ) : (
              <div className='grid gap-3 md:grid-cols-2'>
                {queue.map((l: any) => (
                  <div
                    key={l.id}
                    className='rounded-3xl border border-white/10 bg-black/20 overflow-hidden'
                  >
                    <div className='p-4 flex gap-3'>
                      <div className='w-28 shrink-0'>
                        <div className='aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 overflow-hidden'>
                          {l.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={l.cover_image_url}
                              alt=''
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <div className='h-full w-full grid place-items-center text-xs text-zinc-500'>
                              No image
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='min-w-0 flex-1 space-y-2'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0'>
                            <div className='font-medium truncate'>
                              {l.title}
                            </div>
                            <div className='text-xs text-zinc-400 capitalize'>
                              {l.category}
                              {l.location ? ` • ${l.location}` : ''}
                            </div>
                          </div>
                          <Badge className='bg-white/10 border border-white/10'>
                            {l.status}
                          </Badge>
                        </div>

                        <div className='text-sm font-semibold'>
                          {formatMoney(l.price, l.currency)}
                        </div>

                        <Separator className='bg-white/10' />

                        <div className='flex flex-wrap gap-2'>
                          <form action={setStatus}>
                            <input type='hidden' name='id' value={l.id} />
                            <input
                              type='hidden'
                              name='status'
                              value='approved'
                            />
                            <Button
                              className='bg-white text-black hover:bg-zinc-200'
                              size='sm'
                            >
                              <CheckCircle2 className='mr-2 h-4 w-4' /> Approve
                            </Button>
                          </form>

                          <form action={setStatus}>
                            <input type='hidden' name='id' value={l.id} />
                            <input
                              type='hidden'
                              name='status'
                              value='rejected'
                            />
                            <Button
                              variant='outline'
                              className='border-white/15 bg-white/5 hover:bg-white/10'
                              size='sm'
                            >
                              <XCircle className='mr-2 h-4 w-4' /> Reject
                            </Button>
                          </form>

                          <form action={toggleVerify}>
                            <input type='hidden' name='id' value={l.id} />
                            <input
                              type='hidden'
                              name='next'
                              value={String(!l.is_verified)}
                            />
                            <Button
                              variant='outline'
                              className='border-white/15 bg-white/5 hover:bg-white/10'
                              size='sm'
                            >
                              <ShieldCheck className='mr-2 h-4 w-4' />
                              {l.is_verified ? 'Unverify' : 'Verify'}
                            </Button>
                          </form>
                        </div>

                        <div className='text-xs text-zinc-500 flex items-center gap-2'>
                          <Clock className='h-3.5 w-3.5' />
                          {new Date(l.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle className='text-base'>Approved & Sold</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {!approved || approved.length === 0 ? (
              <div className='text-sm text-zinc-400'>
                No approved listings yet.
              </div>
            ) : (
              <div className='grid gap-3 md:grid-cols-2'>
                {approved.map((l: any) => (
                  <div
                    key={l.id}
                    className='rounded-3xl border border-white/10 bg-black/20 p-4'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <div className='font-medium truncate'>{l.title}</div>
                        <div className='text-xs text-zinc-400 capitalize'>
                          {l.category}
                          {l.location ? ` • ${l.location}` : ''}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                          {l.status}
                        </Badge>
                        {l.is_verified ? (
                          <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                            Verified
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className='mt-2 text-sm font-semibold'>
                      {formatMoney(l.price, l.currency)}
                    </div>

                    <Separator className='bg-white/10 my-3' />

                    <div className='flex flex-wrap gap-2'>
                      {l.status !== 'sold' ? (
                        <form action={setStatus}>
                          <input type='hidden' name='id' value={l.id} />
                          <input type='hidden' name='status' value='sold' />
                          <Button
                            variant='outline'
                            className='border-white/15 bg-white/5 hover:bg-white/10'
                            size='sm'
                          >
                            Mark sold
                          </Button>
                        </form>
                      ) : null}

                      <form action={toggleVerify}>
                        <input type='hidden' name='id' value={l.id} />
                        <input
                          type='hidden'
                          name='next'
                          value={String(!l.is_verified)}
                        />
                        <Button
                          variant='outline'
                          className='border-white/15 bg-white/5 hover:bg-white/10'
                          size='sm'
                        >
                          <ShieldCheck className='mr-2 h-4 w-4' />
                          {l.is_verified ? 'Unverify' : 'Verify'}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
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
