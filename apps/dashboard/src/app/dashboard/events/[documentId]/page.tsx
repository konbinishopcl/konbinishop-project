import EventGallery from '@/components/event-gallery';
import { StrapiAPI } from '@/lib/strapi/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Hash,
  Image as ImageIcon,
  MapPin,
  Share2,
  Tag,
  User,
  Video,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Event {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  company: string;
  description: string;
  about: string;
  isFree: boolean;
  prices: Array<{
    name: string;
    price: number;
    currency: string;
  }>;
  dates: Array<{
    date: string;
    start_time: string;
    end_time: string;
  }>;
  address: string;
  address_number: string;
  ticket_url: string;
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  videos: Array<{
    title: string;
    url: string;
  }>;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string };
  user?: {
    id: number;
    username: string;
    firstname?: string;
    lastname?: string;
  };
  commune?: { id: number; name: string };
  region?: { id: number; name: string };
  blog?: { id: number; title: string };
  banner?: {
    id: number;
    url: string;
    name: string;
  };
  poster?: {
    id: number;
    url: string;
    name: string;
  };
  gallery?: Array<{
    id: number;
    url: string;
    name: string;
  }>;
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const eventResponse = await StrapiAPI.getEvent(documentId);
  const event = eventResponse.data as Event;

  if (!event) {
    return {
      title: 'Evento no encontrado | Konbini',
      description: 'El evento que buscas no existe o ha sido eliminado.',
    };
  }

  return {
    title: `${event.title} | Evento | Konbini`,
    description:
      event.description || `Detalles del evento ${event.title} en Konbini.`,
    keywords: `konbini, dashboard, admin, evento, ${event.title}, detalles, gestión`,
  };
}

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const eventResponse = await StrapiAPI.getEvent(documentId);
  const event = eventResponse.data as Event;

  if (!event) {
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
              Evento no encontrado
            </h3>
            <p className='text-gray-500 mb-6'>
              El evento que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href='/dashboard/events'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Eventos
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
                href='/dashboard/events'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Eventos
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                href={`/dashboard/events/${event.documentId}/edit`}
                className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Edit size={16} className='mr-2' />
                Editar Evento
              </Link>
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles del Evento
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa del evento {event.title}
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
                    <Calendar
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID del Evento:{' '}
                      </span>
                      <span className='text-sm text-gray-900 font-mono'>
                        #{event.documentId}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Título:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {event.title}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Slug:{' '}
                      </span>
                      <span className='slug-text'>{event.slug}</span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Empresa:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {event.company || 'Sin empresa'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Descripción:{' '}
                      </span>
                      <div
                        className='text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg'
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                    </div>
                    {event.about && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Acerca de:{' '}
                        </span>
                        <div
                          className='text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg'
                          dangerouslySetInnerHTML={{ __html: event.about }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <MapPin
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información de Ubicación
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Dirección:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {event.address} {event.address_number}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Comuna:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {event.commune ? (
                          <Link
                            href={`/dashboard/communes/${event.commune.id}`}
                            className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                          >
                            {event.commune.name}
                          </Link>
                        ) : (
                          'Sin comuna'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Región:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {event.region ? (
                          <Link
                            href={`/dashboard/regions/${event.region.id}`}
                            className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                          >
                            {event.region.name}
                          </Link>
                        ) : (
                          'Sin región'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <User
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Usuario
                  </h3>
                  <div className='space-y-4'>
                    {event.user ? (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Usuario:{' '}
                        </span>
                        <Link
                          href={`/dashboard/users/${event.user.id}`}
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                        >
                          {event.user.firstname && event.user.lastname
                            ? `${event.user.firstname} ${event.user.lastname}`
                            : event.user.username}
                        </Link>
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>
                        Sin usuario relacionado
                      </p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Tag
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Categoría
                  </h3>
                  <div className='space-y-4'>
                    {event.category ? (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Categoría:{' '}
                        </span>
                        <Link
                          href={`/dashboard/categories/${event.category.id}`}
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                        >
                          {event.category.name}
                        </Link>
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>Sin categoría</p>
                    )}
                  </div>
                </div>

                {/* Blog */}
                {event.blog && (
                  <div>
                    <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                      <FileText
                        size={20}
                        className='mr-2 text-[var(--brand-primary)]'
                      />
                      Blog Relacionado
                    </h3>
                    <div className='space-y-4'>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Blog:{' '}
                        </span>
                        <Link
                          href={`/dashboard/articles/${event.blog.id}`}
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                        >
                          {event.blog.title}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket URL */}
                {event.ticket_url && (
                  <div>
                    <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                      <DollarSign
                        size={20}
                        className='mr-2 text-[var(--brand-primary)]'
                      />
                      URL de Tickets
                    </h3>
                    <div className='space-y-4'>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          URL:{' '}
                        </span>
                        <a
                          href={event.ticket_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors break-all'
                        >
                          {event.ticket_url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prices */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <DollarSign
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Precios ({event.prices?.length || 0})
                  </h3>
                  <div className='space-y-4'>
                    {event.prices && event.prices.length > 0 ? (
                      <div className='space-y-2'>
                        {event.prices.map((price, index) => (
                          <div
                            key={index}
                            className='text-sm text-gray-600 bg-gray-50 p-2 rounded'
                          >
                            <div className='font-medium'>{price.name}</div>
                            <div>
                              {price.price} {price.currency}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>
                        {event.isFree
                          ? 'Evento gratuito'
                          : 'Sin precios definidos'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Clock
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Fechas ({event.dates?.length || 0})
                  </h3>
                  <div className='space-y-4'>
                    {event.dates && event.dates.length > 0 ? (
                      <div className='space-y-2'>
                        {event.dates.map((date, index) => (
                          <div
                            key={index}
                            className='text-sm text-gray-600 bg-gray-50 p-2 rounded'
                          >
                            <div className='font-medium'>
                              {new Date(date.date).toLocaleDateString('es-ES')}
                            </div>
                            <div>
                              {date.start_time} - {date.end_time}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>
                        Sin fechas definidas
                      </p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Share2
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Redes Sociales ({event.socialLinks?.length || 0})
                  </h3>
                  <div className='space-y-4'>
                    {event.socialLinks && event.socialLinks.length > 0 ? (
                      <div className='space-y-2'>
                        {event.socialLinks.map((social, index) => (
                          <div key={index} className='text-sm text-gray-600'>
                            <div className='font-medium'>{social.platform}</div>
                            <a
                              href={social.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors break-all'
                            >
                              {social.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>
                        Sin redes sociales
                      </p>
                    )}
                  </div>
                </div>

                {/* Videos */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Video
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Videos ({event.videos?.length || 0})
                  </h3>
                  <div className='space-y-4'>
                    {event.videos && event.videos.length > 0 ? (
                      <div className='space-y-2'>
                        {event.videos.map((video, index) => (
                          <div key={index} className='text-sm text-gray-600'>
                            <div className='font-medium'>{video.title}</div>
                            <a
                              href={video.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors break-all'
                            >
                              {video.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>Sin videos</p>
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
                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Hash
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Estado:{' '}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.publishedAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(event.updatedAt)}
                      </span>
                    </div>
                    {event.publishedAt && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Fecha de Publicación:{' '}
                        </span>
                        <span className='text-sm text-gray-900'>
                          {formatDate(event.publishedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section - Full Width */}
        <div className='mt-8'>
          <div className='bg-white rounded-lg border border-gray-200 p-8'>
            <h3 className='text-xl font-semibold text-gray-900 mb-6 flex items-center'>
              <ImageIcon
                size={24}
                className='mr-3 text-[var(--brand-primary)]'
              />
              Galería de Imágenes del Evento
            </h3>
            <EventGallery
              banner={event.banner}
              poster={event.poster}
              gallery={event.gallery}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
