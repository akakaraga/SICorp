'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Sesi tidak valid.' }

  // Verify HRD access
  const { data: hrd } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!hrd || hrd.role !== 'hrd') {
    return { error: 'Akses ditolak. Hanya HRD yang dapat menambah karyawan.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as UserRole
  const departmentId = formData.get('department_id') as string
  const managerId = (formData.get('manager_id') as string) || null

  if (!email || !password || !fullName || !role || !departmentId) {
    return { error: 'Semua field wajib diisi.' }
  }

  const validRoles: UserRole[] = ['employee', 'manager', 'hrd']
  if (!validRoles.includes(role)) {
    return { error: 'Role tidak valid.' }
  }

  // Jika sedang dalam mode dummy data
  if (process.env.USE_DUMMY_DATA === 'true') {
    revalidatePath('/dashboard/hrd')
    return { success: 'Karyawan berhasil ditambahkan (Mode Dummy).' }
  }

  // Cek apakah service_role key sudah dikonfigurasi
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return {
      error:
        'Fitur tambah karyawan memerlukan SUPABASE_SERVICE_ROLE_KEY. Tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local (salin dari Supabase > Project Settings > API > service_role).',
    }
  }

  // Create auth user via Supabase Admin Client (Service Role)
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabaseAdmin = createAdminClient()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: `Gagal membuat akun: ${authError?.message}` }
  }

  // Insert employee record
  const { error: insertError } = await supabaseAdmin.from('employees').insert({
    id: authData.user.id,
    full_name: fullName,
    role,
    department_id: departmentId,
    manager_id: managerId || null,
    leave_balance_annual: 12,
    leave_balance_sick: 14,
  })

  if (insertError) {
    return { error: `Gagal menyimpan data karyawan: ${insertError.message}` }
  }

  revalidatePath('/dashboard/hrd')
  return { success: 'Karyawan berhasil ditambahkan.' }
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Sesi tidak valid.' }

  const { data: hrd } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!hrd || hrd.role !== 'hrd') {
    return { error: 'Akses ditolak.' }
  }

  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as UserRole
  const departmentId = formData.get('department_id') as string
  const managerId = (formData.get('manager_id') as string) || null
  const leaveBalanceAnnual = parseInt(formData.get('leave_balance_annual') as string)
  const leaveBalanceSick = parseInt(formData.get('leave_balance_sick') as string)

  if (!fullName || !role || !departmentId) {
    return { error: 'Semua field wajib diisi.' }
  }

  const { error } = await supabase
    .from('employees')
    .update({
      full_name: fullName,
      role,
      department_id: departmentId,
      manager_id: managerId || null,
      leave_balance_annual: isNaN(leaveBalanceAnnual) ? 12 : leaveBalanceAnnual,
      leave_balance_sick: isNaN(leaveBalanceSick) ? 14 : leaveBalanceSick,
    })
    .eq('id', employeeId)

  if (error) {
    return { error: `Gagal memperbarui data: ${error.message}` }
  }

  revalidatePath('/dashboard/hrd')
  return { success: 'Data karyawan berhasil diperbarui.' }
}

export async function createDepartment(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Sesi tidak valid.' }

  const { data: hrd } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!hrd || hrd.role !== 'hrd') {
    return { error: 'Akses ditolak.' }
  }

  const name = formData.get('name') as string
  if (!name || name.trim().length < 2) {
    return { error: 'Nama departemen minimal 2 karakter.' }
  }

  const { error } = await supabase.from('departments').insert({ name: name.trim() })

  if (error) {
    return { error: `Gagal membuat departemen: ${error.message}` }
  }

  revalidatePath('/dashboard/hrd')
  return { success: 'Departemen berhasil dibuat.' }
}

