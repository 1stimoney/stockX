'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import Thread from './thread'
import { Badge } from '@/components/ui/badge'

export default function ChatShell({
  meId,
  role,
  convos,
  activeId,
  convo,
  offer,
  initialMessages,
  startPayment,
  submitTxHash,
  adminSetDealStatus,
}: any) {
  const active = activeId

  return (
    <div className='min-h-screen py-6 sm:py-8'>
      <div className='mx-auto max-w-6xl grid gap-4 lg:grid-cols-[360px_1fr]'>
        {/* Left list */}
        <div className='rounded-3xl border border-white/10 bg-white/5 overflow-hidden'>
          <div className='p-4 border-b border-white/10'>
            <div className='text-sm font-medium'>Chat</div>
            <div className='text-xs text-zinc-400 mt-1'>
              Chats open automatically after an offer is accepted.
            </div>
          </div>

          <div className='max-h-[70vh] overflow-y-auto'>
            {!convos?.length ? (
              <div className='p-4 text-sm text-zinc-400'>No chats yet.</div>
            ) : (
              convos.map((c: any) => {
                const isActive = c.id === active
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/chat?c=${c.id}`}
                    className={[
                      'block p-4 border-b border-white/10 transition',
                      isActive ? 'bg-white/10' : 'hover:bg-white/5',
                    ].join(' ')}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='font-medium truncate'>
                          {c?.listing?.title ?? 'Listing'}
                        </div>
                        <div className='text-xs text-zinc-400 mt-1 capitalize'>
                          {String(
                            c?.deal?.status ?? 'awaiting_payment',
                          ).replaceAll('_', ' ')}
                        </div>
                      </div>
                      <Badge className='bg-white/10 border border-white/10'>
                        Open
                      </Badge>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Right thread */}
        <div>
          {!activeId ? (
            <div className='rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-400'>
              Select a chat.
            </div>
          ) : (
            <Thread
              meId={meId}
              role={role}
              conversationId={activeId}
              convo={convo}
              offer={offer}
              initialMessages={initialMessages}
              startPayment={startPayment}
              submitTxHash={submitTxHash}
              adminSetDealStatus={adminSetDealStatus}
            />
          )}
        </div>
      </div>
    </div>
  )
}
