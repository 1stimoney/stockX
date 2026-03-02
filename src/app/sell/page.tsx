'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'
import {
  ArrowLeft,
  ArrowUpRight,
  Gem,
  Image as ImageIcon,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

type Category = 'gold' | 'car' | 'house' | 'luxury_good'

export default function SellPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('car')
  const [price, setPrice] = useState<string>('')
  const [currency, setCurrency] = useState('USD')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  const onPickFile = (f: File | null) => {
    setFile(f)
    if (!f) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const validate = () => {
    if (!title.trim()) return 'Title is required.'
    if (!price.trim()) return 'Price is required.'
    const p = Number(price)
    if (Number.isNaN(p) || p <= 0) return 'Price must be a valid number.'
    if (!currency.trim()) return 'Currency is required.'
    if (!description.trim()) return 'Description is required.'
    return null
  }

  const onSubmit = async () => {
    if (loading) return
    const err = validate()
    if (err) return toast.error(err)

    setLoading(true)
    try {
      const {
        data: { user },
        error: uErr,
      } = await supabase.auth.getUser()

      if (uErr) throw uErr
      if (!user) throw new Error('You must be logged in.')

      // 1) Upload image (optional)
      let coverUrl: string | null = null

      if (file) {
        const ext = file.name.split('.').pop() || 'jpg'
        const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '')
        const path = `covers/${user.id}/${crypto.randomUUID()}.${safeExt}`

        const { error: upErr } = await supabase.storage
          .from('assets-public')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'image/jpeg',
          })

        if (upErr) throw upErr

        const { data: pub } = supabase.storage
          .from('assets-public')
          .getPublicUrl(path)
        coverUrl = pub.publicUrl
      }

      // 2) Insert listing
      const { error: insErr } = await supabase.from('listings').insert({
        seller_id: user.id,
        title: title.trim(),
        category,
        price: Number(price),
        currency: currency.trim().toUpperCase(),
        location: location.trim() || null,
        description: description.trim(),
        cover_image_url: coverUrl,
        // status defaults to 'pending'
      })

      if (insErr) throw insErr

      toast.success('Listing submitted for approval.')
      router.replace('/dashboard')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create listing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen px-4 py-6 sm:py-10 pb-28 md:pb-10'>
      <Toaster richColors position='top-right' />
      <div className='mx-auto max-w-3xl space-y-5'>
        {/* Top */}
        <div className='flex items-center justify-between gap-3'>
          <Button
            asChild
            variant='outline'
            className='border-white/15 bg-white/5 hover:bg-white/10'
          >
            <Link href='/dashboard'>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Link>
          </Button>

          <div className='flex items-center gap-2'>
            <Badge className='bg-white/10 border border-white/10 text-amber-50'>
              <Gem className='h-3.5 w-3.5 mr-1 text-amber-50' />
              StockX
            </Badge>
            <Badge className='bg-white/10 border border-white/10 text-amber-50'>
              <ShieldCheck className='h-3.5 w-3.5 mr-1 text-amber-50' />
              Verified listings
            </Badge>
          </div>
        </div>

        {/* Header */}
        <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6'>
          <h1 className='text-2xl sm:text-3xl font-semibold tracking-tight'>
            List an asset
          </h1>
          <p className='mt-2 text-sm sm:text-base text-zinc-400'>
            Submit high-value assets for review. Approved listings go live in
            the marketplace.
          </p>
        </div>

        <Card className='border-white/10 bg-white/5 backdrop-blur'>
          <CardHeader>
            <CardTitle className='text-base flex items-center gap-2'>
              <Tag className='h-4 w-4' /> Listing details
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-5'>
            {/* Cover Upload */}
            <div className='rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5'>
              <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <div className='flex-1'>
                  <div className='text-sm font-medium flex items-center gap-2'>
                    <ImageIcon className='h-4 w-4' />
                    Cover image (optional)
                  </div>
                  <div className='mt-1 text-xs text-zinc-400'>
                    Use a clear photo. Luxury listings perform best with
                    high-quality images.
                  </div>

                  <div className='mt-3'>
                    <Input
                      type='file'
                      accept='image/*'
                      className='bg-black/20 border-white/10'
                      onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className='w-full sm:w-52'>
                  <div className='aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 overflow-hidden grid place-items-center'>
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt='preview'
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='text-xs text-zinc-500 text-center px-4'>
                        Preview will appear here
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. 2022 Range Rover Autobiography (Low mileage)'
                  className='bg-black/20 border-white/10'
                />
              </div>

              <div className='space-y-2'>
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className='w-full h-10 rounded-md bg-black/20 border border-white/10 px-3 text-sm outline-none focus:ring-2 focus:ring-white/20'
                >
                  <option value='gold'>Gold</option>
                  <option value='car'>Car</option>
                  <option value='house'>House</option>
                  <option value='luxury_good'>Luxury good</option>
                </select>
                <div className='text-xs text-zinc-500'>
                  Pick the closest match. Admin can reclassify if needed.
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Location</Label>
                <div className='relative'>
                  <MapPin className='h-4 w-4 text-zinc-500 absolute left-3 top-3' />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='e.g. Lagos, Nigeria'
                    className='pl-9 bg-black/20 border-white/10'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Price</Label>
                <Input
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d.]/g, ''))
                  }
                  placeholder='e.g. 250000'
                  className='bg-black/20 border-white/10'
                />
              </div>

              <div className='space-y-2'>
                <Label>Currency</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder='USD, NGN, GBP...'
                  className='bg-black/20 border-white/10'
                />
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Describe the asset in detail: condition, ownership, documents available, reason for sale...'
                  className='min-h-[140px] bg-black/20 border-white/10'
                />
              </div>
            </div>

            <Separator className='bg-white/10' />

            <div className='flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between'>
              <div className='text-xs text-zinc-400'>
                By submitting, you agree that admins will review details and may
                request documents.
              </div>

              <Button
                onClick={onSubmit}
                disabled={loading}
                className='bg-white text-black hover:bg-zinc-200'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit listing <ArrowUpRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
