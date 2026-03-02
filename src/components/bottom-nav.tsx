'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gem, LayoutGrid, PlusCircle, Store, User } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/marketplace', label: 'Market', icon: Store },
  { href: '/sell', label: 'Sell', icon: PlusCircle },
  { href: '/dashboard/settings', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard')
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className='md:hidden fixed bottom-0 left-0 right-0 z-50'>
      <div className='mx-auto max-w-6xl px-4 pb-4'>
        <div className='rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-lg'>
          <div className='grid grid-cols-4 px-2 py-2'>
            {items.map((it) => {
              const Active = isActive(it.href)
              const Icon = it.icon

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={[
                    'flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition',
                    Active ? 'bg-white/10' : 'hover:bg-white/5',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'h-5 w-5',
                      Active ? 'text-white' : 'text-zinc-300',
                    ].join(' ')}
                  />
                  <span
                    className={[
                      'text-[11px]',
                      Active ? 'text-white' : 'text-zinc-400',
                    ].join(' ')}
                  >
                    {it.label}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className='px-4 pb-3 pt-1'>
            <div className='flex items-center justify-center gap-2 text-[11px] text-zinc-400'>
              <Gem className='h-3.5 w-3.5' />
              StockX • Verified Luxury Marketplace
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
