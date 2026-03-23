import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// URLs base
const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const CLOUDINARY_BASE_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL || 'https://res.cloudinary.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');

    // Obtener query params para transformaciones
    const url = new URL(request.url);
    const format = url.searchParams.get('f'); // formato: webp, jpg, png, etc.
    const width = url.searchParams.get('w'); // ancho
    const height = url.searchParams.get('h'); // alto
    const quality = url.searchParams.get('q'); // calidad (1-100)

    // Determinar si es una imagen de Strapi o Cloudinary
    let imageUrl: string;

    // Si la imagen empieza con 'uploads/', es de Strapi
    if (path.startsWith('uploads/')) {
      imageUrl = `${STRAPI_BASE_URL}/${path}`;
    } else {
      // Si no, asumimos que es de Cloudinary
      imageUrl = `${CLOUDINARY_BASE_URL}/${path}`;
    }

    // Hacer fetch de la imagen
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Obtener el contenido de la imagen
    const imageBuffer = await response.arrayBuffer();

    // Si no hay parámetros de transformación, servir la imagen original
    if (!format && !width && !height && !quality) {
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: `"${Date.now()}"`,
        },
      });
    }

    // Procesar la imagen con Sharp
    let sharpInstance = sharp(Buffer.from(imageBuffer));

    // Aplicar redimensionamiento si se especifica
    if (width || height) {
      const resizeOptions: { width?: number; height?: number } = {};
      if (width) resizeOptions.width = parseInt(width);
      if (height) resizeOptions.height = parseInt(height);
      sharpInstance = sharpInstance.resize(resizeOptions);
    }

    // Aplicar formato si se especifica
    if (format) {
      const formatOptions: { quality?: number } = {};
      if (quality) formatOptions.quality = parseInt(quality);

      switch (format.toLowerCase()) {
        case 'webp':
          sharpInstance = sharpInstance.webp(formatOptions);
          break;
        case 'jpg':
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg(formatOptions);
          break;
        case 'png':
          sharpInstance = sharpInstance.png(formatOptions);
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif(formatOptions);
          break;
        default:
          // Si el formato no es soportado, mantener el original
          break;
      }
    }

    // Procesar la imagen
    const processedBuffer = await sharpInstance.toBuffer();

    // Determinar el content-type basado en el formato
    let contentType = 'image/jpeg';
    if (format) {
      switch (format.toLowerCase()) {
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'avif':
          contentType = 'image/avif';
          break;
      }
    }

    // Crear la respuesta con headers de cache
    const nextResponse = new NextResponse(new Uint8Array(processedBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: `"${Date.now()}"`,
        Vary: 'Accept', // Para cache diferenciado por formato
      },
    });

    return nextResponse;
  } catch (error) {
    console.error('Media error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
