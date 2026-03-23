import {
  ArrowLeft,
  Edit,
  MapPin,
  Calendar,
  Hash,
  Eye,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { StrapiAPI } from '@/lib/strapi/api';
import { Metadata } from 'next';

interface Region {
  documentId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  communes?: Array<{
    documentId: string;
    name: string;
    slug: string;
    createdAt: string;
  }>;
  events?: Array<{ documentId: string; name: string }>;
  heroes?: Array<{ documentId: string; name: string }>;
}

// Get region from Strapi API
async function getRegion(documentId: string): Promise<Region | null> {
  try {
    const response = await StrapiAPI.getRegion(documentId);
    return (response as { data: Region })?.data || null;
  } catch (error) {
    console.error('Error fetching region:', error);
    return null;
  }
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const region = await getRegion(documentId);

  if (!region) {
    return {
      title: 'Región no encontrada | Konbini',
      description: 'La región que buscas no existe o ha sido eliminada.',
    };
  }

  return {
    title: `${region.name} | Región | Konbini`,
    description: `Detalles de la región ${region.name} en Konbini.`,
    keywords: `konbini, dashboard, admin, región, ${region.name}, ubicación, geografía`,
  };
}

export default async function RegionDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const region = await getRegion(documentId);

  if (!region) {
    return (
      <div className='p-6'>
        <div className='max-w-4xl mx-auto'>
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
              Región no encontrada
            </h3>
            <p className='text-gray-500 mb-6'>
              La región que buscas no existe o ha sido eliminada.
            </p>
            <Link
              href='/dashboard/regions'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Regiones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/dashboard/regions'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Regiones
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                href={`/dashboard/regions/${region.documentId}/edit`}
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Edit size={16} className='mr-2' />
                Editar Región
              </Link>
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles de la Región
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa de la región {region.name}
            </p>
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
                    <Building
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID de Región:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{region.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {region.name}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Slug:{' '}
                      </span>
                      <span className='slug-text'>{region.slug}</span>
                    </div>
                  </div>
                </div>

                {/* Events */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Calendar size={20} className='mr-2 text-orange-600' />
                    Eventos ({region.events?.length || 0})
                  </h3>
                  {region.events && region.events.length > 0 ? (
                    <p className='text-sm text-gray-600 leading-relaxed'>
                      {region.events.map((event, index) => (
                        <span key={event.documentId}>
                          {event.name}
                          {index < (region.events?.length ?? 0) - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay eventos asociados
                    </p>
                  )}
                </div>

                {/* Heroes */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <MapPin size={20} className='mr-2 text-red-600' />
                    Héroes ({region.heroes?.length || 0})
                  </h3>
                  {region.heroes && region.heroes.length > 0 ? (
                    <p className='text-sm text-gray-600'>
                      {region.heroes.map((hero, index) => (
                        <span key={hero.documentId}>
                          {hero.name}
                          {index < (region.heroes?.length ?? 0) - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No hay héroes asociados
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 h-full'>
              <div className='space-y-6'>
                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Hash size={20} className='mr-2 text-green-600' />
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(region.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(region.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communes Section - Full Width */}
        <div className='mt-8'>
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <MapPin size={20} className='mr-2 text-purple-600' />
                Comunas de la Región ({region.communes?.length || 0})
              </h3>
            </div>

            {region.communes && region.communes.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Nombre
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
                    {region.communes.map(commune => (
                      <tr key={commune.documentId}>
                        <td className='px-6 py-4'>
                          <div className='max-w-xs'>
                            <Link
                              href={`/dashboard/communes/${commune.documentId}`}
                              className='text-sm font-medium text-black hover:text-gray-800 hover:underline transition-colors block truncate'
                              title={commune.name}
                            >
                              {commune.name}
                            </Link>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            <span className='font-mono'>{commune.slug}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-500'>
                            {formatDate(commune.createdAt)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex items-center space-x-2'>
                            <Link
                              href={`/dashboard/communes/${commune.documentId}`}
                              className='inline-flex items-center justify-center p-2 text-black hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors'
                              title='Ver comuna'
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/dashboard/communes/${commune.documentId}/edit`}
                              className='inline-flex items-center justify-center p-2 text-black hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors'
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
            ) : (
              <div className='text-center py-12'>
                <div className='text-gray-400 mb-4'>
                  <MapPin size={48} className='mx-auto' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No hay comunas
                </h3>
                <p className='text-gray-500'>
                  Esta región aún no tiene comunas asociadas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
