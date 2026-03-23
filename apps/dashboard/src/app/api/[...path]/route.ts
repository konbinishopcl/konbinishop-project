import { NextRequest, NextResponse } from 'next/server';
import { validateRecaptchaToken } from '@/lib/recaptcha';

// URL base de Strapi
const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_VERSION = 'api';

// Allowlist of Strapi API path prefixes accessible via this proxy (SEC-04)
const ALLOWED_PREFIXES = [
  'events',
  'articles',
  'heroes',
  'spots',
  'categories',
  'tags',
  'regions',
  'communes',
  'users',
  'stats',
  'upload',
  'auth/local',
];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
}

function getJwtFromCookie(request: NextRequest): string | null {
  const cookieName = process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
  return request.cookies.get(cookieName)?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');

    // 1. Path allowlist check
    if (!isAllowedPath(path)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const queryString = url.searchParams.toString();

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}${queryString ? `?${queryString}` : ''}`;

    // 2. Cookie-to-header injection (HttpOnly JWT)
    const clientHeaders: Record<string, string> = {};
    const jwt = getJwtFromCookie(request);
    if (jwt) {
      clientHeaders['Authorization'] = `Bearer ${jwt}`;
    }

    // Hacer la request hacia Strapi
    const response = await fetch(strapiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...clientHeaders,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');

    // 1. Path allowlist check
    if (!isAllowedPath(path)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Cookie-to-header injection (HttpOnly JWT)
    const clientHeaders: Record<string, string> = {};
    const jwt = getJwtFromCookie(request);
    if (jwt) {
      clientHeaders['Authorization'] = `Bearer ${jwt}`;
    }

    // 3. reCAPTCHA validation
    const recaptchaToken = request.headers.get('x-recaptcha-token');
    try {
      await validateRecaptchaToken(recaptchaToken, request.method);
    } catch {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Detectar si es FormData o JSON
    const contentType = request.headers.get('content-type') || '';
    let body: FormData | Record<string, unknown>;
    let isFormData = false;

    if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
      isFormData = true;
    } else {
      body = await request.json();
    }

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}`;

    // Construir headers para Strapi
    const strapiHeaders: Record<string, string> = {};

    if (!isFormData) {
      strapiHeaders['Content-Type'] = 'application/json';
    }

    Object.assign(strapiHeaders, clientHeaders);

    // Hacer la request hacia Strapi
    const response = await fetch(strapiUrl, {
      method: 'POST',
      headers: strapiHeaders,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');

    // 1. Path allowlist check
    if (!isAllowedPath(path)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Cookie-to-header injection (HttpOnly JWT)
    const clientHeaders: Record<string, string> = {};
    const jwt = getJwtFromCookie(request);
    if (jwt) {
      clientHeaders['Authorization'] = `Bearer ${jwt}`;
    }

    // 3. reCAPTCHA validation
    const recaptchaToken = request.headers.get('x-recaptcha-token');
    try {
      await validateRecaptchaToken(recaptchaToken, request.method);
    } catch {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}`;

    // Hacer la request hacia Strapi
    const response = await fetch(strapiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...clientHeaders,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');

    // 1. Path allowlist check
    if (!isAllowedPath(path)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Cookie-to-header injection (HttpOnly JWT)
    const clientHeaders: Record<string, string> = {};
    const jwt = getJwtFromCookie(request);
    if (jwt) {
      clientHeaders['Authorization'] = `Bearer ${jwt}`;
    }

    // 3. reCAPTCHA validation
    const recaptchaToken = request.headers.get('x-recaptcha-token');
    try {
      await validateRecaptchaToken(recaptchaToken, request.method);
    } catch {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}`;

    // Hacer la request hacia Strapi
    const response = await fetch(strapiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...clientHeaders,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
