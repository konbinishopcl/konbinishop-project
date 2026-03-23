'use client';

import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import { useRef } from 'react';

interface EventImage {
  id: number;
  url: string;
  name: string;
  type?: 'banner' | 'poster' | 'gallery';
  fullUrl?: string;
}

interface EventGalleryProps {
  banner?: EventImage;
  poster?: EventImage;
  gallery?: EventImage[];
}

export default function EventGallery({
  banner,
  poster,
  gallery = [],
}: EventGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);

  // Función para construir la URL completa de la imagen
  const buildImageUrl = (image: EventImage): string => {
    if (!image.url) return '';

    // Si ya es una URL completa, usarla tal como está
    if (image.url.startsWith('http')) {
      return image.url;
    }

    // Si es una ruta relativa, concatenar con la URL de la API
    const baseURL =
      process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const cleanUrl = image.url.startsWith('/')
      ? image.url.substring(1)
      : image.url;
    return `${baseURL}/${cleanUrl}`;
  };

  // Combinar todas las imágenes en un array, con banner y poster primero
  const allImages = [
    ...(banner
      ? [{ ...banner, type: 'banner' as const, fullUrl: buildImageUrl(banner) }]
      : []),
    ...(poster
      ? [{ ...poster, type: 'poster' as const, fullUrl: buildImageUrl(poster) }]
      : []),
    ...(gallery && Array.isArray(gallery)
      ? gallery.map(img => ({
          ...img,
          type: 'gallery' as const,
          fullUrl: buildImageUrl(img),
        }))
      : []),
  ];

  if (allImages.length === 0) {
    return (
      <div className='bg-gray-50 rounded-lg p-8 text-center'>
        <div className='text-gray-400 mb-2'>
          <svg
            className='mx-auto h-12 w-12'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z'
            />
          </svg>
        </div>
        <p className='text-gray-500'>
          No hay imágenes disponibles para este evento
        </p>
      </div>
    );
  }

  const getBadgeColor = (type: 'banner' | 'poster' | 'gallery') => {
    switch (type) {
      case 'banner':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'poster':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeText = (type: 'banner' | 'poster' | 'gallery') => {
    switch (type) {
      case 'banner':
        return 'Banner';
      case 'poster':
        return 'Poster';
      default:
        return 'Galería';
    }
  };

  const openPhotoSwipe = (index: number) => {
    const items = allImages.map(image => ({
      src: image.fullUrl || image.url,
      width: 1200,
      height: 800,
      alt: image.name,
    }));

    const gallery = new PhotoSwipe({
      dataSource: items,
      index,
      // Configuración básica
      maxZoomLevel: 1,
      bgOpacity: 0.9,
      showHideAnimationType: 'fade',
      showAnimationDuration: 300,
      hideAnimationDuration: 300,
      paddingFn: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    });

    gallery.init();
  };

  return (
    <>
      {/* Grid de imágenes */}
      <div
        ref={galleryRef}
        className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'
      >
        {allImages.map((image, index) => (
          <div
            key={image.id}
            className='relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg'
            onClick={() => openPhotoSwipe(index)}
          >
            {/* Badge */}
            <div
              className={`absolute top-2 left-2 z-10 px-2 py-1 text-xs font-medium rounded-full border ${getBadgeColor(image.type)}`}
            >
              {getBadgeText(image.type)}
            </div>

            {/* Imagen */}
            <div className='aspect-square relative bg-gray-100'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.fullUrl}
                alt={image.name}
                className='w-full h-full object-cover transition-transform duration-200 group-hover:scale-105'
              />
            </div>

            {/* Nombre de la imagen */}
            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2'>
              <p className='text-white text-xs truncate'>{image.name}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
