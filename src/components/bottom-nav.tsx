'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Store,
  PlusCircle,
  ListChecks,
  Bell,
  Settings,
} from 'lucide-react'
import UnreadBadge from '@/components/notifications/unread-badge'

export default function BottomNav({ userId }: { userId: string | null }) {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Market', icon: Store },
    { href: '/dashboard/notifications', label: 'Alerts', icon: Bell },
    { href: '/sell', label: 'Sell', icon: PlusCircle },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className='fixed bottom-4 left-0 right-0 z-50 px-4 md:hidden'>
      <div className='mx-auto max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-2'>
        <div className='grid grid-cols-5 gap-1'>
          {items.map((it) => {
            const Icon = it.icon
            const active = isActive(it.href)

            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  'relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs transition',
                  active
                    ? 'bg-white/10 text-amber-50'
                    : 'text-zinc-300 hover:bg-white/5',
                ].join(' ')}
              >
                <div className='relative'>
                  <Icon className='h-5 w-5' />
                  {/* Badge on the bell icon */}
                  {it.href === '/dashboard/notifications' && userId ? (
                    <span className='absolute -top-2 -right-3'>
                      <UnreadBadge userId={userId} />
                    </span>
                  ) : null}
                </div>
                <span className='leading-none'>{it.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
