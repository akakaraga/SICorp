'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LeaveType } from '@/types/database'

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export async function submitLeaveRequest(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid. Silakan login kembali.' }
  }

  const leaveType = formData.get('leave_type') as LeaveType
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const reason = formData.get('reason') as string
  const attachmentFile = formData.get('attachment') as File | null

  // Server-side validation
  if (!leaveType || !startDate || !endDate || !reason) {
    return { error: 'Semua field wajib diisi.' }
  }

  const validLeaveTypes: LeaveType[] = ['annual', 'sick', 'maternity', 'unpaid']
  if (!validLeaveTypes.includes(leaveType)) {
    return { error: 'Tipe cuti tidak valid.' }
  }

  if (new Date(endDate) < new Date(startDate)) {
    return { error: 'Tanggal akhir harus setelah tanggal mulai.' }
  }

  const daysRequested = calculateDays(startDate, endDate)

  // Check leave balance
  const { data: employee } = await supabase
    .from('employees')
    .select('leave_balance_annual, leave_balance_sick, role')
    .eq('id', user.id)
    .single()

  if (!employee) {
    return { error: 'Data karyawan tidak ditemukan.' }
  }

  if (leaveType === 'annual' && daysRequested > employee.leave_balance_annual) {
    return {
      error: `Saldo cuti tahunan tidak mencukupi. Tersisa: ${employee.leave_balance_annual} hari.`,
    }
  }

  if (leaveType === 'sick' && daysRequested > employee.leave_balance_sick) {
    return {
      error: `Saldo cuti sakit tidak mencukupi. Tersisa: ${employee.leave_balance_sick} hari.`,
    }
  }

  // Upload attachment if provided
  let attachmentUrl: string | null = null
  if (attachmentFile && attachmentFile.size > 0) {
    // Validasi ukuran file maksimal 5 MB
    const MAX_SIZE = 5 * 1024 * 1024
    if (attachmentFile.size > MAX_SIZE) {
      return { error: 'Ukuran file lampiran maksimal 5 MB.' }
    }

    // Validasi format file (hanya gambar dan PDF)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
    const fileExt = attachmentFile.name.split('.').pop()?.toLowerCase() || ''
    if (!allowedExtensions.includes(fileExt)) {
      return { error: 'Format file tidak didukung. Hanya file PDF, JPG, PNG, atau WEBP yang diperbolehkan.' }
    }

    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('leave-attachments')
      .upload(fileName, attachmentFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { error: 'Gagal mengunggah lampiran. Silakan coba lagi.' }
    }

    attachmentUrl = uploadData.path
  }

  // Insert leave request
  const { error: insertError } = await supabase.from('leave_requests').insert({
    employee_id: user.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason: reason.trim(),
    status: 'pending',
    attachment_url: attachmentUrl,
  })

  if (insertError) {
    return { error: 'Gagal mengajukan cuti. Silakan coba lagi.' }
  }

  revalidatePath('/dashboard/employee')
  return { success: 'Pengajuan cuti berhasil dikirim!' }
}

export async function approveLeaveRequest(requestId: string, notes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid.' }
  }

  // Verify user is manager or HRD
  const { data: approver } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!approver || !['manager', 'hrd'].includes(approver.role)) {
    return { error: 'Anda tidak memiliki hak untuk menyetujui cuti.' }
  }

  // Get the leave request to check it exists and is pending
  const { data: leaveRequest } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(leave_balance_annual, leave_balance_sick, manager_id)')
    .eq('id', requestId)
    .single()

  if (!leaveRequest) {
    return { error: 'Pengajuan cuti tidak ditemukan.' }
  }

  if (leaveRequest.status !== 'pending') {
    return { error: 'Pengajuan ini sudah diproses.' }
  }

  // Check manager is authorized for this employee
  if (approver.role === 'manager') {
    const emp = leaveRequest.employee as { manager_id: string } | null
    if (!emp || emp.manager_id !== user.id) {
      return { error: 'Anda bukan atasan langsung karyawan ini.' }
    }
  }

  // Update leave request status
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      manager_notes: notes || null,
    })
    .eq('id', requestId)

  if (updateError) {
    return { error: 'Gagal menyetujui cuti.' }
  }

  // Deduct leave balance
  const days = calculateDays(leaveRequest.start_date, leaveRequest.end_date)
  const emp = leaveRequest.employee as {
    leave_balance_annual: number
    leave_balance_sick: number
  } | null

  if (emp && leaveRequest.leave_type === 'annual') {
    await supabase
      .from('employees')
      .update({
        leave_balance_annual: Math.max(0, emp.leave_balance_annual - days),
      })
      .eq('id', leaveRequest.employee_id)
  } else if (emp && leaveRequest.leave_type === 'sick') {
    await supabase
      .from('employees')
      .update({
        leave_balance_sick: Math.max(0, emp.leave_balance_sick - days),
      })
      .eq('id', leaveRequest.employee_id)
  }

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/hrd')
  return { success: 'Cuti berhasil disetujui.' }
}

export async function rejectLeaveRequest(requestId: string, notes: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi tidak valid.' }
  }

  if (!notes || notes.trim().length < 5) {
    return { error: 'Catatan penolakan wajib diisi (minimal 5 karakter).' }
  }

  // Verify user is manager or HRD
  const { data: approver } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!approver || !['manager', 'hrd'].includes(approver.role)) {
    return { error: 'Anda tidak memiliki hak untuk menolak cuti.' }
  }

  // Get the leave request to check it exists and is pending
  const { data: leaveRequest } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(manager_id)')
    .eq('id', requestId)
    .single()

  if (!leaveRequest) {
    return { error: 'Pengajuan cuti tidak ditemukan.' }
  }

  if (leaveRequest.status !== 'pending') {
    return { error: 'Pengajuan ini sudah diproses.' }
  }

  // Check manager is authorized for this employee
  if (approver.role === 'manager') {
    const emp = leaveRequest.employee as { manager_id: string } | null
    if (!emp || emp.manager_id !== user.id) {
      return { error: 'Anda bukan atasan langsung karyawan ini.' }
    }
  }

  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      manager_notes: notes.trim(),
    })
    .eq('id', requestId)

  if (updateError) {
    return { error: 'Gagal menolak cuti.' }
  }

  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard/hrd')
  return { success: 'Cuti berhasil ditolak.' }
}

