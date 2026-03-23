/**
 * Helper para construir URLs de imágenes a través del proxy de media
 * Este helper centraliza la lógica de construcción de URLs de imágenes
 * y permite que todas las imágenes pasen por el proxy de Next.js
 */

/**
 * Construye la URL de una imagen a través del proxy de media
 * @param imageUrl - URL de la imagen (puede ser relativa o absoluta)
 * @param options - Opciones adicionales
 * @returns URL completa a través del proxy
 */
export function buildImageUrl(
  imageUrl: string | null | undefined,
  options: {
    format?: 'webp' | 'jpg' | 'jpeg' | 'png' | 'avif';
    quality?: number;
    width?: number;
    height?: number;
  } = {}
): string {
  if (!imageUrl) {
    return '/placeholder-image.jpg'; // Imagen por defecto
  }

  // Si ya es una URL completa que no es de Strapi, devolverla tal como está
  if (imageUrl.startsWith('http') && !imageUrl.includes('localhost:1337')) {
    return imageUrl;
  }

  // Extraer la ruta de la imagen
  let imagePath = imageUrl;

  // Si es una URL completa de Strapi, extraer solo la ruta
  if (imageUrl.startsWith('http')) {
    const url = new URL(imageUrl);
    imagePath = url.pathname;
  }

  // Limpiar la ruta (remover /api si existe)
  if (imagePath.startsWith('/api/')) {
    imagePath = imagePath.substring(5); // Remover '/api/'
  }

  // Limpiar la ruta (remover slash inicial si existe)
  if (imagePath.startsWith('/')) {
    imagePath = imagePath.substring(1);
  }

  // Si empieza con 'uploads/', mantenerlo; si no, agregarlo
  if (!imagePath.startsWith('uploads/')) {
    imagePath = `uploads/${imagePath}`;
  }

  // Construir la URL del proxy
  let proxyUrl = `/api/media/${imagePath}`;

  // Agregar parámetros de transformación si se especifican
  const params = new URLSearchParams();

  if (options.format) {
    params.append('f', options.format);
  }

  if (options.quality) {
    params.append('q', options.quality.toString());
  }

  if (options.width) {
    params.append('w', options.width.toString());
  }

  if (options.height) {
    params.append('h', options.height.toString());
  }

  if (params.toString()) {
    proxyUrl += `?${params.toString()}`;
  }

  return proxyUrl;
}

/**
 * Construye la URL de una imagen de Strapi específicamente
 * @param strapiImage - Objeto de imagen de Strapi
 * @param options - Opciones de formato
 * @returns URL a través del proxy
 */
export function buildStrapiImageUrl(
  strapiImage:
    | {
        url?: string;
        formats?: Record<string, { url?: string }>;
      }
    | null
    | undefined,
  options: {
    format?: 'webp' | 'jpg' | 'jpeg' | 'png' | 'avif';
    quality?: number;
    width?: number;
    height?: number;
  } = {}
): string {
  if (!strapiImage) {
    return '/placeholder-image.jpg';
  }

  let imageUrl = strapiImage.url;

  // Si se especifica un formato y está disponible, usarlo
  if (options.format && strapiImage.formats?.[options.format]?.url) {
    imageUrl = strapiImage.formats[options.format].url;
  }

  return buildImageUrl(imageUrl, options);
}

/**
 * Construye la URL de una imagen de Cloudinary
 * @param cloudinaryPath - Ruta de la imagen en Cloudinary
 * @param options - Opciones de transformación
 * @returns URL a través del proxy
 */
export function buildCloudinaryImageUrl(
  cloudinaryPath: string,
  options: {
    format?: 'webp' | 'jpg' | 'jpeg' | 'png' | 'avif';
    quality?: number;
    width?: number;
    height?: number;
    crop?: 'fill' | 'scale' | 'fit' | 'thumb';
  } = {}
): string {
  // Construir la URL del proxy para Cloudinary
  let proxyUrl = `/api/media/${cloudinaryPath}`;

  // Agregar parámetros de transformación de Cloudinary
  const params = new URLSearchParams();

  if (options.format) {
    params.append('f', options.format);
  }

  if (options.quality) {
    params.append('q', options.quality.toString());
  }

  if (options.width) {
    params.append('w', options.width.toString());
  }

  if (options.height) {
    params.append('h', options.height.toString());
  }

  if (options.crop) {
    params.append('c', options.crop);
  }

  if (params.toString()) {
    proxyUrl += `?${params.toString()}`;
  }

  return proxyUrl;
}
