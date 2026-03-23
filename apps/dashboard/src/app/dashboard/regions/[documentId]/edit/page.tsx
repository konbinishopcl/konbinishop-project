import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RegionForm from '@/components/form-region';
import { StrapiAPI } from '@/lib/strapi/api';

interface Region {
  documentId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
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

export default async function EditRegionPage({
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

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-4'>
            <Link
              href={`/dashboard/regions/${region.documentId}`}
              className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Detalles
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>Editar Región</h1>
            <p className='text-gray-600 mt-2'>
              Modifica la información de la región {region.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <RegionForm region={region} isEditing={true} />
        </div>
      </div>
    </div>
  );
}
