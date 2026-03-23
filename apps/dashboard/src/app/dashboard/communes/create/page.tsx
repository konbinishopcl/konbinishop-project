import CommuneForm from '@/components/form-commune';
import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Get regions for the form
async function getRegions() {
  try {
    const response = await StrapiAPI.getRegions();
    return (
      (response as { data?: Array<{ id: number; name: string }> })?.data || []
    );
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Crear Comuna | Konbini',
  description:
    'Crea una nueva comuna en el sistema Konbini. Organiza ubicaciones locales dentro de las regiones.',
  keywords:
    'konbini, dashboard, admin, crear comuna, nueva comuna, ubicaciones, localización',
};

export default async function CreateCommunePage() {
  const regions = await getRegions();

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href='/dashboard/communes'
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Comunas
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Crear Nueva Comuna
            </h1>
            <p className='text-gray-600 mt-2'>
              Completa la información para crear una nueva comuna
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <CommuneForm regions={regions} />
        </div>
      </div>
    </div>
  );
}
