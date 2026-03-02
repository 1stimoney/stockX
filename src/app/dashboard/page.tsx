import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware should prevent this, but keep it safe.
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

  return (
    <div className='min-h-screen px-4 py-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <Badge className='bg-white/10 border border-white/10'>
                Dashboard
              </Badge>
              <Badge className='bg-white/10 border border-white/10'>
                Role: {role}
              </Badge>
            </div>
            <h1 className='mt-3 text-3xl font-semibold tracking-tight'>
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}.
            </h1>
            <p className='mt-1 text-zinc-400'>
              Your verified access is active. Manage listings and offers from
              here.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {role === 'admin' && (
              <Button
                asChild
                variant='outline'
                className='border-white/15 bg-white/5 hover:bg-white/10'
              >
                <Link href='/admin'>Admin</Link>
              </Button>
            )}
            <LogoutButton />
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-3'>
          <Card className='border-white/10 bg-white/5'>
            <CardHeader>
              <CardTitle className='text-base'>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                asChild
                className='w-full bg-white text-black hover:bg-zinc-200'
              >
                <Link href='/sell'>List an asset</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                className='w-full border-white/15 bg-white/5 hover:bg-white/10'
              >
                <Link href='/marketplace'>Browse marketplace</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='border-white/10 bg-white/5 md:col-span-2'>
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
                  <div className='grid gap-3 sm:grid-cols-2 text-sm'>
                    <InfoRow label='Email' value={user.email ?? '-'} />
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

                  <div className='flex flex-wrap gap-2'>
                    <Badge className='bg-white/10 border border-white/10'>
                      Account: Active
                    </Badge>
                    <Badge className='bg-white/10 border border-white/10'>
                      Email verified via OTP
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
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
