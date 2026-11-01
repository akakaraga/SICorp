'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeListener() {
  const router = useRouter()

  useEffect(() => {
    // Jangan inisialisasi jika URL dummy
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('dummy')) {
      return
    }

    const supabase = createClient()

    // Langganan event perubahan data secara real-time via WebSocket
    const channel = supabase
      .channel('schema-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => {
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        () => {
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Auto-refresh data saat user kembali membuka tab browser
    const handleFocus = () => {
      router.refresh()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', handleFocus)
    }
  }, [router])

  return null
}

