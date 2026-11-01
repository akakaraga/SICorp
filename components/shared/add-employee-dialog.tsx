'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEmployee } from '@/actions/employees'
import type { Department, Employee } from '@/types/database'
import { UserPlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddEmployeeDialogProps {
  departments: Department[]
  employees: Employee[]
}

export function AddEmployeeDialog({ departments, employees }: AddEmployeeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const managers = employees.filter((e) => ['manager', 'hrd'].includes(e.role))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)
    const form = event.currentTarget
    startTransition(async () => {
      const result = await createEmployee(formData)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: result.success! })
        form.reset()
        router.refresh()
        setTimeout(() => setOpen(false), 1200)
      }
    })
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm h-9 gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Tambah Karyawan
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Tambah Karyawan Baru</h3>
              <button
                onClick={() => { setOpen(false); setMessage(null) }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nama Lengkap</label>
                <input
                  name="full_name"
                  required
                  placeholder="John Doe"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@perusahaan.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password Awal</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
                <select
                  name="role"
                  required
                  defaultValue="employee"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="employee">Karyawan</option>
                  <option value="manager">Manajer</option>
                  <option value="hrd">HRD Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Departemen</label>
                <select
                  name="department_id"
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih departemen...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Atasan Langsung</label>
                <select
                  name="manager_id"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Tidak Ada --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </span>
                  ) : (
                    'Simpan Karyawan'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setOpen(false); setMessage(null) }}
                  className="rounded-xl text-sm"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

