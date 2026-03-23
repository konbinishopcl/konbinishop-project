import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward login to Strapi
    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!strapiRes.ok) {
      const error = await strapiRes.json();
      return NextResponse.json(error, { status: strapiRes.status });
    }

    const data = await strapiRes.json();

    // Fetch full user with role populated
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });

    if (!meRes.ok) {
      return NextResponse.json(
        { error: { message: 'Error obteniendo datos del usuario' } },
        { status: 500 }
      );
    }

    const userData = await meRes.json();

    // Validate dashboard role server-side
    if (!userData.role || userData.role.type !== 'dashboard') {
      return NextResponse.json(
        {
          error: {
            message:
              'Acceso denegado. Solo usuarios con rol "Dashboard" pueden acceder al sistema.',
          },
        },
        { status: 403 }
      );
    }

    // Set HttpOnly cookie server-side
    const response = NextResponse.json({ user: userData });
    response.cookies.set(COOKIE_NAME, data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
