'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string) || ''
  const password = (formData.get('password') as string) || ''

  // Mode dummy: otomatis switch role berdasarkan email
  if (process.env.USE_DUMMY_DATA === 'true') {
    const cookieStore = await cookies()
    revalidatePath('/', 'layout')

    const lowerEmail = email.toLowerCase()
    if (lowerEmail.includes('manager') || lowerEmail.includes('budi')) {
      cookieStore.set('dummy_user_id', 'user-mgr-001')
      redirect('/dashboard/manager')
    } else if (lowerEmail.includes('employee') || lowerEmail.includes('karyawan') || lowerEmail.includes('andi')) {
      cookieStore.set('dummy_user_id', 'user-emp-001')
      redirect('/dashboard/employee')
    } else {
      cookieStore.set('dummy_user_id', 'user-hrd-001')
      redirect('/dashboard/hrd')
    }
  }

  const supabase = await createClient()

  const data = { email, password }

  // Server-side validation
  if (!data.email || !data.password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'Email atau password salah. Silakan coba lagi.' }
  }

  // Get user role to determine redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Gagal mendapatkan data pengguna.' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = employee?.role ?? 'employee'

  revalidatePath('/', 'layout')

  if (role === 'hrd') {
    redirect('/dashboard/hrd')
  } else if (role === 'manager') {
    redirect('/dashboard/manager')
  } else {
    redirect('/dashboard/employee')
  }
}

export async function signOut() {
  // Mode dummy: bersihkan cookie lalu redirect ke login
  if (process.env.USE_DUMMY_DATA === 'true') {
    const cookieStore = await cookies()
    cookieStore.delete('dummy_user_id')
    revalidatePath('/', 'layout')
    redirect('/login')
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}


