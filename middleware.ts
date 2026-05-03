import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'devlab-secret-key-change-in-production'
)

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip API routes (except auth) and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('auth_token')?.value

  // Allow access to public paths without a token
  if (PUBLIC_PATHS.includes(pathname)) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const role = payload.role as string
        return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/user', req.url))
      } catch {
        // Invalid token — let them reach login
      }
    }
    return NextResponse.next()
  }

  // No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as string

    // Root path → redirect to role-appropriate dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/user', req.url))
    }

    // Wrong role → redirect to correct dashboard
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/user', req.url))
    }
    if (pathname.startsWith('/user') && role !== 'user') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    return NextResponse.next()
  } catch {
    // Expired or invalid token → send to login
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
