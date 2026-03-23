import ServerPagination from '@/components/server-pagination';
import { StrapiAPI } from '@/lib/strapi/api';
import { Calendar, Edit, Eye, MapPin, Plus } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Interface for event data from Strapi
interface Event {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  company: string;
  description: string;
  isFree: boolean;
  address: string;
  address_number: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  categories?: Array<{ documentId: string; name: string }>;
  user?: {
    id: number;
    username: string;
    firstname?: string;
    lastname?: string;
  };
  commune?: { documentId: string; name: string };
  region?: { documentId: string; name: string };
  banner?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
}

// Get events from Strapi API using the StrapiAPI class
async function getEvents(
  page: number = 1,
  pageSize: number = 25
): Promise<{
  events: Event[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}> {
  try {
    const response = await StrapiAPI.getEvents(page, pageSize);
    return {
      events: (response.data as Event[]) || [],
      pagination: response.meta.pagination,
    };
  } catch (error) {
    throw error;
  }
}

export const metadata: Metadata = {
  title: 'Eventos | Konbini',
  description:
    'Gestiona todos los eventos del sistema. Crea, edita y administra eventos con información detallada.',
  keywords: 'konbini, dashboard, admin, eventos, gestión, administración',
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  let events: Event[] = [];
  let pagination = { page: 1, pageSize: 25, pageCount: 1, total: 0 };
  let errorMessage: string | null = null;

  try {
    const result = await getEvents(currentPage, 25);
    events = result.events;
    pagination = result.pagination;

    // Ensure events are sorted by creation date (newest first) as a backup
    events.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    errorMessage = 'Error al cargar los eventos';
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
              <h1 className='text-3xl font-bold text-gray-900'>Eventos</h1>
              <p className='text-gray-600 mt-2'>
                Gestiona los eventos • Ordenados del más nuevo al más antiguo
              </p>
            </div>
            <Link
              href='/dashboard/events/create'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <Plus size={16} className='mr-2' />
              Nuevo Evento
            </Link>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
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
              <p className='text-sm text-red-600'>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Events table */}
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
                    Categoría
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Ubicación
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Estado y Fecha
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
                {events.map(event => (
                  <tr key={event.documentId}>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-center'>
                        {event.banner ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${event.banner.url}`}
                              alt={event.banner.alternativeText || event.title}
                              className='w-16 h-16 object-cover rounded-full'
                            />
                          </>
                        ) : (
                          <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center'>
                            <span className='text-gray-400 text-xs'>
                              Sin imagen
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='max-w-xs'>
                        <Link
                          href={`/dashboard/events/${event.documentId}`}
                          className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors block truncate'
                          title={event.title}
                        >
                          {event.title.length > 30
                            ? `${event.title.substring(0, 30)}...`
                            : event.title}
                        </Link>
                        {event.user && (
                          <div className='text-xs mt-1'>
                            <Link
                              href={`/dashboard/users/${event.user.id}`}
                              className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                            >
                              {event.user.firstname && event.user.lastname
                                ? `${event.user.firstname} ${event.user.lastname}`
                                : event.user.username}
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900'>
                        {event.categories && event.categories.length > 0 ? (
                          <div className='flex flex-wrap gap-1'>
                            {event.categories.map((category, index) => (
                              <Link
                                key={category.documentId}
                                href={`/dashboard/categories/${category.documentId}`}
                                className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-colors border border-[var(--brand-primary)]/20'
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className='text-gray-500 text-xs'>
                            Sin categorías
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900'>
                        <div className='flex items-center space-x-1'>
                          <MapPin size={14} className='text-gray-400' />
                          <span>
                            {event.address} {event.address_number}
                          </span>
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {event.commune ? (
                            <Link
                              href={`/dashboard/communes/${event.commune.documentId}`}
                              className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                            >
                              {event.commune.name}
                            </Link>
                          ) : (
                            'Sin comuna'
                          )}
                          {event.region && (
                            <>
                              ,{' '}
                              <Link
                                href={`/dashboard/regions/${event.region.documentId}`}
                                className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                              >
                                {event.region.name}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex flex-col space-y-2 items-start justify-start text-left'>
                        <span
                          className={`inline-flex items-center justify-start px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.publishedAt
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {event.publishedAt ? 'Publicado' : 'Borrador'}
                        </span>
                        <div className='text-sm text-gray-500 text-left'>
                          {formatDate(event.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center space-x-2'>
                        <Link
                          href={`/dashboard/events/${event.documentId}`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Ver evento'
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/dashboard/events/${event.documentId}/edit`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Editar evento'
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
          {events.length === 0 && !errorMessage && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <Calendar className='mx-auto h-12 w-12' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No hay eventos
              </h3>
              <p className='text-gray-500 mb-6'>
                Comienza creando tu primer evento.
              </p>
              <Link
                href='/dashboard/events/create'
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Plus size={16} className='mr-2' />
                Crear Evento
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {events.length > 0 && (
          <div className='mt-6'>
            <ServerPagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              totalItems={pagination.total}
              itemsPerPage={pagination.pageSize}
              baseUrl='/dashboard/events'
            />
          </div>
        )}
      </div>
    </div>
  );
}
