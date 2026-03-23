import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TagForm from '@/components/form-tag';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Etiqueta | Konbini',
  description:
    'Crea una nueva etiqueta en el sistema Konbini. Organiza y clasifica contenido con etiquetas personalizadas.',
  keywords:
    'konbini, dashboard, admin, crear etiqueta, nueva etiqueta, tags, organización',
};

export default function CreateTagPage() {
  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/tags'
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Etiquetas
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>Nueva Etiqueta</h1>
            <p className='text-gray-600 mt-2'>
              Crea una nueva etiqueta en el sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <TagForm />
        </div>
      </div>
    </div>
  );
}
