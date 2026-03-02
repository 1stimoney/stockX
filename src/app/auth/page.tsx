'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'
import { ShieldCheck, Sparkles } from 'lucide-react'

export default function AuthPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  // LOGIN
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  const [lLoading, setLLoading] = useState(false)

  // SIGNUP
  const [sEmail, setSEmail] = useState('')
  const [sPass, setSPass] = useState('')
  const [sPass2, setSPass2] = useState('')
  const [sLoading, setSLoading] = useState(false)

  // Profile fields (more info)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [occupation, setOccupation] = useState('')
  const [company, setCompany] = useState('')
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [sourceOfFunds, setSourceOfFunds] = useState('')
  const [incomeRange, setIncomeRange] = useState('')

  const onLogin = async () => {
    setLLoading(true)
    try {
      const email = lEmail.trim()

      // Step 1: validate password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: lPass,
      })
      if (error) throw error

      // We don't want to stay in this session; we want OTP-gated final session.
      await supabase.auth.signOut()

      // Step 2: Supabase sends OTP email code
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (otpErr) throw otpErr

      toast.success('Verification code sent. Check your email.')
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
    } catch (e: any) {
      toast.error(e?.message || 'Login failed')
    } finally {
      setLLoading(false)
    }
  }

  const onSignup = async () => {
    if (sLoading) return
    setSLoading(true)
    try {
      if (sPass !== sPass2) throw new Error('Passwords do not match.')
      const email = sEmail.trim().toLowerCase()

      // Save everything (including password) temporarily
      const draft = {
        role: 'user',
        full_name: fullName,
        phone,
        country,
        state,
        city,
        address,
        postal_code: postalCode,
        dob: dob || null,
        gender,
        occupation,
        company,
        id_type: idType,
        id_number: idNumber,
        source_of_funds: sourceOfFunds,
        annual_income_range: incomeRange,
        __password: sPass, // store temporarily for set-password after verify
      }
      localStorage.setItem(`lux_signup_profile:${email}`, JSON.stringify(draft))

      // Create user via OTP (Supabase sends the email code)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) throw error

      toast.success('Verification code sent. Check your email.')
      router.push(`/auth/verify?email=${encodeURIComponent(email)}&flow=signup`)
    } catch (e: any) {
      toast.error(e?.message || 'Signup failed')
    } finally {
      setSLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-10'>
      <Toaster richColors position='top-right' />
      <div className='w-full max-w-5xl'>
        <div className='mb-6'>
          <div className='flex items-center gap-2'>
            <Badge className='bg-white/10 border border-white/10 text-amber-50'>
              <Sparkles className='h-3.5 w-3.5 mr-1 text-amber-50' /> Luxury
              Access
            </Badge>
            <Badge className='bg-white/10 border border-white/10 text-amber-50'>
              <ShieldCheck className='h-3.5 w-3.5 mr-1 text-amber-50' /> Email
              code verification
            </Badge>
          </div>
          <h1 className='mt-3 text-3xl font-semibold tracking-tight'>
            LuxConsign Auth
          </h1>
          <p className='text-zinc-400 mt-1'>
            High-value marketplace — identity-first onboarding.
          </p>
        </div>

        <Card className='border-white/10 bg-white/5 backdrop-blur'>
          <CardHeader>
            <CardTitle>Sign in / Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='login' className='w-full'>
              <TabsList className='grid w-full grid-cols-2 bg-black/30 border border-white/10'>
                <TabsTrigger value='login'>Login</TabsTrigger>
                <TabsTrigger value='signup'>Signup</TabsTrigger>
              </TabsList>

              <TabsContent value='login' className='mt-6 space-y-4'>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <Input
                      value={lEmail}
                      onChange={(e) => setLEmail(e.target.value)}
                      placeholder='you@example.com'
                      className='bg-black/20 border-white/10'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Password</Label>
                    <Input
                      value={lPass}
                      onChange={(e) => setLPass(e.target.value)}
                      type='password'
                      placeholder='••••••••'
                      className='bg-black/20 border-white/10'
                    />
                  </div>
                </div>

                <Button
                  onClick={onLogin}
                  disabled={lLoading}
                  className='w-full bg-white text-black hover:bg-zinc-200'
                >
                  {lLoading ? 'Checking...' : 'Continue (send email code)'}
                </Button>

                <p className='text-xs text-zinc-400'>
                  We’ll verify your password, then send a Supabase email code to
                  complete sign-in.
                </p>
              </TabsContent>

              <TabsContent value='signup' className='mt-6 space-y-5'>
                <div className='grid md:grid-cols-2 gap-4'>
                  <Field label='Email'>
                    <Input
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='Phone'>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Full name'>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='Date of birth'>
                    <Input
                      type='date'
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Country'>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='State'>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='City'>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='Postal code'>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Address' className='md:col-span-2'>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Gender'>
                    <Input
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      placeholder='Optional'
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='Occupation'>
                    <Input
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Company'>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='Source of funds'>
                    <Input
                      value={sourceOfFunds}
                      onChange={(e) => setSourceOfFunds(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Annual income range'>
                    <Input
                      value={incomeRange}
                      onChange={(e) => setIncomeRange(e.target.value)}
                      placeholder='e.g. $50k–$100k'
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <div />

                  <Field label='ID Type (Passport/NIN/Driver’s License)'>
                    <Input
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='ID Number'>
                    <Input
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>

                  <Field label='Password'>
                    <Input
                      type='password'
                      value={sPass}
                      onChange={(e) => setSPass(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                  <Field label='Confirm password'>
                    <Input
                      type='password'
                      value={sPass2}
                      onChange={(e) => setSPass2(e.target.value)}
                      className='bg-black/20 border-white/10'
                    />
                  </Field>
                </div>

                <Button
                  onClick={onSignup}
                  disabled={sLoading}
                  className='w-full bg-white text-black hover:bg-zinc-200'
                >
                  {sLoading ? 'Creating...' : 'Create account'}
                </Button>

                <p className='text-xs text-zinc-400'>
                  After signup, login to receive an email code and complete
                  access.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
