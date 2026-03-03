'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Store,
  PlusCircle,
  ListChecks,
  HandCoins,
  Settings,
  ShieldCheck,
  Bell,
  MessageCircle,
} from 'lucide-react'
import UnreadBadge from '@/components/notifications/unread-badge'

type Role = 'user' | 'admin'

export default function DashboardTabs({
  role,
  userId,
}: {
  role: Role
  userId: string
}) {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'Overview', icon: LayoutGrid, show: true },
    {
      href: '/dashboard/listings',
      label: 'My Listings',
      icon: ListChecks,
      show: true,
    },
    { href: '/sell', label: 'Sell', icon: PlusCircle, show: true },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle, show: true },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
      show: true,
    },
    { href: '/marketplace', label: 'Marketplace', icon: Store, show: true },

    // ✅ Buyer-side: My Offers (everyone can have this)
    {
      href: '/dashboard/my-offers',
      label: 'My Offers',
      icon: HandCoins,
      show: true,
    },

    // ✅ Seller-side: Offers (only sellers will actually have offers, but we can show to all users.
    // If you want seller-only, we can hide it unless they have listings.
    { href: '/dashboard/offers', label: 'Offers', icon: HandCoins, show: true },

    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
      show: true,
    },

    // ✅ Admin only
    {
      href: '/admin',
      label: 'Admin',
      icon: ShieldCheck,
      show: role === 'admin',
    },
  ].filter((x) => x.show)

  const active = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-2'>
      <div className='flex gap-2 overflow-x-auto no-scrollbar'>
        {items.map((it) => {
          const Icon = it.icon
          const isActive = active(it.href)

          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'shrink-0 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition',
                'border border-transparent',
                isActive
                  ? 'bg-white/10 border-white/10 text-amber-50'
                  : 'hover:bg-white/5 text-zinc-300',
              ].join(' ')}
            >
              <Icon className='h-4 w-4' />
              <span className='whitespace-nowrap'>{it.label}</span>
              {it.href === '/dashboard/notifications' ? (
                <UnreadBadge userId={userId} />
              ) : null}{' '}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
