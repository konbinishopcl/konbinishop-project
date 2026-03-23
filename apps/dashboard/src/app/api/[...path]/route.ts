import { NextRequest, NextResponse } from 'next/server';

// URL base de Strapi
const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_VERSION = 'api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}${queryString ? `?${queryString}` : ''}`;

    // Obtener headers del cliente
    const clientHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key === 'authorization' || key === 'Authorization') {
        clientHeaders['Authorization'] = value;
      }
    });

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

    // Obtener headers del cliente
    const clientHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key === 'authorization' || key === 'Authorization') {
        clientHeaders['Authorization'] = value;
      }
    });

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
    const body = await request.json();

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}`;

    // Obtener headers del cliente
    const clientHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key === 'authorization' || key === 'Authorization') {
        clientHeaders['Authorization'] = value;
      }
    });

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

    // Construir la URL completa hacia Strapi
    const strapiUrl = `${STRAPI_BASE_URL}/${STRAPI_VERSION}/${path}`;

    // Obtener headers del cliente
    const clientHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key === 'authorization' || key === 'Authorization') {
        clientHeaders['Authorization'] = value;
      }
    });

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
