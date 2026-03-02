'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toaster, toast } from 'sonner'

export default function VerifyPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()
  const params = useSearchParams()

  const email = params.get('email') || ''
  const flow = params.get('flow') || 'login' // "login" | "signup"

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  const onVerify = async () => {
    setLoading(true)
    try {
      if (!email) throw new Error('Missing email. Go back and try again.')

      // 1) Verify OTP with Supabase (this creates the session)
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email',
      })
      if (error) throw error

      // 2) If this was signup flow, finalize profile insert
      if (flow === 'signup') {
        const { data: userData, error: uErr } = await supabase.auth.getUser()
        if (uErr) throw uErr

        const user = userData.user
        if (!user) throw new Error('No user session after verification.')

        const raw = localStorage.getItem(`lux_signup_profile:${email}`)
        if (raw) {
          const draft = JSON.parse(raw)

          const { error: pErr } = await supabase.from('profiles').upsert({
            id: user.id,
            ...draft,
          })

          if (pErr) throw pErr

          localStorage.removeItem(`lux_signup_profile:${email}`)
        }
      }

      toast.success('Verified. Welcome in.')
      router.replace('/dashboard')
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    try {
      if (!email) throw new Error('Missing email.')

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (error) throw error

      toast.success('New code sent.')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to resend')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <Toaster richColors />
      <Card className='w-full max-w-md border-white/10 bg-white/5 backdrop-blur'>
        <CardHeader>
          <CardTitle>Enter email code</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-zinc-400'>
            Code sent to <span className='text-zinc-200'>{email}</span>
          </div>

          <Input
            value={token}
            onChange={(e) =>
              setToken(e.target.value.replace(/\s/g, '').slice(0, 8))
            }
            placeholder='Enter code'
            className='bg-black/20 border-white/10 text-center tracking-[0.35em] font-semibold'
          />

          <Button
            onClick={onVerify}
            disabled={loading || token.trim().length < 4}
            className='w-full bg-white text-black hover:bg-zinc-200'
          >
            {loading ? 'Verifying...' : 'Verify & continue'}
          </Button>

          <Button
            type='button'
            variant='ghost'
            onClick={onResend}
            className='w-full border border-white/10 bg-white/5 hover:bg-white/10'
          >
            Resend code
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
