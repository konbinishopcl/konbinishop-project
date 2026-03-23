import EventForm from '@/components/form-event';
import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft } from 'lucide-react';
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
  prices: Array<{
    name: string;
    price: number;
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
    link: string;
  }>;
  videos: Array<{
    link: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
  }>;
  user?: {
    id: number;
    username: string;
    firstname?: string;
    lastname?: string;
  };
  commune: {
    id: number;
    name: string;
  };
  region: {
    id: number;
    name: string;
  };
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

// Get event from Strapi API
async function getEvent(documentId: string): Promise<Event | null> {
  try {
    const eventResponse = await StrapiAPI.getEvent(documentId);
    return (eventResponse?.data as Event) || null;
  } catch (error) {
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
  const event = await getEvent(documentId);

  if (!event) {
    return {
      title: 'Evento no encontrado | Konbini',
      description: 'El evento que buscas editar no existe o ha sido eliminado.',
    };
  }

  return {
    title: `Editar ${event.title} | Evento | Konbini`,
    description: `Edita el evento ${event.title} en el sistema Konbini.`,
    keywords: `konbini, dashboard, admin, editar evento, ${event.title}, modificar, gestión`,
  };
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  let event: Event | null = null;
  let error: string | null = null;

  try {
    event = await getEvent(documentId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido';
  }

  if (error) {
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
              Error al cargar el evento
            </h3>
            <p className='text-gray-500 mb-6'>
              Ha ocurrido un error al intentar cargar el evento: {error}
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

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href={`/dashboard/events/${event.documentId}`}
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Evento
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>Editar Evento</h1>
            <p className='text-gray-600 mt-2'>
              Modifica la información del evento {event.title}
            </p>
          </div>
        </div>

        {/* Form */}
        <div>
          <EventForm event={event} isEditing={true} />
        </div>
      </div>
    </div>
  );
}
