import { supabaseServer } from '@/lib/supabase/server'
import DashboardTabs from './tabs'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null as any }

  const role = (profile as any)?.role ?? 'user'

  return (
    <div className='min-h-screen'>
      <div className='mx-auto max-w-6xl px-4 pt-5'>
        <DashboardTabs role={role} userId={user?.id ?? ''} />
      </div>

      <div className='mx-auto max-w-6xl px-4 pb-28 md:pb-8'>{children}</div>
    </div>
  )
}
