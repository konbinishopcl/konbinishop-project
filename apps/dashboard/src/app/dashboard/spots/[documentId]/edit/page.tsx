import SpotForm from '@/components/form-spot';
import { StrapiAPI } from '@/lib/strapi/api';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface Spot {
  id: number;
  documentId: string;
  title: string;
  image?: {
    id: number;
    url: string;
    name: string;
  } | null;
  link?: string;
  expiration_date?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ documentId: string }>;
}): Promise<Metadata> {
  const { documentId } = await params;
  const { data: spot } = (await StrapiAPI.getSpot(documentId)) as {
    data: Spot;
  };

  if (!spot) {
    return {
      title: 'Spot no encontrado | Konbini',
      description: 'El spot que buscas editar no existe o ha sido eliminado.',
    };
  }

  return {
    title: `Editar ${spot.title} | Spot | Konbini`,
    description: `Edita el spot publicitario: ${spot.title} en Konbini.`,
    keywords: `konbini, dashboard, admin, editar spot, ${spot.title}, modificar, publicidad`,
  };
}

export default async function EditSpotPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const { data: spot } = (await StrapiAPI.getSpot(documentId)) as {
    data: Spot;
  };

  if (!spot) {
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
              Spot no encontrado
            </h3>
            <p className='text-gray-500 mb-6'>
              El spot que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href='/dashboard/spots'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Spots
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
              href={`/dashboard/spots/${spot.documentId}`}
              className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
            >
              <ArrowLeft size={20} className='mr-2' />
              Volver a Spot
            </Link>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>Editar Spot</h1>
            <p className='text-gray-600 mt-2'>
              Modifica la información del spot {spot.title}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg border border-gray-200 p-8'>
          <SpotForm spot={spot} isEditing={true} />
        </div>
      </div>
    </div>
  );
}
