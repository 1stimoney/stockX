import { SiteNav } from '@/components/site-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <SiteNav />

      <main className='mx-auto max-w-6xl px-4 py-10'>
        <div className='grid gap-6 md:grid-cols-2 items-center'>
          <div className='space-y-5'>
            <Badge className='bg-white/10 border border-white/10 text-zinc-200'>
              Premium consignment • Gold • Cars • Real Estate • Luxury goods
            </Badge>

            <h1 className='text-4xl md:text-5xl font-semibold tracking-tight'>
              Sell high-value assets with{' '}
              <span className='text-zinc-300'>trust</span>, not stress.
            </h1>

            <p className='text-zinc-300 leading-relaxed'>
              A luxury marketplace built around verification, documents, and
              controlled transactions. List, get approved, receive offers —
              close deals like a pro.
            </p>

            <div className='flex gap-3'>
              <Button asChild className='bg-white text-black hover:bg-zinc-200'>
                <Link href='/marketplace'>Browse marketplace</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                className='border-white/15 bg-white/5 hover:bg-white/10'
              >
                <Link href='/sell'>List an asset</Link>
              </Button>
            </div>

            <div className='text-xs text-zinc-400'>
              No inventory held. We facilitate verified listings and
              introductions.
            </div>
          </div>

          <Card className='border-white/10 bg-white/5'>
            <CardContent className='p-6 space-y-4'>
              <div className='text-sm text-zinc-300'>
                Why buyers trust LuxConsign
              </div>
              <div className='grid gap-3'>
                {[
                  ['Document-first listings', 'Upload proof before approval.'],
                  ['Admin verification', 'Badges for verified assets.'],
                  ['Premium presentation', 'Clean, luxury-grade listings.'],
                  ['Offer flow', 'Serious offers, less time-wasting.'],
                ].map(([t, d]) => (
                  <div
                    key={t}
                    className='rounded-2xl border border-white/10 bg-black/20 p-4'
                  >
                    <div className='font-medium'>{t}</div>
                    <div className='text-sm text-zinc-400'>{d}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
