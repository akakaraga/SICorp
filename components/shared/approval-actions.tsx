'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveLeaveRequest, rejectLeaveRequest } from '@/actions/leave'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ApprovalActionsProps {
  requestId: string
}

export function ApprovalActions({ requestId }: ApprovalActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [processed, setProcessed] = useState(false)

  function handleApprove() {
    setMessage(null)
    startTransition(async () => {
      const result = await approveLeaveRequest(requestId, notes || undefined)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setProcessed(true)
        setMessage({ type: 'success', text: result.success! })
        router.refresh()
      }
    })
  }

  function handleReject() {
    if (!notes || notes.trim().length < 5) {
      setMessage({ type: 'error', text: 'Catatan penolakan minimal 5 karakter.' })
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await rejectLeaveRequest(requestId, notes)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setProcessed(true)
        setMessage({ type: 'success', text: result.success! })
        router.refresh()
      }
    })
  }

  if (processed) {
    return (
      <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Selesai
      </div>
    )
  }

  return (
    <div className="space-y-2 min-w-[200px]">
      {!showRejectForm ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Setuju
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 rounded-lg"
          >
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Tolak
            </span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alasan penolakan... (wajib)"
            rows={2}
            className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReject}
              disabled={isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-7 rounded-lg"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Konfirmasi Tolak'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false)
                setNotes('')
                setMessage(null)
              }}
              className="text-xs h-7 rounded-lg"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`text-xs ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}

