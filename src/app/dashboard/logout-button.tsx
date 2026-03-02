'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.replace('/auth')
    setLoading(false)
  }

  return (
    <Button
      onClick={onLogout}
      disabled={loading}
      variant='outline'
      className='border-white/15 bg-white/5 hover:bg-white/10'
    >
      {loading ? 'Signing out...' : 'Logout'}
    </Button>
  )
}
