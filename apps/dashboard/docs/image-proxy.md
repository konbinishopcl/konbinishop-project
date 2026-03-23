# Proxy de Imágenes

Este documento explica cómo funciona el proxy de imágenes implementado en la aplicación.

## ¿Qué es?

El proxy de imágenes es un endpoint de Next.js (`/api/media/[...path]`) que actúa como intermediario entre el cliente y las fuentes de imágenes (Strapi, Cloudinary, etc.).

## Beneficios

1. **Cache**: Las imágenes se cachean en el servidor de Next.js
2. **Control**: Puedes controlar el acceso a las imágenes
3. **Ocultar URLs**: Las URLs reales de Strapi/Cloudinary no se exponen al cliente
4. **Transformaciones**: Permite aplicar transformaciones a las imágenes (formato, tamaño, calidad)
5. **Reducción de requests**: Reduce las llamadas directas a servicios externos

## Cómo funciona

### Endpoint del Proxy

```
GET /api/media/[ruta-de-la-imagen]
```

### Parámetros de Transformación

- **`?f=webp`** - Convertir a formato WebP (más eficiente)
- **`?w=300`** - Redimensionar ancho a 300px
- **`?h=200`** - Redimensionar alto a 200px
- **`?q=80`** - Calidad de 80% (1-100)

### Lógica de Enrutamiento

- **Imágenes de Strapi**: Si la ruta empieza con `uploads/`, se redirige a Strapi
- **Imágenes de Cloudinary**: Para cualquier otra ruta, se asume que es de Cloudinary
- **Cache**: Se aplican headers de cache para optimizar el rendimiento

### Headers de Cache

- `Cache-Control: public, max-age=31536000, immutable` (1 año)
- `ETag` para validación de cache
- `Vary: Accept` para cache diferenciado por formato

## Uso en el Código

### Helper de URLs

```typescript
import { buildStrapiImageUrl, buildImageUrl } from '@/lib/helpers';

// Para imágenes de Strapi con formato WebP
const imageUrl = buildStrapiImageUrl(strapiImage, {
  format: 'webp',
  quality: 80,
  width: 300,
  height: 200,
});

// Para cualquier imagen con transformaciones
const imageUrl = buildImageUrl(imagePath, {
  format: 'webp',
  width: 300,
  height: 200,
  quality: 80,
});
```

### Ejemplos de URLs Generadas

```typescript
// Imagen original
/api/media/uploads/imagen.jpg

// Imagen convertida a WebP
/api/media/uploads/imagen.jpg?f=webp&q=80

// Imagen redimensionada y convertida
/api/media/uploads/imagen.jpg?f=webp&w=300&h=200&q=80

// Solo redimensionar (mantener formato original)
/api/media/uploads/imagen.jpg?w=300&h=200
```

### Ejemplo de Uso

```typescript
// Antes (URL directa a Strapi)
const imageUrl = `${process.env.NEXT_PUBLIC_STRAPI_URL}/uploads/imagen.jpg`;

// Después (a través del proxy con transformaciones)
const imageUrl = buildStrapiImageUrl(strapiImage, {
  format: 'webp',
  quality: 80,
});
// Resultado: /api/media/uploads/imagen.jpg?f=webp&q=80
```

## Configuración

### Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_CLOUDINARY_BASE_URL=https://res.cloudinary.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Next.js Config

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/media/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};
```

## Migración

### Paso 1: Actualizar Imports

```typescript
// Antes
import { StrapiAPI } from '@/lib/strapi/api';

// Después
import { StrapiAPI } from '@/lib/strapi';
import { buildStrapiImageUrl } from '@/lib/helpers';
```

### Paso 2: Reemplazar Construcción de URLs

```typescript
// Antes
const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const imageUrl = `${baseURL}/${image.url}`;

// Después
const imageUrl = buildStrapiImageUrl(image, { format: 'webp', quality: 80 });
```

### Paso 3: Actualizar Componentes

Buscar y reemplazar todas las construcciones manuales de URLs de imágenes por llamadas al helper.

## Archivos Modificados

- `src/app/api/media/[...path]/route.ts` - Endpoint del proxy con Sharp
- `src/lib/helpers/image-url.ts` - Helper de URLs actualizado
- `src/components/image-upload-field.tsx` - Componente actualizado
- `next.config.ts` - Configuración de imágenes
- `env.example` - Variables de entorno
- `package.json` - Sharp instalado, Axios removido

## Próximos Pasos

1. **Migrar todos los componentes** que construyen URLs de imágenes manualmente
2. **Implementar cache más avanzado** (Redis, etc.)
3. **Agregar más transformaciones** (crop, blur, etc.)
4. **Implementar CDN** para producción
5. **Agregar métricas** de uso del proxy

## Troubleshooting

### Error 404 en imágenes

- Verificar que la ruta de la imagen sea correcta
- Confirmar que la imagen existe en Strapi/Cloudinary
- Revisar los logs del proxy

### Imágenes no se cargan

- Verificar que el proxy esté funcionando (`/api/media/test`)
- Confirmar que las variables de entorno estén configuradas
- Revisar la consola del navegador para errores

### Performance lenta

- Verificar que el cache esté funcionando
- Considerar implementar cache más agresivo
- Revisar el tamaño de las imágenes

### Errores de Sharp

- Verificar que Sharp esté instalado correctamente
- Revisar que los parámetros de formato sean válidos
- Confirmar que la imagen original sea válida
