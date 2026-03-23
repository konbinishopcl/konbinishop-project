import ServerPagination from '@/components/server-pagination';
import { StrapiAPI } from '@/lib/strapi/api';
import { Edit, Eye, Image as ImageIcon, Plus } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Interface for hero data from Strapi
interface Hero {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  date: string;
  address: string;
  address_number: string;
  venue: string;
  link?: string;
  categories?: Array<{
    id: number;
    name: string;
  }> | null;
  region?: {
    id: number;
    name: string;
  } | null;
  commune?: {
    id: number;
    name: string;
  } | null;
  desktop_image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  tablet_image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  mobile_image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  thumbnail?: {
    id: number;
    url: string;
    name: string;
  } | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Get heroes from Strapi API
async function getHeroes(
  page: number = 1,
  pageSize: number = 25
): Promise<{
  heroes: Hero[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}> {
  try {
    const response = await StrapiAPI.getHeroes(page, pageSize);
    return {
      heroes: (response.data as Hero[]) || [],
      pagination: response.meta.pagination,
    };
  } catch (error) {
    throw error;
  }
}

export const metadata: Metadata = {
  title: 'Heroes | Konbini',
  description:
    'Gestiona los heroes del sistema. Administra banners principales con imágenes y enlaces personalizados.',
  keywords:
    'konbini, dashboard, admin, heroes, banners, gestión, administración',
};

export default async function HeroesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  let heroes: Hero[] = [];
  let pagination = { page: 1, pageSize: 25, pageCount: 1, total: 0 };
  let error: string | null = null;

  try {
    const result = await getHeroes(currentPage, 25);
    heroes = result.heroes;
    pagination = result.pagination;
  } catch {
    error = 'Error al cargar los heroes';
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Heroes</h1>
              <p className='text-gray-600 mt-2'>
                Gestiona las secciones hero • Ordenadas por fecha
              </p>
            </div>
            <Link
              href='/dashboard/heroes/create'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <Plus size={16} className='mr-2' />
              Nuevo Hero
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

        {/* Heroes table */}
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
                    className='px-6 py-3 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Título
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Lugar
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Categoría
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
                    Fecha
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
                {heroes.map(hero => (
                  <tr key={hero.documentId}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {hero.thumbnail ? (
                        <div className='w-16 h-16 bg-gray-100 rounded-full overflow-hidden border border-gray-200'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              hero.thumbnail.url.startsWith('http')
                                ? hero.thumbnail.url
                                : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${hero.thumbnail.url.startsWith('/') ? hero.thumbnail.url : `/${hero.thumbnail.url}`}`
                            }
                            alt={hero.thumbnail.name || 'Imagen del hero'}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      ) : (
                        <div className='w-16 h-16 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center'>
                          <ImageIcon size={20} className='text-gray-400' />
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='max-w-xs'>
                        <Link
                          href={`/dashboard/heroes/${hero.documentId}`}
                          className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors line-clamp-2'
                        >
                          {hero.title}
                        </Link>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='max-w-xs'>
                        <p className='text-sm text-gray-900 line-clamp-2'>
                          {hero.venue}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {hero.address} {hero.address_number}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-wrap gap-1'>
                        {hero.categories && hero.categories.length > 0 ? (
                          hero.categories.map(category => (
                            <span
                              key={category.id}
                              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            >
                              {category.name}
                            </span>
                          ))
                        ) : (
                          <span className='text-sm text-gray-500'>
                            Sin categoría
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hero.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {hero.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>
                        {formatDate(hero.date)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center space-x-2'>
                        <Link
                          href={`/dashboard/heroes/${hero.documentId}`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Ver hero'
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/dashboard/heroes/${hero.documentId}/edit`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Editar hero'
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
          {heroes.length === 0 && !error && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <ImageIcon className='mx-auto h-12 w-12' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No hay heroes
              </h3>
              <p className='text-gray-500 mb-6'>
                Comienza creando tu primera sección hero.
              </p>
              <Link
                href='/dashboard/heroes/create'
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Plus size={16} className='mr-2' />
                Crear Hero
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {heroes.length > 0 && (
          <div className='mt-6'>
            <ServerPagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              totalItems={pagination.total}
              itemsPerPage={pagination.pageSize}
              baseUrl='/dashboard/heroes'
            />
          </div>
        )}
      </div>
    </div>
  );
}
