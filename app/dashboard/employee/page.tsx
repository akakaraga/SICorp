import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays, Clock, CheckCircle2, XCircle, Plus, TrendingUp } from 'lucide-react'
import { LeaveRequestForm } from '@/components/shared/leave-request-form'
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
  annual: 'Tahunan',
  sick: 'Sakit',
  maternity: 'Maternitas',
  unpaid: 'Tanpa Bayar',
}

const statusConfig = {
  pending: {
    label: 'Menunggu',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  approved: {
    label: 'Disetujui',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Ditolak',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
}

export default async function EmployeeDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*, department:departments(name)')
    .eq('id', user.id)
    .single()

  if (!employee) return null

  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  const requests = (leaveRequests ?? []) as unknown as LeaveRequest[]
  const pendingCount = requests.filter((r: LeaveRequest) => r.status === 'pending').length
  const approvedCount = requests.filter((r: LeaveRequest) => r.status === 'approved').length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Selamat Datang, {employee.full_name.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {(employee.department as { name: string } | undefined)?.name} ·{' '}
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cuti Tahunan"
          value={employee.leave_balance_annual}
          suffix="hari"
          icon={<CalendarDays className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
          borderColor="border-blue-100"
        />
        <StatCard
          title="Cuti Sakit"
          value={employee.leave_balance_sick}
          suffix="hari"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          bgColor="bg-emerald-50"
          borderColor="border-emerald-100"
        />
        <StatCard
          title="Menunggu"
          value={pendingCount}
          suffix="pengajuan"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          bgColor="bg-amber-50"
          borderColor="border-amber-100"
        />
        <StatCard
          title="Disetujui"
          value={approvedCount}
          suffix="total"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          bgColor="bg-emerald-50"
          borderColor="border-emerald-100"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Leave Request Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Ajukan Cuti</h2>
                  <p className="text-slate-500 text-xs">Isi form di bawah</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <LeaveRequestForm />
            </div>
          </div>
        </div>

        {/* Leave History */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Riwayat Pengajuan</h2>
              <p className="text-slate-500 text-xs mt-0.5">{requests.length} total pengajuan</p>
            </div>
            <div className="divide-y divide-slate-50">
              {requests.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Belum ada pengajuan cuti</p>
                  <p className="text-slate-400 text-xs mt-1">Ajukan cuti pertama Anda di form kiri</p>
                </div>
              ) : (
                requests.map((req: LeaveRequest) => {
                  const status = statusConfig[req.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon
                  return (
                    <div key={req.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-800">
                              {leaveTypeLabel[req.leave_type]}
                            </span>
                            <span className="text-xs text-slate-400">
                              · {calculateDays(req.start_date, req.end_date)} hari
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{req.reason}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(req.start_date)} — {formatDate(req.end_date)}
                          </p>
                          {req.manager_notes && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              &ldquo;{req.manager_notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0',
                            status.className
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  suffix,
  icon,
  bgColor,
  borderColor,
}: {
  title: string
  value: number
  suffix: string
  icon: React.ReactNode
  bgColor: string
  borderColor: string
}) {
  return (
    <div className={cn('bg-white rounded-2xl border shadow-sm p-4', borderColor)}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bgColor)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{suffix}</p>
      <p className="text-xs font-medium text-slate-600 mt-1">{title}</p>
    </div>
  )
}

