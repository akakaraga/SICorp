import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Building2, CalendarDays, TrendingUp } from 'lucide-react'
import { EmployeeTable } from '@/components/shared/employee-table'
import { AddEmployeeDialog } from '@/components/shared/add-employee-dialog'
import { AddDepartmentDialog } from '@/components/shared/add-department-dialog'
import type { Employee, Department } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function HRDDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify HRD role
  const { data: hrd } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!hrd || hrd.role !== 'hrd') {
    redirect('/dashboard/employee')
  }

  // Fetch all employees with joins
  const { data: employees } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments(name),
      manager:employees!manager_id(full_name)
    `)
    .order('created_at', { ascending: false })

  // Fetch all departments
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  // Fetch leave stats
  const { data: allLeaveRequests } = await supabase
    .from('leave_requests')
    .select('status, leave_type, start_date, end_date')

  const requests = (allLeaveRequests ?? []) as unknown as { status: string; leave_type: string; start_date: string; end_date: string }[]
  const totalEmployees = employees?.length ?? 0
  const totalDepts = departments?.length ?? 0
  const pendingLeaves = requests.filter((r) => r.status === 'pending').length
  const onLeaveToday = requests.filter((r) => {
    const today = new Date().toISOString().split('T')[0]
    return r.status === 'approved' && r.start_date <= today && r.end_date >= today
  }).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data & Administrasi</h1>
          <p className="text-slate-500 mt-1">Kelola karyawan, departemen, dan pantau cuti perusahaan</p>
        </div>
        <div className="flex gap-3">
          <AddDepartmentDialog />
          <AddEmployeeDialog departments={(departments ?? []) as Department[]} employees={(employees ?? []) as unknown as Employee[]} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HRDStatCard
          title="Total Karyawan"
          value={totalEmployees}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          border="border-blue-100"
        />
        <HRDStatCard
          title="Departemen"
          value={totalDepts}
          icon={<Building2 className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
          border="border-violet-100"
        />
        <HRDStatCard
          title="Cuti Menunggu"
          value={pendingLeaves}
          icon={<CalendarDays className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          border="border-amber-100"
        />
        <HRDStatCard
          title="Cuti Hari Ini"
          value={onLeaveToday}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          border="border-emerald-100"
        />
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Daftar Karyawan</h2>
          <p className="text-xs text-slate-500 mt-0.5">{totalEmployees} karyawan terdaftar</p>
        </div>
        <div className="p-5">
          <EmployeeTable
            employees={(employees ?? []) as unknown as (Employee & { department?: { name: string }; manager?: { full_name: string } | null })[]}
            departments={(departments ?? []) as Department[]}
          />
        </div>
      </div>

      {/* Departments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Daftar Departemen</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {((departments ?? []) as Department[]).map((dept: Department) => {
            const empCount = ((employees ?? []) as unknown as Employee[]).filter((e: Employee) => e.department_id === dept.id).length
            return (
              <div key={dept.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                </div>
                <span className="text-xs text-slate-400">{empCount} karyawan</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HRDStatCard({
  title,
  value,
  icon,
  bg,
  border,
}: {
  title: string
  value: number
  icon: React.ReactNode
  bg: string
  border: string
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${border}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-600 mt-1">{title}</p>
    </div>
  )
}
