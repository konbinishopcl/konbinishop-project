import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RegionForm from '@/components/form-region';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Región | Konbini',
  description:
    'Crea una nueva región en el sistema Konbini. Organiza ubicaciones geográficas para eventos y contenido.',
  keywords:
    'konbini, dashboard, admin, crear región, nueva región, ubicaciones, geografía',
};

export default function CreateRegionPage() {
  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/regions'
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Regiones
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>Nueva Región</h1>
            <p className='text-gray-600 mt-2'>
              Crea una nueva región en el sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <RegionForm />
        </div>
      </div>
    </div>
  );
}
