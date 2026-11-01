export type UserRole = 'employee' | 'manager' | 'hrd'
export type LeaveType = 'annual' | 'sick' | 'maternity' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Employee {
  id: string
  full_name: string
  role: UserRole
  department_id: string
  manager_id: string | null
  leave_balance_annual: number
  leave_balance_sick: number
  created_at: string
  // Joined fields (not in DB, added at query time)
  department?: { name: string } | null
  manager?: { full_name: string } | { full_name: string }[] | null
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  attachment_url: string | null
  manager_notes: string | null
  created_at: string
  // Joined fields
  employee?: {
    full_name: string
    department?: { name: string } | null
    manager_id?: string | null
    leave_balance_annual?: number
    leave_balance_sick?: number
  } | null
}

// Supabase Database type for typed client
export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          full_name: string
          role: string
          department_id: string
          manager_id: string | null
          leave_balance_annual: number
          leave_balance_sick: number
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: string
          department_id: string
          manager_id?: string | null
          leave_balance_annual?: number
          leave_balance_sick?: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          department_id?: string
          manager_id?: string | null
          leave_balance_annual?: number
          leave_balance_sick?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'emp_dept'
            columns: ['department_id']
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'emp_manager'
            columns: ['manager_id']
            referencedRelation: 'employees'
            referencedColumns: ['id']
          }
        ]
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason: string
          status: string
          attachment_url: string | null
          manager_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason: string
          status?: string
          attachment_url?: string | null
          manager_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          reason?: string
          status?: string
          attachment_url?: string | null
          manager_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leave_emp'
            columns: ['employee_id']
            referencedRelation: 'employees'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
