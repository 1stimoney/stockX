'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'
import { Copy, Loader2, Send } from 'lucide-react'

type Msg = {
  id: string
  sender_id: string
  body: string
  created_at: string
  type?: 'text' | 'payment_request'
  data?: any
  is_system?: boolean
}

export default function Thread({
  meId,
  role,
  conversationId,
  convo,
  offer,
  initialMessages,
  startPayment,
  submitTxHash,
  adminSetDealStatus,
}: any) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [tx, setTx] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const deal = convo?.deal
  const listing = convo?.listing
  const dealStatus: string = deal?.status ?? 'awaiting_payment'
  const buyerId: string = convo?.buyer_id
  const isBuyer = meId === buyerId
  const isAdmin = role === 'admin'

  const chatLocked = dealStatus === 'cancelled'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as any
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row as Msg]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversationId])

  const send = async () => {
    if (sending) return
    if (chatLocked)
      return toast.error('This deal is cancelled. Chat is locked.')
    const body = text.trim()
    if (!body) return

    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: meId,
        body,
        type: 'text',
      })
      if (error) throw error
      setText('')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const statusBadge = dealStatus.replaceAll('_', ' ')

  return (
    <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden'>
      <Toaster richColors position='top-right' />

      {/* Deal Panel */}
      <div className='p-4 sm:p-5 border-b border-white/10 space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='text-sm font-medium truncate'>
              {listing?.title ?? 'Deal chat'}
            </div>
            <div className='mt-1 flex flex-wrap items-center gap-2'>
              <Badge className='bg-white/10 border border-white/10 capitalize'>
                {statusBadge}
              </Badge>
              {deal?.buyer_tx_hash ? (
                <Badge className='bg-white/10 border border-white/10 text-amber-50'>
                  Tx submitted
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Pricing summary */}
        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-[11px] text-zinc-400'>Asking price</div>
            <div className='mt-1 text-sm font-medium text-zinc-100'>
              {listing?.price && listing?.currency
                ? formatMoney(listing.price, listing.currency)
                : '—'}
            </div>
          </div>

          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-[11px] text-zinc-400'>Accepted offer</div>
            <div className='mt-1 text-sm font-medium text-zinc-100'>
              {offer?.amount && offer?.currency
                ? formatMoney(offer.amount, offer.currency)
                : '—'}
            </div>
          </div>
        </div>

        {/* Buyer Payment controls */}
        {isBuyer && dealStatus === 'awaiting_payment' ? (
          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-sm font-medium'>Payment</div>
            <div className='mt-1 text-xs text-zinc-400'>
              Choose payment method. A payment instruction will be posted in
              chat.
            </div>

            <div className='mt-3 flex flex-wrap gap-2'>
              <form action={startPayment}>
                <input type='hidden' name='currency' value='BTC' />
                <input type='hidden' name='network' value='BTC' />
                <Button
                  className='bg-white text-black hover:bg-zinc-200'
                  size='sm'
                >
                  Start BTC payment
                </Button>
              </form>

              <form action={startPayment}>
                <input type='hidden' name='currency' value='USDT' />
                <input type='hidden' name='network' value='TRC20' />
                <Button
                  variant='outline'
                  className='border-white/15 bg-white/5 hover:bg-white/10'
                  size='sm'
                >
                  Start USDT (TRC20)
                </Button>
              </form>

              <form action={startPayment}>
                <input type='hidden' name='currency' value='USDT' />
                <input type='hidden' name='network' value='ERC20' />
                <Button
                  variant='outline'
                  className='border-white/15 bg-white/5 hover:bg-white/10'
                  size='sm'
                >
                  Start USDT (ERC20)
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Buyer Tx Hash submission */}
        {isBuyer &&
        (dealStatus === 'awaiting_payment' ||
          dealStatus === 'payment_submitted') ? (
          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-sm font-medium'>Transaction Hash (TxID)</div>
            <div className='mt-1 text-xs text-zinc-400'>
              After you send crypto, paste the TxID here so admin can verify.
            </div>

            <form action={submitTxHash} className='mt-3 flex gap-2'>
              <Input
                name='tx'
                value={tx}
                onChange={(e) => setTx(e.target.value)}
                placeholder='Paste TxID / hash...'
                className='bg-black/20 border-white/10'
              />
              <Button
                className='bg-white text-black hover:bg-zinc-200'
                type='submit'
              >
                Submit
              </Button>
            </form>

            {deal?.buyer_tx_hash ? (
              <div className='mt-2 text-xs text-zinc-400 break-all'>
                Submitted:{' '}
                <span className='text-zinc-200'>{deal.buyer_tx_hash}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Admin controls */}
        {isAdmin ? (
          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-sm font-medium'>Admin controls</div>
            <div className='mt-1 text-xs text-zinc-400'>
              Update deal status. Completed → listing sold. Cancelled → listing
              approved.
            </div>

            {deal?.buyer_tx_hash ? (
              <div className='mt-2 text-xs text-zinc-400 break-all'>
                TxID:{' '}
                <span className='text-zinc-200'>{deal.buyer_tx_hash}</span>
              </div>
            ) : null}

            <div className='mt-3 flex flex-wrap gap-2'>
              <form action={adminSetDealStatus}>
                <input type='hidden' name='status' value='payment_received' />
                <Button
                  className='bg-white text-black hover:bg-zinc-200'
                  size='sm'
                >
                  Mark payment received
                </Button>
              </form>

              <form action={adminSetDealStatus}>
                <input type='hidden' name='status' value='transfer_initiated' />
                <Button
                  variant='outline'
                  className='border-white/15 bg-white/5 hover:bg-white/10'
                  size='sm'
                >
                  Transfer initiated
                </Button>
              </form>

              <form action={adminSetDealStatus}>
                <input type='hidden' name='status' value='completed' />
                <Button
                  className='bg-white text-black hover:bg-zinc-200'
                  size='sm'
                >
                  Complete deal
                </Button>
              </form>

              <form action={adminSetDealStatus}>
                <input type='hidden' name='status' value='cancelled' />
                <Button variant='destructive' size='sm'>
                  Cancel
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div className='p-4 sm:p-5 h-[55vh] overflow-y-auto space-y-2 bg-black/10'>
        {messages.length === 0 ? (
          <div className='text-sm text-zinc-400'>
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            if (m.type === 'payment_request') {
              const d = m.data || {}
              return (
                <div key={m.id} className='flex justify-center'>
                  <div className='w-full max-w-xl rounded-3xl border border-white/10 bg-black/30 p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='text-sm font-medium'>Make payment</div>
                        <div className='mt-1 text-xs text-zinc-400'>
                          Pay{' '}
                          <span className='text-zinc-200 font-medium'>
                            {d.amount_due} {d.offer_currency}
                          </span>{' '}
                          using{' '}
                          <span className='text-zinc-200 font-medium'>
                            {d.pay_currency} ({d.pay_network})
                          </span>
                          .
                        </div>
                      </div>
                      {d.address ? (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='border-white/15 bg-white/5 hover:bg-white/10'
                          onClick={() => copy(String(d.address))}
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      ) : null}
                    </div>

                    <div className='mt-3 rounded-2xl border border-white/10 bg-black/20 p-3'>
                      <div className='text-[11px] text-zinc-400'>
                        Wallet address
                      </div>
                      <div className='mt-1 text-sm text-zinc-100 break-all'>
                        {d.address ?? '—'}
                      </div>
                    </div>

                    <div className='mt-3 text-xs text-zinc-400 space-y-1'>
                      <div>• Send exactly the amount shown.</div>
                      <div>
                        • Use the correct network ({String(d.pay_network)}).
                        Wrong network = lost funds.
                      </div>
                      <div>• After sending, submit your TxID above.</div>
                    </div>
                  </div>
                </div>
              )
            }

            const mine = m.sender_id === meId
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[80%] rounded-2xl border px-3 py-2 text-sm',
                    mine
                      ? 'bg-white/10 border-white/10 text-zinc-100'
                      : 'bg-black/30 border-white/10 text-zinc-100',
                    m.is_system ? 'opacity-90' : '',
                  ].join(' ')}
                >
                  <div className='whitespace-pre-wrap break-words'>
                    {m.body}
                  </div>
                  <div className='mt-1 text-[11px] text-zinc-500'>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className='p-3 sm:p-4 border-t border-white/10 bg-black/10'>
        <div className='flex gap-2'>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={chatLocked ? 'Chat locked' : 'Type a message…'}
            disabled={chatLocked}
            className='bg-black/20 border-white/10'
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
          />
          <Button
            onClick={send}
            disabled={sending || chatLocked}
            className='bg-white text-black hover:bg-zinc-200'
          >
            {sending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Send className='h-4 w-4' />
            )}
          </Button>
        </div>
        <div className='mt-2 text-xs text-zinc-500'>
          Only buyer & seller in the deal can chat.
        </div>
      </div>
    </div>
  )

  function formatMoney(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount)
    } catch {
      return `${currency} ${amount}`
    }
  }
}
