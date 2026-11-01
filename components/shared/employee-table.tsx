'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee, Department } from '@/types/database'
import { updateEmployee } from '@/actions/employees'
import { Pencil, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const roleLabel: Record<string, string> = {
  employee: 'Karyawan',
  manager: 'Manajer',
  hrd: 'HRD Admin',
}

const roleBadgeColor: Record<string, string> = {
  employee: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  hrd: 'bg-purple-100 text-purple-700',
}

interface EmployeeTableProps {
  employees: (Employee & {
    department?: { name: string }
    manager?: { full_name: string } | null
  })[]
  departments: Department[]
}

type SortKey = 'full_name' | 'role' | 'department' | 'leave_balance_annual'
type SortDir = 'asc' | 'desc'

function SortIcon({
  columnKey,
  currentKey,
  sortDir,
}: {
  columnKey: SortKey
  currentKey: SortKey
  sortDir: SortDir
}) {
  if (currentKey !== columnKey) {
    return <ChevronUp className="w-3 h-3 opacity-20" />
  }
  return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
}

export function EmployeeTable({ employees, departments }: EmployeeTableProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('full_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [search, setSearch] = useState('')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = employees
    .filter((e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.department as { name: string } | undefined)?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let av = ''
      let bv = ''
      if (sortKey === 'full_name') { av = a.full_name; bv = b.full_name }
      else if (sortKey === 'role') { av = a.role; bv = b.role }
      else if (sortKey === 'department') {
        av = (a.department as { name: string } | undefined)?.name ?? ''
        bv = (b.department as { name: string } | undefined)?.name ?? ''
      } else if (sortKey === 'leave_balance_annual') {
        return sortDir === 'asc'
          ? a.leave_balance_annual - b.leave_balance_annual
          : b.leave_balance_annual - a.leave_balance_annual
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  function handleUpdate(employeeId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setMessage(null)
    startTransition(async () => {
      const result = await updateEmployee(employeeId, formData)
      if (result?.error) {
        setMessage({ id: employeeId, type: 'error', text: result.error })
      } else {
        setMessage({ id: employeeId, type: 'success', text: result.success! })
        router.refresh()
        setEditingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Cari karyawan atau departemen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => toggleSort('full_name')}
              >
                <span className="flex items-center gap-1">Nama <SortIcon columnKey="full_name" currentKey={sortKey} sortDir={sortDir} /></span>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => toggleSort('role')}
              >
                <span className="flex items-center gap-1">Role <SortIcon columnKey="role" currentKey={sortKey} sortDir={sortDir} /></span>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => toggleSort('department')}
              >
                <span className="flex items-center gap-1">Departemen <SortIcon columnKey="department" currentKey={sortKey} sortDir={sortDir} /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Atasan
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => toggleSort('leave_balance_annual')}
              >
                <span className="flex items-center gap-1">Saldo Cuti <SortIcon columnKey="leave_balance_annual" currentKey={sortKey} sortDir={sortDir} /></span>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Tidak ada karyawan yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const isEditing = editingId === emp.id
                const dept = (emp.department as { name: string } | undefined)
                const mgr = (emp.manager as { full_name: string } | null | undefined)
                const msg = message?.id === emp.id ? message : null

                if (isEditing) {
                  return (
                    <tr key={emp.id} className="bg-blue-50/50">
                      <td colSpan={6} className="px-4 py-4">
                        <form onSubmit={(e) => handleUpdate(emp.id, e)} className="space-y-3">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap</label>
                              <input
                                name="full_name"
                                defaultValue={emp.full_name}
                                required
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                              <select
                                name="role"
                                defaultValue={emp.role}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="employee">Karyawan</option>
                                <option value="manager">Manajer</option>
                                <option value="hrd">HRD Admin</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Departemen</label>
                              <select
                                name="department_id"
                                defaultValue={emp.department_id}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {departments.map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Atasan</label>
                              <select
                                name="manager_id"
                                defaultValue={emp.manager_id ?? ''}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">-- Tidak Ada --</option>
                                {filtered
                                  .filter((e) => e.id !== emp.id && ['manager', 'hrd'].includes(e.role))
                                  .map((e) => (
                                    <option key={e.id} value={e.id}>{e.full_name}</option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Saldo Cuti Tahunan</label>
                              <input
                                type="number"
                                name="leave_balance_annual"
                                defaultValue={emp.leave_balance_annual}
                                min={0}
                                max={30}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Saldo Cuti Sakit</label>
                              <input
                                type="number"
                                name="leave_balance_sick"
                                defaultValue={emp.leave_balance_sick}
                                min={0}
                                max={30}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          {msg && (
                            <p className={`text-xs ${msg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {msg.text}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-lg"
                            >
                              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                              className="text-xs h-8 rounded-lg"
                            >
                              Batal
                            </Button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700 text-sm">{emp.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', roleBadgeColor[emp.role])}>
                        {roleLabel[emp.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{dept?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{mgr?.full_name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">
                        <span className="text-emerald-600 font-semibold">{emp.leave_balance_annual}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-sky-600 font-semibold">{emp.leave_balance_sick}</span>
                        <span className="text-slate-400 text-xs ml-1">hr</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(emp.id)}
                        className="h-7 w-7 p-0 rounded-lg hover:bg-blue-50"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

