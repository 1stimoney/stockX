import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const pathname = req.nextUrl.pathname

  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/')
  const isVerifyRoute = pathname.startsWith('/auth/verify')
  const isProtected =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not signed in -> block protected + admin
  if (!user && (isProtected || isAdminRoute)) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Signed in -> keep them out of /auth (but allow verify page)
  if (user && isAuthRoute && !isVerifyRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin gate: must be admin in profiles.role
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*', '/auth'],
}
