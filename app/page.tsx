import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = employee?.role ?? 'employee'

  if (role === 'hrd') redirect('/dashboard/hrd')
  if (role === 'manager') redirect('/dashboard/manager')
  redirect('/dashboard/employee')
}
