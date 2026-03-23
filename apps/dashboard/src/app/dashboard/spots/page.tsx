import ServerPagination from '@/components/server-pagination';
import { StrapiAPI } from '@/lib/strapi/api';
import { Edit, Eye, Plus } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Interface for spot data from Strapi
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

// Get spots from Strapi API
async function getSpots(
  page: number = 1,
  pageSize: number = 25
): Promise<{
  spots: Spot[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}> {
  try {
    const response = await StrapiAPI.getSpots(page, pageSize);
    return {
      spots: (response.data as Spot[]) || [],
      pagination: response.meta.pagination,
    };
  } catch (error) {
    throw error;
  }
}

export const metadata: Metadata = {
  title: 'Spots | Konbini',
  description:
    'Gestiona los spots publicitarios del sistema. Administra banners promocionales con enlaces y fechas de expiración.',
  keywords:
    'konbini, dashboard, admin, spots, publicidad, banners, gestión, administración',
};

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  let spots: Spot[] = [];
  let pagination = { page: 1, pageSize: 25, pageCount: 1, total: 0 };
  let error: string | null = null;

  try {
    const result = await getSpots(currentPage, 25);
    spots = result.spots;
    pagination = result.pagination;
  } catch {
    error = 'Error al cargar los spots';
  }

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Spots</h1>
              <p className='text-gray-600 mt-2'>
                Gestiona los spots publicitarios del sistema
              </p>
            </div>
            <Link
              href='/dashboard/spots/create'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <Plus size={16} className='mr-2' />
              Nuevo Spot
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <div className='text-red-400'>
                <svg
                  className='h-5 w-5'
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
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          </div>
        )}

        {/* Spots table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Imagen
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Título
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Enlace
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Fecha de Expiración
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Estado
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {spots.map(spot => (
                  <tr key={spot.documentId} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {spot.image ? (
                        <div className='w-16 h-16 bg-gray-100 rounded-full overflow-hidden border border-gray-200'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              spot.image.url.startsWith('http')
                                ? spot.image.url
                                : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${spot.image.url.startsWith('/') ? spot.image.url : `/${spot.image.url}`}`
                            }
                            alt={spot.image.name || 'Imagen del spot'}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      ) : (
                        <div className='w-16 h-16 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center'>
                          <svg
                            className='h-8 w-8 text-gray-400'
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
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='max-w-xs'>
                        <Link
                          href={`/dashboard/spots/${spot.documentId}`}
                          className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors line-clamp-2'
                        >
                          {spot.title}
                        </Link>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {spot.link ? (
                        <a
                          href={spot.link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 truncate max-w-xs block underline'
                        >
                          {spot.link}
                        </a>
                      ) : (
                        <span className='text-sm text-gray-400'>
                          Sin enlace
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {spot.expiration_date ? (
                        <div className='text-sm text-gray-900'>
                          {new Date(spot.expiration_date).toLocaleDateString(
                            'es-ES'
                          )}
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400'>Sin fecha</span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          spot.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {spot.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center space-x-2'>
                        <Link
                          href={`/dashboard/spots/${spot.documentId}`}
                          className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition-colors underline'
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/dashboard/spots/${spot.documentId}/edit`}
                          className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition-colors'
                        >
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {spots.length === 0 && !error && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
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
                    d='M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No hay spots
              </h3>
              <p className='text-gray-500 mb-6'>
                Comienza creando tu primer spot publicitario.
              </p>
              <Link
                href='/dashboard/spots/create'
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Plus size={16} className='mr-2' />
                Crear Spot
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {spots.length > 0 && (
          <div className='mt-6'>
            <ServerPagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              totalItems={pagination.total}
              itemsPerPage={pagination.pageSize}
              baseUrl='/dashboard/spots'
            />
          </div>
        )}
      </div>
    </div>
  );
}
