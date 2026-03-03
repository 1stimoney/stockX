'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster, toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

type Msg = {
  id: string
  sender_id: string
  body: string
  created_at: string
}

export default function ChatThread({
  conversationId,
  dealStatus,
  listingTitle,
  askingPrice,
  askingCurrency,
  offerAmount,
  offerCurrency,
  offerMessage,
  initialMessages,
}: {
  conversationId: string
  dealStatus: string
  listingTitle: string
  askingPrice: number | null
  askingCurrency: string | null
  offerAmount: number | null
  offerCurrency: string | null
  offerMessage: string | null
  initialMessages: Msg[]
}) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [me, setMe] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const chatLocked = dealStatus === 'cancelled' // keep simple for MVP

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null))
  }, [supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Realtime: listen for new messages
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
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) return toast.error('Please login again.')

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: uid,
        body,
      })
      if (error) throw error

      setText('')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden'>
      <Toaster richColors position='top-right' />

      <div className='p-4 sm:p-5 border-b border-white/10 flex flex-col gap-2'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='text-sm font-medium truncate'>{listingTitle}</div>
            <div className='text-xs text-zinc-400 capitalize'>
              Deal status: {dealStatus.replaceAll('_', ' ')}
            </div>
          </div>
        </div>

        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-[11px] text-zinc-400'>Asking price</div>
            <div className='mt-1 text-sm font-medium text-zinc-100'>
              {askingPrice && askingCurrency
                ? formatMoney(askingPrice, askingCurrency)
                : '—'}
            </div>
          </div>

          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-[11px] text-zinc-400'>Accepted offer</div>
            <div className='mt-1 text-sm font-medium text-zinc-100'>
              {offerAmount && offerCurrency
                ? formatMoney(offerAmount, offerCurrency)
                : '—'}
            </div>
          </div>
        </div>

        {offerMessage ? (
          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
            <div className='text-[11px] text-zinc-400'>Offer note</div>
            <div className='mt-1 text-sm text-zinc-200 whitespace-pre-wrap break-words'>
              {offerMessage}
            </div>
          </div>
        ) : null}
      </div>
      <div className='p-4 sm:p-5 h-[55vh] overflow-y-auto space-y-2 bg-black/10'>
        {messages.length === 0 ? (
          <div className='text-sm text-zinc-400'>
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = me && m.sender_id === me
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
