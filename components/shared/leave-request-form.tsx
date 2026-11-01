'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitLeaveRequest } from '@/actions/leave'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LeaveRequestForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)
    const form = event.currentTarget
    startTransition(async () => {
      const result = await submitLeaveRequest(formData)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: result.success })
        form.reset()
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Leave Type */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Jenis Cuti</label>
        <select
          name="leave_type"
          required
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Pilih jenis cuti...</option>
          <option value="annual">Cuti Tahunan</option>
          <option value="sick">Cuti Sakit</option>
          <option value="maternity">Cuti Maternitas</option>
          <option value="unpaid">Cuti Tanpa Bayar</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Tanggal Mulai</label>
          <input
            type="date"
            name="start_date"
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Tanggal Akhir</label>
          <input
            type="date"
            name="end_date"
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Alasan</label>
        <textarea
          name="reason"
          required
          rows={3}
          placeholder="Jelaskan alasan cuti Anda..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Attachment */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Lampiran{' '}
          <span className="text-slate-400 font-normal">(opsional - maks. 5MB)</span>
        </label>
        <input
          type="file"
          name="attachment"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
        />
      </div>

      {/* Message */}
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

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengirim...
          </span>
        ) : (
          'Kirim Pengajuan'
        )}
      </Button>
    </form>
  )
}

