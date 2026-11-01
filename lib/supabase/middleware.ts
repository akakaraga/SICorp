import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Mode dummy: bypass auth check dan biarkan request lanjut
  if (process.env.USE_DUMMY_DATA === 'true') {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users trying to access protected routes
  if (!user && pathname.startsWith('/dashboard')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login page
  if (user && pathname === '/login') {
    // Get employee role and redirect accordingly
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single()

    // Jika user belum ada di tabel employees, biarkan di halaman login untuk mencegah loop
    if (!employee) {
      return supabaseResponse
    }

    const role = employee.role ?? 'employee'
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname =
      role === 'hrd'
        ? '/dashboard/hrd'
        : role === 'manager'
        ? '/dashboard/manager'
        : '/dashboard/employee'
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based route protection
  if (user && pathname.startsWith('/dashboard')) {
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = employee?.role ?? 'employee'

    // Block non-HRD from /dashboard/hrd
    if (pathname.startsWith('/dashboard/hrd') && role !== 'hrd') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname =
        role === 'manager' ? '/dashboard/manager' : '/dashboard/employee'
      return NextResponse.redirect(redirectUrl)
    }

    // Block non-managers and non-HRD from /dashboard/manager
    if (
      pathname.startsWith('/dashboard/manager') &&
      role !== 'manager' &&
      role !== 'hrd'
    ) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard/employee'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

