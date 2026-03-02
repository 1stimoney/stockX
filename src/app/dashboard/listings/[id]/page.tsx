import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await supabaseServer()
  const { id } = await params

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return (
    <div className='min-h-screen px-4 py-8'>
      <div className='mx-auto max-w-3xl space-y-4'>
        <Button
          asChild
          variant='outline'
          className='border-white/15 bg-white/5 hover:bg-white/10'
        >
          <Link href='/dashboard'>← Back to dashboard</Link>
        </Button>

        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle>{listing?.title ?? 'Listing'}</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-zinc-400'>
            Detail page next: images, documents, status timeline, edit, and
            offers.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
