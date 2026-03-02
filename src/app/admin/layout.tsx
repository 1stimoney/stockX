import { supabaseServer } from '@/lib/supabase/server'
import AdminTabs from './tabs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (profile as any)?.role ?? 'user'

  if (role !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center text-sm text-zinc-400'>
        Unauthorized
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <div className='mx-auto max-w-6xl px-4 pt-6'>
        <AdminTabs />
      </div>

      <div className='mx-auto max-w-6xl px-4 pb-28 md:pb-8'>{children}</div>
    </div>
  )
}
