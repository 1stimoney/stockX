'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toaster, toast } from 'sonner'

export default function VerifyClient() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()
  const params = useSearchParams()

  const email = params.get('email') || ''
  const flow = params.get('flow') || 'login'

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  const onVerify = async () => {
    setLoading(true)
    try {
      if (!email) throw new Error('Missing email.')

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email',
      })

      await supabase.auth.getSession()
      router.replace('/dashboard')

      if (error) throw error

      // Finalize signup profile
      if (flow === 'signup') {
        const { data: userData, error: uErr } = await supabase.auth.getUser()
        if (uErr) throw uErr

        const user = userData.user
        if (!user) throw new Error('No user session after verification.')

        const raw = localStorage.getItem(`lux_signup_profile:${email}`)
        if (raw) {
          const draft = JSON.parse(raw)
          const password = draft.__password
          delete draft.__password

          // Save profile
          const { error: pErr } = await supabase.from('profiles').upsert({
            id: user.id,
            ...draft,
          })
          if (pErr) throw pErr

          // Set password now that the user is verified + signed in
          const { error: pwErr } = await supabase.auth.updateUser({ password })
          if (pwErr) throw pwErr

          localStorage.removeItem(`lux_signup_profile:${email}`)
        }
      }
      toast.success('Verified ✔')
      router.replace('/dashboard')
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (!error) toast.success('Code resent')
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <Toaster richColors position='top-right' />
      <Card className='w-full max-w-md border-white/10 bg-white/5 backdrop-blur'>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder='Enter code'
            className='text-center'
          />

          <Button
            onClick={onVerify}
            disabled={loading}
            className='w-full bg-white text-black'
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          <Button
            variant='ghost'
            onClick={onResend}
            className='w-full border border-white/10'
          >
            Resend Code
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
