'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Toaster, toast } from 'sonner'
import { ArrowUpRight, Loader2 } from 'lucide-react'

export default function OfferBox({
  listingId,
  currency,
}: {
  listingId: string
  currency: string
}) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (loading) return

    const n = Number(amount)
    if (!amount.trim() || Number.isNaN(n) || n <= 0) {
      return toast.error('Enter a valid amount.')
    }

    setLoading(true)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        toast.error('Please login to make an offer.')
        router.push(
          `/auth?next=${encodeURIComponent(`/marketplace/${listingId}`)}`,
        )
        return
      }

      const { error } = await supabase.from('offers').insert({
        listing_id: listingId,
        buyer_id: data.user.id,
        amount: n,
        currency,
        message: message.trim() || null,
      })

      if (error) throw error

      toast.success('Offer sent.')
      setAmount('')
      setMessage('')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send offer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 space-y-3'>
      <Toaster richColors />
      <div className='text-sm font-medium'>Make an offer</div>

      <Input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
        placeholder={`Amount (${currency})`}
        className='bg-black/20 border-white/10'
      />

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Optional message (inspection, payment timing, etc.)'
        className='bg-black/20 border-white/10 min-h-[110px]'
      />

      <Button
        onClick={submit}
        disabled={loading}
        className='bg-white text-black hover:bg-zinc-200 w-full'
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Sending...
          </>
        ) : (
          <>
            Send offer <ArrowUpRight className='ml-2 h-4 w-4' />
          </>
        )}
      </Button>

      <div className='text-xs text-zinc-500'>
        Offers are visible to the seller after submission.
      </div>
    </div>
  )
}
