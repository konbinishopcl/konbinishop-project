import EventForm from '@/components/form-event';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Crear Evento | Konbini',
  description:
    'Crea un nuevo evento en el sistema Konbini. Completa la información del evento, ubicación y detalles.',
  keywords:
    'konbini, dashboard, admin, crear evento, nuevo evento, gestión eventos',
};

export default async function CreateEventPage() {
  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/events'
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Eventos
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Crear Nuevo Evento
            </h1>
            <p className='text-gray-600 mt-2'>
              Completa la información para crear un nuevo evento
            </p>
          </div>
        </div>

        {/* Form */}
        <div>
          <EventForm />
        </div>
      </div>
    </div>
  );
}
