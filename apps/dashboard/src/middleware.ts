import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get(
    process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt'
  );

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/'];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is authenticated and tries to access login page, redirect to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is on home page and authenticated, redirect to dashboard
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For protected routes, validate user role if token exists
  if (token && !isPublicRoute) {
    try {
      // Get user info from token to validate role
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/users/me?populate=role`,
        {
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        }
      );

      if (userResponse.ok) {
        const user = await userResponse.json();
        if (!user.role || user.role.type !== 'dashboard') {
          const response = NextResponse.redirect(
            new URL('/login', request.url)
          );
          response.cookies.delete(
            process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt'
          );
          return response;
        }
      } else {
        // Token is invalid, clear it and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(
          process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt'
        );
        return response;
      }
    } catch (error) {
      console.error('Error validating user role in middleware:', error);
      // On error, clear token and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(
        process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt'
      );
      return response;
    }
  }

  // Obtener la respuesta
  const response = NextResponse.next();

  // Headers para bloquear motores de búsqueda
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, nosnippet, noimageindex'
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Headers de seguridad adicionales
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Cache control para evitar cacheo
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
