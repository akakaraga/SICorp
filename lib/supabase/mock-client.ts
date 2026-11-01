/**
 * Mock Supabase Server Client untuk development tanpa koneksi Supabase
 *
 * File ini digunakan ketika USE_DUMMY_DATA=true di .env.local
 * Semua query database di-intercept dan mengembalikan data dummy.
 *
 * Ganti ACTIVE_USER_ID di bawah untuk testing role yang berbeda:
 *   'user-hrd-001'  → HRD (Siti Rahayu)
 *   'user-mgr-001'  → Manager (Budi Santoso)
 *   'user-emp-001'  → Employee (Andi Wijaya)
 */

import {
  DUMMY_USER,
  DUMMY_EMPLOYEES,
  DUMMY_DEPARTMENTS,
  DUMMY_LEAVE_REQUESTS,
} from './mock-data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQueryBuilder(dataset: any[]): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: {
    filters: Record<string, unknown>
    inFilter?: { key: string; values: string[] }
    orderKey: string
    ascending: boolean
    limitN?: number
  } = {
    filters: {},
    orderKey: 'created_at',
    ascending: true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyAll = (): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows: any[] = [...dataset]

    // eq filters
    for (const [key, val] of Object.entries(state.filters)) {
      rows = rows.filter((row) => row[key] === val)
    }

    // in filter
    if (state.inFilter) {
      const { key, values } = state.inFilter
      rows = rows.filter((row) => values.includes(row[key]))
    }

    // sort
    rows.sort((a, b) => {
      const va = a[state.orderKey] ?? ''
      const vb = b[state.orderKey] ?? ''
      if (state.ascending) return va < vb ? -1 : va > vb ? 1 : 0
      return va > vb ? -1 : va < vb ? 1 : 0
    })

    // limit
    if (state.limitN !== undefined) {
      rows = rows.slice(0, state.limitN)
    }

    return rows
  }

  const builder = {
    select(_cols: string) { return builder },
    eq(col: string, val: unknown) {
      state.filters[col] = val
      return builder
    },
    in(col: string, values: string[]) {
      state.inFilter = { key: col, values }
      return builder
    },
    order(col: string, opts?: { ascending?: boolean }) {
      state.orderKey = col
      state.ascending = opts?.ascending ?? true
      return builder
    },
    limit(n: number) {
      state.limitN = n
      return builder
    },
    single() {
      const rows = applyAll()
      return Promise.resolve({ data: rows[0] ?? null, error: null })
    },
    // Makes the builder awaitable (async/await + destructuring)
    then(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve: (v: { data: any[]; error: null }) => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _reject?: (e: any) => void
    ) {
      resolve({ data: applyAll(), error: null })
    },
  }

  return builder
}

export function createMockClient(activeUserId: string = 'user-hrd-001') {
  const ACTIVE_USER_ID = activeUserId
  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { ...DUMMY_USER, id: ACTIVE_USER_ID } },
          error: null,
        }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      admin: {
        createUser: () =>
          Promise.resolve({
            data: { user: { id: `user-new-${Date.now()}` } },
            error: null,
          }),
      },
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from(table: string): any {
      const tableMap: Record<string, unknown[]> = {
        employees: DUMMY_EMPLOYEES,
        departments: DUMMY_DEPARTMENTS,
        leave_requests: DUMMY_LEAVE_REQUESTS,
      }
      const data = tableMap[table] ?? []

      return {
        select: (_cols: string) => buildQueryBuilder(data),
        insert: () => Promise.resolve({ error: null }),
        update: (_vals: unknown) => ({
          eq: (_col: string, _val: unknown) => Promise.resolve({ error: null }),
        }),
      }
    },

    storage: {
      from: (_bucket: string) => ({
        upload: (_path: string, _file: unknown) =>
          Promise.resolve({ data: { path: 'dummy/path.jpg' }, error: null }),
      }),
    },
  }
}
