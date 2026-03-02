'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

export default function UnreadBadge({ userId }: { userId: string }) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (!mounted) return
      if (!error) setCount(count ?? 0)
    }

    load()

    // Realtime subscription (INSERT + UPDATE)
    const channel = supabase
      .channel(`notif-unread-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // new notification created
          setCount((c) => c + 1)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldRow = payload.old as any
          const newRow = payload.new as any

          // if it changed from unread -> read, decrement
          if (oldRow?.is_read === false && newRow?.is_read === true) {
            setCount((c) => Math.max(0, c - 1))
          }

          // if it changed from read -> unread (rare but possible), increment
          if (oldRow?.is_read === true && newRow?.is_read === false) {
            setCount((c) => c + 1)
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  if (!count) return null

  return (
    <span className='ml-2 inline-flex items-center justify-center rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] leading-none text-amber-50'>
      {count}
    </span>
  )
}
