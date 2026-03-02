'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CheckSquare,
  Handshake,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react'

export default function AdminTabs() {
  const pathname = usePathname()

  const items = [
    {
      href: '/admin',
      label: 'Approvals',
      icon: CheckSquare,
    },
    {
      href: '/admin/deals',
      label: 'Deals',
      icon: Handshake,
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-2'>
      <div className='flex gap-2 overflow-x-auto no-scrollbar'>
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition',
                active
                  ? 'bg-white/10 border border-white/10 text-amber-50'
                  : 'text-zinc-300 hover:bg-white/5',
              ].join(' ')}
            >
              <Icon className='h-4 w-4' />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
