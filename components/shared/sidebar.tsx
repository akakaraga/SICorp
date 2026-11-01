'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/actions/auth'
import type { Employee } from '@/types/database'
import {
  Building2,
  LayoutDashboard,
  CalendarDays,
  Users,
  CheckSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  employee: Employee & { department?: { name: string } }
}

const roleLabel: Record<string, string> = {
  employee: 'Karyawan',
  manager: 'Manajer',
  hrd: 'HRD Admin',
}

const roleColor: Record<string, string> = {
  employee: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  hrd: 'bg-purple-100 text-purple-700',
}

export function Sidebar({ employee }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    // Always visible
    {
      href: '/dashboard/employee',
      label: 'Portal Saya',
      icon: LayoutDashboard,
      roles: ['employee', 'manager', 'hrd'],
    },
    // Manager & HRD
    {
      href: '/dashboard/manager',
      label: 'Approval Cuti',
      icon: CheckSquare,
      roles: ['manager', 'hrd'],
    },
    // HRD only
    {
      href: '/dashboard/hrd',
      label: 'Master Data',
      icon: Users,
      roles: ['hrd'],
    },
  ].filter((item) => item.roles.includes(employee.role))

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none">SICorp</h1>
            <p className="text-blue-300 text-xs mt-0.5">HRIS Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 mx-3 mt-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {employee.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{employee.full_name}</p>
            <p className="text-blue-300 text-xs truncate">
              {(employee.department as { name: string } | undefined)?.name ?? 'Tidak ada dept.'}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-blue-400" />
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              roleColor[employee.role]
            )}
          >
            {roleLabel[employee.role]}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-2">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-blue-100/70 hover:text-white hover:bg-white/10'
              )}
            >
              <item.icon
                className={cn(
                  'w-4.5 h-4.5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'
                )}
                size={18}
              />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          )
        })}
      </nav>

      {/* Leave Balance (for employees) */}
      {employee.role === 'employee' && (
        <div className="px-3 py-3 mx-3 mb-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
              Saldo Cuti
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-emerald-400 font-bold text-lg">{employee.leave_balance_annual}</p>
              <p className="text-emerald-300/70 text-xs">Tahunan</p>
            </div>
            <div className="text-center p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
              <p className="text-sky-400 font-bold text-lg">{employee.leave_balance_sick}</p>
              <p className="text-sky-300/70 text-xs">Sakit</p>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="px-3 pb-4">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-64 z-50 bg-slate-900 border-r border-slate-800 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  )
}

