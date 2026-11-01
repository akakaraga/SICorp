import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/sidebar'
import { RealtimeListener } from '@/components/shared/realtime-listener'
import { signOut } from '@/actions/auth'
import type { Employee } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*, department:departments(name)')
    .eq('id', user.id)
    .single()

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-white">Profil Karyawan Belum Terdaftar</h2>
          <p className="text-slate-300 text-sm">
            Akun Anda (<strong className="text-white">{user.email}</strong>) sudah ada di Supabase Auth, namun belum ditambahkan ke tabel <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">public.employees</code>.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-slate-300 break-all border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">User UID Anda:</span>
            {user.id}
          </div>
          {error && (
            <div className="bg-red-950/50 p-3 rounded-lg text-left text-xs font-mono text-red-300 break-all border border-red-800">
              <span className="text-red-400 block text-[10px] uppercase font-bold mb-1">Detail Error Supabase:</span>
              {error.message} (Code: {error.code})
            </div>
          )}
          <p className="text-slate-400 text-xs">
            Silakan masukkan UID di atas ke tabel <code>employees</code> via SQL Editor Supabase agar profil Anda aktif.
          </p>
          <div className="pt-2 flex gap-3 justify-center">
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Keluar (Logout)
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <RealtimeListener />
      <Sidebar employee={employee as Employee & { department?: { name: string } }} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
