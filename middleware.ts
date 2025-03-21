import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/sign-in', '/sign-up']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si la ruta es pública
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar si el usuario está autenticado
  const isAuthenticated = request.cookies.has('auth-token') // Ajusta esto según tu implementación de autenticación

  if (!isAuthenticated) {
    // Redirigir a la página de login si no está autenticado
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 