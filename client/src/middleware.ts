import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

// Paths that don't require authentication
const publicPaths = ['/auth/signin', '/auth/signup']

// Define allowed roles
type AllowedRole = 'admin' | 'level1' | 'level2' | 'level3'

// Role-based route configuration
const roleBasedRoutes = {
  '/admin': ['admin', 'level1', 'level2'] as AllowedRole[],
  '/admin/requests': ['admin', 'level1', 'level2'] as AllowedRole[],
} as const

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    // If user is already logged in, redirect to home
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Check if user is authenticated for protected routes
  if (!token) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check role-based access for specific routes
  const roleRestrictedPath = Object.keys(roleBasedRoutes).find(path => pathname.startsWith(path))
  if (roleRestrictedPath) {
    try {
      const decoded = jwtDecode<{ role: AllowedRole }>(token)
      const allowedRoles = roleBasedRoutes[roleRestrictedPath as keyof typeof roleBasedRoutes]
      
      if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch {
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
} 