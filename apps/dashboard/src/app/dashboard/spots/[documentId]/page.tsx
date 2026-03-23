import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft, Edit } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Spot {
  id: number;
  documentId: string;
  title: string;
  image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  link?: string;
  expiration_date?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;

  try {
    const { data: spot } = (await StrapiAPI.getSpot(documentId)) as {
      data: Spot;
    };

    if (!spot) {
      return {
        title: 'Spot no encontrado | Konbini',
        description: 'El spot que buscas no existe o ha sido eliminado.',
      };
    }

    return {
      title: `${spot.title} | Spot | Konbini`,
      description: `Detalles del spot publicitario: ${spot.title} en Konbini.`,
      keywords: `konbini, dashboard, admin, spot, ${spot.title}, publicidad, banner`,
    };
  } catch {
    return {
      title: 'Spot no encontrado | Konbini',
      description: 'El spot que buscas no existe o ha sido eliminado.',
    };
  }
}

export default async function SpotDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { data: spot } = (await StrapiAPI.getSpot(documentId)) as {
    data: Spot;
  };

  if (!spot) {
    return (
      <div className='p-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center py-12'>
            <div className='text-red-400 mb-4'>
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
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Spot no encontrado
            </h3>
            <p className='text-gray-500 mb-6'>
              El spot que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href='/dashboard/spots'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Spots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/dashboard/spots'
                className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Spots
              </Link>
            </div>
            <Link
              href={`/dashboard/spots/${spot.documentId}/edit`}
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <Edit size={16} className='mr-2' />
              Editar Spot
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>{spot.title}</h1>
            <p className='text-gray-600 mt-2'>Detalles del spot publicitario</p>
          </div>
        </div>

        {/* Two Column Layout with Separate Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Main Information (2/3 width) */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg border border-gray-200 p-8 h-full'>
              <div className='space-y-8'>
                {/* Basic Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <svg
                      className='mr-2 text-[var(--brand-primary)] h-5 w-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID del Spot:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{spot.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Título:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {spot.title}
                      </span>
                    </div>
                    {spot.link && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Enlace:{' '}
                        </span>
                        <a
                          href={spot.link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline break-all'
                        >
                          {spot.link}
                        </a>
                      </div>
                    )}
                    {spot.expiration_date && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Fecha de Expiración:{' '}
                        </span>
                        <span className='text-sm text-gray-900'>
                          {new Date(spot.expiration_date).toLocaleDateString(
                            'es-ES',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <svg
                      className='mr-2 text-[var(--brand-primary)] h-5 w-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Estado:{' '}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          spot.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {spot.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {new Date(spot.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {new Date(spot.updatedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {spot.publishedAt && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Fecha de Publicación:{' '}
                        </span>
                        <span className='text-sm text-gray-900'>
                          {new Date(spot.publishedAt).toLocaleDateString(
                            'es-ES',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 h-full'>
              <div className='space-y-6'>
                {/* Image */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <svg
                      className='mr-2 text-[var(--brand-primary)] h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                    Imagen del Spot
                  </h3>
                  {spot.image ? (
                    <div className='space-y-2'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          spot.image.url.startsWith('http')
                            ? spot.image.url
                            : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${spot.image.url.startsWith('/') ? spot.image.url : `/${spot.image.url}`}`
                        }
                        alt={spot.image.name}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <div className='text-sm text-gray-600'>
                        <p className='font-medium'>{spot.image.name}</p>
                        <p className='text-xs text-gray-500'>
                          ID: {spot.image.id}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8 bg-gray-50 rounded-lg'>
                      <svg
                        className='mx-auto h-8 w-8 text-gray-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                      <p className='text-sm text-gray-500 mt-2'>Sin imagen</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
