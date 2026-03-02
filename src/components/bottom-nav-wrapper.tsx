import { supabaseServer } from '@/lib/supabase/server'
import BottomNav from './bottom-nav'

export default async function BottomNavWrapper() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BottomNav userId={user?.id ?? null} />
}
