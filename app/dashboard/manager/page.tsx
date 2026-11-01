import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, CalendarDays } from 'lucide-react'
import { ApprovalActions } from '@/components/shared/approval-actions'
import { cn } from '@/lib/utils'
import type { LeaveRequest } from '@/types/database'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function calculateDays(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

const leaveTypeLabel: Record<string, string> = {
  annual: 'Cuti Tahunan',
  sick: 'Cuti Sakit',
  maternity: 'Cuti Maternitas',
  unpaid: 'Cuti Tanpa Bayar',
}

const leaveTypeColor: Record<string, string> = {
  annual: 'bg-blue-100 text-blue-700',
  sick: 'bg-sky-100 text-sky-700',
  maternity: 'bg-pink-100 text-pink-700',
  unpaid: 'bg-slate-100 text-slate-600',
}

export default async function ManagerDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify role
  const { data: manager } = await supabase
    .from('employees')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!manager || !['manager', 'hrd'].includes(manager.role)) {
    redirect('/dashboard/employee')
  }

  // Fetch pending leave requests from direct subordinates
  const { data: pendingRequests } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(
        full_name,
        department:departments(name),
        leave_balance_annual,
        leave_balance_sick,
        manager_id
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Filter: manager only sees their subordinates; HRD sees all
  const rawPending = (pendingRequests ?? []) as unknown as LeaveRequest[]
  const filteredPending =
    manager.role === 'hrd'
      ? rawPending
      : rawPending.filter((req: LeaveRequest) => {
          const emp = req.employee as { manager_id: string } | null
          return emp?.manager_id === user.id
        })

  // Also fetch recently processed requests
  const { data: recentProcessed } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(full_name, manager_id, department:departments(name))
    `)
    .in('status', ['approved', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(10)

  const rawProcessed = (recentProcessed ?? []) as unknown as LeaveRequest[]
  const processedRequests =
    manager.role === 'hrd'
      ? rawProcessed
      : rawProcessed.filter((req: LeaveRequest) => {
          const emp = req.employee as { manager_id: string } | null
          return emp?.manager_id === user.id
        })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approval Cuti</h1>
        <p className="text-slate-500 mt-1">
          {manager.role === 'hrd' ? 'Semua pengajuan cuti' : 'Pengajuan dari tim Anda'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{filteredPending.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">pengajuan</p>
          <p className="text-xs font-medium text-slate-600 mt-1">Menunggu Approval</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {processedRequests.filter((r) => r.status === 'approved').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">disetujui</p>
          <p className="text-xs font-medium text-slate-600 mt-1">Cuti Disetujui</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {processedRequests.filter((r) => r.status === 'rejected').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">ditolak</p>
          <p className="text-xs font-medium text-slate-600 mt-1">Cuti Ditolak</p>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Menunggu Persetujuan</h2>
            <p className="text-xs text-slate-500 mt-0.5">{filteredPending.length} pengajuan perlu ditindaklanjuti</p>
          </div>
          <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{filteredPending.length}</span>
          </div>
        </div>

        {filteredPending.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Semua sudah diproses!</p>
            <p className="text-slate-400 text-xs mt-1">Tidak ada pengajuan yang menunggu persetujuan</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredPending.map((req) => {
              const emp = req.employee as {
                full_name: string
                department?: { name: string }
                leave_balance_annual: number
                leave_balance_sick: number
              } | null
              const days = calculateDays(req.start_date, req.end_date)
              return (
                <div key={req.id} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {emp?.full_name.charAt(0).toUpperCase() ?? '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{emp?.full_name}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {emp?.department?.name ?? '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            leaveTypeColor[req.leave_type]
                          )}
                        >
                          {leaveTypeLabel[req.leave_type]}
                        </span>
                        <span className="text-xs text-slate-500">
                          <CalendarDays className="inline w-3 h-3 mr-1" />
                          {formatDate(req.start_date)} — {formatDate(req.end_date)}
                          <span className="ml-1 font-medium text-slate-700">({days} hari)</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{req.reason}</p>
                      <div className="mt-1.5 flex gap-3 text-xs text-slate-400">
                        <span>Saldo Tahunan: <strong className="text-slate-600">{emp?.leave_balance_annual} hr</strong></span>
                        <span>Saldo Sakit: <strong className="text-slate-600">{emp?.leave_balance_sick} hr</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <ApprovalActions requestId={req.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Riwayat Terkini</h2>
            <p className="text-xs text-slate-500 mt-0.5">10 terakhir yang sudah diproses</p>
          </div>
          <div className="divide-y divide-slate-50">
            {processedRequests.map((req) => {
              const emp = req.employee as { full_name: string; department?: { name: string } } | null
              const isApproved = req.status === 'approved'
              return (
                <div key={req.id} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      isApproved ? 'bg-emerald-100' : 'bg-red-100'
                    )}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{emp?.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {leaveTypeLabel[req.leave_type]} · {formatDate(req.start_date)} — {formatDate(req.end_date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                      isApproved
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {isApproved ? 'Disetujui' : 'Ditolak'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
