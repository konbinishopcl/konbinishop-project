import { StrapiAPI } from '@/lib/strapi/api';
import {
  ArrowLeft,
  Building,
  Calendar,
  Edit,
  Hash,
  MapPin,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Commune {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  region?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  events?: Array<{ id: number; name: string }>;
  heroes?: Array<{ id: number; name: string }>;
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const { data: commune } = (await StrapiAPI.getCommune(documentId)) as {
    data: Commune;
  };

  if (!commune) {
    return {
      title: 'Comuna no encontrada | Konbini',
      description: 'La comuna que buscas no existe o ha sido eliminada.',
    };
  }

  return {
    title: `${commune.name} | Comuna | Konbini`,
    description: `Detalles de la comuna ${commune.name}${commune.region ? ` en la región ${commune.region.name}` : ''} en Konbini.`,
    keywords: `konbini, dashboard, admin, comuna, ${commune.name}, ubicación, localización`,
  };
}

export default async function CommuneDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { data: commune } = (await StrapiAPI.getCommune(documentId)) as {
    data: Commune;
  };

  if (!commune) {
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
              Comuna no encontrada
            </h3>
            <p className='text-gray-500 mb-6'>
              La comuna que buscas no existe o ha sido eliminada.
            </p>
            <Link
              href='/dashboard/communes'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Comunas
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
                href='/dashboard/communes'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Comunas
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                href={`/dashboard/communes/${commune.documentId}/edit`}
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Edit size={16} className='mr-2' />
                Editar Comuna
              </Link>
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles de la Comuna
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa de la comuna {commune.name}
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
                        ID de Comuna:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{commune.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {commune.name}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Slug:{' '}
                      </span>
                      <span className='slug-text'>{commune.slug}</span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Región:{' '}
                      </span>
                      {commune.region ? (
                        <Link
                          href={`/dashboard/regions/${commune.region.id}`}
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                        >
                          {commune.region.name}
                        </Link>
                      ) : (
                        <span className='text-sm text-gray-500'>
                          Sin región asignada
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Events */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Calendar size={20} className='mr-2 text-orange-600' />
                    Eventos ({commune.events?.length || 0})
                  </h3>
                  {commune.events && commune.events.length > 0 ? (
                    <p className='text-sm text-gray-600 leading-relaxed'>
                      {commune.events.map((event, index) => (
                        <span key={event.id}>
                          {event.name}
                          {index < (commune.events?.length ?? 0) - 1
                            ? ', '
                            : ''}
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
                    Héroes ({commune.heroes?.length || 0})
                  </h3>
                  {commune.heroes && commune.heroes.length > 0 ? (
                    <p className='text-sm text-gray-600 leading-relaxed'>
                      {commune.heroes.map((hero, index) => (
                        <span key={hero.id}>
                          {hero.name}
                          {index < (commune.heroes?.length ?? 0) - 1
                            ? ', '
                            : ''}
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
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Hash size={18} className='mr-2 text-green-600' />
                    Información del Sistema
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(commune.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(commune.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
