import Link from 'next/link';
import { Eye, Edit, Plus, MapPin } from 'lucide-react';
import { StrapiAPI } from '@/lib/strapi/api';
import ServerPagination from '@/components/server-pagination';
import { Metadata } from 'next';

// Interface for commune data from Strapi
interface Commune {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  region: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Get communes from Strapi API
async function getCommunes(
  page: number = 1,
  pageSize: number = 25
): Promise<{
  communes: Commune[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}> {
  try {
    const response = await StrapiAPI.getCommunes(page, pageSize);
    return {
      communes: (response.data as Commune[]) || [],
      pagination: response.meta.pagination,
    };
  } catch (error) {
    throw error;
  }
}

export const metadata: Metadata = {
  title: 'Comunas | Konbini',
  description:
    'Gestiona las comunas del sistema. Organiza ubicaciones locales dentro de las regiones para eventos y contenido.',
  keywords:
    'konbini, dashboard, admin, comunas, ubicaciones, localización, organización',
};

export default async function CommunesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  let communes: Commune[] = [];
  let pagination = { page: 1, pageSize: 25, pageCount: 1, total: 0 };
  let error: string | null = null;

  try {
    const result = await getCommunes(currentPage, 25);
    communes = result.communes;
    pagination = result.pagination;
  } catch {
    error = 'Error al cargar las comunas';
  }

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Comunas</h1>
              <p className='text-gray-600 mt-2'>
                Gestiona las comunas del sistema • Ordenadas alfabéticamente
              </p>
            </div>
            <Link
              href='/dashboard/communes/create'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <Plus size={16} className='mr-2' />
              Nueva Comuna
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

        {/* Communes table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Comuna
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Región
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Slug
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Fecha de Creación
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
                {communes.map(commune => (
                  <tr key={commune.documentId}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <Link
                        href={`/dashboard/communes/${commune.documentId}`}
                        className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                      >
                        {commune.name}
                      </Link>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {commune.region?.name || 'Sin región'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='slug-text'>{commune.slug}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>
                        {new Date(commune.createdAt).toLocaleDateString(
                          'es-ES',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center space-x-2'>
                        <Link
                          href={`/dashboard/communes/${commune.documentId}`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Ver comuna'
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/dashboard/communes/${commune.documentId}/edit`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Editar comuna'
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
          {communes.length === 0 && !error && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <MapPin className='mx-auto h-12 w-12' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No hay comunas
              </h3>
              <p className='text-gray-500 mb-6'>
                Comienza creando tu primera comuna.
              </p>
              <Link
                href='/dashboard/communes/create'
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Plus size={16} className='mr-2' />
                Crear Comuna
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {communes.length > 0 && (
          <div className='mt-6'>
            <ServerPagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              totalItems={pagination.total}
              itemsPerPage={pagination.pageSize}
              baseUrl='/dashboard/communes'
            />
          </div>
        )}
      </div>
    </div>
  );
}
