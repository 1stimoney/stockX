'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Gem, ShieldCheck } from 'lucide-react'

export function SiteNav() {
  return (
    <header className='sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-black/20'>
      <div className='mx-auto max-w-6xl px-4 py-3 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='h-9 w-9 rounded-xl bg-white/10 border border-white/10 grid place-items-center'>
            <Gem className='h-5 w-5' />
          </div>
          <div className='leading-tight'>
            <div className='font-semibold'>
              Stock<span className='text-zinc-400 text-2xl'>X</span>
            </div>
            <div className='text-xs text-zinc-400'>Verified luxury assets</div>
          </div>
        </Link>

        <nav className='hidden md:flex items-center gap-6 text-sm text-zinc-300'>
          <Link className='hover:text-white' href='/marketplace'>
            Marketplace
          </Link>
          <Link className='hover:text-white' href='/sell'>
            Sell
          </Link>
          <Link className='hover:text-white' href='/how-it-works'>
            How it works
          </Link>
          <span className='inline-flex items-center gap-1 text-xs text-zinc-400'>
            <ShieldCheck className='h-4 w-4' /> Escrow-ready
          </span>
        </nav>

        <div className='flex items-center gap-2'>
          <Button
            asChild
            variant='ghost'
            className='border border-white/10 bg-white/5 hover:bg-white/10'
          >
            <Link href='/auth'>Sign in</Link>
          </Button>
          <Button asChild className='bg-white text-black hover:bg-zinc-200'>
            <Link href='/sell'>List an asset</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
